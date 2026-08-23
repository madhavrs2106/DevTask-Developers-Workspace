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
} from "../types";

export const qk = {
  tasks: ["tasks"] as const,
  analytics: ["analytics"] as const,
  projects: ["projects"] as const,
  courses: ["courses"] as const,
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
  return useMutation({
    mutationFn: async (skills) =>
      (await api.put<{ skills: SkillProgress[] }>("/users/me/skills", { skills })).data.skills,
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

/* ── Follows ────────────────────────────────────────────────── */

export function useFollowUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (username: string) =>
      (await api.post<{ following: boolean }>(`/follows/${username}`)).data,
    onSuccess: (_data, username) => {
      void queryClient.invalidateQueries({ queryKey: ["userProfile", username] });
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
    },
  });
}
