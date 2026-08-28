import { useMemo, useState } from "react";
import { FileDown, LayoutTemplate, SlidersHorizontal } from "lucide-react";
import { useMe, useProjects, useCourses } from "../hooks/useQueries";
import { buildResumeData } from "../lib/buildResume";
import { ResumePreview } from "../components/resume/ResumePreview";
import { ResumeCustomizeModal } from "../components/resume/ResumeCustomizeModal";
import { ResumeTemplateModal } from "../components/resume/ResumeTemplateModal";
import { Button } from "../components/ui/Button";
import type { ResumeOptions, ResumeTemplate } from "../types";

export function ResumePage() {
  const { data: user } = useMe();
  const { data: projects = [] } = useProjects();
  const { data: courses = [] } = useCourses();
  const [options, setOptions] = useState<ResumeOptions>({ template: "minimal" });
  const [modalOpen, setModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  const resume = useMemo(() => {
    if (!user) return null;
    return buildResumeData(user, projects, courses, options);
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
        </div>
      </div>

      {!resume ? (
        <p className="text-sm text-ink-faint">Loading…</p>
      ) : (
        <ResumePreview data={resume} />
      )}

      {modalOpen && user && (
        <ResumeCustomizeModal
          projects={projects}
          skills={user.skills ?? []}
          initial={options}
          onSave={(o) => {
            setOptions(o);
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
