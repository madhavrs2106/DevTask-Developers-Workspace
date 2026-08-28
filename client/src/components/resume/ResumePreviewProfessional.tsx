import type { ResumeData } from "../../types";

const SKILL_LABELS: Record<string, string> = {
  Languages: "Languages",
  "Frameworks & Libraries": "Frameworks/Libraries",
  "Tools & Platforms": "Developer Tools",
  Other: "Core Competencies",
};

function contactLine(data: ResumeData): string {
  const c = data.contact;
  return [c.location, c.phone, c.email, c.linkedin, c.github, c.portfolio].filter(Boolean).join("  |  ");
}

function skillBullets(data: ResumeData): string[] {
  return data.skills.map((g) => `* ${SKILL_LABELS[g.category] ?? g.category}: ${g.skills.join(", ")}`);
}

export function ResumePreviewProfessional({ data }: { data: ResumeData }) {
  return (
    <div
      id="resume-sheet"
      className="resume-print mx-auto w-full max-w-[820px] bg-white px-10 py-9 text-slate-900 shadow-xl"
      style={{ fontFamily: "Inter, Helvetica, Arial, sans-serif", fontSize: "11px", lineHeight: 1.5 }}
    >
      {/* Header */}
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{data.fullName}</h1>
      <p className="mt-1 text-[10.5px] text-slate-600">{contactLine(data)}</p>

      {/* Professional Summary */}
      {data.summary && (
        <section className="mt-4">
          <h2 className="text-[12px] font-bold uppercase tracking-[0.14em] text-indigo-800">Professional Summary</h2>
          <hr className="mb-1 mt-0.5 border-indigo-800" />
          <p className="text-slate-800">{data.summary}</p>
        </section>
      )}

      {/* Technical Skills */}
      {data.skills.length > 0 && (
        <section className="mt-4">
          <h2 className="text-[12px] font-bold uppercase tracking-[0.14em] text-indigo-800">Technical Skills</h2>
          <hr className="mb-1 mt-0.5 border-indigo-800" />
          <ul className="space-y-0.5 text-slate-800">
            {skillBullets(data).map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Projects */}
      {data.projects.length > 0 && (
        <section className="mt-4">
          <h2 className="text-[12px] font-bold uppercase tracking-[0.14em] text-indigo-800">Projects</h2>
          <hr className="mb-1 mt-0.5 border-indigo-800" />
          {data.projects.map((p, i) => (
            <div key={i} className="mb-2">
              <div className="font-semibold text-slate-900">
                {p.title}
                {p.techStack.length > 0 && <span className="font-normal text-slate-700"> | {p.techStack.join(", ")}</span>}
              </div>
              {p.description && <p className="mt-0.5 whitespace-pre-line text-slate-800">{p.description}</p>}
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <section className="mt-4">
          <h2 className="text-[12px] font-bold uppercase tracking-[0.14em] text-indigo-800">Education</h2>
          <hr className="mb-1 mt-0.5 border-indigo-800" />
          {data.education.map((e, i) => (
            <div key={i} className="mb-2">
              <div className="font-semibold text-slate-900">{e.degree}</div>
              <div className="text-slate-700">
                {e.institution}
                {e.duration ? `, ${e.duration}` : ""}
                {e.cgpa ? ` | ${e.cgpa}` : ""}
              </div>
              {data.coursework.length > 0 && (
                <p className="mt-0.5 text-slate-800">
                  <span className="font-medium">Relevant Coursework:</span> {data.coursework.join(", ")}
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Hobbies & Interests */}
      {data.hobbies && data.hobbies.length > 0 && (
        <section className="mt-4">
          <h2 className="text-[12px] font-bold uppercase tracking-[0.14em] text-indigo-800">Hobbies &amp; Interests</h2>
          <hr className="mb-1 mt-0.5 border-indigo-800" />
          <ul className="space-y-0.5 text-slate-800">
            {data.hobbies.map((h, i) => (
              <li key={i}>* {h}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Achievements */}
      {data.achievements && data.achievements.length > 0 && (
        <section className="mt-4">
          <h2 className="text-[12px] font-bold uppercase tracking-[0.14em] text-indigo-800">Achievements</h2>
          <hr className="mb-1 mt-0.5 border-indigo-800" />
          <ul className="space-y-0.5 text-slate-800">
            {data.achievements.map((a, i) => (
              <li key={i}>* {a}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
