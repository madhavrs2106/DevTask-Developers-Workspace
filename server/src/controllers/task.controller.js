import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, HttpError } from "../utils/httpError.js";
import { parse } from "../utils/validate.js";

const STATUSES = ["BACKLOG", "IN_PROGRESS", "REVIEW", "DONE"];
const DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

/**
 * Dual-database support:
 *  - PostgreSQL (schema.prisma): tags are a native String[] list.
 *  - SQLite (schema.sqlite.prisma): tags are a JSON-encoded string.
 * The provider is inferred from DATABASE_URL ("file:" prefix = sqlite).
 */
export const IS_SQLITE = (process.env.DATABASE_URL ?? "").trim().startsWith("file:");

function encodeTags(tags) {
  return IS_SQLITE ? JSON.stringify(tags ?? []) : (tags ?? []);
}

function decodeTags(tags) {
  if (!IS_SQLITE) return Array.isArray(tags) ? tags : [];
  try {
    const parsed = JSON.parse(tags ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Shape a raw task row for API responses. */
function serializeTask(task, role) {
  const tags = decodeTags(task.tags);
  const visible = role === "DEVELOPER" ? tags : tags.filter((t) => t.toLowerCase() !== "developer");
  return { ...task, tags: visible };
}

const optionalUrl = z
  .union([z.literal(""), z.string().trim().url("Enter a valid URL")])
  .transform((v) => (v === "" ? null : v))
  .optional()
  .nullable();

const taskFields = {
  title: z.string().trim().min(1, "Title is required").max(160),
  description: z.string().trim().max(5000).optional().nullable(),
  status: z.enum(STATUSES).default("BACKLOG"),
  difficulty: z.enum(DIFFICULTIES).default("BEGINNER"),
  tags: z
    .array(z.string().trim().min(1).max(24))
    .max(8, "At most 8 tags")
    .default([]),
  codeSnippet: z.string().max(20000).optional().nullable(),
  snippetLang: z.string().trim().max(24).optional().nullable(),
  githubUrl: optionalUrl,
  dueDate: z.coerce.date().optional().nullable(),
  actualHours: z.number().min(0).max(1000).default(0),
  projectId: z.string().cuid("Invalid project id").optional().nullable(),
  courseId: z.string().cuid("Invalid course id").optional().nullable(),
};

const createSchema = z.object(taskFields);

const updateSchema = z
  .object({ ...taskFields, title: taskFields.title.optional() })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "No fields to update" });

const reorderSchema = z.object({
  updates: z
    .array(
      z.object({
        id: z.string().cuid(),
        status: z.enum(STATUSES),
        position: z.number(),
      })
    )
    .min(1)
    .max(500),
});

/** Validates that referenced project/course belongs to the user; returns FK data. */
async function resolveRelations(userId, { projectId, courseId }, current = {}) {
  const out = {};

  if (projectId !== undefined) {
    if (projectId === null) out.projectId = null;
    else if (projectId !== current.projectId) {
      const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
      if (!project) throw new HttpError(400, "projectId does not reference a valid project");
      out.projectId = projectId;
    }
  }

  if (courseId !== undefined) {
    if (courseId === null) out.courseId = null;
    else if (courseId !== current.courseId) {
      const course = await prisma.course.findFirst({ where: { id: courseId, userId } });
      if (!course) throw new HttpError(400, "courseId does not reference a valid course");
      out.courseId = courseId;
    }
  }

  return out;
}

const includeForList = {
  project: { select: { id: true, name: true, color: true } },
  course: { select: { id: true, title: true } },
};

/** GET /api/tasks?status=&tag=&difficulty=&projectId=&courseId=&q= */
export const listTasks = asyncHandler(async (req, res) => {
  const { status, tag, difficulty, projectId, courseId, q } = req.query;

  const where = { userId: req.user.id };

  if (status) {
    const statuses = String(status)
      .split(",")
      .filter((s) => STATUSES.includes(s));
    if (statuses.length) where.status = { in: statuses };
  }
  if (difficulty) {
    const difficulties = String(difficulty)
      .split(",")
      .filter((d) => DIFFICULTIES.includes(d));
    if (difficulties.length) where.difficulty = { in: difficulties };
  }
  if (projectId) where.projectId = String(projectId);
  if (courseId) where.courseId = String(courseId);
  if (tag) {
    if (!IS_SQLITE) where.tags = { has: String(tag).trim() };
    // SQLite: tag filtering happens in JS after the fetch (see below)
  }
  if (q) {
    const contains = { contains: String(q) };
    where.OR = [
      { title: IS_SQLITE ? contains : { ...contains, mode: "insensitive" } },
      { description: IS_SQLITE ? contains : { ...contains, mode: "insensitive" } },
    ];
  }

  let tasks = await prisma.task.findMany({
    where,
    orderBy: [{ status: "asc" }, { position: "asc" }, { createdAt: "desc" }],
    include: includeForList,
  });

  if (IS_SQLITE && tag) {
    const needle = String(tag).trim().toLowerCase();
    tasks = tasks.filter((t) => decodeTags(t.tags).some((x) => x.toLowerCase() === needle));
  }

  res.json(tasks.map((t) => serializeTask(t, req.user.role)));
});

 /** POST /api/tasks */
export const createTask = asyncHandler(async (req, res) => {
  const data = parse(createSchema, req.body);
  if (data.tags?.some((t) => t.toLowerCase() === "developer") && req.user.role !== "DEVELOPER") {
    throw new HttpError(403, "Only developers can use the Developer tag");
  }
  const relations = await resolveRelations(req.user.id, data);

  const last = await prisma.task.findFirst({
    where: { userId: req.user.id, status: data.status },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const task = await prisma.task.create({
    data: {
      ...data,
      tags: encodeTags(data.tags),
      ...relations,
      userId: req.user.id,
      completedAt: data.status === "DONE" ? new Date() : null,
      position: last ? last.position + 1 : 0,
    },
    include: includeForList,
  });

  res.status(201).json(serializeTask(task, req.user.role));
});

/** PUT /api/tasks/:id */
export const updateTask = asyncHandler(async (req, res) => {
  const existing = await prisma.task.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!existing) throw new HttpError(404, "Task not found");

  const data = parse(updateSchema, req.body);
  if (data.tags?.some((t) => t.toLowerCase() === "developer") && req.user.role !== "DEVELOPER") {
    throw new HttpError(403, "Only developers can use the Developer tag");
  }
  const relations = await resolveRelations(req.user.id, data, existing);

  let completedAt = existing.completedAt;
  if (data.status && data.status !== existing.status) {
    completedAt = data.status === "DONE" ? new Date() : null;
  }

  const task = await prisma.task.update({
    where: { id: req.params.id },
    data: {
      ...data,
      ...(data.tags !== undefined ? { tags: encodeTags(data.tags) } : {}),
      ...relations,
      completedAt,
    },
    include: includeForList,
  });

  res.json(serializeTask(task, req.user.role));
});

/**
 * PATCH /api/tasks/reorder  { updates: [{ id, status, position }] }
 * Bulk update used by the Kanban drag & drop flow.
 */
export const reorderTasks = asyncHandler(async (req, res) => {
  const { updates } = parse(reorderSchema, req.body);

  const ids = updates.map((u) => u.id);
  const owned = await prisma.task.findMany({
    where: { id: { in: ids }, userId: req.user.id },
    select: { id: true, status: true },
  });
  if (owned.length !== new Set(ids).size) {
    throw new HttpError(404, "One or more tasks not found");
  }
  const byId = new Map(owned.map((t) => [t.id, t]));

  await prisma.$transaction(
    updates.map((u) =>
      prisma.task.update({
        where: { id: u.id },
        data: {
          status: u.status,
          position: u.position,
          completedAt:
            u.status === "DONE"
              ? byId.get(u.id).status === "DONE"
                ? undefined // keep original completion time
                : new Date()
              : null,
        },
      })
    )
  );

  const tasks = await prisma.task.findMany({
    where: { userId: req.user.id },
    orderBy: [{ status: "asc" }, { position: "asc" }],
    include: includeForList,
  });

  res.json(tasks.map((t) => serializeTask(t, req.user.role)));
});

/** DELETE /api/tasks/:id */
export const deleteTask = asyncHandler(async (req, res) => {
  const existing = await prisma.task.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    select: { id: true },
  });
  if (!existing) throw new HttpError(404, "Task not found");

  await prisma.task.delete({ where: { id: req.params.id } });
  res.json({ message: "Task deleted" });
});
