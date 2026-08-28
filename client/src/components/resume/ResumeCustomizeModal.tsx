import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
import type { Project, SkillProgress, ResumeOptions, ResumeTemplate } from "../../types";

interface Props {
  projects: Project[];
  skills: SkillProgress[];
  initial: ResumeOptions;
  onSave: (opts: ResumeOptions) => void;
  onClose: () => void;
}

export function ResumeCustomizeModal({ projects, skills, initial, onSave, onClose }: Props) {
  const [headline, setHeadline] = useState(initial.headline ?? "");
  const [location, setLocation] = useState(initial.location ?? "");
  const [template, setTemplate] = useState<ResumeTemplate>(initial.template);
  const [selProjects, setSelProjects] = useState<Set<string>>(
    new Set(initial.selectedProjectIds?.length ? initial.selectedProjectIds : projects.map((p) => p.id))
  );
  const [selSkills, setSelSkills] = useState<Set<string>>(
    new Set(initial.selectedSkillNames?.length ? initial.selectedSkillNames : skills.map((s) => s.name))
  );

  const toggle = (set: Set<string>, id: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    setter(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-800 bg-surface-raised p-6 shadow-glow"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Customize resume</h2>
          <button onClick={onClose} className="text-ink-faint hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label-dark">Professional headline</label>
              <input className="input-dark" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Full-Stack Developer" />
            </div>
            <div>
              <label className="label-dark">Location</label>
              <input className="input-dark" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Bengaluru, India" />
            </div>
          </div>

          <div>
            <span className="label-dark">Template</span>
            <div className="grid grid-cols-2 gap-2">
              {(["minimal", "classic"] as ResumeTemplate[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTemplate(t)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left text-sm capitalize transition-all",
                    template === t ? "border-accent/60 bg-accent/[.07] text-white" : "border-slate-800 bg-surface text-slate-300"
                  )}
                >
                  {t === "minimal" ? "Minimal Tech" : "Classic Single-Column"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="label-dark">Featured projects ({selProjects.size}/{projects.length})</span>
            <div className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-800 bg-surface p-2">
              {projects.length === 0 && <p className="text-xs text-ink-faint">No DevTask projects yet.</p>}
              {projects.map((p) => (
                <label key={p.id} className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                  <input type="checkbox" checked={selProjects.has(p.id)} onChange={() => toggle(selProjects, p.id, setSelProjects)} />
                  {p.name}
                </label>
              ))}
            </div>
          </div>

          <div>
            <span className="label-dark">Highlighted skills ({selSkills.size}/{skills.length})</span>
            <div className="mt-2 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-slate-800 bg-surface p-2">
              {skills.length === 0 && <p className="text-xs text-ink-faint">No skills tracked yet.</p>}
              {skills.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => toggle(selSkills, s.name, setSelSkills)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                    selSkills.has(s.name)
                      ? "border-accent/60 bg-accent/[.1] text-white"
                      : "border-slate-700 text-ink-faint line-through"
                  )}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              onSave({
                headline: headline.trim() || undefined,
                location: location.trim() || undefined,
                template,
                selectedProjectIds: [...selProjects],
                selectedSkillNames: [...selSkills],
              })
            }
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
