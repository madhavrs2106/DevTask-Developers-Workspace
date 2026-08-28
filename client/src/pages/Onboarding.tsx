import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ArrowLeft, ArrowRight, Save } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useUpdateProfile } from "../hooks/useQueries";
import { Button } from "../components/ui/Button";
import { LogoMark } from "../components/ui/LogoMark";
import { cn } from "../lib/utils";
import { apiErrorMessage } from "../lib/api";
import type {
  AcademicDetails,
  ContactDetails,
  ResumeExtras,
  ResumeProject,
  ResumeCertification,
  ResumeExperience,
} from "../types";

const ONBOARDING_KEY = "devtask.onboarding";
const STEPS = ["Contact", "10th", "12th", "College", "More details"] as const;

export function Onboarding() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const updateProfile = useUpdateProfile();

  const [step, setStep] = useState(0);
  const [academic, setAcademic] = useState<AcademicDetails>(user?.academicDetails ?? {});
  const [contact, setContact] = useState<ContactDetails>(user?.contactDetails ?? {});
  const [resume, setResume] = useState<ResumeExtras>(user?.resumeExtras ?? {});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const isLast = step === STEPS.length - 1;

  const patchAcademic = (group: "tenth" | "twelfth" | "college", patch: Record<string, string>) =>
    setAcademic((a) => ({ ...a, [group]: { ...(a?.[group] as object), ...patch } } as AcademicDetails));

  const updateProject = (i: number, val: ResumeProject) =>
    setResume((r) => ({ ...r, projects: (r.projects ?? []).map((p, j) => (j === i ? val : p)) }));
  const addProject = () => setResume((r) => ({ ...r, projects: [...(r.projects ?? []), { title: "" }] }));
  const removeProject = (i: number) =>
    setResume((r) => ({ ...r, projects: (r.projects ?? []).filter((_, j) => j !== i) }));

  const updateCert = (i: number, val: ResumeCertification) =>
    setResume((r) => ({ ...r, certifications: (r.certifications ?? []).map((c, j) => (j === i ? val : c)) }));
  const addCert = () => setResume((r) => ({ ...r, certifications: [...(r.certifications ?? []), { name: "" }] }));
  const removeCert = (i: number) =>
    setResume((r) => ({ ...r, certifications: (r.certifications ?? []).filter((_, j) => j !== i) }));

  const updateExp = (i: number, val: ResumeExperience) =>
    setResume((r) => ({ ...r, workExperience: (r.workExperience ?? []).map((x, j) => (j === i ? val : x)) }));
  const addExp = () => setResume((r) => ({ ...r, workExperience: [...(r.workExperience ?? []), { title: "" }] }));
  const removeExp = (i: number) =>
    setResume((r) => ({ ...r, workExperience: (r.workExperience ?? []).filter((_, j) => j !== i) }));

  const finish = async () => {
    setError(null);
    setPending(true);
    try {
      const updated = await updateProfile.mutateAsync({
        academicDetails: academic,
        contactDetails: contact,
        resumeExtras: resume,
      });
      sessionStorage.removeItem(ONBOARDING_KEY);
      setUser(updated);
      navigate("/", { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, "Could not save your details"));
      setPending(false);
    }
  };

  const skip = () => {
    sessionStorage.removeItem(ONBOARDING_KEY);
    navigate("/", { replace: true });
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-midnight px-4 py-8">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-hero-radial" />

      <div className="relative w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoMark size={28} />
            <span className="font-mono text-sm font-bold text-white">
              dev<span className="text-gradient-neon">task</span>
            </span>
          </div>
          <button onClick={skip} className="text-xs text-ink-faint hover:text-ink-muted">
            Skip for now
          </button>
        </div>

        {/* Stepper */}
        <div className="mb-6 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                  i < step && "bg-accent text-slate-950",
                  i === step && "border-2 border-accent text-accent-bright",
                  i > step && "border border-slate-700 text-ink-faint"
                )}
              >
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("h-0.5 flex-1", i < step ? "bg-accent" : "bg-slate-800")} />
              )}
            </div>
          ))}
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white">{STEPS[step]}</h2>
          <p className="mt-1 text-xs text-ink-faint">
            Step {step + 1} of {STEPS.length} — this powers your future auto-generated resume.
          </p>

          {error && (
            <p role="alert" className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2.5 text-xs text-rose-300">
              {error}
            </p>
          )}

          <div className="mt-5 space-y-4">
            {step === 0 && <ContactStep contact={contact} setContact={setContact} />}
            {step === 1 && (
              <AcademicStep group="tenth" label="10th" academic={academic} patchAcademic={patchAcademic} />
            )}
            {step === 2 && (
              <AcademicStep group="twelfth" label="12th" academic={academic} patchAcademic={patchAcademic} />
            )}
            {step === 3 && (
              <AcademicStep group="college" label="Current college" academic={academic} patchAcademic={patchAcademic} />
            )}
            {step === 4 && (
              <MoreStep
                resume={resume}
                setResume={setResume}
                updateProject={updateProject}
                addProject={addProject}
                removeProject={removeProject}
                updateCert={updateCert}
                addCert={addCert}
                removeCert={removeCert}
                updateExp={updateExp}
                addExp={addExp}
                removeExp={removeExp}
              />
            )}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              <ArrowLeft size={15} /> Back
            </Button>
            {isLast ? (
              <Button onClick={() => void finish()} disabled={pending || updateProfile.isPending}>
                {pending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-800 border-t-slate-950" /> : <Save size={15} />}
                Finish
              </Button>
            ) : (
              <Button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
                Next <ArrowRight size={15} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Step sub-components ---------- */

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="label-dark">{label}</label>
      {children}
    </div>
  );
}

const contactKeys: { key: keyof ContactDetails; label: string }[] = [
  { key: "phone", label: "Phone" },
  { key: "address", label: "Address" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "country", label: "Country" },
  { key: "pincode", label: "Pincode" },
  { key: "linkedin", label: "LinkedIn URL" },
  { key: "github", label: "GitHub URL" },
  { key: "portfolio", label: "Portfolio URL" },
];

function ContactStep({
  contact,
  setContact,
}: {
  contact: ContactDetails;
  setContact: (c: ContactDetails) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {contactKeys.map((f) => (
        <Field key={f.key} label={f.label}>
          <input
            className="input-dark"
            value={(contact as Record<string, string | undefined>)[f.key] ?? ""}
            onChange={(e) => setContact({ ...contact, [f.key]: e.target.value })}
          />
        </Field>
      ))}
    </div>
  );
}

function AcademicStep({
  group,
  label,
  academic,
  patchAcademic,
}: {
  group: "tenth" | "twelfth" | "college";
  label: string;
  academic: AcademicDetails;
  patchAcademic: (g: "tenth" | "twelfth" | "college", patch: Record<string, string>) => void;
}) {
  const g = academic?.[group] as Record<string, string | undefined> | undefined;
  const fields =
    group === "college"
      ? [
          { k: "name", l: "College name" },
          { k: "degree", l: "Degree" },
          { k: "branch", l: "Branch / Major" },
          { k: "year", l: "Current year" },
          { k: "cgpa", l: "CGPA" },
          { k: "gradYear", l: "Grad year" },
        ]
      : [
          { k: "school", l: "School" },
          { k: "board", l: "Board" },
          { k: "score", l: "Score / %" },
          { k: "year", l: "Year" },
        ];
  return (
    <div>
      <div className="mb-3 text-xs font-medium text-accent-bright">{label}</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {fields.map((f) => (
          <Field key={f.k} label={f.l}>
            <input className="input-dark" value={g?.[f.k] ?? ""} onChange={(e) => patchAcademic(group, { [f.k]: e.target.value })} />
          </Field>
        ))}
      </div>
    </div>
  );
}

function StringList({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <span className="label-dark">{label}</span>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2">
            <input
              className="input-dark flex-1"
              value={it}
              placeholder={placeholder}
              onChange={(e) => {
                const n = [...items];
                n[i] = e.target.value;
                onChange(n);
              }}
            />
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="shrink-0 text-rose-400 hover:text-rose-300" title="Remove">
              <Trash2Inline />
            </button>
          </div>
        ))}
        <Button variant="outline" onClick={() => onChange([...items, ""])}>
          <PlusInline /> Add
        </Button>
      </div>
    </div>
  );
}

