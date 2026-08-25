import { BookOpen } from "lucide-react";
import { EmptyState } from "../ui/EmptyState";

interface CoursesStudyingProps {
  courses: {
    id: string;
    title: string;
    progress: number;
    lessonsDone: number;
    totalLessons: number;
  }[];
}

export function CoursesStudying({ courses }: CoursesStudyingProps) {
  if (!courses.length) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No courses in progress"
        hint="Start a course to track your learning progress here."
      />
    );
  }

  return (
    <ul className="space-y-4">
      {courses.map((course, i) => (
        <li key={course.id}>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-sm font-medium text-slate-300 truncate">{course.title}</span>
            <span className="metric-mono text-xs font-semibold text-accent-bright shrink-0 ml-2">{course.progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800/80">
            <div
              className="h-full rounded-full bg-neon-gradient shadow-glow-sm transition-all duration-700 ease-out"
              style={{
                width: `${Math.max(2, Math.min(100, course.progress))}%`,
                transitionDelay: `${i * 60}ms`,
              }}
            />
          </div>
          <p className="mt-1 metric-mono text-[11px] text-ink-faint">
            {course.lessonsDone}/{course.totalLessons} lessons
          </p>
        </li>
      ))}
    </ul>
  );
}
