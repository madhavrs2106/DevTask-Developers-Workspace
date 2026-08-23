/**
 * DevTask seed — creates a rich demo account:
 *   email:    demo@dev.io
 *   password: password123
 *
 * Works with both schemas:
 *   - PostgreSQL  (prisma/schema.prisma)         DATABASE_URL=postgres://…
 *   - SQLite      (prisma/schema.sqlite.prisma)  DATABASE_URL=file:./devtask.db
 */
import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Load server/.env so Prisma sees DATABASE_URL regardless of cwd
loadEnv({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../server/.env") });

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// SQLite has no native enums or scalar lists — mirror task.controller.js behaviour
const IS_SQLITE = (process.env.DATABASE_URL ?? "").trim().startsWith("file:");
const encodeTags = (tags) => (IS_SQLITE ? JSON.stringify(tags ?? []) : (tags ?? []));

const prisma = new PrismaClient();

const DAY = 86_400_000;
const daysFromNow = (n) => new Date(Date.now() + n * DAY);
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

async function main() {
  await prisma.user.deleteMany({ where: { email: "demo@dev.io" } });

  const passwordHash = await bcrypt.hash("password123", 12);

  const demo = await prisma.user.create({
    data: {
      email: "demo@dev.io",
      passwordHash,
      name: "Devon Reyes",
      role: "DEVELOPER",
      bio: "Full-stack developer levelling up in Go and system design. Coffee-driven.",
      avatarColor: "#06B6D4",
      skills: {
        create: [
          { name: "React", level: 90 },
          { name: "TypeScript", level: 78 },
          { name: "JavaScript", level: 85 },
          { name: "Go", level: 45 },
          { name: "Python", level: 68 },
          { name: "SQL", level: 62 },
          { name: "Docker", level: 38 },
          { name: "Data Structures", level: 72 },
        ],
      },
    },
  });

  const [neonCommerce, algoForge, sideblog] = await Promise.all([
    prisma.project.create({
      data: {
        userId: demo.id,
        name: "Neon Commerce",
        description: "Headless e-commerce storefront built with React, tRPC and Stripe.",
        repoUrl: "https://github.com/devreyes/neon-commerce",
        color: "#06B6D4",
      },
    }),
    prisma.project.create({
      data: {
        userId: demo.id,
        name: "AlgoForge",
        description: "Daily algorithm practice — one problem per day, solutions in Go.",
        repoUrl: "https://github.com/devreyes/algo-forge",
        color: "#14B8A6",
      },
    }),
    prisma.project.create({
      data: {
        userId: demo.id,
        name: "Sideblog Engine",
        description: "Markdown-first blogging engine with MDX and SSG.",
        repoUrl: "https://github.com/devreyes/sideblog",
        color: "#8B5CF6",
      },
    }),
  ]);

  const [reactCourse, goCourse, dsaCourse, dockerCourse] = await Promise.all([
    prisma.course.create({
      data: {
        userId: demo.id,
        title: "Epic React — Advanced Patterns",
        provider: "epicreact.dev",
        category: "Frontend",
        description: "Hooks deep-dive, suspense, performance profiling.",
        totalLessons: 42,
        lessonsDone: 29,
        estimatedHours: 25,
        status: "IN_PROGRESS",
      },
    }),
    prisma.course.create({
      data: {
        userId: demo.id,
        title: "Go: The Complete Developer's Guide",
        provider: "Udemy",
        category: "Backend",
        description: "Goroutines, channels, REST APIs and microservices in Go.",
        totalLessons: 96,
        lessonsDone: 31,
        estimatedHours: 32,
        status: "IN_PROGRESS",
      },
    }),
    prisma.course.create({
      data: {
        userId: demo.id,
        title: "NeetCode 150 Roadmap",
        provider: "neetcode.io",
        category: "Data Structures",
        description: "Arrays → graphs → DP. Interview prep roadmap.",
        totalLessons: 150,
        lessonsDone: 118,
        estimatedHours: 80,
        status: "IN_PROGRESS",
      },
    }),
    prisma.course.create({
      data: {
        userId: demo.id,
        title: "Docker & Kubernetes: The Practical Guide",
        provider: "Academind",
        category: "DevOps",
        description: "Containers, orchestration and CI/CD pipelines.",
        totalLessons: 58,
        lessonsDone: 58,
        estimatedHours: 22,
        status: "COMPLETED",
      },
    }),
  ]);

  const task = (t) => ({ userId: demo.id, ...t });

  const tasksData = [
    /* ------------------------------ BACKLOG ------------------------------ */
    task({
      projectId: neonCommerce.id,
      title: "Design cart drawer with optimistic updates",
      description: "Framer-motion slide-over, optimistic quantity changes, rollback on API error.",
      tags: ["React", "TypeScript"],
      difficulty: "INTERMEDIATE",
      dueDate: daysFromNow(9),
      position: 0,
    }),
    task({
      courseId: goCourse.id,
      title: "Finish goroutines + channels module",
      description: "Sections 8–11: worker pools, select statements, context cancellation.",
      tags: ["Go"],
      difficulty: "INTERMEDIATE",
      dueDate: daysFromNow(12),
      position: 1,
    }),
    task({
      projectId: algoForge.id,
      title: "Solve 5 graph problems (BFS/DFS)",
      tags: ["Python", "Data Structures"],
      difficulty: "ADVANCED",
      dueDate: daysFromNow(4),
      position: 2,
      codeSnippet:
        "from collections import deque\n\ndef bfs(graph, start):\n    seen, order = {start}, []\n    q = deque([start])\n    while q:\n        node = q.popleft()\n        order.append(node)\n        for nb in graph[node]:\n            if nb not in seen:\n                seen.add(nb)\n                q.append(nb)\n    return order",
      snippetLang: "python",
    }),
    task({
      courseId: reactCourse.id,
      title: "Watch: concurrent UI patterns with Suspense",
      tags: ["React"],
      difficulty: "BEGINNER",
      position: 3,
    }),
    /* ---------------------------- IN PROGRESS ---------------------------- */
    task({
      projectId: neonCommerce.id,
      title: "Implement checkout webhook handler",
      status: "IN_PROGRESS",
      description: "Verify Stripe signature, persist orders idempotently, send receipt email.",
      tags: ["Node.js", "Stripe", "TypeScript"],
      difficulty: "ADVANCED",
      dueDate: daysFromNow(2),
      position: 0,
      actualHours: 6.5,
      githubUrl: "https://github.com/devreyes/neon-commerce/pull/42",
      codeSnippet:
        "export async function POST(req: Request) {\n  const sig = req.headers['stripe-signature']!;\n  const event = stripe.webhooks.constructEvent(raw, sig, secret);\n  if (event.type === 'checkout.session.completed') {\n    await fulfillOrder(event.data.object);\n  }\n  return Response.json({ received: true });\n}",
      snippetLang: "typescript",
    }),
    task({
      courseId: dsaCourse.id,
      title: "NeetCode: sliding window subset (12 problems)",
      status: "IN_PROGRESS",
      tags: ["Go", "Data Structures"],
      difficulty: "INTERMEDIATE",
      dueDate: daysFromNow(1),
      position: 1,
      actualHours: 4,
    }),
    task({
      projectId: sideblog.id,
      title: "Add MDX + syntax highlighting pipeline",
      status: "IN_PROGRESS",
      tags: ["React", "MDX"],
      difficulty: "INTERMEDIATE",
      dueDate: daysFromNow(-1),
      position: 2,
      actualHours: 3.5,
      githubUrl: "https://github.com/devreyes/sideblog/issues/18",
    }),
    /* ------------------------------- REVIEW ------------------------------ */
    task({
      projectId: neonCommerce.id,
      title: "Migrate product grid to virtualized list",
      status: "REVIEW",
      tags: ["React", "Performance"],
      difficulty: "INTERMEDIATE",
      position: 0,
      actualHours: 5,
      githubUrl: "https://github.com/devreyes/neon-commerce/pull/39",
    }),
    task({
      courseId: goCourse.id,
      title: "Build REST API exercise: bookshelf service",
      status: "REVIEW",
      tags: ["Go", "SQL"],
      difficulty: "BEGINNER",
      position: 1,
      actualHours: 2.5,
    }),
    /* -------------------------------- DONE ------------------------------- */
    task({
      projectId: neonCommerce.id,
      title: "Set up CI pipeline with GitHub Actions",
      status: "DONE",
      tags: ["CI/CD", "GitHub Actions", "Docker"],
      difficulty: "BEGINNER",
      position: 0,
      actualHours: 3,
      completedAt: daysFromNow(-20),
      githubUrl: "https://github.com/devreyes/neon-commerce/actions",
    }),
    task({
      projectId: algoForge.id,
      title: "Two-pointer technique — 10 problems",
      status: "DONE",
      tags: ["Data Structures", "Python"],
      difficulty: "BEGINNER",
      position: 1,
      actualHours: 4.5,
      completedAt: daysFromNow(-14),
    }),
    task({
      projectId: sideblog.id,
      title: "Dark mode toggle with CSS variables",
      status: "DONE",
      tags: ["CSS", "React"],
      difficulty: "BEGINNER",
      position: 2,
      actualHours: 1.5,
      completedAt: daysFromNow(-9),
    }),
    task({
      courseId: reactCourse.id,
      title: "Complete hooks fundamentals module",
      status: "DONE",
      tags: ["React"],
      difficulty: "INTERMEDIATE",
      position: 3,
      actualHours: 6,
      completedAt: daysFromNow(-6),
    }),
    task({
      projectId: neonCommerce.id,
      title: "Write integration tests for cart API",
      status: "DONE",
      tags: ["Node.js", "Testing"],
      difficulty: "INTERMEDIATE",
      position: 4,
      actualHours: 5.5,
      completedAt: daysFromNow(-3),
      codeSnippet:
        "it('merges guest cart on login', async () => {\n  const res = await request(app)\n    .post('/api/cart/merge')\n    .set('Authorization', `Bearer ${token}`)\n    .send({ guestId });\n  expect(res.status).toBe(200);\n});",
      snippetLang: "typescript",
    }),
    task({
      projectId: algoForge.id,
      title: "Dynamic programming: knapsack variants",
      status: "DONE",
      tags: ["Go", "Data Structures"],
      difficulty: "ADVANCED",
      position: 5,
      actualHours: 7,
      completedAt: daysFromNow(-1),
    }),
  ];

  await prisma.task.createMany({
    data: tasksData.map((t) => ({ ...t, tags: encodeTags(t.tags) })),
  });

  // Coding sessions — last 21 days, deterministic pseudo-random intensity.
  const sessions = [];
  for (let i = 20; i >= 0; i--) {
    const date = new Date(startOfToday().getTime() - i * DAY);
    const wave = Math.sin(i * 1.13) + Math.cos(i * 0.47);
    const hours = Math.max(0.5, Math.round((2.4 + wave * 1.4) * 2) / 2);
    sessions.push({ userId: demo.id, date, hours });
  }
  await prisma.codingSession.createMany({ data: sessions });

  const counts = {
    tasks: await prisma.task.count({ where: { userId: demo.id } }),
    projects: await prisma.project.count({ where: { userId: demo.id } }),
    courses: await prisma.course.count({ where: { userId: demo.id } }),
    sessions: await prisma.codingSession.count({ where: { userId: demo.id } }),
  };

  console.log("✔ Seed complete — demo account ready");
  console.log("  login: demo@dev.io / password123");
  console.log(
    `  created: ${counts.tasks} tasks (${tasksData.filter((t) => t.status === "DONE").length} done, ` +
      `${tasksData.filter((t) => t.difficulty === "ADVANCED").length} advanced), ` +
      `${counts.projects} projects, ${counts.courses} courses, ${counts.sessions} coding sessions`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
