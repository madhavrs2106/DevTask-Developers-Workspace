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
  academicDetails?: AcademicDetails | null;
  contactDetails?: ContactDetails | null;
  resumeExtras?: ResumeExtras | null;
  onboarded?: boolean;
  createdAt: string;
  skills?: SkillProgress[];
  followersCount?: number;
  followingCount?: number;
}

export interface TenthDetails {
  school?: string;
  board?: string;
  score?: string;
  year?: string;
}
export interface TwelfthDetails {
  school?: string;
  board?: string;
  score?: string;
  year?: string;
}
export interface CollegeDetails {
  name?: string;
  degree?: string;
  branch?: string;
  year?: string;
  cgpa?: string;
  gradYear?: string;
}
export interface AcademicDetails {
  tenth?: TenthDetails;
  twelfth?: TwelfthDetails;
  college?: CollegeDetails;
}

export interface ContactDetails {
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface ResumeProject {
  title: string;
  link?: string;
  description?: string;
}
export interface ResumeExperience {
  title: string;
  org?: string;
  period?: string;
  description?: string;
}
export interface ResumeCertification {
  name: string;
  issuer?: string;
  year?: string;
}
export interface ResumeExtras {
  summary?: string;
  projects?: ResumeProject[];
  certifications?: ResumeCertification[];
  achievements?: string[];
  workExperience?: ResumeExperience[];
  languagesKnown?: string[];
  hobbies?: string[];
}

/* ── Auto resume generator ─────────────────────────────────────── */

export type ResumeTemplate = "minimal" | "classic" | "modern" | "compact" | "professional";

export interface ResumeContact {
  email: string;
  phone?: string;
  location?: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
}

export interface ResumeEducation {
  degree: string;
  institution: string;
  duration?: string;
  cgpa?: string;
  highlight?: string; // e.g. board/percentage for school level
}

export interface ResumeExperienceItem {
  role: string;
  company: string;
  duration?: string;
  location?: string;
  bullets: string[];
}

export interface ResumeProjectItem {
  title: string;
  description?: string;
  repoUrl?: string;
  techStack: string[];
}

export interface ResumeSkillGroup {
  category: string;
  skills: string[];
}

export interface ResumeData {
  fullName: string;
  headline?: string;
  contact: ResumeContact;
  summary?: string;
  education: ResumeEducation[];
  experience: ResumeExperienceItem[];
  skills: ResumeSkillGroup[];
  projects: ResumeProjectItem[];
  coursework: string[];
  template: ResumeTemplate;
}

export interface ResumeOptions {
  headline?: string;
  location?: string;
  selectedProjectIds?: string[];
  selectedSkillNames?: string[];
  template: ResumeTemplate;
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
  hoursPerWeek: { label: string; hours: number }[];
  skillMastery: { name: string; level: number }[];
  coursesStudying: {
    id: string;
    title: string;
    progress: number;
    lessonsDone: number;
    totalLessons: number;
  }[];
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
  description?: string | null;
  path: string;
  createdAt: string;
  addedBy: Pick<User, "id" | "name" | "username">;
}

export interface RoomDiscussion {
  id: string;
  content: string;
  createdAt: string;
  author: Pick<User, "id" | "name" | "username" | "avatarColor" | "avatarUrl">;
  syllabusItem: { id: string; title: string } | null;
  parentId: string | null;
  replies?: RoomDiscussion[];
}

export interface FocusSession {
  id: string;
  task: string;
  duration: number;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  startedAt: string;
  endsAt: string;
  user: Pick<User, "id" | "name" | "username" | "avatarColor" | "avatarUrl">;
}

export interface CoLearningRoom {
  id: string;
  name: string;
  topic: string;
  inviteCode: string;
  description: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  streakCount: number;
  lastStreakDate: string | null;
  maxMembers: number;
  createdAt: string;
  creator: Pick<User, "id" | "name" | "username" | "avatarColor">;
  memberCount: number;
  role?: RoomRole;
}

export interface RoomNote {
  id: string;
  title: string;
  type: "FOLDER" | "FILE";
  fileType?: "TEXT" | "CODE" | "IMAGE" | "VIDEO" | "DOC" | null;
  content?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  author: Pick<User, "id" | "name" | "username" | "avatarColor">;
  parentId?: string | null;
  children?: RoomNote[];
}

export interface CoLearningRoomFull extends CoLearningRoom {
  members: RoomMember[];
  syllabusItems: SyllabusItem[];
  discussions: RoomDiscussion[];
  focusSessions: FocusSession[];
  passwordHash?: string | null;
}

export interface RoomStats {
  memberCount: number;
  syllabusCount: number;
  resourceCount: number;
  completionsByUser: Record<string, number>;
}

export interface QuizQuestion {
  id: string;
  text: string;
  type: "MCQ" | "NUMERICAL";
  options: string | null; // JSON array of MCQ options
  answer: string; // correct answer (MCQ option index or numerical value)
  order: number;
}

export interface QuizSubmission {
  id: string;
  answers: string | null; // JSON: { questionId: answer }
  score: number | null;
  feedback: string | null;
  status: "SUBMITTED" | "GRADED";
  createdAt: string;
  user: Pick<User, "id" | "name" | "username" | "avatarColor" | "avatarUrl">;
}

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  status: "DRAFT" | "PUBLISHED";
  createdAt: string;
  creator: Pick<User, "id" | "name" | "username" | "avatarColor">;
  questions?: QuizQuestion[];
  submissions?: QuizSubmission[];
  mySubmission?: { id: string; score: number | null; status: string; answers?: string | null; feedback?: string | null } | null;
  _count?: { questions: number; submissions: number };
  lockedUserIds?: string[];
}

export type ProblemLanguage = "javascript" | "python" | "c" | "cpp" | "java" | "go" | "ruby";
export type ProblemDifficulty = "EASY" | "MEDIUM" | "HARD";
export type SubmissionStatus = "ACCEPTED" | "WRONG" | "TIME_LIMIT" | "RUNTIME_ERROR" | "PENDING";

export interface ProblemTestCase {
  hidden: boolean;
  input: string | null;
  expected: string | null;
}

export interface RoomProblem {
  id: string;
  title: string;
  description: string;
  difficulty: ProblemDifficulty;
  languages: ProblemLanguage[];
  starterCode: Partial<Record<ProblemLanguage, string>>;
  testCases: ProblemTestCase[];
  createdById: string;
  creator: Pick<User, "id" | "name" | "username" | "avatarColor" | "avatarUrl">;
  submissionsCount: number;
  solved: boolean;
}

export interface ProblemDetail extends Omit<RoomProblem, "testCases" | "starterCode"> {
  testCases: ProblemTestCase[];
  starterCode: Partial<Record<ProblemLanguage, string>>;
}

export interface SubmissionResult {
  hidden: boolean;
  input?: string | null;
  expected?: string | null;
  actual?: string | null;
  passed: boolean;
  error?: string | null;
}

export interface RoomProblemSubmission {
  id: string;
  userId: string;
  user?: Pick<User, "id" | "name" | "username" | "avatarColor" | "avatarUrl">;
  language: ProblemLanguage;
  passed: number;
  total: number;
  status: SubmissionStatus;
  createdAt: string;
}

export interface KnowledgeItem {
  id: string;
  type: "FAQ" | "DOCUMENT";
  question?: string | null;
  answer: string;
  title?: string | null;
  createdAt: string;
}
