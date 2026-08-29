import { useEffect, useState } from "react";
import {
  ExternalLink,
  FolderGit2,
  Github,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { apiErrorMessage } from "../lib/api";
import { cn, formatDate } from "../lib/utils";
import { AVATAR_COLORS } from "../lib/constants";
import { useCreateProject, useDeleteProject, useProjects, useUpdateProject } from "../hooks/useQueries";
import type { Project } from "../types";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";

interface FormState {
  name: string;
  description: string;
  repoUrl: string;
  techStack: string;
  color: string;
}

const emptyForm: FormState = {
  name: "",
  description: "",
  repoUrl: "",
  techStack: "",
  color: AVATAR_COLORS[0],
};

export function Projects() {
  const { data: projects = [], isLoading } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(project: Project) {
    setEditing(project);
    setForm({
      name: project.name,
      description: project.description ?? "",
      repoUrl: project.repoUrl ?? "",
      techStack: project.techStack ?? "",
      color: project.color || AVATAR_COLORS[0],
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      setError("Project name is required");
      return;
    }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      repoUrl: form.repoUrl.trim() || null,
      techStack: form.techStack.trim() || null,
      color: form.color,
    };
    try {
      if (editing) await updateProject.mutateAsync({ id: editing.id, data: payload });
      else await createProject.mutateAsync(payload);
      setModalOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not save the project"));
    }
  }

  async function handleDelete(project: Project) {
    if (!window.confirm(`Delete "${project.name}"? Its tasks will be kept but unlinked.`)) return;
    await deleteProject.mutateAsync(project.id);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-faint">
          Group your tasks under the things you're building.
        </p>
        <Button onClick={openCreate} size="sm">
          <Plus size={15} strokeWidth={2.5} /> New Project
        </Button>
      </div>

      {isLoading ? (
        <Spinner className="py-24" label="Loading projects…" />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderGit2}
          title="No projects yet"
          hint='Create a project like "Neon Commerce" and attach tasks to it.'
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => {
            const pct =
              project.taskCount > 0
                ? Math.round((project.doneCount / project.taskCount) * 100)
                : 0;
            return (
              <article key={project.id} className="card card-interactive group relative overflow-hidden p-5">
                {/* Neon top bar */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-[3px]"
                  style={{
                    background: `linear-gradient(90deg, ${project.color}, ${project.color}66)`,
                    boxShadow: `0 0 14px ${project.color}66`,
                  }}
                />

                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-white">{project.name}</h3>
                  <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 max-md:opacity-100">
                    <button
                      onClick={() => openEdit(project)}
                      aria-label={`Edit ${project.name}`}
                      className="rounded-lg p-1.5 text-ink-faint hover:bg-white/5 hover:text-accent-bright"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => void handleDelete(project)}
                      aria-label={`Delete ${project.name}`}
                      className="rounded-lg p-1.5 text-ink-faint hover:bg-rose-400/10 hover:text-rose-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {project.description && (
                  <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-ink-muted">
                    {project.description}
                  </p>
                )}

                {project.techStack && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {project.techStack
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                      .map((tech) => (
                        <span
                          key={tech}
                          className="rounded-full border border-slate-700 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-300"
                        >
                          {tech}
                        </span>
                      ))}
                  </div>
                )}

                {/* Progress */}
                <div className="mt-4">
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="metric-mono text-xs text-slate-200">
                      {project.doneCount}/{project.taskCount}
                      <span className="ml-1 font-sans text-[11px] text-ink-faint">tasks done</span>
                    </span>
                    <span className="metric-mono text-xs font-semibold text-accent-bright">{pct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-neon-gradient shadow-glow-sm transition-all duration-500"
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
                  </div>
                </div>

                <footer className="mt-4 flex items-center justify-between border-t border-slate-800/70 pt-3">
                  <span className="font-mono text-[11px] text-ink-faint">
                    created {formatDate(project.createdAt)}
                  </span>
                  {project.repoUrl && (
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 transition-colors hover:text-accent-bright"
                    >
                      <Github size={12} /> repo <ExternalLink size={10} />
                    </a>
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      )}

      {/* Create / edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit project" : "New project"}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={createProject.isPending || updateProject.isPending}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleSubmit()}
              disabled={createProject.isPending || updateProject.isPending}
            >
              {(createProject.isPending || updateProject.isPending) && (
                <Loader2 size={15} className="animate-spin" />
              )}
              {editing ? "Save changes" : "Create project"}
            </Button>
          </div>
        }
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
        >
          {error && (
            <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-300">
              {error}
            </p>
          )}

          <div>
            <label htmlFor="proj-name" className="label-dark">
              Name *
            </label>
            <input
              id="proj-name"
              className="input-dark"
              placeholder="Neon Commerce"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              maxLength={80}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="proj-desc" className="label-dark">
              Description
            </label>
              <textarea
                id="proj-desc"
                rows={3}
                className="input-dark resize-y"
                placeholder="What are you building?"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                maxLength={1000}
              />
          </div>

          <div>
            <label htmlFor="proj-repo" className="label-dark">
              GitHub repository URL
            </label>
            <input
              id="proj-repo"
              type="url"
              className="input-dark"
              placeholder="https://github.com/you/repo"
              value={form.repoUrl}
              onChange={(e) => setForm((f) => ({ ...f, repoUrl: e.target.value }))}
            />
          </div>

          <div>
            <label htmlFor="proj-tech" className="label-dark">
              Tech stack
            </label>
            <input
              id="proj-tech"
              className="input-dark"
              placeholder="React, Node.js, PostgreSQL"
              value={form.techStack}
              onChange={(e) => setForm((f) => ({ ...f, techStack: e.target.value }))}
              maxLength={300}
            />
          </div>

          <div>
            <span className="label-dark">Accent color</span>
            <div className="flex gap-2">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Use color ${color}`}
                  onClick={() => setForm((f) => ({ ...f, color }))}
                  className={cn(
                    "h-7 w-7 rounded-full transition-all",
                    form.color === color ? "scale-110 ring-2 ring-white/80" : "opacity-60 hover:opacity-100"
                  )}
                  style={{ background: color, boxShadow: form.color === color ? `0 0 12px ${color}` : undefined }}
                />
              ))}
            </div>
          </div>

          <button type="submit" hidden aria-hidden tabIndex={-1} />
        </form>
      </Modal>
    </div>
  );
}
