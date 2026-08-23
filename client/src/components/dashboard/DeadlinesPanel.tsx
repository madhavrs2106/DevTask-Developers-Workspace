import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarClock } from "lucide-react";
import type { Analytics } from "../../types";
import { DIFFICULTY_META } from "../../lib/constants";
import { dueMeta } from "../../lib/utils";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import { cn } from "../../lib/utils";

type Deadline = Analytics["upcomingDeadlines"][number];

export function DeadlinesPanel({ deadlines }: { deadlines: Deadline[] }) {
  if (!deadlines.length) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="No upcoming deadlines"
        hint="Tasks with a due date will surface here so nothing slips."
      />
    );
  }

  return (
    <ul className="divide-y divide-slate-800/70">
      {deadlines.map((d) => {
        const meta = dueMeta(d.dueDate);
        const diff = DIFFICULTY_META[d.difficulty];
        return (
          <li key={d.id}>
            <Link
              to="/board"
              className="group flex items-center gap-3 px-1 py-3.5 transition-colors hover:bg-white/[.02]"
            >
              <span
                className={cn(
                  "h-8 w-1 shrink-0 rounded-full",
                  meta?.tone === "overdue" && "bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,.6)]",
                  meta?.tone === "soon" && "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,.5)]",
                  (!meta || meta.tone === "normal") &&
                    "bg-slate-700 group-hover:bg-accent/70"
                )}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-200 group-hover:text-white">
                  {d.title}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-ink-faint">
                  {d.projectName ?? d.courseTitle ?? "Unassigned"}
                  {" · "}
                  <span className={cn(meta?.tone === "overdue" && "text-rose-400", meta?.tone === "soon" && "text-amber-400")}>
                    {meta?.label}
                  </span>
                </p>
              </div>
              <Badge className={diff.chip} title={`Difficulty: ${diff.label}`}>
                {diff.label}
              </Badge>
              <ArrowUpRight
                size={15}
                className="shrink-0 text-slate-600 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-bright"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
