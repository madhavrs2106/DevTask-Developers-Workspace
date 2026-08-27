import express from "express";
import cors from "cors";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import followRoutes from "./routes/follow.routes.js";
import projectRoutes from "./routes/project.routes.js";
import courseRoutes from "./routes/course.routes.js";
import taskRoutes from "./routes/task.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import coLearningRoutes from "./routes/coLearning.routes.js";
import notesRoutes from "./routes/notes.routes.js";
import settingRoutes from "./routes/setting.routes.js";
import knowledgeRoutes from "./routes/knowledge.routes.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(
  cors({
    origin: env.clientOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

const __dirname = dirname(fileURLToPath(import.meta.url));

// Serve uploaded files
const uploadsDir = join(__dirname, "../uploads");
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", service: "devtask-api", time: new Date().toISOString() })
);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/follows", followRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/rooms", coLearningRoutes);
app.use("/api/rooms", notesRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/knowledge", knowledgeRoutes);

/* ── Production: serve the built React app from client/dist (single origin) ── */
const clientDist = join(__dirname, "../../client/dist");

if (existsSync(clientDist)) {
  app.use(express.static(clientDist, { index: false, maxAge: "1h" }));

  // SPA fallback — any non-API GET returns the app shell
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
    res.sendFile(join(clientDist, "index.html"));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
