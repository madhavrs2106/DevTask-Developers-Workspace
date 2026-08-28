import type { ResumeData, ResumeTemplate } from "../../types";
import { ResumePreviewProfessional } from "./ResumePreviewProfessional";
import { ResumePreviewModern } from "./ResumePreviewModern";

function contactLine(data: ResumeData): string[] {
  const c = data.contact;
  return [c.location, c.phone, c.email, c.github, c.linkedin, c.portfolio].filter(Boolean) as string[];
}

// Per-template theme: accent color, heading rule, name color, and base font size.
const THEMES: Record<
  ResumeTemplate,
  { accent: string; rule: string; rule2: string; name: string; fontSize: string; py: string }
> = {
  minimal: { accent: "text-blue-700", rule: "border-blue-700", rule2: "border-b-2 border-blue-700", name: "text-slate-900", fontSize: "11px", py: "py-9" },
  classic: { accent: "text-slate-800", rule: "border-slate-800", rule2: "border-b border-slate-800", name: "text-black", fontSize: "11px", py: "py-9" },
  modern: { accent: "text-teal-700", rule: "border-teal-700", rule2: "border-b-2 border-teal-700", name: "text-slate-900", fontSize: "11px", py: "py-9" },
  compact: { accent: "text-blue-600", rule: "border-blue-600", rule2: "border-b border-blue-600", name: "text-slate-900", fontSize: "10px", py: "py-7" },
  professional: { accent: "text-indigo-800", rule: "border-indigo-800", rule2: "border-b-2 border-indigo-800", name: "text-slate-900", fontSize: "11px", py: "py-9" },
};

export function ResumePreview({ data }: { data: ResumeData }) {
  if (data.template === "professional") return <ResumePreviewProfessional data={data} />;
  if (data.template === "modern") return <ResumePreviewModern data={data} />;
  const theme = THEMES[data.template] ?? THEMES.minimal;
  const headingClass = `text-[11px] font-bold uppercase tracking-[0.14em] ${theme.accent} ${theme.rule2} pb-1 mb-2`;

  return (
    <div
      id="resume-sheet"
      className={`resume-print mx-auto w-full max-w-[820px] bg-white px-10 ${theme.py} text-slate-800 shadow-xl`}
      style={{ fontFamily: "Inter, Helvetica, Arial, sans-serif", fontSize: theme.fontSize, lineHeight: 1.45 }}
    >
      {/* Header */}
      <header className={`mb-4 border-b-2 ${theme.rule} pb-3 text-center`}>
        {data.photoUrl && (
          <img
            src={data.photoUrl}
            alt={data.fullName}
            className="mx-auto mb-3 h-24 w-24 rounded-full border-2 border-slate-300 object-cover"
          />
        )}
        <h1 className={`text-3xl font-extrabold tracking-tight ${theme.name}`}>{data.fullName}</h1>
        {data.headline && <p className={`mt-1 text-sm font-semibold ${theme.accent}`}>{data.headline}</p>}
        <p className="mt-1 text-[10px] text-slate-500">{contactLine(data).join("   •   ")}</p>
      </header>

      {data.summary && (
        <section className="mb-4">
          <h2 className={headingClass}>Summary</h2>
          <p className="text-slate-800">{data.summary}</p>
        </section>
      )}

      {data.education.length > 0 && (
        <section className="mb-4">
          <h2 className={headingClass}>Education</h2>
          {data.education.map((e, i) => (
            <div key={i} className="mb-2">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold text-black">
                  {e.degree}
                  {e.institution ? <span className="font-normal text-slate-700"> — {e.institution}</span> : null}
                </span>
                <span className="whitespace-nowrap text-[10px] 
text-slate-500">{[e.duration, e.cgpa].filter(Boolean).join("  ")}</span>
              </div>
              {e.highlight && <p className="text-[10px] 
text-slate-500">{e.highlight}</p>}
            </div>
          ))}
        </section>
      )}

      {data.experience.length > 0 && (
        <section className="mb-4">
          <h2 className={headingClass}>Experience</h2>
          {data.experience.map((x, i) => (
            <div key={i} className="mb-2">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold text-black">
                  {x.role}
                  {x.company ? <span className="font-normal text-slate-700"> — {x.company}</span> : null}
                </span>
                <span className="whitespace-nowrap text-[10px] 
text-slate-500">{[x.duration, x.location].filter(Boolean).join("  ")}</span>
              </div>
              {x.bullets.length > 0 && (
                <ul className="ml-4 list-disc text-slate-800">
                  {x.bullets.map((b, j) => (
                    <li key={j}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {data.skills.length > 0 && (
        <section className="mb-4">
          <h2 className={headingClass}>Technical Skills</h2>
          <div className="space-y-0.5">
            {data.skills.map((g) => (
              <div key={g.category} className="flex gap-2">
                <span className="w-40 shrink-0 font-semibold text-black">{g.category}:</span>
                <span className="text-slate-800">{g.skills.join(", ")}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.projects.length > 0 && (
        <section className="mb-4">
          <h2 className={headingClass}>Projects</h2>
          {data.projects.map((p, i) => (
            <div key={i} className="mb-2">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold text-black">{p.title}</span>
                {p.repoUrl && <span className="whitespace-nowrap text-[10px] 
text-slate-500">{p.repoUrl}</span>}
              </div>
              {p.description && <p className="text-slate-800">{p.description}</p>}
              {p.techStack.length > 0 && (
                <p className="text-[10px] 
text-slate-500">
                  <span className="font-semibold">Stack:</span> {p.techStack.join(", ")}
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      {data.coursework.length > 0 && (
        <section>
          <h2 className={headingClass}>Coursework &amp; Certifications</h2>
          <ul className="ml-4 list-disc text-slate-800">
            {data.coursework.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
