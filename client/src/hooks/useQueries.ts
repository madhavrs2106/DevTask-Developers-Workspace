import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { api, apiErrorMessage } from "../lib/api";
import type {
  Analytics,
  Course,
  CourseInput,
  Project,
  ProjectInput,
  SkillProgress,
  Task,
  TaskInput,
  User,
  CoLearningRoom,
  CoLearningRoomFull,
  RoomStats,
  Quiz,
} from "../types";

export const qk = {
  tasks: ["tasks"] as const,
  analytics: ["analytics"] as const,
  projects: ["projects"] as const,
  courses: ["courses"] as const,
  myRooms: ["myRooms"] as const,
  room: (id: string) => ["room", id] as const,
  roomStats: (id: string) => ["roomStats", id] as const,
};

/* ── Tasks ──────────────────────────────────────────────────────── */

export function useTasks() {
  return useQuery<Task[]>({
    queryKey: qk.tasks,
    queryFn: async () => (await api.get<Task[]>("/tasks")).data,
  });
}

export function useCreateTask(): UseMutationResult<Task, Error, TaskInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => (await api.post<Task>("/tasks", input)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.tasks });
      void queryClient.invalidateQueries({ queryKey: qk.analytics });
    },
  });
}

export function useUpdateTask(): UseMutationResult<Task, Error, { id: string; data: Partial<TaskInput> }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) =>
      (await api.put<Task>(`/tasks/${id}`, data)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.tasks });
      void queryClient.invalidateQueries({ queryKey: qk.analytics });
    },
  });
}

export interface ReorderUpdate {
  id: string;
  status: Task["status"];
  position: number;
}

export function useReorderTasks(): UseMutationResult<Task[], Error, { updates: ReorderUpdate[] }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ updates }) =>
      (await api.patch<Task[]>("/tasks/reorder", { updates })).data,
    onMutate: async ({ updates }) => {
      await queryClient.cancelQueries({ queryKey: qk.tasks });
      const previous = queryClient.getQueryData<Task[]>(qk.tasks);

      if (previous) {
        const byId = new Map(updates.map((u) => [u.id, u]));
        const optimistic = previous.map((task) => {
          const update = byId.get(task.id);
          return update ? { ...task, status: update.status, position: update.position } : task;
        });
        queryClient.setQueryData<Task[]>(qk.tasks, optimistic);
      }

      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(qk.tasks, context.previous);
      console.error(apiErrorMessage(err));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: qk.tasks });
      void queryClient.invalidateQueries({ queryKey: qk.analytics });
    },
  });
}

export function useDeleteTask(): UseMutationResult<unknown, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.tasks });
      void queryClient.invalidateQueries({ queryKey: qk.analytics });
    },
  });
}

/* ── Projects ───────────────────────────────────────────────────── */

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: qk.projects,
    queryFn: async () => (await api.get<Project[]>("/projects")).data,
  });
}

export function useCreateProject(): UseMutationResult<Project, Error, ProjectInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => (await api.post<Project>("/projects", input)).data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: qk.projects }),
  });
}

export function useUpdateProject(): UseMutationResult<
  Project,
  Error,
  { id: string; data: Partial<ProjectInput> }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => (await api.put<Project>(`/projects/${id}`, data)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.projects });
      void queryClient.invalidateQueries({ queryKey: qk.tasks });
    },
  });
}

export function useDeleteProject(): UseMutationResult<unknown, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.projects });
      void queryClient.invalidateQueries({ queryKey: qk.tasks });
      void queryClient.invalidateQueries({ queryKey: qk.analytics });
    },
  });
}

/* ── Courses ────────────────────────────────────────────────────── */

export function useCourses() {
  return useQuery<Course[]>({
    queryKey: qk.courses,
    queryFn: async () => (await api.get<Course[]>("/courses")).data,
  });
}

export function useCreateCourse(): UseMutationResult<Course, Error, CourseInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => (await api.post<Course>("/courses", input)).data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: qk.courses }),
  });
}

export function useUpdateCourse(): UseMutationResult<
  Course,
  Error,
  { id: string; data: Partial<CourseInput> }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => (await api.put<Course>(`/courses/${id}`, data)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.courses });
      void queryClient.invalidateQueries({ queryKey: qk.analytics });
    },
  });
}

