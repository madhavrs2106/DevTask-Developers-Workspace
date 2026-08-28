import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
import type { Project, SkillProgress, ResumeOptions, ResumeSection, ResumeCustomSection } from "../../types";

interface Props {
  projects: Project[];
  skills: SkillProgress[];
  initial: ResumeOptions;
  initialCustomSections: ResumeCustomSection[];
  onSave: (opts: ResumeOptions, customSections: ResumeCustomSection[]) => void;
  onClose: () => void;
}

export function ResumeCustomizeModal({ projects, skills, initial, initialCustomSections, onSave, onClose }: Props) {
  const [headline, setHeadline] = useState(initial.headline ?? "");
  const [location, setLocation] = useState(initial.location ?? "");
  const [customSections, setCustomSections] = useState<ResumeCustomSection[]>(
    initialCustomSections.map((c) => ({ ...c }))
  );
  const [selProjects, setSelProjects] = useState<Set<string>>(
    new Set(initial.selectedProjectIds?.length ? initial.selectedProjectIds : projects.map((p) => p.id))
  );
  const [selSkills, setSelSkills] = useState<Set<string>>(
    new Set(initial.selectedSkillNames?.length ? initial.selectedSkillNames : skills.map((s) => s.name))
  );

  const SECTION_LIST: { key: ResumeSection; label: string }[] = [
    { key: "summary", label: "About / Summary" },
    { key: "education", label: "Education" },
    { key: "experience", label: "Experience" },
    { key: "skills", label: "Skills" },
    { key: "projects", label: "Projects" },
    { key: "coursesCompleted", label: "Courses Completed" },
    { key: "certifications", label: "Certifications" },
    { key: "languages", label: "Languages" },
    { key: "achievements", label: "Achievements" },
    { key: "hobbies", label: "Hobbies" },
    { key: "references", label: "References" },
  ];
  const [secOn, setSecOn] = useState<Set<string>>(() => {
    const s = new Set<string>(SECTION_LIST.map((x) => x.key));
    if (initial.sections) {
      for (const [k, v] of Object.entries(initial.sections)) if (v === false) s.delete(k);
    }
    return s;
  });
  const toggleSec = (key: string) =>
    setSecOn((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });

  const updateCustom = (i: number, val: ResumeCustomSection) =>
    setCustomSections((list) => list.map((c, j) => (j === i ? val : c)));
  const addCustom = () => setCustomSections((list) => [...list, { title: "", body: "" }]);
  const removeCustom = (i: number) => setCustomSections((list) => list.filter((_, j) => j !== i));

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

          <div>
            <span className="label-dark">Sections to include</span>
            <div className="mt-2 flex max-h-44 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-slate-800 bg-surface p-2">
              {SECTION_LIST.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => toggleSec(s.key)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                    secOn.has(s.key)
                      ? "border-accent/60 bg-accent/[.1] text-white"
                      : "border-slate-700 text-ink-faint line-through"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="label-dark">Custom sections</span>
            <p className="mb-2 text-[11px] text-ink-faint">Add any extra sections you want on the resume (e.g. Projects, Awards, Volunteering).</p>
            <div className="space-y-2">
              {customSections.map((cs, i) => (
                <div key={i} className="space-y-2 rounded-lg border border-slate-800 bg-surface p-2">
                  <div className="flex items-center gap-2">
                    <input
                      className="input-dark flex-1"
                      placeholder="Section title"
                      value={cs.title}
                      onChange={(e) => updateCustom(i, { ...cs, title: e.target.value })}
                    />
                    <button type="button" onClick={() => removeCustom(i)} className="shrink-0 text-rose-400 hover:text-rose-300" title="Remove">
                      <span className="text-sm">✕</span>
                    </button>
                  </div>
                  <textarea
                    className="input-dark h-20 w-full resize-y"
                    placeholder="Section content"
                    value={cs.body}
                    onChange={(e) => updateCustom(i, { ...cs, body: e.target.value })}
                  />
                </div>
              ))}
              <Button variant="outline" onClick={addCustom}>+ Add custom section</Button>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() =>
            onSave(
              {
                headline: headline.trim() || undefined,
                location: location.trim() || undefined,
                template: initial.template,
                selectedProjectIds: [...selProjects],
                selectedSkillNames: [...selSkills],
                sections: Object.fromEntries(SECTION_LIST.map((s) => [s.key, secOn.has(s.key)])) as Record<ResumeSection, boolean>,
              },
              customSections
                .map((c) => ({ title: c.title.trim(), body: c.body.trim() }))
                .filter((c) => c.title || c.body)
            )
            }
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
