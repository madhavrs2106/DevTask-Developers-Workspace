import { useEffect, useState } from "react";
import { CheckCircle2, LogOut, Plus, Save, Trash2, UserCog } from "lucide-react";
import { apiErrorMessage } from "../lib/api";
import { cn, formatDate } from "../lib/utils";
import { AVATAR_COLORS, ROLE_META } from "../lib/constants";
import { useAuth } from "../context/AuthContext";
import { applyAccent } from "../lib/accent";
import { useReplaceSkills, useUpdateProfile } from "../hooks/useQueries";
import type { Role, SkillProgress } from "../types";
import { Button } from "../components/ui/Button";
import { ProgressRing } from "../components/ui/ProgressRing";

export function Settings() {
  const { user, logout, setUser } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [role, setRole] = useState<Role>(user?.role ?? "DEVELOPER");
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor ?? AVATAR_COLORS[0]);

  const [skills, setSkills] = useState<SkillProgress[]>(user?.skills ?? []);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState(50);

  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [skillsMsg, setSkillsMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const updateProfile = useUpdateProfile();
  const replaceSkills = useReplaceSkills();

  // Re-sync local state when the user object changes (e.g. after login)
  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setBio(user.bio ?? "");
    setRole(user.role);
    setAvatarColor(user.avatarColor || AVATAR_COLORS[0]);
    if (user.skills) setSkills(user.skills);
  }, [user]);

  // Live accent preview — the whole app re-themes as a swatch is clicked
  useEffect(() => {
    applyAccent(avatarColor);
  }, [avatarColor]);

  async function handleProfileSave() {
    setProfileMsg(null);
    try {
      const updated = await updateProfile.mutateAsync({
        name: name.trim(),
        bio: bio.trim() || null,
        role,
        avatarColor,
      });
      setUser(updated);
      setProfileMsg({ ok: true, text: "Profile updated" });
    } catch (err) {
      setProfileMsg({ ok: false, text: apiErrorMessage(err, "Could not update profile") });
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
          {/* Avatar preview */}
          <div className="flex flex-col items-center gap-2 self-center sm:self-start">
            <ProgressRing percent={avgMastery} size={96} strokeWidth={6}>
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
            </ProgressRing>
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
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-dashed border-slate-800 p-3">
          <input
            className="input-dark !py-1.5 !text-xs"
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
    </div>
  );
}
