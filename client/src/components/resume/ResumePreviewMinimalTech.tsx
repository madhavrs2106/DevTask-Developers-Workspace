import type { ResumeData } from "../../types";

const headingClass = "text-[18px] font-bold uppercase tracking-[0.14em] text-blue-700 border-b-2 border-blue-700 pb-1 mb-3";

function scoreLabel(cgpa?: string): string {
  return cgpa ? cgpa.replace(/^Score:\s*/, "") : "";
}

export function ResumePreviewMinimalTech({ data }: { data: ResumeData }) {
  const c = data.contact;

  // Split location into "City, State" + "Country"
  const locParts = (c.location ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const country = locParts.length ? locParts[locParts.length - 1] : "";
  const locRest = locParts.slice(0, -1).join(", ");

  // Hide @dev.io email (private) and drop portfolio per design
  const emailToShow = c.email && !c.email.includes("@dev.io") ? c.email : undefined;

  const devtaskUrl = data.username ? `${window.location.origin}/u/${data.username}` : undefined;

  const linkRows: [string, string][] = [];
  if (c.github) linkRows.push(["GitHub", c.github]);
  if (c.linkedin) linkRows.push(["LinkedIn", c.linkedin]);
  if (devtaskUrl) linkRows.push(["DevTask", `${devtaskUrl} (${data.username})`]);

  const leftCol = [c.phone, emailToShow].filter(Boolean) as string[];
  const rightCol = [locRest, country].filter(Boolean) as string[];

  return (
    <div
      id="resume-sheet"
      className="resume-print mx-auto w-full max-w-[820px] bg-white px-10 py-9 text-slate-800 shadow-xl"
      style={{ fontFamily: "Inter, Helvetica, Arial, sans-serif", fontSize: "11px", lineHeight: 1.5 }}
    >
      {/* Header */}
      <header className="mb-4 flex items-center gap-4 border-b-2 border-blue-700 pb-3 text-left">
        {data.photoUrl && (
          <img src={data.photoUrl} alt={data.fullName} className="h-20 w-20 shrink-0 rounded-full border-2 border-slate-300 object-cover" />
        )}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{data.fullName}</h1>
          {data.headline && <p className="mt-1 text-sm font-semibold text-blue-700">{data.headline}</p>}
        </div>
      </header>

      {/* Contact */}
      {(leftCol.length > 0 || rightCol.length > 0 || linkRows.length > 0) && (
        <section className="mb-4">
          <h2 className={headingClass}>Contact</h2>
          {(leftCol.length > 0 || rightCol.length > 0) && (
            <div className="flex justify-between gap-6">
              <div className="space-y-0.5">
                {leftCol.map((v, i) => (
                  <div key={i}>{v}</div>
                ))}
              </div>
              <div className="space-y-0.5 text-right">
                {rightCol.map((v, i) => (
                  <div key={i}>{v}</div>
                ))}
              </div>
            </div>
          )}
          {linkRows.length > 0 && (
            <>
              <div className="h-2" />
              <ul className="space-y-0.5">
                {linkRows.map(([label, url]) => (
                  <li key={label} className="grid grid-cols-[70px_1fr] gap-2">
                    <span className="font-semibold text-black">{label}:</span>
                    <span className="break-all text-slate-700">{url}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {data.summary && (
        <section className="mb-4">
          <h2 className={headingClass}>Summary</h2>
          <p className="text-slate-800">{data.summary}</p>
        </section>
      )}

      {data.education.length > 0 && (
        <section className="mb-4">
          <h2 className={headingClass}>Education</h2>
          <div className="space-y-1">
            {data.education.map((e, i) => (
              <div key={i} className="grid grid-cols-[1.3fr_1.7fr_0.8fr_0.8fr] gap-3 text-slate-800">
                <span className="font-semibold text-black">{e.degree}</span>
                <span>{e.institution}</span>
                <span>{scoreLabel(e.cgpa)}</span>
                <span>{e.duration ?? ""}</span>
              </div>
            ))}
          </div>
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
                <span className="whitespace-nowrap text-slate-500">{x.duration}</span>
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
                <span className="w-44 shrink-0 font-semibold text-black">{g.category}:</span>
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
                {p.repoUrl && <span className="whitespace-nowrap text-slate-500">{p.repoUrl}</span>}
              </div>
              {p.description && <p className="text-slate-800">{p.description}</p>}
            </div>
          ))}
        </section>
      )}

      {data.coursesCompleted.length > 0 && (
        <section className="mb-4">
          <h2 className={headingClass}>Courses Completed</h2>
          <ul className="ml-4 list-disc text-slate-800">
            {data.coursesCompleted.map((cw, i) => (
              <li key={i}>{cw}</li>
            ))}
          </ul>
        </section>
      )}

      {data.certifications.length > 0 && (
        <section>
          <h2 className={headingClass}>Certifications</h2>
          <ul className="ml-4 list-disc text-slate-800">
            {data.certifications.map((cw, i) => (
              <li key={i}>{cw}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
