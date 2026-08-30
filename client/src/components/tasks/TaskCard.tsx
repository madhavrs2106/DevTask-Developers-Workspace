import type { DragEvent, MouseEvent } from "react";
import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock,
  Code2,
  FolderGit2,
  Github,
} from "lucide-react";
import type { Task } from "../../types";
import { cn, dueMeta } from "../../lib/utils";
import { DIFFICULTY_META } from "../../lib/constants";
import { useAuth } from "../../context/AuthContext";

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onDragStart: (e: DragEvent<HTMLElement>, task: Task) => void;
  onDragEnd: () => void;
  onEdit: (task: Task) => void;
  onToggleDone: (task: Task) => void;
  /** Drop a dragged card *before* this one */
  onDropBefore?: (targetId: string) => void;
  onPodometer?: (task: Task) => void;
}

export function TaskCard({
  task,
  isDragging,
  onDragStart,
  onDragEnd,
  onEdit,
  onToggleDone,
  onDropBefore,
  onPodometer,
}: TaskCardProps) {
  const { user } = useAuth();
  const visibleTags = task.tags.filter((tag) => tag.toLowerCase() !== "developer" || user?.role === "DEVELOPER");
  const done = task.status === "DONE";
  const due = dueMeta(task.dueDate);
  const difficulty = DIFFICULTY_META[task.difficulty];

  function handleClick() {
    onEdit(task);
  }

  function handleCompleteClick(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    onToggleDone(task);
  }

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", task.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(e, task);
      }}
      onDragEnd={onDragEnd}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) return;
        onDropBefore?.(task.id);
      }}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleClick();
      }}
      tabIndex={0}
      role="button"
      aria-label={`Task: ${task.title}`}
      className={cn(
        "group cursor-grab select-none rounded-xl border border-slate-800 bg-surface-raised p-3.5 transition-all duration-200 animate-fade-in",
        "hover:border-accent/40 hover:shadow-glow-sm focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent/60",
        done && "opacity-60",
        isDragging && "scale-[.98] opacity-40 ring-1 ring-accent/60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h4
          className={cn(
            "text-sm font-medium leading-snug text-slate-100",
            done && "text-slate-500 line-through"
          )}
        >
          {task.title}
        </h4>
        <button
          onClick={handleCompleteClick}
          aria-label={done ? "Mark as not done" : "Mark as done"}
          className={cn(
            "-mr-1 -mt-1 shrink-0 rounded-lg p-1 transition-colors",
            done ? "text-teal-300" : "text-slate-600 hover:text-accent-bright"
          )}
        >
          {done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
        </button>
      </div>

      {/* Tags — Developer tag only visible to developers */}
      {visibleTags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-slate-700/80 bg-slate-800/70 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Meta row */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
        <span
          title={`${difficulty.label} level`}
          className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5", difficulty.chip)}
        >
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: difficulty.dot, boxShadow: `0 0 6px ${difficulty.dot}` }}
          />
          {difficulty.label}
        </span>

        {due && (
          <span
            className={cn(
              "inline-flex items-center gap-1",
              due.tone === "overdue" && "text-rose-400",
              due.tone === "soon" && "text-amber-400",
              due.tone === "normal" && "text-ink-faint"
            )}
          >
            <CalendarClock size={12} />
            {due.label}
          </span>
        )}

        {task.course && !task.project && (
          <span
            className="inline-flex min-w-0 items-center gap-1 truncate text-ink-faint"
            title={`Course: ${task.course.title}`}
          >
            <BookOpen size={12} />
            <span className="truncate">{task.course.title}</span>
          </span>
        )}

        <span className="flex-1" />

        {task.githubUrl && (
          <a
            href={task.githubUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Open GitHub link"
            className="rounded-md p-0.5 text-ink-faint transition-colors hover:text-white"
          >
            <Github size={13} />
          </a>
        )}

        {task.status === "IN_PROGRESS" && onPodometer && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPodometer(task);
            }}
            title="Start Podometer"
            className="rounded-md p-0.5 text-accent-bright transition-colors hover:bg-accent/10 hover:text-white"
          >
            <Clock size={13} />
          </button>
        )}

        {task.codeSnippet && (
          <span title="Has code snippet attached" className="text-accent/70">
            <Code2 size={13} />
          </span>
        )}

        {task.project && (
          <span
            className="inline-flex items-center gap-1 truncate text-ink-faint"
            title={`Project: ${task.project.name}`}
          >
            <FolderGit2 size={12} style={{ color: task.project.color }} />
            <span className="max-w-[72px] truncate">{task.project.name}</span>
          </span>
        )}
      </div>
    </article>
  );
}
