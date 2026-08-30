import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, GraduationCap, LogOut, Plus, Save, Trash2, UserCog } from "lucide-react";
import { apiErrorMessage } from "../lib/api";
import { cn, formatDate } from "../lib/utils";
import { fileToAvatarDataUri } from "../lib/image";
import { AVATAR_COLORS, BACKGROUND_COLORS, ROLE_META } from "../lib/constants";
import { useAuth } from "../context/AuthContext";
import { applyAccent } from "../lib/accent";
import {
  useReplaceSkills,
  useUpdateProfile,
  useUploadAvatar,
  useDeleteAccount,
  useSetting,
  useUpdateSetting,
  useKnowledge,
  useAddKnowledge,
  useDeleteKnowledge,
} from "../hooks/useQueries";
import type {
  Role,
  SkillProgress,
  AcademicDetails,
  ContactDetails,
  ResumeExtras,
  ResumeCertification,
  ResumeExperience,
  ResumeReference,
} from "../types";
import { Button } from "../components/ui/Button";
import { ProgressRing } from "../components/ui/ProgressRing";

function StringListEditor({
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
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="shrink-0 text-rose-400 hover:text-rose-300"
              title="Remove"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <Button variant="outline" onClick={() => onChange([...items, ""])}>
          <Plus size={13} /> Add
        </Button>
      </div>
    </div>
  );
}

