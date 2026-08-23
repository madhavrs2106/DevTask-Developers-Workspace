/* Shared API types (mirrors server responses) */

export type Role = "DEVELOPER" | "LEARNER";

export type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export type TaskStatus = "BACKLOG" | "IN_PROGRESS" | "REVIEW" | "DONE";

export type CourseStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface SkillProgress {
  id?: string;
  name: string;
  level: number; // 0-100
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  bio: string | null;
  avatarColor: string;
  avatarUrl?: string | null;
  createdAt: string;
  skills?: SkillProgress[];
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ProjectRef {
  id: string;
  name: string;
  color: string;
}

export interface CourseRef {
  id: string;
  title: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  difficulty: Difficulty;
  tags: string[];
  codeSnippet: string | null;
  snippetLang: string | null;
  githubUrl: string | null;
  dueDate: string | null;
  position: number;
  actualHours: number;
  completedAt: string | null;
  projectId: string | null;
  courseId: string | null;
  project?: ProjectRef | null;
  course?: CourseRef | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskInput {
  title: string;
  description?: string | null;
  status: TaskStatus;
  difficulty: Difficulty;
  tags: string[];
  codeSnippet?: string | null;
  snippetLang?: string | null;
  githubUrl?: string | null;
  dueDate?: string | null;
  actualHours?: number;
  projectId?: string | null;
  courseId?: string | null;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  repoUrl: string | null;
  color: string;
  userId: string;
  createdAt: string;
  taskCount: number;
  doneCount: number;
  tasks?: Pick<Task, "id" | "title" | "status" | "difficulty" | "tags" | "dueDate">[];
}

export interface ProjectInput {
  name: string;
  description?: string | null;
  repoUrl?: string | null;
  color: string;
}

export interface Course {
  id: string;
  title: string;
  provider: string | null;
  category: string | null;
  description: string | null;
  totalLessons: number;
  lessonsDone: number;
  estimatedHours: number;
  status: CourseStatus;
  progress: number;
  taskCount: number;
  userId: string;
  createdAt: string;
}

export interface CourseInput {
  title: string;
  provider?: string | null;
  category?: string | null;
  description?: string | null;
  totalLessons: number;
  lessonsDone: number;
  estimatedHours: number;
  status: CourseStatus;
}

export interface Analytics {
  stats: {
    totalCodingHours: number;
    activeTasks: number;
    completionRate: number;
    velocityThisWeek: number;
    velocityDelta: number;
    completedCourses: number;
    totalCourses: number;
    totalTasks: number;
    doneTasks: number;
  };
  weeklyCodingHours: { day: string; date: string; hours: number }[];
  velocitySeries: { label: string; completed: number }[];
  skillMastery: { name: string; level: number }[];
  upcomingDeadlines: {
    id: string;
    title: string;
    dueDate: string;
    difficulty: Difficulty;
    tags: string[];
    projectName: string | null;
    courseTitle: string | null;
  }[];
}
