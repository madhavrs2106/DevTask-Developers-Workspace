import type { CourseStatus, Difficulty, Role, TaskStatus } from "../types";

/* ── Kanban columns ─────────────────────────────────────────────── */

export const TASK_STATUSES: { id: TaskStatus; label: string; accent: string }[] = [
  { id: "BACKLOG", label: "Backlog", accent: "#64748B" },
  { id: "IN_PROGRESS", label: "In Progress", accent: "#06B6D4" },
  { id: "REVIEW", label: "Review", accent: "#A78BFA" },
  { id: "DONE", label: "Done", accent: "#14B8A6" },
];

export const STATUS_META: Record<TaskStatus, { label: string; accent: string }> =
  TASK_STATUSES.reduce(
    (acc, s) => {
      acc[s.id] = { label: s.label, accent: s.accent };
      return acc;
    },
    {} as Record<TaskStatus, { label: string; accent: string }>
  );

/* ── Difficulty chips ───────────────────────────────────────────── */

export const DIFFICULTY_META: Record<Difficulty, { label: string; chip: string; dot: string }> = {
  BEGINNER: {
    label: "Beginner",
    chip: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
    dot: "#34D399",
  },
  INTERMEDIATE: {
    label: "Intermediate",
    chip: "border-accent/25 bg-accent/10 text-accent-bright",
    dot: "#22D3EE",
  },
  ADVANCED: {
    label: "Advanced",
    chip: "border-fuchsia-400/25 bg-fuchsia-400/10 text-fuchsia-300",
    dot: "#E879F9",
  },
};

export const DIFFICULTIES = Object.keys(DIFFICULTY_META) as Difficulty[];

/* ── Tech stack tag suggestions ─────────────────────────────────── */

export const TECH_TAGS = [
  "React",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "Go",
  "Python",
  "Rust",
  "SQL",
  "GraphQL",
  "CSS",
  "Data Structures",
  "Algorithms",
  "Docker",
  "Kubernetes",
  "Testing",
  "CI/CD",
];

/* ── Courses ────────────────────────────────────────────────────── */

export const COURSE_STATUS_META: Record<CourseStatus, { label: string; chip: string }> = {
  NOT_STARTED: {
    label: "Not started",
    chip: "border-slate-600 bg-slate-800/60 text-slate-400",
  },
  IN_PROGRESS: {
    label: "In progress",
    chip: "border-accent/25 bg-accent/10 text-accent-bright",
  },
  COMPLETED: {
    label: "Completed",
    chip: "border-teal-400/25 bg-teal-400/10 text-teal-300",
  },
};

/* ── Roles ──────────────────────────────────────────────────────── */

export const ROLE_META: Record<Role, { label: string; blurb: string }> = {
  DEVELOPER: { label: "Developer", blurb: "Shipping projects & tracking sprints" },
  LEARNER: { label: "Learner", blurb: "Following roadmaps & building skills" },
};

/* ── Avatar palette ─────────────────────────────────────────────── */

export const AVATAR_COLORS = ["#06B6D4", "#14B8A6", "#8B5CF6", "#F472B6", "#F59E0B", "#34D399"];