export function useDeleteCourse(): UseMutationResult<unknown, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => api.delete(`/courses/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.courses });
      void queryClient.invalidateQueries({ queryKey: qk.tasks });
      void queryClient.invalidateQueries({ queryKey: qk.analytics });
    },
  });
}

/* ── Analytics / profile / skills ───────────────────────────────── */

/** Fresh signed-in user incl. skills (GET /auth/me). */
export function useMe() {
  return useQuery<User>({
    queryKey: ["me"],
    queryFn: async () => (await api.get<{ user: User }>("/auth/me")).data.user,
  });
}

export function useAnalytics() {
  return useQuery<Analytics>({
    queryKey: qk.analytics,
    queryFn: async () => (await api.get<Analytics>("/analytics")).data,
  });
}

export function useUpdateProfile(): UseMutationResult<User, Error, Partial<User>> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) =>
      (await api.put<{ user: User }>(`/users/me`, data)).data.user,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["me"] }),
  });
}

/** Upload (or clear with null) the profile picture. Returns the updated user. */
export function useUploadAvatar(): UseMutationResult<User, Error, string | null> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (avatarUrl) =>
      (await api.put<{ user: User }>("/users/me/avatar", { avatarUrl })).data.user,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["me"] }),
  });
}

export function useReplaceSkills(): UseMutationResult<SkillProgress[], Error, SkillProgress[]> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (skills) =>
      (await api.put<{ skills: SkillProgress[] }>("/users/me/skills", { skills })).data.skills,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["me"] }),
  });
}

/* ── User search ─────────────────────────────────────────────── */

export function useSearchUsers(query: string) {
  return useQuery<User[]>({
    queryKey: ["searchUsers", query],
    queryFn: async () => (await api.get<{ users: User[] }>(`/users/search?q=${encodeURIComponent(query)}`)).data.users,
    enabled: query.trim().length >= 2,
  });
}

export function useSuggestedUsers() {
  return useQuery<User[]>({
    queryKey: ["suggestedUsers"],
    queryFn: async () => {
      const results = await Promise.all(
        ["satoshi_demo", "madhavrs_official"].map(async (username) => {
          try {
            const res = await api.get<{ user: User }>(`/users/${username}`);
            return res.data.user;
          } catch {
            return null;
          }
        })
      );
      return results.filter((u): u is User => u !== null);
    },
  });
}

/* ── Follows ────────────────────────────────────────────────── */

export function useFollowUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (username: string) =>
      (await api.post<{ following: boolean }>(`/follows/${username}`)).data,
    onSuccess: (_data, username) => {
      void queryClient.invalidateQueries({ queryKey: ["userProfile", username] });
      void queryClient.invalidateQueries({ queryKey: ["followList"] });
    },
  });
}

export function useUnfollowUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (username: string) =>
      (await api.delete<{ following: boolean }>(`/follows/${username}`)).data,
    onSuccess: (_data, username) => {
      void queryClient.invalidateQueries({ queryKey: ["userProfile", username] });
      void queryClient.invalidateQueries({ queryKey: ["followList"] });
    },
  });
}

/* ── Follow lists ─────────────────────────────────────────── */

export type FollowListUser = User & { isFollowing: boolean };

export function useFollowList(username: string | undefined, type: "followers" | "following") {
  return useQuery<FollowListUser[]>({
    queryKey: ["followList", username, type],
    queryFn: async () =>
      (await api.get<{ users: FollowListUser[] }>(`/follows/${username}/${type}`)).data.users,
    enabled: Boolean(username),
  });
}

/* ── Delete account ────────────────────────────────────────── */

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => api.delete("/users/me"),
  });
}

/* ── Co-Learning Rooms ─────────────────────────────────────── */

export function useMyRooms() {
  return useQuery<CoLearningRoom[]>({
    queryKey: qk.myRooms,
    queryFn: async () => (await api.get<CoLearningRoom[]>("/rooms")).data,
  });
}

export function useRoom(id: string) {
  return useQuery<CoLearningRoomFull>({
    queryKey: qk.room(id),
    queryFn: async () => (await api.get<CoLearningRoomFull>(`/rooms/${id}`)).data,
    enabled: !!id,
  });
}

export function useRoomStats(id: string) {
  return useQuery<RoomStats>({
    queryKey: qk.roomStats(id),
    queryFn: async () => (await api.get<RoomStats>(`/rooms/${id}/stats`)).data,
    enabled: !!id,
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; topic: string; description?: string; visibility?: "PUBLIC" | "PRIVATE"; password?: string; maxMembers?: number }) =>
      (await api.post<CoLearningRoom>("/rooms", input)).data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: qk.myRooms }),
  });
}

export function useJoinRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ inviteCode, password }: { inviteCode: string; password?: string }) =>
      (await api.post<{ room: CoLearningRoom }>(`/rooms/join/${inviteCode}`, { password })).data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: qk.myRooms }),
  });
}

export function useLeaveRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`/rooms/${id}/leave`)).data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: qk.myRooms }),
  });
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/rooms/${id}`)).data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: qk.myRooms }),
  });
}

