import type { ReactNode } from "react";
import type { ResumeData } from "../../types";

function BannerHead({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-2 bg-slate-900 px-3 py-1 text-[12px] font-bold uppercase tracking-[0.1em] text-white">{children}</h2>
  );
}

function SectionHead({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-2 border-b border-slate-300 pb-1 text-[13px] font-bold uppercase tracking-[0.14em] text-slate-800">{children}</h2>
  );
}

export function ResumePreviewClassic({ data }: { data: ResumeData }) {
  const c = data.contact;

  return (
    <div
      id="resume-sheet"
      className="resume-print mx-auto w-[210mm] max-w-full min-h-[297mm] overflow-hidden bg-white text-slate-800 shadow-xl"
      style={{ fontFamily: "Inter, Helvetica, Arial, sans-serif", fontSize: "11px", lineHeight: 1.5 }}
    >
      {/* Top navy banner */}
      <div className="flex items-center justify-between gap-4 bg-slate-900 px-8 py-5">
        <div>
          <h1 className="text-3xl font-extrabold uppercase tracking-wide text-white">{data.fullName}</h1>
          {data.headline && <p className="mt-0.5 text-sm font-normal text-slate-300">{data.headline}</p>}
        </div>
        {data.photoUrl && (
          <img src={data.photoUrl} alt={data.fullName} className="h-20 w-20 shrink-0 rounded-full border-2 border-white object-cover" />
        )}
      </div>

      {/* Two columns */}
      <div className="flex">
        {/* Left sidebar (light gray) */}
        <div className="w-1/3 space-y-4 bg-slate-100 p-5">
          {[c.email, c.phone, c.location, c.linkedin, c.github, c.portfolio].filter(Boolean).length > 0 && (
            <section>
              <BannerHead>Contact</BannerHead>
              <ul className="space-y-0.5 text-slate-700">
                {c.email && <li>{c.email}</li>}
                {c.phone && <li>{c.phone}</li>}
                {c.location && <li>{c.location}</li>}
                {c.linkedin && <li className="break-all">{c.linkedin}</li>}
                {c.github && <li className="break-all">{c.github}</li>}
                {c.portfolio && <li className="break-all">{c.portfolio}</li>}
              </ul>
            </section>
          )}

          {data.education.length > 0 && (
            <section>
              <BannerHead>Education</BannerHead>
              <div className="space-y-2">
                {data.education.map((e, i) => (
                  <div key={i}>
                    <div className="font-bold text-slate-900">{e.degree}</div>
                    <div className="text-slate-700">{e.institution}</div>
                    <div className="text-[10px] text-slate-500">
                      {[e.duration, e.cgpa].filter(Boolean).join("   ")}
                      {e.highlight ? `   ${e.highlight}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.skills.length > 0 && (
            <section>
              <BannerHead>Skills</BannerHead>
              <ul className="space-y-0.5 text-slate-700">
                {data.skills.map((g) => (
                  <li key={g.category}>* {g.category}: {g.skills.join(", ")}</li>
                ))}
              </ul>
            </section>
          )}

          {data.languages && data.languages.length > 0 && (
            <section>
              <BannerHead>Language</BannerHead>
              <ul className="space-y-0.5 text-slate-700">
                {data.languages.map((l, i) => (
                  <li key={i}>* {l}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Right column (white) */}
        <div className="w-2/3 space-y-4 p-6">
          {data.summary && (
            <section>
              <SectionHead>About Me</SectionHead>
              <p className="text-slate-700">{data.summary}</p>
            </section>
          )}

          {data.experience.length > 0 && (
            <section>
              <SectionHead>Experience</SectionHead>
              <div className="space-y-3">
                {data.experience.map((x, i) => (
                  <div key={i}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-bold text-slate-900">
                        {x.role}
                        {x.company ? <span className="font-normal text-slate-600"> — {x.company}</span> : null}
                      </span>
                      <span className="whitespace-nowrap text-[10px] text-slate-500">{x.duration}</span>
                    </div>
                    {x.bullets.length > 0 && (
                      <ul className="ml-4 list-disc text-slate-700">
                        {x.bullets.map((b, j) => (
                          <li key={j}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.projects.length > 0 && (
            <section>
              <SectionHead>Projects</SectionHead>
              <div className="space-y-2">
                {data.projects.map((p, i) => (
                  <div key={i}>
                    <div className="font-bold text-slate-900">
                      {p.title}
                      {p.techStack.length > 0 && <span className="font-normal text-slate-600"> | {p.techStack.join(", ")}</span>}
                    </div>
                    {p.description && <p className="text-slate-700">{p.description}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.references && data.references.length > 0 && (
            <section>
              <SectionHead>References</SectionHead>
              <div className="grid grid-cols-2 gap-4">
                {data.references.map((rf, i) => (
                  <div key={i}>
                    <div className="font-bold text-slate-900">{rf.name}</div>
                    {rf.role && <div className="text-slate-700">{rf.role}</div>}
                    {rf.contact && <div className="text-[10px] text-slate-500 break-all">{rf.contact}</div>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.customSections && data.customSections.length > 0 && (
            <>
              {data.customSections.map((cs, i) => (
                <section key={i}>
                  <SectionHead>{cs.title || "Section"}</SectionHead>
                  <p className="whitespace-pre-line text-slate-800">{cs.body}</p>
                </section>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
