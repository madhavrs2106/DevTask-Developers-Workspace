import { useEffect, useMemo, useState } from "react";
import { FileDown, LayoutTemplate, SlidersHorizontal, ZoomIn, ZoomOut } from "lucide-react";
import { useMe, useProjects, useCourses, useUpdateProfile } from "../hooks/useQueries";
import { buildResumeData } from "../lib/buildResume";
import { downloadResumeDocx } from "../lib/buildResumeDocx";
import { ResumePreview } from "../components/resume/ResumePreview";
import { ResumeCustomizeModal } from "../components/resume/ResumeCustomizeModal";
import { ResumeTemplateModal } from "../components/resume/ResumeTemplateModal";
import { Button } from "../components/ui/Button";
import type { ResumeOptions, ResumeTemplate, ResumeCustomSection } from "../types";

export function ResumePage() {
  const { data: user } = useMe();
  const { data: projects = [] } = useProjects();
  const { data: courses = [] } = useCourses();
  const updateProfile = useUpdateProfile();
  const [options, setOptions] = useState<ResumeOptions>({ template: "minimal" });
  const [customSections, setCustomSections] = useState<ResumeCustomSection[]>(
    user?.resumeExtras?.customSections ?? []
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const computeFitZoom = () => {
    if (typeof window === "undefined") return 1;
    const sheetPx = (210 * 96) / 25.4; // 210mm → px at 96dpi
    const avail = window.innerWidth - 32;
    return Math.max(0.4, Math.min(1, avail / sheetPx));
  };
  const [zoom, setZoom] = useState(() => computeFitZoom());
  const zoomIn = () => setZoom((z) => Math.min(1.5, Math.round((z + 0.1) * 100) / 100));
  const zoomOut = () => setZoom((z) => Math.max(0.4, Math.round((z - 0.1) * 100) / 100));

  useEffect(() => {
    if (user?.resumeExtras?.customSections) setCustomSections(user.resumeExtras.customSections);
  }, [user]);

  const resume = useMemo(() => {
    if (!user) return null;
    const mergedUser = {
      ...user,
      resumeExtras: { ...user.resumeExtras, customSections },
    };
    return buildResumeData(mergedUser, projects, courses, options);
  }, [user, projects, courses, options]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Toolbar (hidden in print) */}
      <div className="no-print mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Resume Generator</h1>
          <p className="text-xs text-ink-faint">
            Auto-built from your DevTask activity. Education &amp; contact are edited in{" "}
            <span className="text-accent-bright">Settings</span>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setTemplateModalOpen(true)}>
            <LayoutTemplate size={14} /> Templates
          </Button>
          <Button variant="outline" onClick={() => setModalOpen(true)}>
            <SlidersHorizontal size={14} /> Customize
          </Button>
          <Button onClick={() => window.print()}>
            <FileDown size={14} /> Download PDF
          </Button>
          <Button variant="outline" onClick={() => resume && void downloadResumeDocx(resume)}>
            <FileDown size={14} /> Download Word
          </Button>
          <div className="no-print flex items-center gap-1 rounded-md border border-slate-700 p-0.5">
            <button
              type="button"
              onClick={zoomOut}
              disabled={zoom <= 0.5}
              className="rounded p-1 text-ink-muted hover:bg-surface-raised hover:text-white disabled:opacity-40"
              title="Zoom out"
            >
              <ZoomOut size={14} />
            </button>
            <span className="w-12 text-center text-xs text-ink-faint">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={zoomIn}
              disabled={zoom >= 1.5}
              className="rounded p-1 text-ink-muted hover:bg-surface-raised hover:text-white disabled:opacity-40"
              title="Zoom in"
            >
              <ZoomIn size={14} />
            </button>
          </div>
        </div>
      </div>

      {!resume ? (
        <p className="text-sm text-ink-faint">Loading…</p>
      ) : (
        <div className="resume-zoom-wrap flex justify-center" style={{ zoom }}>
          <ResumePreview data={resume} />
        </div>
      )}

      {modalOpen && user && (
        <ResumeCustomizeModal
          projects={projects}
          skills={user.skills ?? []}
          initial={options}
          initialCustomSections={customSections}
          onSave={(o, cs) => {
            setOptions(o);
            setCustomSections(cs);
            if (user) {
              updateProfile.mutate({
                resumeExtras: { ...user.resumeExtras, customSections: cs },
              });
            }
            setModalOpen(false);
          }}
          onClose={() => setModalOpen(false)}
        />
      )}

      {templateModalOpen && (
        <ResumeTemplateModal
          current={options.template}
          onSelect={(t: ResumeTemplate) => {
            setOptions((o) => ({ ...o, template: t }));
            setTemplateModalOpen(false);
          }}
          onClose={() => setTemplateModalOpen(false)}
        />
      )}
    </div>
  );
}
