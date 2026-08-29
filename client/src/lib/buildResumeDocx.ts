import { Document, Packer, Paragraph, TextRun } from "docx";
import type { ResumeData, ResumeTemplate } from "../types";

type Theme = {
  accent: string; // hex without '#'
  nameSize: number; // pt
  headingSize: number; // pt
  headingUppercase: boolean;
  bodyColor: string;
  bodySize: number; // pt
};

// Per-template visual identity so the Word export matches the on-screen template.
const THEMES: Record<ResumeTemplate, Theme> = {
  minimal: { accent: "06B6D4", nameSize: 30, headingSize: 12, headingUppercase: true, bodyColor: "1F2937", bodySize: 11 },
  classic: { accent: "1E3A8A", nameSize: 30, headingSize: 12, headingUppercase: false, bodyColor: "1F2937", bodySize: 11 },
  modern: { accent: "1E40AF", nameSize: 32, headingSize: 13, headingUppercase: true, bodyColor: "334155", bodySize: 11 },
  professional: { accent: "7C4A2D", nameSize: 30, headingSize: 12, headingUppercase: false, bodyColor: "3F3F46", bodySize: 11 },
};

const half = (pt: number) => pt * 2;

function run(text: string, theme: Theme, overrides: Partial<{ bold: boolean; italics: boolean; size: number; color: string }> = {}) {
  return new TextRun({
    text,
    size: half(overrides.size ?? theme.bodySize),
    color: overrides.color ?? theme.bodyColor,
    bold: overrides.bold ?? false,
    italics: overrides.italics ?? false,
  });
}

function heading(title: string, theme: Theme): Paragraph {
  const text = theme.headingUppercase ? title.toUpperCase() : title;
  return new Paragraph({
    spacing: { before: 240, after: 80 },
    border: { bottom: { color: theme.accent, size: 12, style: "single" } },
    children: [run(text, theme, { bold: true, size: theme.headingSize, color: theme.accent })],
  });
}

function body(text: string, theme: Theme, opts: Partial<{ bold: boolean; italics: boolean; color: string; after: number }> = {}): Paragraph {
  return new Paragraph({
    spacing: { after: opts.after ?? 80 },
    children: [run(text, theme, { bold: opts.bold, italics: opts.italics, color: opts.color })],
  });
}

export async function buildResumeDocx(data: ResumeData): Promise<Blob> {
  const theme = THEMES[data.template] ?? THEMES.minimal;
  const children: Paragraph[] = [];

  // Header: name + headline + contact
  children.push(
    new Paragraph({
      spacing: { after: 20 },
      children: [run(data.fullName, theme, { bold: true, size: theme.nameSize, color: theme.accent })],
    })
  );
  if (data.headline) children.push(body(data.headline, theme, { italics: true, color: "475569" }));

  const c = data.contact;
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.github, c.portfolio].filter(Boolean);
  if (contactParts.length) {
    children.push(
      new Paragraph({
        spacing: { after: 160 },
        border: { bottom: { color: "CBD5E1", size: 8, style: "single" } },
        children: [run(contactParts.join("    |    "), theme, { size: 9, color: "475569" })],
      })
    );
  }

  if (data.summary) {
    children.push(heading("Summary", theme), body(data.summary, theme));
  }

  if (data.education.length) {
    children.push(heading("Education", theme));
    for (const e of data.education) {
      const meta = [e.duration, e.cgpa, e.highlight].filter(Boolean).join("    ");
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            run(`${e.degree} — ${e.institution}`, theme, { bold: true }),
            run(meta ? `    ${meta}` : "", theme),
          ],
        })
      );
    }
  }

  if (data.experience.length) {
    children.push(heading("Experience", theme));
    for (const x of data.experience) {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            run(x.role + (x.company ? ` — ${x.company}` : ""), theme, { bold: true }),
            run(x.duration ? `    ${x.duration}` : "", theme, { color: "64748B" }),
          ],
        })
      );
      for (const b of x.bullets) children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 20 }, children: [run(b, theme)] }));
    }
  }

  if (data.skills.length) {
    children.push(heading("Skills", theme));
    for (const g of data.skills) {
      children.push(
        new Paragraph({
          children: [run(`${g.category}: `, theme, { bold: true }), run(g.skills.join(", "), theme)],
        })
      );
    }
  }

  if (data.projects.length) {
    children.push(heading("Projects", theme));
    for (const p of data.projects) {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            run(p.title, theme, { bold: true }),
            run(p.techStack.length ? `   (${p.techStack.join(", ")})` : "", theme, { color: "64748B" }),
          ],
        })
      );
      if (p.description) {
        const lines = p.description.split("\n");
        children.push(
          new Paragraph({
            spacing: { after: 60 },
            children: lines.map((ln, idx) => (idx === 0 ? run(ln, theme) : new TextRun({ text: ln, break: 1, size: half(theme.bodySize), color: theme.bodyColor }))),
          })
        );
      }
    }
  }

  if (data.coursesCompleted.length) {
    children.push(heading("Courses Completed", theme));
    for (const cw of data.coursesCompleted)
      children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 20 }, children: [run(cw, theme)] }));
  }

  if (data.certifications.length) {
    children.push(heading("Certifications", theme));
    for (const cw of data.certifications)
      children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 20 }, children: [run(cw, theme)] }));
  }

  if (data.languages && data.languages.length) {
    children.push(heading("Languages", theme));
    for (const l of data.languages)
      children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 20 }, children: [run(l, theme)] }));
  }

  if (data.references && data.references.length) {
    children.push(heading("References", theme));
    for (const r of data.references) {
      const meta = [r.role, r.contact].filter(Boolean).join(" — ");
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [run(r.name, theme, { bold: true }), run(meta ? `    ${meta}` : "", theme)],
        })
      );
    }
  }

  if (data.customSections && data.customSections.length) {
    for (const cs of data.customSections) {
      children.push(heading(cs.title || "Section", theme));
      if (cs.body) children.push(body(cs.body, theme));
    }
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri" } } } },
    sections: [{ children }],
  });
  return Packer.toBlob(doc);
}

export async function downloadResumeDocx(data: ResumeData): Promise<void> {
  const blob = await buildResumeDocx(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.fullName.replace(/\s+/g, "_")}_Resume.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