export function Settings() {
  const { user, logout, setUser } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [role, setRole] = useState<Role>(user?.role ?? "DEVELOPER");
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor ?? AVATAR_COLORS[0]);
  const [backgroundColor, setBackgroundColor] = useState<string | null>(user?.backgroundColor ?? null);

  const [skills, setSkills] = useState<SkillProgress[]>(user?.skills ?? []);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState(50);

  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [skillsMsg, setSkillsMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const updateProfile = useUpdateProfile();
  const replaceSkills = useReplaceSkills();
  const uploadAvatar = useUploadAvatar();
  const deleteAccount = useDeleteAccount();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteConfirm, setDeleteConfirm] = useState("");

  const [noupeSnippet, setNoupeSnippet] = useState("");
  const noupeSetting = useSetting("noupe-embed");
  const updateNoupe = useUpdateSetting("noupe-embed");
  useEffect(() => {
    if (noupeSetting.data) setNoupeSnippet(noupeSetting.data.value);
  }, [noupeSetting.data]);

  const [kbType, setKbType] = useState<"FAQ" | "DOCUMENT">("FAQ");
  const [kbQuestion, setKbQuestion] = useState("");
  const [kbTitle, setKbTitle] = useState("");
  const [kbAnswer, setKbAnswer] = useState("");
  const knowledge = useKnowledge();
  const addKnowledge = useAddKnowledge();
  const deleteKnowledge = useDeleteKnowledge();

  const [academic, setAcademic] = useState<AcademicDetails>(user?.academicDetails ?? {});
  const [contact, setContact] = useState<ContactDetails>(user?.contactDetails ?? {});
  const [resume, setResume] = useState<ResumeExtras>(user?.resumeExtras ?? {});
  const [resumeMsg, setResumeMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const updateResumeDetails = useUpdateProfile();

  const contactFields: { key: keyof ContactDetails; label: string }[] = [
    { key: "email", label: "Email" },
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

  const patchAcademic = (group: "tenth" | "twelfth" | "college", patch: Record<string, string>) =>
    setAcademic((a) => ({ ...a, [group]: { ...(a?.[group] as object), ...patch } } as AcademicDetails));

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
  const updateRef = (i: number, val: ResumeReference) =>
    setResume((r) => ({ ...r, references: (r.references ?? []).map((c, j) => (j === i ? val : c)) }));
  const addRef = () => setResume((r) => ({ ...r, references: [...(r.references ?? []), { name: "" }] }));
  const removeRef = (i: number) =>
    setResume((r) => ({ ...r, references: (r.references ?? []).filter((_, j) => j !== i) }));
  const handleAddKnowledge = () => {
    if (!kbAnswer.trim()) return;
    addKnowledge.mutate(
      { type: kbType, question: kbType === "FAQ" ? kbQuestion.trim() : undefined, title: kbType === "DOCUMENT" ? kbTitle.trim() : undefined, answer: kbAnswer.trim() },
      { onSuccess: () => { setKbQuestion(""); setKbTitle(""); setKbAnswer(""); } }
    );
  };

  // Re-sync local state when the user object changes (e.g. after login)
  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setUsername(user.username);
    setBio(user.bio ?? "");
    setRole(user.role);
    setAvatarColor(user.avatarColor || AVATAR_COLORS[0]);
    setBackgroundColor(user.backgroundColor ?? null);
    if (user.skills) setSkills(user.skills);
    setAcademic(user.academicDetails ?? {});
    setContact(user.contactDetails ?? {});
    setResume(user.resumeExtras ?? {});
  }, [user]);

  // Live accent preview — the whole app re-themes as a swatch is clicked
  useEffect(() => {
    applyAccent(avatarColor);
  }, [avatarColor]);

  // Live background preview — the app/page background updates as a swatch is picked
  useEffect(() => {
    const root = document.documentElement;
    if (backgroundColor) root.style.setProperty("--app-bg", backgroundColor);
    else root.style.removeProperty("--app-bg");
  }, [backgroundColor]);

  async function handleProfileSave() {
    setProfileMsg(null);
    try {
      const updated = await updateProfile.mutateAsync({
        name: name.trim(),
        username: username.trim(),
        bio: bio.trim() || null,
        role,
        avatarColor,
        backgroundColor,
      });
      setUser(updated);
      setProfileMsg({ ok: true, text: "Profile updated" });
    } catch (err) {
      setProfileMsg({ ok: false, text: apiErrorMessage(err, "Could not update profile") });
    }
  }

  async function handleResumeSave() {
    setResumeMsg(null);
    try {
      const updated = await updateResumeDetails.mutateAsync({
        academicDetails: academic,
        contactDetails: contact,
        resumeExtras: resume,
      });
      setUser(updated);
      setResumeMsg({ ok: true, text: "Academic & contact details saved" });
    } catch (err) {
      setResumeMsg({ ok: false, text: apiErrorMessage(err, "Could not save details") });
    }
  }

  async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    setProfileMsg(null);
    try {
      const dataUri = await fileToAvatarDataUri(file);
      const updated = await uploadAvatar.mutateAsync(dataUri);
      setUser(updated);
      setProfileMsg({ ok: true, text: "Profile picture updated" });
    } catch (err) {
      setProfileMsg({ ok: false, text: apiErrorMessage(err, "Could not upload picture") });
    }
  }

  async function handleAvatarRemove() {
    setProfileMsg(null);
    try {
      const updated = await uploadAvatar.mutateAsync(null);
      setUser(updated);
      setProfileMsg({ ok: true, text: "Profile picture removed" });
    } catch (err) {
      setProfileMsg({ ok: false, text: apiErrorMessage(err, "Could not remove picture") });
    }
  }

  async function handleSkillsSave(next?: SkillProgress[]) {
    setSkillsMsg(null);
    const payload = next ?? skills;
    try {
      const saved = await replaceSkills.mutateAsync(payload);
      setSkills(saved);
      setSkillsMsg({ ok: true, text: "Skills saved" });
    } catch (err) {
      setSkillsMsg({ ok: false, text: apiErrorMessage(err, "Could not save skills") });
    }
  }

  function addSkill() {
    const skillName = newSkillName.trim();
    if (!skillName) return;
    if (skills.some((s) => s.name.toLowerCase() === skillName.toLowerCase())) {
      setSkillsMsg({ ok: false, text: "That skill already exists" });
      return;
    }
    const next = [...skills, { name: skillName, level: newSkillLevel }];
    setSkills(next);
    setNewSkillName("");
    void handleSkillsSave(next);
  }

  function removeSkill(index: number) {
    const next = skills.filter((_, i) => i !== index);
    setSkills(next);
    void handleSkillsSave(next);
  }

  function moveSkill(index: number, dir: -1 | 1) {
    const next = [...skills];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSkills(next);
  }

  if (!user) return null;

  const avgMastery =
    skills.length > 0
      ? Math.round(skills.reduce((acc, s) => acc + s.level, 0) / skills.length)
      : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* ── Profile ─────────────────────────────────────────────── */}
      <section className="card p-6">
        <header className="flex items-center gap-2">
          <UserCog size={17} className="text-accent-bright" />
          <h2 className="text-sm font-semibold text-white">Profile</h2>
        </header>

        <div className="mt-5 flex flex-col items-start gap-6 sm:flex-row">
          {/* Avatar preview + upload */}
          <div className="flex flex-col items-center gap-2 self-center sm:self-start">
            <div className="relative">
              <ProgressRing percent={avgMastery} size={96} strokeWidth={6}>
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Your profile"
                    className="h-[68px] w-[68px] rounded-full object-cover"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="flex h-[68px] w-[68px] items-center justify-center rounded-full font-mono text-lg font-bold text-slate-950"
                    style={{
                      background: `linear-gradient(135deg, ${avatarColor}, rgb(var(--accent-2-rgb)))`,
                    }}
                  >
                    {(name || "?")
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </span>
                )}
              </ProgressRing>

              {/* Upload / remove controls */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => void handleAvatarFile(e)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAvatar.isPending}
                aria-label="Upload profile picture"
                title="Upload profile picture"
                className="absolute -bottom-0.5 -right-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-neon-gradient text-slate-950 shadow-glow-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
              >
                <Camera size={14} />
              </button>
              {user?.avatarUrl && (
                <button
                  type="button"
                  onClick={() => void handleAvatarRemove()}
                  disabled={uploadAvatar.isPending}
                  aria-label="Remove profile picture"
                  title="Remove profile picture"
                  className="absolute -right-1 top-0 flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-surface-raised text-ink-faint transition-colors hover:border-rose-400/50 hover:text-rose-400 disabled:opacity-60"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">
              mastery ring
            </p>
          </div>

          <div className="w-full space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="settings-name" className="label-dark">
                  Name
                </label>
                <input
                  id="settings-name"
                  className="input-dark"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                />
              </div>
              <div>
                <label htmlFor="settings-email" className="label-dark">
                  Email
                </label>
                <input
                  id="settings-email"
                  className="input-dark cursor-not-allowed opacity-60"
                  value={user.email}
                  readOnly
                  disabled
                />
              </div>
            </div>

            <div>
              <label htmlFor="settings-username" className="label-dark">
                Username
              </label>
              <input
                id="settings-username"
                className="input-dark"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                minLength={3}
                maxLength={30}
              />
              <p className="mt-1 text-[11px] text-ink-faint">
                Letters, numbers and underscores only — this is your public handle
              </p>
            </div>

            <div>
              <label htmlFor="settings-bio" className="label-dark">
                Bio
              </label>
              <textarea
                id="settings-bio"
                rows={2}
                className="input-dark resize-y"
                placeholder="Full-stack dev levelling up in Go…"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={280}
              />
              <p className="mt-1 text-right font-mono text-[10px] text-ink-faint">{bio.length}/280</p>
            </div>

            <div>
              <span className="label-dark">Role</span>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(ROLE_META) as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-left transition-all",
                      role === r
                        ? "border-accent/60 bg-accent/[.07] shadow-glow-sm"
                        : "border-slate-800 bg-surface-raised hover:border-slate-600"
                    )}
                  >
                    <span
                      className={cn(
                        "block text-sm font-medium",
                        role === r ? "text-white" : "text-slate-300"
                      )}
                    >
                      {ROLE_META[r].label}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-ink-faint">
                      {ROLE_META[r].blurb}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="label-dark">Accent color</span>
              <div className="flex items-center gap-2">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Use color ${color}`}
                    onClick={() => setAvatarColor(color)}
                    className={cn(
                      "h-7 w-7 rounded-full transition-all",
                      avatarColor === color
                        ? "scale-110 ring-2 ring-white/80"
                        : "opacity-60 hover:opacity-100"
                    )}
                    style={{
                      background: color,
                      boxShadow: avatarColor === color ? `0 0 12px ${color}` : undefined,
                    }}
                  />
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-ink-faint">
                Themes buttons, highlights, charts & your avatar across DevTask.
              </p>
            </div>

            <div>
              <span className="label-dark">Background color</span>
              <div className="flex flex-wrap items-center gap-2">
                {BACKGROUND_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Use background ${color}`}
                    onClick={() => setBackgroundColor(color)}
                    className={cn(
                      "h-7 w-7 rounded-full transition-all",
                      backgroundColor === color
                        ? "scale-110 ring-2 ring-white/80"
                        : "opacity-60 hover:opacity-100"
                    )}
                    style={{
                      background: color,
                      boxShadow: backgroundColor === color ? `0 0 12px ${color}` : undefined,
                    }}
                  />
                ))}
                {backgroundColor && (
                  <button
                    type="button"
                    onClick={() => setBackgroundColor(null)}
                    className="rounded-full border border-slate-700 px-2 py-1 text-[11px] text-ink-muted transition-colors hover:text-white"
                  >
                    Reset
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-[11px] text-ink-faint">
                Changes the app/page background everywhere in DevTask.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button onClick={() => void handleProfileSave()} disabled={updateProfile.isPending}>
                {updateProfile.isPending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-800 border-t-slate-950" />
                ) : (
                  <Save size={15} />
                )}
                Save profile
              </Button>
              {profileMsg && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-xs",
                    profileMsg.ok ? "text-teal-300" : "text-rose-400"
                  )}
                  role="status"
                >
                  {profileMsg.ok && <CheckCircle2 size={13} />}
                  {profileMsg.text}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Skills ──────────────────────────────────────────────── */}
      <section className="card p-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-neon-gradient shadow-glow-sm" aria-hidden />
            <h2 className="text-sm font-semibold text-white">Skill mastery</h2>
          </div>
          <span className="metric-mono text-xs text-accent-bright">{skills.length} tracked</span>
        </header>

        <ul className="mt-5 space-y-4">
          {skills.map((skill, i) => (
            <li key={`${skill.name}-${i}`} className="group flex items-center gap-3">
              <button
                onClick={() => moveSkill(i, -1)}
                aria-label={`Move ${skill.name} up`}
                className="hidden font-mono text-[10px] text-slate-600 hover:text-accent-bright lg:block"
              >
                ▲
              </button>
              <span className="w-28 shrink-0 truncate text-sm text-slate-300" title={skill.name}>
                {skill.name}
              </span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={skill.level}
                onChange={(e) =>
                  setSkills((list) =>
                    list.map((s, idx) =>
                      idx === i ? { ...s, level: Number(e.target.value) } : s
                    )
                  )
                }
                aria-label={`${skill.name} mastery level`}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-accent [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-neon-gradient [&::-webkit-slider-thumb]:shadow-glow"
              />
              <span className="metric-mono w-11 shrink-0 text-right text-xs font-semibold text-accent-bright">
                {skill.level}%
              </span>
              <button
                onClick={() => removeSkill(i)}
                disabled={replaceSkills.isPending}
                aria-label={`Remove ${skill.name}`}
                className="shrink-0 rounded-lg p-1 text-slate-600 opacity-0 transition-all hover:bg-rose-400/10 hover:text-rose-400 group-hover:opacity-100"
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>

        {/* Add skill */}
        <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-slate-800 p-3">
          <input
            className="input-dark !py-1.5 !text-xs flex-1 min-w-[120px]"
            placeholder="e.g. Rust, Kubernetes…"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSkill()}
            maxLength={30}
            aria-label="New skill name"
          />
          <span className="metric-mono shrink-0 text-xs text-ink-faint">{newSkillLevel}%</span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={newSkillLevel}
            onChange={(e) => setNewSkillLevel(Number(e.target.value))}
            aria-label="New skill level"
            className="h-1.5 w-24 cursor-pointer appearance-none rounded-full bg-slate-800 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent"
          />
          <button
            onClick={addSkill}
            disabled={!newSkillName.trim()}
            aria-label="Add skill"
            className="shrink-0 rounded-lg border border-accent/30 p-1.5 text-accent-bright transition-colors hover:bg-accent/10 disabled:opacity-40"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleSkillsSave()}
            disabled={replaceSkills.isPending}
          >
            {replaceSkills.isPending && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-700 border-t-accent-bright" />
            )}
            Save skills
          </Button>
          {skillsMsg && (
            <span
              className={cn("text-xs", skillsMsg.ok ? "text-teal-300" : "text-rose-400")}
              role="status"
            >
              {skillsMsg.text}
            </span>
          )}
        </div>
      </section>

      {/* ── Account ─────────────────────────────────────────────── */}
      <section className="card flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="text-sm font-semibold text-white">Account</h2>
          <p className="mt-1 text-xs text-ink-faint">
            Member since <span className="metric-mono text-slate-300">{formatDate(user.createdAt)}</span>
          </p>
        </div>
        <Button variant="danger" onClick={logout}>
          <LogOut size={15} /> Sign out
        </Button>
      </section>

      {/* ── Noupe AI Chatbot ───────────────────────────────────── */}
      <section className="card p-6">
        <h2 className="text-sm font-semibold text-white">Noupe AI Chatbot</h2>
        <p className="mt-1 text-xs text-ink-faint">
          Paste your Noupe embed snippet (the <code className="text-slate-300">{"<script …></script>"}</code> line from the Noupe
          dashboard). The widget appears inside the app and can answer questions about DevTask and study help — no rebuild required.
        </p>
        <textarea
          className="input-dark mt-3 h-28 w-full font-mono text-xs"
          placeholder={'<script src="https://…" data-bot="…" async></script>'}
          value={noupeSnippet}
          onChange={(e) => setNoupeSnippet(e.target.value)}
        />
        <div className="mt-3 flex items-center gap-3">
          <Button variant="primary" onClick={() => updateNoupe.mutate(noupeSnippet)} disabled={updateNoupe.isPending}>
            <Save size={14} /> {updateNoupe.isPending ? "Saving…" : "Save snippet"}
          </Button>
          {updateNoupe.isSuccess && (
            <span className="text-xs text-teal-400 flex items-center gap-1">
              <CheckCircle2 size={14} /> Saved
            </span>
          )}
          {updateNoupe.isError && <span className="text-xs text-rose-400">Failed to save.</span>}
        </div>
      </section>

      {/* ── Knowledge Base (trains the assistant) ──────────────── */}
      <section className="card p-6">
        <h2 className="text-sm font-semibold text-white">Knowledge Base</h2>
        <p className="mt-1 text-xs text-ink-faint">
          Add FAQs or documents so the DevTask assistant can answer from them. (To train Noupe specifically, also paste the same content into your Noupe dashboard's Knowledge Base.)
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {(["FAQ", "DOCUMENT"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setKbType(t)}
              className={`rounded-lg px-3 py-1 text-xs ${
                kbType === t ? "bg-accent text-white" : "bg-surface text-ink-muted border border-slate-700"
              }`}
            >
              {t === "FAQ" ? "FAQ" : "Document"}
            </button>
          ))}
        </div>

        {kbType === "FAQ" ? (
          <input
            className="input-dark mt-3 w-full"
            placeholder="Question (e.g. How do I join a room?)"
            value={kbQuestion}
            onChange={(e) => setKbQuestion(e.target.value)}
          />
        ) : (
          <input
            className="input-dark mt-3 w-full"
            placeholder="Document title (e.g. Course Syllabus)"
            value={kbTitle}
            onChange={(e) => setKbTitle(e.target.value)}
          />
        )}
        <textarea
          className="input-dark mt-2 h-24 w-full font-mono text-xs"
          placeholder={kbType === "FAQ" ? "Answer…" : "Paste the document text / notes here…"}
          value={kbAnswer}
          onChange={(e) => setKbAnswer(e.target.value)}
        />
        <div className="mt-2">
          <Button variant="primary" onClick={handleAddKnowledge} disabled={addKnowledge.isPending || !kbAnswer.trim()}>
            <Plus size={14} /> {addKnowledge.isPending ? "Adding…" : "Add to Knowledge Base"}
          </Button>
        </div>

        <div className="mt-4 space-y-2">
          {knowledge.isLoading ? (
            <p className="text-xs text-ink-faint">Loading…</p>
          ) : !knowledge.data || knowledge.data.length === 0 ? (
            <p className="text-xs text-ink-faint">No knowledge added yet.</p>
          ) : (
            knowledge.data.map((k) => (
              <div key={k.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-700 bg-surface p-2">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-ink">
                    {k.type === "FAQ" ? k.question || "(no question)" : k.title || "(untitled)"}
                  </div>
                  <div className="mt-0.5 line-clamp-2 text-[11px] text-ink-muted">{k.answer}</div>
                </div>
                <button
                  onClick={() => deleteKnowledge.mutate(k.id)}
                  className="shrink-0 text-rose-400 hover:text-rose-300"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── Academic & Resume details ─────────────────────────── */}
      <section className="card p-6">
        <header className="flex items-center gap-2">
          <GraduationCap size={17} className="text-accent-bright" />
          <h2 className="text-sm font-semibold text-white">Academic &amp; Resume details</h2>
        </header>
        <p className="mt-1 text-xs text-ink-faint">
          Stored now so the upcoming auto resume generator can build your resume from this data.
        </p>

        {/* Contact */}
        <h3 className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Contact details</h3>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {contactFields.map((f) => (
            <div key={f.key}>
              <label className="label-dark">{f.label}</label>
              <input
                className="input-dark"
                value={(contact as Record<string, string | undefined>)[f.key] ?? ""}
                onChange={(e) => setContact((c) => ({ ...c, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        {/* Academic */}
        <h3 className="mt-6 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Academic details</h3>
        {(["tenth", "twelfth", "college"] as const).map((group) => (
          <div key={group} className="mt-3">
            <div className="mb-2 text-xs font-medium text-accent-bright">
              {group === "tenth" ? "10th" : group === "twelfth" ? "12th" : "Current college"}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {group === "college" ? (
                <>
                  <div>
                    <label className="label-dark">College name</label>
                    <input className="input-dark" value={academic?.college?.name ?? ""} onChange={(e) => patchAcademic("college", { name: e.target.value })} />
                  </div>
                  <div>
                    <label className="label-dark">Degree</label>
                    <input className="input-dark" value={academic?.college?.degree ?? ""} onChange={(e) => patchAcademic("college", { degree: e.target.value })} />
                  </div>
                  <div>
                    <label className="label-dark">Branch / Major</label>
                    <input className="input-dark" value={academic?.college?.branch ?? ""} onChange={(e) => patchAcademic("college", { branch: e.target.value })} />
                  </div>
                  <div>
                    <label className="label-dark">Current year</label>
                    <input className="input-dark" value={academic?.college?.year ?? ""} onChange={(e) => patchAcademic("college", { year: e.target.value })} />
                  </div>
                  <div>
                    <label className="label-dark">CGPA (overall — legacy)</label>
                    <input className="input-dark" value={academic?.college?.cgpa ?? ""} onChange={(e) => patchAcademic("college", { cgpa: e.target.value })} placeholder="e.g. 4.31" />
                  </div>
                  <div>
                    <label className="label-dark">1st Year CGPA</label>
                    <input className="input-dark" value={academic?.college?.cgpaYear1 ?? ""} onChange={(e) => patchAcademic("college", { cgpaYear1: e.target.value })} placeholder="e.g. 4.31" />
                  </div>
                  <div>
                    <label className="label-dark">2nd Year CGPA</label>
                    <input className="input-dark" value={academic?.college?.cgpaYear2 ?? ""} onChange={(e) => patchAcademic("college", { cgpaYear2: e.target.value })} />
                  </div>
                  <div>
                    <label className="label-dark">3rd Year CGPA</label>
                    <input className="input-dark" value={academic?.college?.cgpaYear3 ?? ""} onChange={(e) => patchAcademic("college", { cgpaYear3: e.target.value })} />
                  </div>
                  <div>
                    <label className="label-dark">4th Year CGPA</label>
                    <input className="input-dark" value={academic?.college?.cgpaYear4 ?? ""} onChange={(e) => patchAcademic("college", { cgpaYear4: e.target.value })} />
                  </div>
                  <div>
                    <label className="label-dark">Grad year</label>
                    <input className="input-dark" value={academic?.college?.gradYear ?? ""} onChange={(e) => patchAcademic("college", { gradYear: e.target.value })} />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="label-dark">School</label>
                    <input className="input-dark" value={(academic?.[group] as { school?: string } | undefined)?.school ?? ""} onChange={(e) => patchAcademic(group, { school: e.target.value })} />
                  </div>
                  <div>
                    <label className="label-dark">Board</label>
                    <input className="input-dark" value={(academic?.[group] as { board?: string } | undefined)?.board ?? ""} onChange={(e) => patchAcademic(group, { board: e.target.value })} />
                  </div>
                  <div>
                    <label className="label-dark">Score / %</label>
                    <input className="input-dark" value={(academic?.[group] as { score?: string } | undefined)?.score ?? ""} onChange={(e) => patchAcademic(group, { score: e.target.value })} />
                  </div>
                  <div>
                    <label className="label-dark">Year</label>
                    <input className="input-dark" value={(academic?.[group] as { year?: string } | undefined)?.year ?? ""} onChange={(e) => patchAcademic(group, { year: e.target.value })} />
                  </div>
                </>
              )}
            </div>
          </div>
        ))}

        {/* Resume extras */}
        <h3 className="mt-6 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">More details (for resume)</h3>
        <div className="mt-3 space-y-5">
          <div>
            <label className="label-dark">Career summary / objective</label>
            <textarea
              className="input-dark h-20 w-full resize-y"
              value={resume.summary ?? ""}
              onChange={(e) => setResume((r) => ({ ...r, summary: e.target.value }))}
              placeholder="Brief intro for your resume…"
            />
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
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <Button variant="outline" onClick={addCert}><Plus size={13} /> Add certification</Button>
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
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input className="input-dark w-full" placeholder="Period (e.g. Jun 2024 – Aug 2024)" value={x.period ?? ""} onChange={(e) => updateExp(i, { ...x, period: e.target.value })} />
                  <textarea className="input-dark h-16 w-full resize-y" placeholder="Description" value={x.description ?? ""} onChange={(e) => updateExp(i, { ...x, description: e.target.value })} />
                </div>
              ))}
              <Button variant="outline" onClick={addExp}><Plus size={13} /> Add experience</Button>
            </div>
          </div>

          <StringListEditor label="Achievements" items={resume.achievements ?? []} placeholder="e.g. Winner, Hackathon 2024" onChange={(v) => setResume((r) => ({ ...r, achievements: v }))} />
          <StringListEditor label="Languages known" items={resume.languagesKnown ?? []} placeholder="e.g. English" onChange={(v) => setResume((r) => ({ ...r, languagesKnown: v }))} />
          <StringListEditor label="Hobbies" items={resume.hobbies ?? []} placeholder="e.g. Chess" onChange={(v) => setResume((r) => ({ ...r, hobbies: v }))} />

          <div>
            <span className="label-dark">References</span>
            <div className="space-y-2">
              {(resume.references ?? []).map((rf, i) => (
                <div key={i} className="space-y-2 rounded-lg border border-slate-700 bg-surface p-2">
                  <div className="flex items-center gap-2">
                    <input className="input-dark flex-1" placeholder="Name" value={rf.name} onChange={(e) => updateRef(i, { ...rf, name: e.target.value })} />
                    <input className="input-dark flex-1" placeholder="Role / Relation" value={rf.role ?? ""} onChange={(e) => updateRef(i, { ...rf, role: e.target.value })} />
                    <button type="button" onClick={() => removeRef(i)} className="shrink-0 text-rose-400 hover:text-rose-300" title="Remove">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input className="input-dark w-full" placeholder="Contact (email / phone)" value={rf.contact ?? ""} onChange={(e) => updateRef(i, { ...rf, contact: e.target.value })} />
                </div>
              ))}
              <Button variant="outline" onClick={addRef}><Plus size={13} /> Add reference</Button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button onClick={() => void handleResumeSave()} disabled={updateResumeDetails.isPending}>
            {updateResumeDetails.isPending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-800 border-t-slate-950" />
            ) : (
              <Save size={15} />
            )}
            Save details
          </Button>
          {resumeMsg && (
            <span className={cn("inline-flex items-center gap-1 text-xs", resumeMsg.ok ? "text-teal-300" : "text-rose-400")} role="status">
              {resumeMsg.ok && <CheckCircle2 size={13} />}
              {resumeMsg.text}
            </span>
          )}
        </div>
      </section>

      {/* ── Danger zone ─────────────────────────────────────────── */}
      <section className="card border-rose-400/20 p-6">
        <h2 className="text-sm font-semibold text-rose-400">Danger zone</h2>
        <p className="mt-1 text-xs text-ink-faint">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            className="input-dark max-w-xs"
            placeholder={`Type "${user.name}" to confirm`}
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
          />
          <Button
            variant="danger"
            disabled={deleteConfirm !== user.name || deleteAccount.isPending}
            onClick={() => {
              deleteAccount.mutate(undefined, {
                onSuccess: () => {
                  logout();
                },
              });
            }}
          >
            <Trash2 size={14} />
            {deleteAccount.isPending ? "Deleting…" : "Delete account"}
          </Button>
        </div>
        {deleteConfirm && deleteConfirm !== user.name && (
          <p className="mt-2 text-[11px] text-rose-400">
            Please type "{user.name}" exactly to confirm.
          </p>
        )}
      </section>
    </div>
  );
}
