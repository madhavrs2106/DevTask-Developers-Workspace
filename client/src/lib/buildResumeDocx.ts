import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import type { ResumeData } from "../types";

function textParagraph(text: string): Paragraph {
  return new Paragraph({ children: [new TextRun(text)] });
}

function heading(title: string): Paragraph {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: title, bold: true })] });
}

export async function buildResumeDocx(data: ResumeData): Promise<Blob> {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: data.fullName, bold: true })] })
  );
  if (data.headline) {
    children.push(new Paragraph({ children: [new TextRun({ text: data.headline, italics: true })] }));
  }

  const c = data.contact;
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.github, c.portfolio].filter(Boolean);
  if (contactParts.length) {
    children.push(textParagraph(contactParts.join("  |  ")));
  }

  if (data.summary) {
    children.push(heading("Summary"), textParagraph(data.summary));
  }

  if (data.education.length) {
    children.push(heading("Education"));
    for (const e of data.education) {
      const meta = [e.duration, e.cgpa, e.highlight].filter(Boolean).join("   ");
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${e.degree} — ${e.institution}`, bold: true }),
            new TextRun({ text: meta ? `   ${meta}` : "" }),
          ],
        })
      );
    }
  }

  if (data.experience.length) {
    children.push(heading("Experience"));
    for (const x of data.experience) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: x.role + (x.company ? ` — ${x.company}` : ""), bold: true }),
            new TextRun({ text: x.duration ? `   ${x.duration}` : "" }),
          ],
        })
      );
      for (const b of x.bullets) children.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun(b)] }));
    }
  }

  if (data.skills.length) {
    children.push(heading("Skills"));
    for (const g of data.skills) {
      children.push(new Paragraph({ children: [new TextRun({ text: `${g.category}: `, bold: true }), new TextRun(g.skills.join(", "))] }));
    }
  }

  if (data.projects.length) {
    children.push(heading("Projects"));
    for (const p of data.projects) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: p.title, bold: true }),
            new TextRun({ text: p.techStack.length ? `  (${p.techStack.join(", ")})` : "" }),
          ],
        })
      );
      if (p.description) children.push(textParagraph(p.description));
    }
  }

  if (data.coursesCompleted.length) {
    children.push(heading("Courses Completed"));
    for (const cw of data.coursesCompleted) children.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun(cw)] }));
  }

  if (data.certifications.length) {
    children.push(heading("Certifications"));
    for (const cw of data.certifications) children.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun(cw)] }));
  }

  if (data.languages && data.languages.length) {
    children.push(heading("Languages"));
    for (const l of data.languages) children.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun(l)] }));
  }

  if (data.references && data.references.length) {
    children.push(heading("References"));
    for (const r of data.references) {
      const meta = [r.role, r.contact].filter(Boolean).join(" — ");
      children.push(new Paragraph({ children: [new TextRun({ text: r.name, bold: true }), new TextRun({ text: meta ? `   ${meta}` : "" })] }));
    }
  }

  if (data.customSections && data.customSections.length) {
    for (const cs of data.customSections) {
      children.push(heading(cs.title || "Section"));
      if (cs.body) children.push(textParagraph(cs.body));
    }
  }

  const doc = new Document({ sections: [{ children }] });
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
