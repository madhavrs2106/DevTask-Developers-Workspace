import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { apiErrorMessage } from "../../lib/api";
import { cn } from "../../lib/utils";
import { DIFFICULTIES, DIFFICULTY_META, TASK_STATUSES, TECH_TAGS } from "../../lib/constants";
import { useCourses, useCreateTask, useDeleteTask, useMe, useProjects, useUpdateTask } from "../../hooks/useQueries";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import type { Difficulty, Task, TaskInput, TaskStatus } from "../../types";

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  /** When set the modal edits an existing task */
  task?: Task | null;
  defaultStatus?: TaskStatus;
}

interface FormState {
  title: string;
  description: string;
  status: TaskStatus;
  difficulty: Difficulty;
  dueDate: string;
  actualHours: string;
  githubUrl: string;
  snippetLang: string;
  codeSnippet: string;
  projectId: string;
  courseId: string;
}

/** Common languages shown when the user has no skill data yet. */
const FALLBACK_LANGS = [
  "typescript",
  "javascript",
  "python",
  "go",
  "rust",
  "sql",
  "bash",
  "json",
  "html",
  "css",
];

/** Heuristic: skill names that look like programming languages / tech. */
const LANG_SKILL_RE = /^(typescript|ts|javascript|js|python|py|go|golang|rust|java|c\+\+|c#|csharp|ruby|php|swift|kotlin|scala|r|dart|lua|perl|haskell|elixir|sql|graphql|html|css|scss|sass|tailwind|bash|shell|zsh|dockerfile|yaml|json|toml|markdown|svelte|vue|react|next|nuxt)$/i;

function emptyForm(defaultStatus: TaskStatus): FormState {
  return {
    title: "",
    description: "",
    status: defaultStatus,
    difficulty: "BEGINNER",
    dueDate: "",
    actualHours: "",
    githubUrl: "",
    snippetLang: "",
    codeSnippet: "",
    projectId: "",
    courseId: "",
  };
}

export function TaskModal({ open, onClose, task, defaultStatus = "BACKLOG" }: TaskModalProps) {
  const isEdit = Boolean(task);
  const [form, setForm] = useState<FormState>(() => emptyForm(defaultStatus));
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [showSnippet, setShowSnippet] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: projects = [] } = useProjects();
  const { data: courses = [] } = useCourses();
  const { data: meData } = useMe();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  /** Languages derived from the user's tracked skills, falling back to defaults. */
  const snippetLangs = useMemo(() => {
    const skillLangs = (meData?.skills ?? [])
      .map((s) => s.name.trim().toLowerCase())
      .filter((name) => LANG_SKILL_RE.test(name));
    return skillLangs.length > 0 ? skillLangs : FALLBACK_LANGS;
  }, [meData?.skills]);

  // Hydrate form whenever the modal opens for a different target
  useEffect(() => {
    if (!open) return;
    setError(null);
    setShowSnippet(Boolean(task?.codeSnippet));

    if (task) {
      setForm({
        title: task.title,
        description: task.description ?? "",
        status: task.status,
        difficulty: task.difficulty,
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
        actualHours: task.actualHours ? String(task.actualHours) : "",
        githubUrl: task.githubUrl ?? "",
        snippetLang: task.snippetLang ?? "",
        codeSnippet: task.codeSnippet ?? "",
        projectId: task.projectId ?? "",
        courseId: task.courseId ?? "",
      });
      setTags(task.tags);
    } else {
      setForm(emptyForm(defaultStatus));
      setTags([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task?.id]);

  const pending = createTask.isPending || updateTask.isPending;

  const suggestions = useMemo(() => {
    const q = tagDraft.trim().toLowerCase();
    return TECH_TAGS.filter(
      (t) =>
        !tags.some((existing) => existing.toLowerCase() === t.toLowerCase()) &&
        (q === "" ? true : t.toLowerCase().includes(q))
    ).slice(0, 6);
  }, [tagDraft, tags]);

  function patch(partial: Partial<FormState>) {
    setForm((f) => ({ ...f, ...partial }));
  }

  function addTag(raw: string) {
    const value = raw.trim().replace(/,+$/, "");
    if (!value) return;
    if (tags.length >= 8) {
      setError("At most 8 tags per task");
      return;
    }
    if (!tags.some((t) => t.toLowerCase() === value.toLowerCase())) {
      setTags((ts) => [...ts, value]);
    }
    setTagDraft("");
  }

  function handleTagKeys(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagDraft);
    } else if (e.key === "Backspace" && tagDraft === "" && tags.length > 0) {
      setTags((ts) => ts.slice(0, -1));
    }
  }

  async function handleSubmit() {
    setError(null);
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }

    const payload: TaskInput = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      status: form.status,
      difficulty: form.difficulty,
      tags,
      codeSnippet: form.codeSnippet.trim() || null,
      snippetLang: form.snippetLang || null,
      githubUrl: form.githubUrl.trim() || null,
      // noon timestamp keeps the calendar day stable across timezones
      dueDate: form.dueDate ? new Date(`${form.dueDate}T12:00:00`).toISOString() : null,
      actualHours: Number(form.actualHours) || 0,
      projectId: form.projectId || null,
      courseId: form.courseId || null,
    };

    try {
      if (task) await updateTask.mutateAsync({ id: task.id, data: payload });
      else await createTask.mutateAsync(payload);
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, "Could not save the task"));
    }
  }

  async function handleDelete() {
    if (!task) return;
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    try {
      await deleteTask.mutateAsync(task.id);
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, "Could not delete the task"));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={isEdit ? "Edit task" : "New task"}
      footer={
        <div className="flex items-center justify-between gap-3">
          {isEdit ? (
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleteTask.isPending}
              className="gap-1.5"
            >
              {deleteTask.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={pending}>
              {pending && <Loader2 size={15} className="animate-spin" />}
              {isEdit ? "Save changes" : "Create task"}
            </Button>
          </div>
        </div>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
      >
        {error && (
          <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-300">
            {error}
          </p>
        )}

        {/* Title */}
        <div>
          <label htmlFor="task-title" className="label-dark">
            Title *
          </label>
          <input
            id="task-title"
            className="input-dark"
            placeholder="e.g. Implement JWT refresh flow"
            value={form.title}
            onChange={(e) => patch({ title: e.target.value })}
            autoFocus
            maxLength={160}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="task-desc" className="label-dark">
            Description
          </label>
          <textarea
            id="task-desc"
            rows={2}
            className="input-dark resize-y"
            placeholder="Context, acceptance criteria, notes…"
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
            maxLength={5000}
          />
        </div>

        {/* Status + difficulty */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="task-status" className="label-dark">
              Status
            </label>
            <select
              id="task-status"
              className="input-dark"
              value={form.status}
              onChange={(e) => patch({ status: e.target.value as TaskStatus })}
            >
              {TASK_STATUSES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="label-dark">Difficulty</span>
            <div className="flex rounded-xl border border-slate-800 bg-surface-raised p-1">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => patch({ difficulty: d })}
                  className={cn(
                    "flex-1 rounded-lg px-2 py-1.5 text-[11px] font-medium capitalize transition-all",
                    form.difficulty === d
                      ? DIFFICULTY_META[d].chip + " shadow-glow-sm"
                      : "text-ink-faint hover:text-slate-300"
                  )}
                >
                  {DIFFICULTY_META[d].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Categorisation */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="task-project" className="label-dark">
              Project <span className="normal-case text-ink-faint">(optional)</span>
            </label>
            <select
              id="task-project"
              className="input-dark"
              value={form.projectId}
              onChange={(e) => patch({ projectId: e.target.value })}
            >
              <option value="">— none —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="task-course" className="label-dark">
              Course <span className="normal-case text-ink-faint">(optional)</span>
            </label>
            <select
              id="task-course"
              className="input-dark"
              value={form.courseId}
              onChange={(e) => patch({ courseId: e.target.value })}
            >
              <option value="">— none —</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-[11px] text-ink-faint">
          Link tasks to a project, a course, or both — so you know which course each project task belongs to.
        </p>

        {/* Due date + hours */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="task-due" className="label-dark">
              Due date
            </label>
            <input
              id="task-due"
              type="date"
              className="input-dark [color-scheme:dark]"
              value={form.dueDate}
              onChange={(e) => patch({ dueDate: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="task-hours" className="label-dark">
              Hours spent
            </label>
            <input
              id="task-hours"
              type="number"
              min={0}
              step={0.5}
              placeholder="0"
              className="input-dark font-mono"
              value={form.actualHours}
              onChange={(e) => patch({ actualHours: e.target.value })}
            />
          </div>
        </div>

        {/* GitHub link */}
        <div>
          <label htmlFor="task-github" className="label-dark">
            GitHub repo / PR / issue URL
          </label>
          <input
            id="task-github"
            type="url"
            placeholder="https://github.com/you/repo/pull/42"
            className="input-dark"
            value={form.githubUrl}
            onChange={(e) => patch({ githubUrl: e.target.value })}
          />
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="task-tags" className="label-dark">
            Tech tags <span className="normal-case text-ink-faint">(press Enter)</span>
          </label>
          <div className="input-dark flex min-h-[42px] flex-wrap items-center gap-1.5 !py-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-md border border-accent/30 bg-accent/10 px-1.5 py-0.5 font-mono text-[11px] uppercase text-accent-soft"
              >
                {tag}
                <button
                  type="button"
                  aria-label={`Remove tag ${tag}`}
                  onClick={() => setTags((ts) => ts.filter((t) => t !== tag))}
                  className="text-accent-bright/70 hover:text-white"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
            <input
              id="task-tags"
              className="min-w-[120px] flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
              placeholder={tags.length ? "Add another…" : "React, Go, Data Structures…"}
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={handleTagKeys}
              maxLength={24}
            />
          </div>
          {suggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {suggestions.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addTag(t)}
                  className="inline-flex items-center gap-1 rounded-md border border-dashed border-slate-700 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-faint transition-colors hover:border-accent/50 hover:text-accent-bright"
                >
                  <Plus size={9} /> {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Code snippet */}
        <div className="rounded-xl border border-slate-800 bg-surface-raised/50 p-3">
          <div className="flex items-center justify-between">
            <span className="label-dark !mb-0">Code snippet</span>
            <button
              type="button"
              onClick={() => setShowSnippet((v) => !v)}
              className="rounded-lg border border-slate-700 px-2 py-1 text-[11px] text-ink-muted transition-colors hover:border-accent/50 hover:text-accent-bright"
            >
              {showSnippet ? "Hide" : "Attach"}
            </button>
          </div>
          {showSnippet && (
            <div className="mt-2.5 space-y-2">
              <textarea
                rows={5}
                spellCheck={false}
                className="input-dark resize-y font-mono !text-xs leading-relaxed"
                placeholder="// paste a relevant snippet…"
                value={form.codeSnippet}
                onChange={(e) => patch({ codeSnippet: e.target.value })}
              />
              <select
                aria-label="Snippet language"
                className="input-dark max-w-[180px]"
                value={form.snippetLang}
                onChange={(e) => patch({ snippetLang: e.target.value })}
              >
                <option value="">language…</option>
                {snippetLangs.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Hidden submit so Enter works */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
