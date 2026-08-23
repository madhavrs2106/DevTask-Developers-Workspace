import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, HttpError } from "../utils/httpError.js";
import { parse } from "../utils/validate.js";

const optionalUrl = z
  .union([z.literal(""), z.string().trim().url("Enter a valid URL")])
  .transform((v) => (v === "" ? null : v))
  .optional()
  .nullable();

const hexColor = z.string().regex(/^#([0-9a-fA-F]{6})$/, "Must be a hex color");

const createSchema = z.object({
  name: z.string().trim().min(1, "Project name is required").max(80),
  description: z.string().trim().max(500).optional().nullable(),
  repoUrl: optionalUrl,
  color: hexColor.default("#06B6D4"),
});

const updateSchema = createSchema.partial();

async function ownedProjectOr404(id, userId) {
  const project = await prisma.project.findFirst({ where: { id, userId } });
  if (!project) throw new HttpError(404, "Project not found");
  return project;
}

/** GET /api/projects */
export const listProjects = asyncHandler(async (req, res) => {
  const projects = await prisma.project.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      tasks: {
        select: {
          id: true,
          status: true,
          difficulty: true,
          tags: true,
          dueDate: true,
          title: true,
        },
      },
    },
  });

  res.json(
    projects.map(({ tasks, ...project }) => ({
      ...project,
      taskCount: tasks.length,
      doneCount: tasks.filter((t) => t.status === "DONE").length,
      tasks,
    }))
  );
});

/** POST /api/projects */
export const createProject = asyncHandler(async (req, res) => {
  const data = parse(createSchema, req.body);
  const project = await prisma.project.create({ data: { ...data, userId: req.user.id } });
  res.status(201).json(project);
});

/** PUT /api/projects/:id */
export const updateProject = asyncHandler(async (req, res) => {
  await ownedProjectOr404(req.params.id, req.user.id);
  const data = parse(updateSchema, req.body);

  const project = await prisma.project.update({
    where: { id: req.params.id },
    data,
  });

  res.json(project);
});

/** DELETE /api/projects/:id — tasks are detached, not deleted. */
export const deleteProject = asyncHandler(async (req, res) => {
  await ownedProjectOr404(req.params.id, req.user.id);
  await prisma.project.delete({ where: { id: req.params.id } });
  res.json({ message: "Project deleted" });
});
