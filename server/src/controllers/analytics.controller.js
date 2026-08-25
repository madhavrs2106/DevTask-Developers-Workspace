import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/httpError.js";

const DAY = 86_400_000;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * GET /api/analytics
 * Aggregated dashboard metrics + chart series for the signed-in user.
 */
export const getAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const today = startOfDay(new Date());
  const weekAgo = new Date(today.getTime() - 6 * DAY);
  const sevenDaysAgo = new Date(today.getTime() - 7 * DAY);
  const fourteenDaysAgo = new Date(today.getTime() - 14 * DAY);

  const [
    hoursAgg,
    activeTasks,
    totalTasks,
    doneTotal,
    doneThisWeek,
    doneLastWeek,
    completedCourses,
    totalCourses,
    tasksWithHours,
    skills,
    deadlines,
    inProgressCourses,
    codingSessions,
  ] = await Promise.all([
    prisma.task.aggregate({ where: { userId }, _sum: { actualHours: true } }),
    prisma.task.count({ where: { userId, status: { not: "DONE" } } }),
    prisma.task.count({ where: { userId } }),
    prisma.task.count({ where: { userId, status: "DONE" } }),
    prisma.task.count({
      where: { userId, status: "DONE", completedAt: { gte: sevenDaysAgo } },
    }),
    prisma.task.count({
      where: {
        userId,
        status: "DONE",
        completedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
    }),
    prisma.course.count({ where: { userId, status: "COMPLETED" } }),
    prisma.course.count({ where: { userId } }),
    prisma.task.findMany({
      where: { userId, actualHours: { gt: 0 } },
      select: { completedAt: true, actualHours: true },
    }),
    prisma.skillProgress.findMany({
      where: { userId },
      orderBy: [{ level: "desc" }, { name: "asc" }],
      take: 8,
    }),
    prisma.task.findMany({
      where: { userId, status: { not: "DONE" }, dueDate: { not: null } },
      orderBy: { dueDate: "asc" },
      take: 6,
      include: {
        project: { select: { name: true } },
        course: { select: { title: true } },
      },
    }),
    prisma.course.findMany({
      where: { userId, status: "IN_PROGRESS" },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.codingSession.findMany({
      where: { userId, date: { gte: new Date(today.getTime() - 55 * DAY) } },
      select: { date: true, hours: true },
    }),
  ]);

  /* Weekly coding hours — last 7 days from task actualHours */
  const byDay = new Map();
  for (const t of tasksWithHours) {
    const at = t.completedAt ? startOfDay(t.completedAt).getTime() : null;
    if (at !== null) {
      byDay.set(at, (byDay.get(at) ?? 0) + (t.actualHours ?? 0));
    }
  }
  const weeklyCodingHours = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekAgo.getTime() + i * DAY);
    return {
      day: WEEKDAYS[day.getDay()],
      date: day.toISOString().slice(0, 10),
      hours: Math.round((byDay.get(day.getTime()) ?? 0) * 10) / 10,
    };
  });

  /* Velocity — tasks completed per week over the last 8 weeks */
  const velocitySeries = await buildVelocitySeries(userId, today);
  const velocityDelta =
    doneLastWeek === 0
      ? doneThisWeek > 0
        ? 100
        : 0
      : Math.round(((doneThisWeek - doneLastWeek) / doneLastWeek) * 100);

  async function buildVelocitySeries(uid, endDay) {
    // single grouped query instead of 8 separate counts
    const since = new Date(endDay.getTime() - 55 * DAY);
    const doneTasks = await prisma.task.findMany({
      where: { userId: uid, status: "DONE", completedAt: { gte: since } },
      select: { completedAt: true },
    });
    return Array.from({ length: 8 }, (_, i) => {
      const start = new Date(endDay.getTime() - (7 * (7 - i) + 6) * DAY);
      const end = new Date(start.getTime() + 7 * DAY);
      const label = i === 7 ? "This wk" : `${7 - i}w ago`;
      const completed = doneTasks.filter((t) => {
        const at = t.completedAt?.getTime() ?? 0;
        return at >= start.getTime() && at < end.getTime();
      }).length;
      return { label, completed };
    });
  }

  /* Hours studied per week — last 8 weeks from coding sessions */
  const hoursPerWeek = Array.from({ length: 8 }, (_, i) => {
    const start = new Date(today.getTime() - (7 * (7 - i) + 6) * DAY);
    const end = new Date(start.getTime() + 7 * DAY);
    const label = i === 7 ? "This wk" : `${7 - i}w ago`;
    const hours = codingSessions
      .filter((s) => {
        const d = s.date.getTime();
        return d >= start.getTime() && d < end.getTime();
      })
      .reduce((sum, s) => sum + s.hours, 0);
    return { label, hours: Math.round(hours * 10) / 10 };
  });

  res.json({
    stats: {
      totalCodingHours: Math.round((hoursAgg._sum.actualHours ?? 0) * 10) / 10,
      activeTasks,
      completionRate: totalTasks === 0 ? 0 : Math.round((doneTotal / totalTasks) * 100),
      velocityThisWeek: doneThisWeek,
      velocityDelta,
      completedCourses,
      totalCourses,
      totalTasks,
      doneTasks: doneTotal,
    },
    weeklyCodingHours,
    velocitySeries,
    hoursPerWeek,
    skillMastery: skills.map((s) => ({ name: s.name, level: s.level })),
    coursesStudying: inProgressCourses.map((c) => ({
      id: c.id,
      title: c.title,
      progress: c.totalLessons > 0
        ? Math.round((Math.min(c.lessonsDone, c.totalLessons) / c.totalLessons) * 100)
        : 0,
      lessonsDone: c.lessonsDone,
      totalLessons: c.totalLessons,
    })),
    upcomingDeadlines: deadlines.map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate,
      difficulty: t.difficulty,
      tags: t.tags,
      projectName: t.project?.name ?? null,
      courseTitle: t.course?.title ?? null,
    })),
  });
});
