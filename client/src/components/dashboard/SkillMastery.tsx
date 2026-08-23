import { Code2 } from "lucide-react";
import { EmptyState } from "../ui/EmptyState";

interface SkillMasteryProps {
  skills: { name: string; level: number }[];
}

export function SkillMastery({ skills }: SkillMasteryProps) {
  if (!skills.length) {
    return (
      <EmptyState
        icon={Code2}
        title="No skills tracked yet"
        hint="Add your stack in Profile Settings to see mastery progress here."
      />
    );
  }

  return (
    <ul className="space-y-4">
      {skills.map((skill, i) => (
        <li key={skill.name}>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-sm font-medium text-slate-300">{skill.name}</span>
            <span className="metric-mono text-xs font-semibold text-accent-bright">{skill.level}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800/80">
            <div
              className="h-full rounded-full bg-neon-gradient shadow-glow-sm transition-all duration-700 ease-out"
              style={{
                width: `${Math.max(2, Math.min(100, skill.level))}%`,
                transitionDelay: `${i * 60}ms`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
