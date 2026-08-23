import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CalendarClock,
  Code2,
  FolderGit2,
  Github,
  KanbanSquare,
  LayoutList,
  ListChecks,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { cn, dueMeta, formatHours } from "../lib/utils";
import { DIFFICULTY_META, STATUS_META } from "../lib/constants";
import { useDeleteTask, useTasks } from "../hooks/useQueries";
import type { Task, TaskStatus } from "../types";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { Badge } from "../components/ui/Badge";
import { TaskModal } from "../components/tasks/TaskModal";

type SortMode = "due" | "status" | "recent";

const SORT_LABELS: Record<SortMode, string> = {
  due: "Due date",
  status: "Status",
  recent: "Recently added",
};

const STATUS_ORDER: TaskStatus[] = ["IN_PROGRESS", "REVIEW", "BACKLOG", "DONE"];

export function TaskList() {
  const { data: tasks = [], isLoading } = useTasks();
  const deleteTask = useDeleteTask();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | TaskStatus>("");
  const [sort, setSort] = useState<SortMode>("due");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = tasks.filter(
      (t) =>
        (!q ||
          t.title.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q)) &&
        (!statusFilter || t.status === statusFilter)
    );

    return [...filtered].sort((a, b) => {
      if (sort === "due") {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (sort === "status") {
        return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [tasks, query, statusFilter, sort]);

  function openEdit(task: Task) {
    setEditingTask(task);
    setModalOpen(true);
  }

  async function handleDelete(task: Task) {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    await deleteTask.mutateAsync(task.id);
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-slate-800 bg-surface-raised p-1">
            <Link
              to="/board"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:text-white"
            >
              <KanbanSquare size={14} /> Board
            </Link>
            <span className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent-bright shadow-glow-sm">
              <LayoutList size={14} /> List
            </span>
          </div>

          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks…"
              aria-label="Search tasks"
              className="input-dark !w-full pl-8 sm:!w-52"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "" | TaskStatus)}
            aria-label="Filter by status"
            className="input-dark !w-auto min-w-[130px]"
          >
            <option value="">All statuses</option>
            {(Object.keys(STATUS_META) as TaskStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          aria-label="Sort tasks"
          className="input-dark !w-auto lg:ml-auto"
        >
          {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
            <option key={mode} value={mode}>
              Sort: {SORT_LABELS[mode]}
            </option>
          ))}
        </select>
      </div>

      {/* Rows */}
      {isLoading ? (
        <Spinner className="py-24" label="Loading tasks…" />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title={tasks.length === 0 ? "No tasks yet" : "No tasks match your filters"}
          hint={
            tasks.length === 0
              ? "Head to the board and create your first task."
              : "Try clearing the search or filters above."
          }
        />
      ) : (
        <ul className="space-y-2">
          {visible.map((task) => {
            const done = task.status === "DONE";
            const due = dueMeta(task.dueDate);
            const diff = DIFFICULTY_META[task.difficulty];

            return (
              <li key={task.id}>
                <article
                  onClick={() => openEdit(task)}
                  onKeyDown={(e) => e.key === "Enter" && openEdit(task)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Edit task ${task.title}`}
                  className="card card-interactive group flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:flex-nowrap"
                >
                  {/* Title + meta */}
                  <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                    <div className="flex min-w-0 items-center gap-2">
                      <h4
                        className={cn(
                          "truncate text-sm font-medium",
                          done ? "text-slate-500 line-through" : "text-slate-100"
                        )}
                      >
                        {task.title}
                      </h4>
                      {task.githubUrl && (
                        <a
                          href={task.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title={task.githubUrl}
                          className="shrink-0 text-ink-faint transition-colors hover:text-accent-bright"
                        >
                          <Github size={13} />
                        </a>
                      )}
                      {task.codeSnippet && (
                        <span title="Has code snippet" className="shrink-0 text-accent/70">
                          <Code2 size={13} />
                        </span>
                      )}
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ink-faint">
                      <span className="inline-flex items-center gap-1" style={{ color: STATUS_META[task.status].accent }}>
                        ● {STATUS_META[task.status].label}
                      </span>
                      {task.project && (
                        <span className="inline-flex max-w-[180px] items-center gap-1 truncate">
                          <FolderGit2 size={11} style={{ color: task.project.color }} />
                          <span className="truncate">{task.project.name}</span>
                        </span>
                      )}
                      {task.course && !task.project && (
                        <span className="inline-flex max-w-[200px] items-center gap-1 truncate">
                          <BookOpen size={11} />
                          <span className="truncate">{task.course.title}</span>
                        </span>
                      )}
                      {task.actualHours > 0 && (
                        <span className="metric-mono">{formatHours(task.actualHours)} spent</span>
                      )}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="hidden shrink-0 items-center gap-1.5 xl:flex">
                    {task.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-slate-700/80 bg-slate-800/70 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                    {task.tags.length > 3 && (
                      <span className="metric-mono text-[10px] text-ink-faint">
                        +{task.tags.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Difficulty */}
                  <Badge className={cn("shrink-0", diff.chip)}>{diff.label}</Badge>

                  {/* Due date */}
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 text-[11px]",
                      due?.tone === "overdue" && "text-rose-400",
                      due?.tone === "soon" && "text-amber-400",
                      (!due || due.tone === "normal") && "text-ink-faint"
                    )}
                  >
                    <CalendarClock size={12} />
                    {due?.label ?? "No due date"}
                  </span>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 max-md:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(task);
                      }}
                      aria-label={`Edit ${task.title}`}
                      className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-white/5 hover:text-accent-bright"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDelete(task);
                      }}
                      disabled={deleteTask.isPending}
                      aria-label={`Delete ${task.title}`}
                      className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-rose-400/10 hover:text-rose-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}

      <TaskModal open={modalOpen} onClose={() => setModalOpen(false)} task={editingTask} />
    </div>
  );
}
