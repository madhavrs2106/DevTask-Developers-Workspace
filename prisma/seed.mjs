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
      username: "satoshi_demo",
      passwordHash,
      name: "Satoshi Demo",
      role: "LEARNER",
      bio: "CS student learning programming languages and data science. Exploring DevTask!",
      avatarColor: "#8B5CF6",
      skills: {
        create: [
          { name: "Python", level: 90 },
          { name: "C++", level: 85 },
          { name: "Java", level: 80 },
          { name: "Data Science", level: 55 },
          { name: "Data Structures", level: 65 },
          { name: "Algorithms", level: 60 },
          { name: "Machine Learning", level: 40 },
          { name: "SQL", level: 50 },
        ],
      },
    },
  });

  const [pythonProject, cppProject, dataProject] = await Promise.all([
    prisma.project.create({
      data: {
        userId: demo.id,
        name: "Python Scripts Collection",
        description: "Utility scripts and automations built with Python.",
        repoUrl: "https://github.com/satoshi_demo/python-scripts",
        color: "#3B82F6",
      },
    }),
    prisma.project.create({
      data: {
        userId: demo.id,
        name: "C++ Practice",
        description: "Competitive programming solutions and system-level programs.",
        repoUrl: "https://github.com/satoshi_demo/cpp-practice",
        color: "#10B981",
      },
    }),
    prisma.project.create({
      data: {
        userId: demo.id,
        name: "Data Science Projects",
        description: "Exploratory data analysis and ML model experiments.",
        repoUrl: "https://github.com/satoshi_demo/ds-projects",
        color: "#F59E0B",
      },
    }),
  ]);

  const [pythonCourse, cppCourse, javaCourse, dsCourse, dsaCourse] = await Promise.all([
    prisma.course.create({
      data: {
        userId: demo.id,
        title: "Python Masterclass",
        provider: "Udemy",
        category: "Programming",
        description: "Complete Python course — basics to advanced OOP, decorators, generators.",
        totalLessons: 65,
        lessonsDone: 65,
        estimatedHours: 40,
        status: "COMPLETED",
      },
    }),
    prisma.course.create({
      data: {
        userId: demo.id,
        title: "C++ Fundamentals",
        provider: "Coursera",
        category: "Programming",
        description: "Modern C++ — memory management, STL, templates and OOP.",
        totalLessons: 48,
        lessonsDone: 48,
        estimatedHours: 35,
        status: "COMPLETED",
      },
    }),
    prisma.course.create({
      data: {
        userId: demo.id,
        title: "Java Programming Masterclass",
        provider: "Udemy",
        category: "Programming",
        description: "Core Java, OOP, collections, multithreading and Spring Boot intro.",
        totalLessons: 80,
        lessonsDone: 80,
        estimatedHours: 50,
        status: "COMPLETED",
      },
    }),
    prisma.course.create({
      data: {
        userId: demo.id,
        title: "Data Scientist with Python",
        provider: "DataCamp",
        category: "Data Science",
        description: "Pandas, NumPy, data visualization, stats and intro to ML.",
        totalLessons: 90,
        lessonsDone: 42,
        estimatedHours: 60,
        status: "IN_PROGRESS",
      },
    }),
    prisma.course.create({
      data: {
        userId: demo.id,
        title: "Data Structures & Algorithms",
        provider: "neetcode.io",
        category: "Computer Science",
        description: "Arrays, linked lists, trees, graphs, DP — interview prep roadmap.",
        totalLessons: 150,
        lessonsDone: 72,
        estimatedHours: 80,
        status: "IN_PROGRESS",
      },
    }),
  ]);

  const task = (t) => ({ userId: demo.id, ...t });

  const tasksData = [
    /* ------------------------------ BACKLOG ------------------------------ */
    task({
      courseId: dsaCourse.id,
      title: "Implement binary search tree with insert/delete",
      description: "Practice BST operations with in-order traversal.",
      tags: ["C++", "Data Structures"],
      difficulty: "INTERMEDIATE",
      dueDate: daysFromNow(5),
      position: 0,
    }),
    task({
      courseId: dsCourse.id,
      title: "Pandas data cleaning exercise",
      description: "Handle missing values, duplicates and type conversions on a real dataset.",
      tags: ["Python", "Data Science"],
      difficulty: "BEGINNER",
      dueDate: daysFromNow(7),
      position: 1,
    }),
    task({
      courseId: dsaCourse.id,
      title: "Solve 3 graph BFS/DFS problems",
      tags: ["C++", "Algorithms"],
      difficulty: "ADVANCED",
      dueDate: daysFromNow(3),
      position: 2,
      codeSnippet:
        "#include <vector>\n#include <queue>\nusing namespace std;\n\nvector<int> bfs(vector<vector<int>>& adj, int start) {\n    vector<int> visited(adj.size(), 0), order;\n    queue<int> q;\n    q.push(start);\n    visited[start] = 1;\n    while (!q.empty()) {\n        int node = q.front(); q.pop();\n        order.push_back(node);\n        for (int nb : adj[node])\n            if (!visited[nb]) { visited[nb]=1; q.push(nb); }\n    }\n    return order;\n}",
      snippetLang: "cpp",
    }),
    task({
      projectId: pythonProject.id,
      title: "Build web scraper with BeautifulSoup",
      tags: ["Python"],
      difficulty: "BEGINNER",
      position: 3,
    }),
    /* ---------------------------- IN PROGRESS ---------------------------- */
    task({
      courseId: dsCourse.id,
      title: "NumPy array operations & broadcasting",
      status: "IN_PROGRESS",
      tags: ["Python", "Data Science"],
      difficulty: "BEGINNER",
      dueDate: daysFromNow(1),
      position: 0,
      actualHours: 3,
      codeSnippet:
        "import numpy as np\n\narr = np.array([[1, 2, 3], [4, 5, 6]])\nprint(arr.mean(axis=1))  # [2. 5.]\nprint(arr.reshape(3, 2))",
      snippetLang: "python",
    }),
    task({
      courseId: dsaCourse.id,
      title: "Sliding window problems — 10 exercises",
      status: "IN_PROGRESS",
      tags: ["C++", "Algorithms"],
      difficulty: "INTERMEDIATE",
      dueDate: daysFromNow(2),
      position: 1,
      actualHours: 5,
    }),
    task({
      projectId: dataProject.id,
      title: "Exploratory analysis on Titanic dataset",
      status: "IN_PROGRESS",
      tags: ["Python", "Data Science", "Pandas"],
      difficulty: "BEGINNER",
      dueDate: daysFromNow(4),
      position: 2,
      actualHours: 2.5,
    }),
    /* ------------------------------- REVIEW ------------------------------ */
    task({
      courseId: dsaCourse.id,
      title: "Linked list cycle detection (Floyd's algorithm)",
      status: "REVIEW",
      tags: ["C++", "Data Structures"],
      difficulty: "INTERMEDIATE",
      position: 0,
      actualHours: 2,
    }),
    task({
      courseId: dsCourse.id,
      title: "Matplotlib & Seaborn visualization task",
      status: "REVIEW",
      tags: ["Python", "Data Science"],
      difficulty: "BEGINNER",
      position: 1,
      actualHours: 3,
    }),
    /* -------------------------------- DONE ------------------------------- */
    task({
      courseId: pythonCourse.id,
      title: "Complete OOP module — classes, inheritance, polymorphism",
      status: "DONE",
      tags: ["Python"],
      difficulty: "INTERMEDIATE",
      position: 0,
      actualHours: 8,
      completedAt: daysFromNow(-18),
    }),
    task({
      courseId: cppCourse.id,
      title: "STL containers & algorithms practice",
      status: "DONE",
      tags: ["C++", "Data Structures"],
      difficulty: "INTERMEDIATE",
      position: 1,
      actualHours: 6,
      completedAt: daysFromNow(-14),
    }),
    task({
      courseId: javaCourse.id,
      title: "Java collections framework — HashMap, TreeMap, LinkedList",
      status: "DONE",
      tags: ["Java"],
      difficulty: "BEGINNER",
      position: 2,
      actualHours: 5,
      completedAt: daysFromNow(-10),
    }),
    task({
      courseId: pythonCourse.id,
      title: "Decorators & generators deep-dive",
      status: "DONE",
      tags: ["Python"],
      difficulty: "ADVANCED",
      position: 3,
      actualHours: 4,
      completedAt: daysFromNow(-7),
      codeSnippet:
        "def memoize(func):\n    cache = {}\n    def wrapper(*args):\n        if args not in cache:\n            cache[args] = func(*args)\n        return cache[args]\n    return wrapper\n\n@memoize\ndef fib(n):\n    return n if n < 2 else fib(n-1) + fib(n-2)",
      snippetLang: "python",
    }),
    task({
      courseId: dsaCourse.id,
      title: "Stack & queue implementation in C++",
      status: "DONE",
      tags: ["C++", "Data Structures"],
      difficulty: "BEGINNER",
      position: 4,
      actualHours: 3,
      completedAt: daysFromNow(-4),
    }),
    task({
      courseId: javaCourse.id,
      title: "Multithreading basics — Runnable, Callable, ExecutorService",
      status: "DONE",
      tags: ["Java"],
      difficulty: "INTERMEDIATE",
      position: 5,
      actualHours: 6,
      completedAt: daysFromNow(-2),
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
