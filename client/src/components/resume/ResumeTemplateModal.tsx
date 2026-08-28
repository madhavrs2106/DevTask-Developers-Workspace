import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import type { ResumeTemplate } from "../../types";

const TEMPLATES: { id: ResumeTemplate; name: string; blurb: string; swatch: string }[] = [
  { id: "minimal", name: "Minimal Tech", blurb: "Clean single column with a blue accent and bold section rules.", swatch: "bg-blue-700" },
  { id: "classic", name: "Classic", blurb: "Navy banner with a light-gray sidebar and white content column.", swatch: "bg-slate-800" },
  { id: "modern", name: "Modern", blurb: "Two-column layout with a blue top band and a vertical timeline.", swatch: "bg-teal-700" },
  { id: "professional", name: "Professional", blurb: "Warm earth-tone two-column with a chocolate sidebar.", swatch: "bg-indigo-800" },
];

interface Props {
  current: ResumeTemplate;
  onSelect: (t: ResumeTemplate) => void;
  onClose: () => void;
}

export function ResumeTemplateModal({ current, onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-slate-800 bg-surface-raised p-6 shadow-glow"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Choose a template</h2>
          <button onClick={onClose} className="text-ink-faint hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t.id)}
              className={cn(
                "rounded-xl border p-3 text-left transition-all",
                current === t.id
                  ? "border-accent/60 bg-accent/[.07] shadow-glow-sm"
                  : "border-slate-800 bg-surface hover:border-slate-600"
              )}
            >
              <div className="mb-2 flex h-20 flex-col gap-1 rounded-lg bg-white p-2">
                <div className="h-2 w-1/2 rounded bg-slate-800" />
                <div className="h-1 w-2/3 rounded bg-slate-300" />
                <div className={cn("mt-1 h-1 w-full rounded", t.swatch)} />
                <div className="h-1 w-full rounded bg-slate-200" />
                <div className="h-1 w-5/6 rounded bg-slate-200" />
              </div>
              <div className="text-sm font-medium text-white">{t.name}</div>
              <p className="mt-0.5 text-[11px] leading-snug text-ink-faint">{t.blurb}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
