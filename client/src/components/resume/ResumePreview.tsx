import type { ResumeData } from "../../types";
import { ResumePreviewProfessional } from "./ResumePreviewProfessional";
import { ResumePreviewModern } from "./ResumePreviewModern";
import { ResumePreviewMinimalTech } from "./ResumePreviewMinimalTech";
import { ResumePreviewClassic } from "./ResumePreviewClassic";

export function ResumePreview({ data }: { data: ResumeData }) {
  switch (data.template) {
    case "professional":
      return <ResumePreviewProfessional data={data} />;
    case "modern":
      return <ResumePreviewModern data={data} />;
    case "classic":
      return <ResumePreviewClassic data={data} />;
    case "minimal":
    default:
      return <ResumePreviewMinimalTech data={data} />;
  }
}
