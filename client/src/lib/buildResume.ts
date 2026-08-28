import type { User, Project, Course, ResumeData, ResumeOptions, ResumeSkillGroup } from "../types";

const LANGUAGES = new Set([
  "python", "javascript", "typescript", "java", "c", "c++", "c#", "go", "golang", "ruby", "rust",
  "kotlin", "swift", "php", "sql", "html", "css", "dart", "scala", "r", "matlab",
]);
const FRAMEWORKS = new Set([
  "react", "vue", "angular", "next", "next.js", "svelte", "node", "node.js", "express", "express.js",
  "django", "flask", "fastapi", "spring", "rails", "pandas", "numpy", "scipy", "tensorflow",
  "pytorch", "keras", "tailwind", "tailwindcss", "bootstrap", "jquery", "redux", "mongoose",
]);
const TOOLS = new Set([
  "git", "github", "gitlab", "docker", "kubernetes", "supabase", "postgres", "postgresql", "mysql",
  "mongodb", "redis", "aws", "azure", "gcp", "google cloud", "linux", "figma", "vite", "prisma",
  "webpack", "npm", "yarn", "vercel", "netlify", "jenkins", "terraform",
]);

function classifySkill(name: string): string {
  const n = name.toLowerCase().trim();
  if (LANGUAGES.has(n)) return "Languages";
  if (FRAMEWORKS.has(n)) return "Frameworks & Libraries";
  if (TOOLS.has(n)) return "Tools & Platforms";
  return "Other";
}

function groupSkills(names: string[]): ResumeSkillGroup[] {
  const order = ["Languages", "Frameworks & Libraries", "Tools & Platforms", "Other"];
  const buckets: Record<string, string[]> = {};
  for (const n of names) {
    const cat = classifySkill(n);
    (buckets[cat] ??= []).push(n);
  }
  return order
    .filter((c) => buckets[c]?.length)
    .map((category) => ({ category, skills: buckets[category] }));
}

function joinLocation(contact?: { city?: string; state?: string; country?: string; address?: string }): string | undefined {
  const parts = [contact?.city, contact?.state, contact?.country].filter(Boolean);
  return parts.length ? parts.join(", ") : contact?.address;
}

export function buildResumeData(
  user: User,
  projects: Project[],
  courses: Course[],
  options: ResumeOptions
): ResumeData {
  const contact = user.contactDetails ?? {};
  const academic = user.academicDetails ?? {};
  const extras = user.resumeExtras ?? {};

  // Contact
  const resumeContact = {
    email: user.email,
    phone: contact.phone,
    location: options.location || joinLocation(contact) || undefined,
    github: contact.github,
    linkedin: contact.linkedin,
    portfolio: contact.portfolio,
  };

  // Education (college first, then 12th, then 10th)
  const education = [];
  if (academic.college) {
    const c = academic.college;
    const duration = [c.year, c.gradYear].filter(Boolean).join(" - ") || undefined;
    education.push({
      degree: [c.degree, c.branch].filter(Boolean).join(", ") || "Degree",
      institution: c.name || "Institution",
      duration,
      cgpa: c.cgpa ? `CGPA: ${c.cgpa}` : undefined,
    });
  }
  if (academic.twelfth) {
    const t = academic.twelfth;
    education.push({
      degree: "12th Grade",
      institution: t.school || "School",
      duration: t.year,
      cgpa: t.score ? `Score: ${t.score}` : undefined,
      highlight: t.board,
    });
  }
  if (academic.tenth) {
    const t = academic.tenth;
    education.push({
      degree: "10th Grade",
      institution: t.school || "School",
      duration: t.year,
      cgpa: t.score ? `Score: ${t.score}` : undefined,
      highlight: t.board,
    });
  }

  // Experience
  const experience = (extras.workExperience ?? []).map((e) => ({
    role: e.title,
    company: e.org || "",
    duration: e.period,
    location: undefined,
    bullets: e.description ? e.description.split("\n").map((b) => b.replace(/^[-•]\s*/, "").trim()).filter(Boolean) : [],
  }));

  // Skills (filtered by selection)
  const allSkills = (user.skills ?? []).map((s) => s.name);
  const selectedSkills = options.selectedSkillNames && options.selectedSkillNames.length
    ? allSkills.filter((s) => options.selectedSkillNames!.includes(s))
    : allSkills;
  const skills = groupSkills(selectedSkills);

  // Projects (filtered by selection; default to all)
  const selectedIds = options.selectedProjectIds;
  const chosenProjects = selectedIds
    ? projects.filter((p) => selectedIds.includes(p.id))
    : projects;
  const projectItems = chosenProjects.map((p) => ({
    title: p.name,
    description: p.description ?? undefined,
    repoUrl: p.repoUrl ?? undefined,
    techStack: [],
  }));

  // DevTask-completed courses vs. externally added certifications
  const coursesCompleted = courses.filter((c) => c.status === "COMPLETED").map((c) => c.title);
  const certifications = (extras.certifications ?? []).map((c) => (c.issuer ? `${c.name} (${c.issuer})` : c.name));

  const result: ResumeData = {
    fullName: user.name,
    headline: options.headline || (user.role === "DEVELOPER" ? "Software Developer" : "Learner & Developer"),
    contact: resumeContact,
    summary: extras.summary,
    education,
    experience,
    skills,
    projects: projectItems,
    coursesCompleted,
    certifications,
    hobbies: extras.hobbies,
    achievements: extras.achievements,
    languages: extras.languagesKnown,
    references: extras.references,
    photoUrl: user.avatarUrl ?? undefined,
    username: user.username ?? undefined,
    template: options.template,
  };

  // Honor per-section visibility toggles (default: all visible)
  const hidden = options.sections ?? {};
  if (hidden.summary === false) result.summary = undefined;
  if (hidden.education === false) result.education = [];
  if (hidden.experience === false) result.experience = [];
  if (hidden.skills === false) result.skills = [];
  if (hidden.projects === false) result.projects = [];
  if (hidden.coursesCompleted === false) result.coursesCompleted = [];
  if (hidden.certifications === false) result.certifications = [];
  if (hidden.languages === false) result.languages = [];
  if (hidden.achievements === false) result.achievements = [];
  if (hidden.hobbies === false) result.hobbies = [];
  if (hidden.references === false) result.references = [];

  return result;
}