function MoreStep({
  resume,
  setResume,
  updateProject,
  addProject,
  removeProject,
  updateCert,
  addCert,
  removeCert,
  updateExp,
  addExp,
  removeExp,
}: {
  resume: ResumeExtras;
  setResume: (r: ResumeExtras) => void;
  updateProject: (i: number, v: ResumeProject) => void;
  addProject: () => void;
  removeProject: (i: number) => void;
  updateCert: (i: number, v: ResumeCertification) => void;
  addCert: () => void;
  removeCert: (i: number) => void;
  updateExp: (i: number, v: ResumeExperience) => void;
  addExp: () => void;
  removeExp: (i: number) => void;
}) {
  return (
    <div className="space-y-5">
      <Field label="Career summary / objective">
        <textarea
          className="input-dark h-20 w-full resize-y"
          value={resume.summary ?? ""}
          onChange={(e) => setResume({ ...resume, summary: e.target.value })}
          placeholder="Brief intro for your resume…"
        />
      </Field>

      <div>
        <span className="label-dark">Projects</span>
        <div className="space-y-2">
          {(resume.projects ?? []).map((p, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-slate-700 bg-surface p-2">
              <div className="flex items-center gap-2">
                <input className="input-dark flex-1" placeholder="Title" value={p.title} onChange={(e) => updateProject(i, { ...p, title: e.target.value })} />
                <button type="button" onClick={() => removeProject(i)} className="shrink-0 text-rose-400 hover:text-rose-300" title="Remove">
                  <Trash2Inline />
                </button>
              </div>
              <input className="input-dark w-full" placeholder="Link (optional)" value={p.link ?? ""} onChange={(e) => updateProject(i, { ...p, link: e.target.value })} />
              <textarea className="input-dark h-16 w-full resize-y" placeholder="Description" value={p.description ?? ""} onChange={(e) => updateProject(i, { ...p, description: e.target.value })} />
            </div>
          ))}
          <Button variant="outline" onClick={addProject}><PlusInline /> Add project</Button>
        </div>
      </div>

      <div>
        <span className="label-dark">Certifications</span>
        <div className="space-y-2">
          {(resume.certifications ?? []).map((c, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-700 bg-surface p-2">
              <input className="input-dark flex-1" placeholder="Name" value={c.name} onChange={(e) => updateCert(i, { ...c, name: e.target.value })} />
              <input className="input-dark flex-1" placeholder="Issuer" value={c.issuer ?? ""} onChange={(e) => updateCert(i, { ...c, issuer: e.target.value })} />
              <input className="input-dark w-24" placeholder="Year" value={c.year ?? ""} onChange={(e) => updateCert(i, { ...c, year: e.target.value })} />
              <button type="button" onClick={() => removeCert(i)} className="shrink-0 text-rose-400 hover:text-rose-300" title="Remove">
                <Trash2Inline />
              </button>
            </div>
          ))}
          <Button variant="outline" onClick={addCert}><PlusInline /> Add certification</Button>
        </div>
      </div>

      <div>
        <span className="label-dark">Work experience</span>
        <div className="space-y-2">
          {(resume.workExperience ?? []).map((x, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-slate-700 bg-surface p-2">
              <div className="flex items-center gap-2">
                <input className="input-dark flex-1" placeholder="Title" value={x.title} onChange={(e) => updateExp(i, { ...x, title: e.target.value })} />
                <input className="input-dark flex-1" placeholder="Organization" value={x.org ?? ""} onChange={(e) => updateExp(i, { ...x, org: e.target.value })} />
                <button type="button" onClick={() => removeExp(i)} className="shrink-0 text-rose-400 hover:text-rose-300" title="Remove">
                  <Trash2Inline />
                </button>
              </div>
              <input className="input-dark w-full" placeholder="Period (e.g. Jun 2024 – Aug 2024)" value={x.period ?? ""} onChange={(e) => updateExp(i, { ...x, period: e.target.value })} />
              <textarea className="input-dark h-16 w-full resize-y" placeholder="Description" value={x.description ?? ""} onChange={(e) => updateExp(i, { ...x, description: e.target.value })} />
            </div>
          ))}
          <Button variant="outline" onClick={addExp}><PlusInline /> Add experience</Button>
        </div>
      </div>

      <StringList label="Achievements" items={resume.achievements ?? []} placeholder="e.g. Winner, Hackathon 2024" onChange={(v) => setResume({ ...resume, achievements: v })} />
      <StringList label="Languages known" items={resume.languagesKnown ?? []} placeholder="e.g. English" onChange={(v) => setResume({ ...resume, languagesKnown: v })} />
      <StringList label="Hobbies" items={resume.hobbies ?? []} placeholder="e.g. Chess" onChange={(v) => setResume({ ...resume, hobbies: v })} />
    </div>
  );
}

/* tiny inline icon helpers to avoid extra imports churn */
function PlusInline() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function Trash2Inline() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6" />
    </svg>
  );
}
