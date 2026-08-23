import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, HttpError } from "../utils/httpError.js";
import { parse } from "../utils/validate.js";

export const COURSE_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"];

const createSchema = z.object({
  title: z.string().trim().min(1, "Course title is required").max(120),
  provider: z.string().trim().max(60).optional().nullable(),
  category: z.string().trim().max(40).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  totalLessons: z.number().int().min(0).max(10000).default(0),
  lessonsDone: z.number().int().min(0).max(10000).default(0),
  estimatedHours: z.number().int().min(0).max(2000).default(0),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]).default("IN_PROGRESS"),
});

const updateSchema = createSchema.partial();

function normalize(course) {
  const data = { ...course };
  if (data.totalLessons > 0 && data.lessonsDone >= data.totalLessons) {
    data.status = "COMPLETED";
  }
  if (data.status === "COMPLETED" && data.totalLessons > data.lessonsDone) {
    data.lessonsDone = data.totalLessons;
  }
  return data;
}

async function ownedCourseOr404(id, userId) {
  const course = await prisma.course.findFirst({ where: { id, userId } });
  if (!course) throw new HttpError(404, "Course not found");
  return course;
}

/** GET /api/courses */
export const listCourses = asyncHandler(async (req, res) => {
  const courses = await prisma.course.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    include: { tasks: { select: { id: true, status: true } } },
  });

  res.json(
    courses.map(({ tasks, ...course }) => ({
      ...course,
      progress:
        course.totalLessons > 0
          ? Math.round((Math.min(course.lessonsDone, course.totalLessons) / course.totalLessons) * 100)
          : course.status === "COMPLETED"
            ? 100
            : 0,
      taskCount: tasks.length,
    }))
  );
});

/** POST /api/courses */
export const createCourse = asyncHandler(async (req, res) => {
  const data = parse(createSchema, req.body);
  const course = await prisma.course.create({
    data: { ...normalize(data), userId: req.user.id },
  });
  res.status(201).json(course);
});

/** PUT /api/courses/:id */
export const updateCourse = asyncHandler(async (req, res) => {
  await ownedCourseOr404(req.params.id, req.user.id);
  const data = parse(updateSchema, req.body);

  const current = await prisma.course.findUnique({ where: { id: req.params.id } });
  const merged = normalize({ ...current, ...data });

  const course = await prisma.course.update({
    where: { id: req.params.id },
    data: {
      title: merged.title,
      provider: merged.provider,
      category: merged.category,
      description: merged.description,
      totalLessons: merged.totalLessons,
      lessonsDone: merged.lessonsDone,
      estimatedHours: merged.estimatedHours,
      status: merged.status,
    },
  });

  res.json(course);
});

/** DELETE /api/courses/:id — linked tasks are detached, not deleted. */
export const deleteCourse = asyncHandler(async (req, res) => {
  await ownedCourseOr404(req.params.id, req.user.id);
  await prisma.course.delete({ where: { id: req.params.id } });
  res.json({ message: "Course deleted" });
});
