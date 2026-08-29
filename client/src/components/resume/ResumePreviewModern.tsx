import type { ReactNode } from "react";
import {
  Code2,
  Github,
  Globe,
  Languages as LanguagesIcon,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import type { ResumeData } from "../../types";

function IconRow({ icon: Icon, children }: { icon: typeof User; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-slate-700">
      <Icon size={13} className="mt-0.5 shrink-0 text-blue-800" />
      <span className="text-[10.5px] leading-snug">{children}</span>
    </div>
  );
}

export function ResumePreviewModern({ data }: { data: ResumeData }) {
  const c = data.contact;
  const contactItems = [
    c.email && { icon: Mail, text: c.email },
    c.phone && { icon: Phone, text: c.phone },
    c.location && { icon: MapPin, text: c.location },
    c.linkedin && { icon: Linkedin, text: c.linkedin },
    c.github && { icon: Github, text: c.github },
    c.portfolio && { icon: Globe, text: c.portfolio },
  ].filter(Boolean) as { icon: typeof User; text: string }[];

  return (
    <div
      id="resume-sheet"
      className="resume-print relative mx-auto w-[210mm] min-h-[297mm] overflow-hidden bg-white text-slate-800 shadow-xl"
      style={{ fontFamily: "Inter, Helvetica, Arial, sans-serif", fontSize: "11px", lineHeight: 1.5 }}
    >
      {/* Top band */}
      <div className="relative flex items-center gap-5 bg-slate-100 px-8 py-5">
        {data.photoUrl && (
          <img src={data.photoUrl} alt={data.fullName} className="h-20 w-20 rounded-full border-2 border-white object-cover shadow" />
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">{data.fullName}</h1>
          <p className="text-sm font-normal text-slate-500">{data.headline ?? "Professional"}</p>
        </div>
        {/* decorative blue angle, top right */}
        <div className="absolute right-0 top-0 h-0 w-0 border-y-[18px] border-y-transparent border-r-[18px] border-r-blue-800" />
      </div>

      {/* Two-column body */}
      <div className="flex">
        {/* Left column */}
        <div className="w-1/3 space-y-5 border-r border-slate-200 bg-white p-6">
          {data.summary && (
            <section>
              <h2 className="mb-2.5 flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-[0.12em] text-blue-800">
                <User size={13} /> About Me
              </h2>
              <p className="text-slate-700">{data.summary}</p>
            </section>
          )}

          {contactItems.length > 0 && (
            <section>
              <h2 className="mb-2.5 flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-[0.12em] text-blue-800">
                <Phone size={13} /> Contact
              </h2>
              <div className="space-y-1">
                {contactItems.map((it, i) => (
                  <IconRow key={i} icon={it.icon}>
                    {it.text}
                  </IconRow>
                ))}
              </div>
            </section>
          )}

          {data.skills.length > 0 && (
            <section>
              <h2 className="mb-2.5 flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-[0.12em] text-blue-800">
                <Code2 size={13} /> Skills
              </h2>
              <ul className="space-y-0.5 text-slate-700">
                {data.skills.map((g) => (
                  <li key={g.category}>* {g.category}: {g.skills.join(", ")}</li>
                ))}
              </ul>
            </section>
          )}

          {data.languages && data.languages.length > 0 && (
            <section>
              <h2 className="mb-2.5 flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-[0.12em] text-blue-800">
                <LanguagesIcon size={13} /> Language
              </h2>
              <ul className="space-y-0.5 text-slate-700">
                {data.languages.map((l, i) => (
                  <li key={i}>* {l}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Right column — timeline */}
        <div className="w-2/3 space-y-5 p-6">
          {data.education.length > 0 && (
            <section>
              <h2 className="mb-3 text-[14px] font-bold uppercase tracking-[0.12em] text-blue-800">Education</h2>
              <div className="relative space-y-3 border-l border-slate-300 pl-4">
                {data.education.map((e, i) => (
                  <div key={i} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-blue-800 ring-2 ring-white" />
                    <div className="font-bold text-slate-800">{e.degree}</div>
                    <div className="text-[10px] font-bold text-blue-800">
                      {[e.duration, e.cgpa].filter(Boolean).join("  ")}
                    </div>
                    <p className="text-slate-700">{e.institution}{e.highlight ? ` — ${e.highlight}` : ""}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.experience.length > 0 && (
            <section>
              <h2 className="mb-3 text-[14px] font-bold uppercase tracking-[0.12em] text-blue-800">Experience</h2>
              <div className="relative space-y-3 border-l border-slate-300 pl-4">
                {data.experience.map((x, i) => (
                  <div key={i} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-blue-800 ring-2 ring-white" />
                    <div className="font-bold text-slate-800">
                      {x.role}{x.company ? `, ${x.company}` : ""}
                    </div>
                    <div className="text-[10px] font-bold text-blue-800">{x.duration}</div>
                    {x.bullets.map((b, j) => (
                      <p key={j} className="mt-0.5 text-slate-700">{b}</p>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.projects.length > 0 && (
            <section>
              <h2 className="mb-3 text-[14px] font-bold uppercase tracking-[0.12em] text-blue-800">Projects</h2>
              {data.projects.map((p, i) => (
                <div key={i} className="mb-2">
                  <div className="text-[14px] font-bold text-slate-800">
                    {p.title}{p.techStack.length > 0 ? ` | ${p.techStack.join(", ")}` : ""}
                  </div>
                  {p.description && <p className="whitespace-pre-line text-slate-700">{p.description}</p>}
                </div>
              ))}
            </section>
          )}

          {data.coursesCompleted.length > 0 && (
            <section>
              <h2 className="mb-3 text-[14px] font-bold uppercase tracking-[0.12em] text-blue-800">Courses Completed</h2>
              <ul className="ml-4 list-disc text-slate-800">
                {data.coursesCompleted.map((cw, i) => (
                  <li key={i}>{cw}</li>
                ))}
              </ul>
            </section>
          )}

          {data.certifications.length > 0 && (
            <section>
              <h2 className="mb-3 text-[14px] font-bold uppercase tracking-[0.12em] text-blue-800">Certifications</h2>
              <ul className="ml-4 list-disc text-slate-800">
                {data.certifications.map((cw, i) => (
                  <li key={i}>{cw}</li>
                ))}
              </ul>
            </section>
          )}

          {data.customSections && data.customSections.length > 0 && (
            <>
              {data.customSections.map((cs, i) => (
                <section key={i}>
                  <h2 className="mb-3 text-[14px] font-bold uppercase tracking-[0.12em] text-blue-800">{cs.title || "Section"}</h2>
                  <p className="whitespace-pre-line text-slate-800">{cs.body}</p>
                </section>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Bottom decorative triangle, bottom left */}
      <div className="absolute bottom-2 left-0 h-0 w-0 border-b-[16px] border-b-transparent border-l-[16px] border-l-blue-800" />
    </div>
  );
}
