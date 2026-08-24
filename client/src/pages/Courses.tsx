import { useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import { apiErrorMessage } from "../lib/api";
import { cn } from "../lib/utils";
import { COURSE_STATUS_META } from "../lib/constants";
import {
  useCreateCourse,
  useCourses,
  useDeleteCourse,
  useUpdateCourse,
} from "../hooks/useQueries";
import type { Course, CourseStatus } from "../types";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";

interface FormState {
  title: string;
  provider: string;
  category: string;
  description: string;
  totalLessons: string;
  lessonsDone: string;
  estimatedHours: string;
}

const emptyForm: FormState = {
  title: "",
  provider: "",
  category: "",
  description: "",
  totalLessons: "",
  lessonsDone: "0",
  estimatedHours: "",
};

function toPayload(form: FormState, status?: CourseStatus) {
  const total = Math.max(0, Number(form.totalLessons) || 0);
  const doneRaw = Math.max(0, Number(form.lessonsDone) || 0);
  return {
    title: form.title.trim(),
    provider: form.provider.trim() || null,
    category: form.category.trim() || null,
    description: form.description.trim() || null,
    totalLessons: total,
    lessonsDone: Math.min(doneRaw, total),
    estimatedHours: Math.max(0, Number(form.estimatedHours) || 0),
    status:
      status ??
      (total > 0 && doneRaw >= total ? ("COMPLETED" as const) : ("IN_PROGRESS" as const)),
  };
}

export function Courses() {
  const { data: courses = [], isLoading } = useCourses();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(course: Course) {
    setEditing(course);
    setForm({
      title: course.title,
      provider: course.provider ?? "",
      category: course.category ?? "",
      description: course.description ?? "",
      totalLessons: String(course.totalLessons),
      lessonsDone: String(course.lessonsDone),
      estimatedHours: String(course.estimatedHours),
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit() {
    if (!form.title.trim()) {
      setError("Course title is required");
      return;
    }
    try {
      if (editing) await updateCourse.mutateAsync({ id: editing.id, data: toPayload(form) });
      else await createCourse.mutateAsync(toPayload(form));
      setModalOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not save the course"));
    }
  }

  async function bump(course: Course, delta: number) {
    const next = Math.min(
      Math.max(0, course.lessonsDone + delta),
      course.totalLessons || Number.POSITIVE_INFINITY
    );
    await updateCourse.mutateAsync({
      id: course.id,
      data: { lessonsDone: Number.isFinite(next) ? next : 0 },
    });
  }

  async function toggleComplete(course: Course) {
    if (course.status === "COMPLETED") {
      await updateCourse.mutateAsync({ id: course.id, data: { status: "IN_PROGRESS" } });
    } else {
      await updateCourse.mutateAsync({
        id: course.id,
        data: {
          status: "COMPLETED",
          lessonsDone: course.totalLessons > 0 ? course.totalLessons : course.lessonsDone,
        },
      });
    }
  }

  async function handleDelete(course: Course) {
    if (!window.confirm(`Remove "${course.title}"? Linked tasks will be kept but unlinked.`)) return;
    await deleteCourse.mutateAsync(course.id);
  }

  const busy = createCourse.isPending || updateCourse.isPending;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-faint">Roadmaps, courses and everything you're learning.</p>
        <Button onClick={openCreate} size="sm">
          <Plus size={15} strokeWidth={2.5} /> New Course
        </Button>
      </div>

      {isLoading ? (
        <Spinner className="py-24" label="Loading courses…" />
      ) : courses.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No courses yet"
          hint='Add a roadmap like "NeetCode 150" and track lessons as you go.'
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {courses.map((course) => {
            const statusMeta = COURSE_STATUS_META[course.status];
            const completed = course.status === "COMPLETED";
            return (
              <article key={course.id} className="card card-interactive p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Badge className={statusMeta.chip}>{statusMeta.label}</Badge>
                    {course.category && (
                      <span className="rounded-full border border-slate-700 bg-slate-800/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-slate-300">
                        {course.category}
                      </span>
                    )}
                    {course.provider && (
                      <span className="font-mono text-[11px] text-ink-faint">@{course.provider}</span>
                    )}
                  </div>
                  <button
                    onClick={() => void handleDelete(course)}
                    aria-label={`Delete ${course.title}`}
                    disabled={deleteCourse.isPending}
                    className="shrink-0 rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-rose-400/10 hover:text-rose-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <h3
                  className={cn(
                    "mt-3 text-base font-semibold",
                    completed ? "text-teal-300" : "text-white"
                  )}
                >
                  {course.title}
                </h3>
                {course.description && (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-muted">
                    {course.description}
                  </p>
                )}

                {/* Progress */}
                <div className="mt-4">
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="metric-mono text-xs text-slate-200">
                      {course.lessonsDone}/{course.totalLessons || "?"}
                      <span className="ml-1 font-sans text-[11px] text-ink-faint">lessons</span>
                    </span>
                    <span className="metric-mono text-xs font-semibold text-accent-bright">
                      {course.progress}%
                      {course.estimatedHours > 0 && (
                        <span className="ml-2 font-sans text-[11px] text-ink-faint">
                          ~{course.estimatedHours}h
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        completed ? "bg-teal-400 shadow-glow-sm" : "bg-neon-gradient shadow-glow-sm"
                      )}
                      style={{ width: `${Math.max(2, course.progress)}%` }}
                    />
                  </div>
                </div>

                {/* Controls */}
                <footer className="mt-4 flex items-center gap-2 border-t border-slate-800/70 pt-3">
                  <div className="flex overflow-hidden rounded-xl border border-slate-700">
                    <button
                      onClick={() => void bump(course, -1)}
                      disabled={busy || course.lessonsDone === 0}
                      aria-label="Decrement lessons done"
                      className="px-3 py-1.5 text-slate-300 transition-colors hover:bg-white/5 disabled:opacity-40"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="border-x border-slate-700 px-3 py-1.5 font-mono text-xs text-slate-200">
                      lesson
                    </span>
                    <button
                      onClick={() => void bump(course, +1)}
                      disabled={busy || (course.totalLessons > 0 && course.lessonsDone >= course.totalLessons)}
                      aria-label="Increment lessons done"
                      className="px-3 py-1.5 text-accent-bright transition-colors hover:bg-accent/10 disabled:opacity-40"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void toggleComplete(course)}
                    disabled={busy}
                    className={cn(completed && "border-teal-400/40 text-teal-300")}
                  >
                    {completed ? (
                      <>
                        <CheckCircle2 size={13} /> Completed
                      </>
                    ) : (
                      "Mark complete"
                    )}
                  </Button>

                  <Button variant="ghost" size="sm" onClick={() => openEdit(course)} className="ml-auto">
                    Edit
                  </Button>
                </footer>
              </article>
            );
          })}
        </div>
      )}

      {/* Create / edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit course" : "New course / roadmap"}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={busy}>
              {busy && <Loader2 size={15} className="animate-spin" />}
              {editing ? "Save changes" : "Create course"}
            </Button>
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

          <div>
            <label htmlFor="course-title" className="label-dark">
              Title *
            </label>
            <input
              id="course-title"
              className="input-dark"
              placeholder="NeetCode 150 Roadmap"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              maxLength={120}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="course-provider" className="label-dark">
                Provider
              </label>
              <input
                id="course-provider"
                className="input-dark"
                placeholder="Udemy, freeCodeCamp…"
                value={form.provider}
                onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
                maxLength={60}
              />
            </div>
            <div>
              <label htmlFor="course-category" className="label-dark">
                Category
              </label>
              <input
                id="course-category"
                className="input-dark"
                placeholder="Backend, DS&A…"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                maxLength={40}
              />
            </div>
          </div>

          <div>
            <label htmlFor="course-desc" className="label-dark">
              Description
            </label>
            <textarea
              id="course-desc"
              rows={2}
              className="input-dark resize-y"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              maxLength={500}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="course-total" className="label-dark">
                Total lessons
              </label>
              <input
                id="course-total"
                type="number"
                min={0}
                className="input-dark font-mono"
                value={form.totalLessons}
                onChange={(e) => setForm((f) => ({ ...f, totalLessons: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="course-done" className="label-dark">
                Done
              </label>
              <input
                id="course-done"
                type="number"
                min={0}
                className="input-dark font-mono"
                value={form.lessonsDone}
                onChange={(e) => setForm((f) => ({ ...f, lessonsDone: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="course-hours" className="label-dark">
                Est. hours
              </label>
              <input
                id="course-hours"
                type="number"
                min={0}
                className="input-dark font-mono"
                value={form.estimatedHours}
                onChange={(e) => setForm((f) => ({ ...f, estimatedHours: e.target.value }))}
              />
            </div>
          </div>

          <button type="submit" hidden aria-hidden tabIndex={-1}>
            <BookOpen size={1} />
          </button>
        </form>
      </Modal>
    </div>
  );
}