export function useUpdateRoom(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name?: string; topic?: string; description?: string; maxMembers?: number; visibility?: "PUBLIC" | "PRIVATE"; password?: string }) =>
      (await api.put(`/rooms/${id}`, data)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.room(id) });
      void queryClient.invalidateQueries({ queryKey: qk.myRooms });
    },
  });
}

export function useRemoveRoomMember(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) =>
      (await api.delete(`/rooms/${roomId}/members/${memberId}`)).data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: qk.room(roomId) }),
  });
}

export function useAddSyllabusItem(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; description?: string; resourceUrl?: string }) =>
      (await api.post(`/rooms/${roomId}/syllabus`, input)).data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: qk.room(roomId) }),
  });
}

export function useToggleSyllabusComplete(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) =>
      (await api.post(`/rooms/${roomId}/syllabus/${itemId}/toggle`)).data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: qk.room(roomId) }),
  });
}

export function useDeleteSyllabusItem(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) =>
      (await api.delete(`/rooms/${roomId}/syllabus/${itemId}`)).data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: qk.room(roomId) }),
  });
}

export function useAddDiscussion(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { content: string; itemId?: string; parentId?: string }) =>
      (await api.post(`/rooms/${roomId}/discussions`, input)).data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: qk.room(roomId) }),
  });
}

export function useStartFocusSession(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { task: string; duration?: number }) =>
      (await api.post(`/rooms/${roomId}/focus`, input)).data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: qk.room(roomId) }),
  });
}

export function useUpdateFocusStatus(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, status }: { sessionId: string; status: string }) =>
      (await api.put(`/rooms/${roomId}/focus/${sessionId}`, { status })).data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: qk.room(roomId) }),
  });
}

/* ── Quizzes ──────────────────────────────────────────────────── */

export function useQuizzes(roomId: string) {
  return useQuery<Quiz[]>({
    queryKey: ["quizzes", roomId],
    queryFn: async () => (await api.get<Quiz[]>(`/rooms/${roomId}/quizzes`)).data,
  });
}

export function useQuiz(roomId: string, quizId: string) {
  return useQuery<Quiz>({
    queryKey: ["quiz", roomId, quizId],
    queryFn: async () => (await api.get<Quiz>(`/rooms/${roomId}/quizzes/${quizId}`)).data,
    enabled: !!quizId,
  });
}

export function useCreateQuiz(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; description?: string; questions: { text: string; type: "MCQ" | "NUMERICAL"; options?: string[]; answer: string }[] }) =>
      (await api.post(`/rooms/${roomId}/quizzes`, input)).data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["quizzes", roomId] }),
  });
}

export function useDeleteQuiz(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (quizId: string) =>
      (await api.delete(`/rooms/${roomId}/quizzes/${quizId}`)).data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["quizzes", roomId] }),
  });
}

export function useSubmitQuiz(roomId: string, quizId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (answers: Record<string, string>) =>
      (await api.post(`/rooms/${roomId}/quizzes/${quizId}/submit`, { answers })).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["quiz", roomId, quizId] });
      void queryClient.invalidateQueries({ queryKey: ["quizzes", roomId] });
    },
  });
}

export function useGradeSubmission(roomId: string, quizId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { submissionId: string; score: number; feedback?: string }) =>
      (await api.post(`/rooms/${roomId}/quizzes/${quizId}/grade`, input)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["quiz", roomId, quizId] });
      void queryClient.invalidateQueries({ queryKey: ["quizzes", roomId] });
    },
  });
}

export function useDeleteSubmission(roomId: string, quizId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (submissionId: string) =>
      (await api.delete(`/rooms/${roomId}/quizzes/${quizId}/submissions/${submissionId}`)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["quiz", roomId, quizId] });
      void queryClient.invalidateQueries({ queryKey: ["quizzes", roomId] });
    },
  });
}

export function usePublishQuiz(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (quizId: string) =>
      (await api.post(`/rooms/${roomId}/quizzes/${quizId}/publish`)).data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["quizzes", roomId] }),
  });
}

export function useUnpublishQuiz(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (quizId: string) =>
      (await api.post(`/rooms/${roomId}/quizzes/${quizId}/unpublish`)).data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["quizzes", roomId] }),
  });
}

export function useUpdateQuiz(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ quizId, data }: { quizId: string; data: { title: string; description?: string; questions: { text: string; type: "MCQ" | "NUMERICAL"; options?: string[]; answer: string }[] } }) =>
      (await api.put(`/rooms/${roomId}/quizzes/${quizId}`, data)).data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["quizzes", roomId] }),
  });
}
