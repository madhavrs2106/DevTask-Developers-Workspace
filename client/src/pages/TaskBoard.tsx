import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { KanbanSquare, LayoutList, ListTodo, Plus, Search, Square } from "lucide-react";
import { cn } from "../lib/utils";
import { DIFFICULTIES, DIFFICULTY_META, TASK_STATUSES } from "../lib/constants";
import { useReorderTasks, useTasks, useUpdateTask, type ReorderUpdate } from "../hooks/useQueries";
import type { Difficulty, Task, TaskStatus } from "../types";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { Button } from "../components/ui/Button";
import { TaskCard } from "../components/tasks/TaskCard";
import { TaskModal } from "../components/tasks/TaskModal";

export function TaskBoard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: tasks = [], isLoading } = useTasks();
  const reorder = useReorderTasks();
  const updateTask = useUpdateTask();

  /* Modal state */
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("BACKLOG");

  /* Drag state */
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  /* Filters */
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<"" | Difficulty>("");

  /* ?new=1 (header CTA) opens the create dialog */
  useEffect(() => {
    if (searchParams.get("new")) {
      openCreate("BACKLOG");
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => t.tags.forEach((tag) => set.add(tag)));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter(
      (t) =>
        (!q ||
          t.title.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q)) &&
        (!tagFilter || t.tags.includes(tagFilter)) &&
        (!difficultyFilter || t.difficulty === difficultyFilter)
    );
  }, [tasks, query, tagFilter, difficultyFilter]);

  const columns = useMemo(() => {
    const map = new Map<TaskStatus, Task[]>(TASK_STATUSES.map((s) => [s.id, []]));
    for (const t of filtered) map.get(t.status)?.push(t);
    for (const list of map.values()) list.sort((a, b) => a.position - b.position);
    return map;
  }, [filtered]);

  function openCreate(status: TaskStatus = "BACKLOG") {
    setEditingTask(null);
    setDefaultStatus(status);
    setModalOpen(true);
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    setModalOpen(true);
  }

  function toggleDone(task: Task) {
    updateTask.mutate({
      id: task.id,
      data: { status: task.status === "DONE" ? "IN_PROGRESS" : "DONE" },
    });
  }

  /** Moves `dragged` into `targetStatus`, optionally before `beforeId`. */
  function moveTask(dragged: string, targetStatus: TaskStatus, beforeId?: string | null) {
    const source = tasks.find((t) => t.id === dragged);
    if (!source) return finishDrag();

    const updates = new Map<string, ReorderUpdate>();

    for (const col of TASK_STATUSES) {
      const involved = col.id === targetStatus || col.id === source.status;
      if (!involved) continue;

      const list = tasks
        .filter((t) => t.status === col.id && t.id !== source.id)
        .sort((a, b) => a.position - b.position)
        .map((t) => t.id);

      if (col.id === targetStatus) {
        if (beforeId && list.includes(beforeId)) {
          list.splice(list.indexOf(beforeId), 0, source.id);
        } else {
          list.push(source.id);
        }
      }

      list.forEach((id, position) => updates.set(id, { id, status: col.id, position }));
    }

    finishDrag();

    const changed = [...updates.values()].filter((u) => {
      const current = tasks.find((t) => t.id === u.id);
      return !current || current.status !== u.status || Math.abs(current.position - u.position) > 0.001;
    });
    if (changed.length > 0) reorder.mutate({ updates: changed });
  }

  function finishDrag() {
    setDragId(null);
    setDragOverCol(null);
  }

  return (
    <div className="space-y-5">
      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-xl border border-slate-800 bg-surface-raised p-1">
            <span className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent-bright shadow-glow-sm">
              <KanbanSquare size={14} /> Board
            </span>
            <Link
              to="/tasks"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:text-white"
            >
              <LayoutList size={14} /> List
            </Link>
          </div>

          {/* Search */}
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

          {/* Tag filter */}
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            aria-label="Filter by tag"
            className="input-dark !w-auto min-w-[120px]"
          >
            <option value="">All stacks</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>

          {/* Difficulty filter */}
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value as "" | Difficulty)}
            aria-label="Filter by difficulty"
            className="input-dark !w-auto min-w-[130px]"
          >
            <option value="">All levels</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {DIFFICULTY_META[d].label}
              </option>
            ))}
          </select>
        </div>

        <Button onClick={() => openCreate()} className="shrink-0">
          <Plus size={16} strokeWidth={2.5} /> New Task
        </Button>
      </div>

      {/* ── Kanban board ────────────────────────────────────────── */}
      {isLoading ? (
        <Spinner className="py-24" label="Loading your board…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title={tasks.length === 0 ? "No tasks yet" : "No tasks match your filters"}
          hint={
            tasks.length === 0
              ? "Create your first task and start shipping."
              : "Try clearing the search or filters above."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {TASK_STATUSES.map((col) => {
            const columnTasks = columns.get(col.id) ?? [];
            return (
              <section
                key={col.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setDragOverCol(col.id);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragId) moveTask(dragId, col.id);
                }}
                className={cn(
                  "card flex min-h-[260px] flex-col p-3 transition-all duration-200",
                  dragOverCol === col.id && dragId
                    ? "border-accent/60 bg-accent/[.04] shadow-glow-sm"
                    : ""
                )}
              >
                <header className="mb-3 flex items-center gap-2 px-1">
                  <span
                    aria-hidden
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: col.accent, boxShadow: `0 0 8px ${col.accent}` }}
                  />
                  <h3 className="font-mono text-[11px] font-semibold uppercase tracking-widest text-slate-300">
                    {col.label}
                  </h3>
                  <span className="metric-mono ml-auto rounded-full bg-slate-800/80 px-2 py-0.5 text-[11px] text-ink-muted">
                    {columnTasks.length}
                  </span>
                  <button
                    onClick={() => openCreate(col.id)}
                    aria-label={`Add task to ${col.label}`}
                    title={`Add task to ${col.label}`}
                    className="rounded-md p-1 text-slate-500 transition-colors hover:bg-white/5 hover:text-accent-bright"
                  >
                    <Plus size={15} />
                  </button>
                </header>

                <div className="flex flex-1 flex-col gap-2">
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isDragging={dragId === task.id}
                      onDragStart={(_, t) => setDragId(t.id)}
                      onDragEnd={finishDrag}
                      onEdit={openEdit}
                      onToggleDone={toggleDone}
                      onDropBefore={(targetId) => {
                        if (dragId && dragId !== targetId) moveTask(dragId, col.id, targetId);
                        else finishDrag();
                      }}
                    />
                  ))}

                  {columnTasks.length === 0 && (
                    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-800 py-8">
                      <span className="flex items-center gap-1.5 text-[11px] text-slate-600">
                        <Square size={10} className="opacity-40" />
                        Drop tasks here
                      </span>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <TaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        task={editingTask}
        defaultStatus={defaultStatus}
      />
    </div>
  );
}
