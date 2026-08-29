import type { ResumeData } from "../../types";

const BROWN = "#5b3a29";
const BROWN_DARK = "#3d261a";

function LeftHead({ children }: { children: string }) {
  return (
    <h2 className="mb-2 mt-6 text-[18px] font-bold uppercase tracking-[0.12em] text-white first:mt-0">
      {children}
    </h2>
  );
}

function RightHead({ children }: { children: string }) {
  return (
    <h2 className="mb-2 mt-6 text-[18px] font-bold uppercase tracking-[0.12em] text-slate-800 first:mt-0">
      {children}
    </h2>
  );
}

export function ResumePreviewProfessional({ data }: { data: ResumeData }) {
  const c = data.contact;

  const halftone =
    "radial-gradient(circle, rgba(91,58,41,0.55) 1.4px, transparent 1.5px)";

  return (
    <div
      id="resume-sheet"
      className="resume-print relative mx-auto w-[210mm] min-h-[297mm] overflow-hidden bg-[#faf8f5] text-slate-800 shadow-xl"
      style={{ fontFamily: "Inter, Helvetica, Arial, sans-serif", fontSize: "11px", lineHeight: 1.55 }}
    >
      {/* Decorative halftone accents */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full opacity-25"
        style={{ backgroundImage: halftone, backgroundSize: "8px 8px" }}
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full opacity-20"
        style={{ backgroundImage: halftone, backgroundSize: "8px 8px" }}
      />

      <div className="flex">
        {/* Left brown panel */}
        <div className="relative w-[40%] bg-[#5b3a29] p-6 text-white">
          {data.photoUrl && (
            <img
              src={data.photoUrl}
              alt={data.fullName}
              className="h-28 w-28 rounded-2xl border-2 border-white/30 object-cover"
            />
          )}
          <h1 className="mt-4 text-2xl font-bold uppercase tracking-wide text-white">{data.fullName}</h1>
          {data.headline && <p className="mt-3 text-[13px] font-normal text-white/80">{data.headline}</p>}

          <div className="mt-5 space-y-0.5 text-[11px] text-white/90">
            {c.email && <div className="break-all">{c.email}</div>}
            {c.phone && <div>{c.phone}</div>}
            {c.location && <div>{c.location}</div>}
            {c.linkedin && <div className="break-all">{c.linkedin}</div>}
            {c.github && <div className="break-all">{c.github}</div>}
            {c.portfolio && <div className="break-all">{c.portfolio}</div>}
          </div>

          {data.summary && (
            <section>
              <LeftHead>About</LeftHead>
              <p className="text-[11.5px] text-white/90">{data.summary}</p>
            </section>
          )}

          {data.education.length > 0 && (
            <section>
              <LeftHead>Education</LeftHead>
              <div className="space-y-4">
                {data.education.map((e, i) => (
                  <div key={i}>
                    <div className="font-bold text-white">{e.degree}</div>
                    <div className="text-white/85">{e.institution}</div>
                    <div className="text-[10px] text-white/70">
                      {[e.duration, e.cgpa].filter(Boolean).join("   ")}
                      {e.highlight ? `   ${e.highlight}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right off-white panel with faint diagonal shadow overlay */}
        <div
          className="relative w-[60%] p-6"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, rgba(0,0,0,0.02) 0 6px, transparent 6px 12px)",
          }}
        >
          {data.experience.length > 0 && (
            <section>
              <RightHead>Experience</RightHead>
              <div className="space-y-3">
                {data.experience.map((x, i) => (
                  <div key={i}>
                    <div className="font-semibold text-slate-700">{x.role}</div>
                    <div className="text-[10px] text-slate-500">
                      {[x.company, x.duration].filter(Boolean).join("  |  ")}
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
              </div>
            </section>
          )}

          {data.skills.length > 0 && (
            <section>
              <RightHead>Skills</RightHead>
              <ul className="space-y-0.5 text-slate-800">
                {data.skills.map((g) => (
                  <li key={g.category}>* {g.category}: {g.skills.join(", ")}</li>
                ))}
              </ul>
            </section>
          )}

          {data.projects.length > 0 && (
            <section>
              <RightHead>Projects</RightHead>
              <div className="space-y-2">
                {data.projects.map((p, i) => (
                  <div key={i}>
                    <div className="font-semibold text-slate-700">
                      {p.title}
                      {p.techStack.length > 0 && <span className="font-normal text-slate-500"> | {p.techStack.join(", ")}</span>}
                    </div>
                    {p.description && <p className="whitespace-pre-line text-slate-800">{p.description}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.coursesCompleted.length > 0 && (
            <section>
              <RightHead>Courses Completed</RightHead>
              <ul className="ml-4 list-disc text-slate-800">
                {data.coursesCompleted.map((cw, i) => (
                  <li key={i}>{cw}</li>
                ))}
              </ul>
            </section>
          )}

          {data.certifications.length > 0 && (
            <section>
              <RightHead>Certifications</RightHead>
              <ul className="ml-4 list-disc text-slate-800">
                {data.certifications.map((cw, i) => (
                  <li key={i}>{cw}</li>
                ))}
              </ul>
            </section>
          )}

          {data.languages && data.languages.length > 0 && (
            <section>
              <RightHead>Languages</RightHead>
              <ul className="space-y-0.5 text-slate-800">
                {data.languages.map((l, i) => (
                  <li key={i}>* {l}</li>
                ))}
              </ul>
            </section>
          )}

          {data.customSections && data.customSections.length > 0 && (
            <>
              {data.customSections.map((cs, i) => (
                <section key={i}>
                  <RightHead>{cs.title || "Section"}</RightHead>
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
