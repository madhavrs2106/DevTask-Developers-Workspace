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
  username: string;
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

// ─── Co-Learning Rooms ─────────────────────────────────────────────

export type RoomRole = "ADMIN" | "MEMBER";

export interface RoomMember {
  id: string;
  role: RoomRole;
  joinedAt: string;
  user: Pick<User, "id" | "name" | "username" | "avatarColor" | "avatarUrl">;
}

export interface SyllabusItem {
  id: string;
  title: string;
  description: string | null;
  resourceUrl: string | null;
  order: number;
  completions: { userId: string; completedAt: string }[];
  _count: { completions: number };
}

export interface RoomResource {
  id: string;
  title: string;
  url: string;
  type: "LINK" | "NOTE" | "REPO" | "VIDEO";
  createdAt: string;
  addedBy: Pick<User, "id" | "name" | "username">;
}

export interface RoomDiscussion {
  id: string;
  content: string;
  createdAt: string;
  author: Pick<User, "id" | "name" | "username" | "avatarColor">;
  syllabusItem: { id: string; title: string } | null;
}

export interface FocusSession {
  id: string;
  task: string;
  duration: number;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  startedAt: string;
  endsAt: string;
  user: Pick<User, "id" | "name" | "username" | "avatarColor">;
}

export interface CoLearningRoom {
  id: string;
  name: string;
  topic: string;
  inviteCode: string;
  description: string | null;
  streakCount: number;
  lastStreakDate: string | null;
  maxMembers: number;
  createdAt: string;
  creator: Pick<User, "id" | "name" | "username" | "avatarColor">;
  memberCount: number;
  role?: RoomRole;
}

export interface CoLearningRoomFull extends CoLearningRoom {
  members: RoomMember[];
  syllabusItems: SyllabusItem[];
  resources: RoomResource[];
  discussions: RoomDiscussion[];
  focusSessions: FocusSession[];
}

export interface RoomStats {
  memberCount: number;
  syllabusCount: number;
  resourceCount: number;
  completionsByUser: Record<string, number>;
}
