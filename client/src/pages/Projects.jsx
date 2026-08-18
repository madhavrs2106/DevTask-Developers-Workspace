import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Github, Code, ExternalLink, Trash2, Calendar, CheckSquare, AlertTriangle, Edit3 } from 'lucide-react';

export default function Projects() {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  
  // Form states for new project
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newStatus, setNewStatus] = useState('TODO');
  const [newDifficulty, setNewDifficulty] = useState('BEGINNER');
  const [newTechStack, setNewTechStack] = useState('');
  const [newGithubLink, setNewGithubLink] = useState('');
  const [newCodeSnippet, setNewCodeSnippet] = useState('');
  const [newDurationHours, setNewDurationHours] = useState('0.0');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          throw new Error('Server returned an unexpected response. The backend may be waking up, please try again.');
        }
        const data = await response.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Error fetching projects', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const payload = {
        title: newTitle,
        description: newDescription,
        status: newStatus,
        difficulty: newDifficulty,
        techStack: newTechStack,
        githubLink: newGithubLink,
        codeSnippet: newCodeSnippet,
        durationHours: Number(newDurationHours) || 0.0
      };

      const url = editingProject ? `/api/projects/${editingProject.id}` : '/api/projects';
      const method = editingProject ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error || 'Failed to save project');
        return;
      }

      resetProjectForm();
      fetchProjects();
    } catch (err) {
      console.error('Error saving project', err);
      setFormError(err.message || 'Network error');
    }
  };

  const resetProjectForm = () => {
    setNewTitle('');
    setNewDescription('');
    setNewStatus('TODO');
    setNewDifficulty('BEGINNER');
    setNewTechStack('');
    setNewGithubLink('');
    setNewCodeSnippet('');
    setNewDurationHours('0.0');
    setEditingProject(null);
    setShowAddModal(false);
  };

  const openCreateModal = () => {
    setEditingProject(null);
    setNewTitle('');
    setNewDescription('');
    setNewStatus('TODO');
    setNewDifficulty('BEGINNER');
    setNewTechStack('');
    setNewGithubLink('');
    setNewCodeSnippet('');
    setNewDurationHours('0.0');
    setFormError('');
    setShowAddModal(true);
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    setNewTitle(project.title);
    setNewDescription(project.description || '');
    setNewStatus(project.status);
    setNewDifficulty(project.difficulty);
    setNewTechStack(project.techStack || '');
    setNewGithubLink(project.githubLink || '');
    setNewCodeSnippet(project.codeSnippet || '');
    setNewDurationHours(String(project.durationHours || 0));
    setShowAddModal(true);
  };

  const handleUpdateStatus = async (projectId, nextStatus) => {
    try {
      const projectToUpdate = projects.find(t => t.id === projectId);
      if (!projectToUpdate) return;

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...projectToUpdate,
          status: nextStatus
        })
      });

      if (response.ok) {
        fetchProjects();
        if (selectedProject && selectedProject.id === projectId) {
          setSelectedProject(prev => ({ ...prev, status: nextStatus }));
        }
      }
    } catch (err) {
      console.error('Error updating project status', err);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to decommission this project?')) return;
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setSelectedProject(null);
        fetchProjects();
      }
    } catch (err) {
      console.error('Error deleting project', err);
    }
  };

  const filteredProjects = projects.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (t.techStack && t.techStack.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const columns = [
    { id: 'TODO', title: 'To Do', color: 'border-t-sky-400' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'border-t-indigo-400' },
    { id: 'IN_REVIEW', title: 'In Review', color: 'border-t-purple-400' },
    { id: 'DONE', title: 'Done', color: 'border-t-emerald-400' }
  ];

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-50 dark:bg-darkBg text-slate-800 dark:text-textMuted flex flex-col max-h-[calc(100vh-80px)]">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by keyword or technology..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-textHeader font-mono focus:border-neonCyan outline-none transition-all"
          />
        </div>

        {/* Add button */}
        <button
          onClick={openCreateModal}
          className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-neonCyan to-neonTeal text-slate-950 font-mono font-bold text-sm rounded-lg hover:brightness-110 flex items-center justify-center gap-2 transition-all shadow-lg neon-glow-cyan"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" /> Create Workspace Project
        </button>
      </div>

      {/* Grid Columns */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-neonCyan font-mono">
          <span>Loading projects...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 flex-1 items-start">
          {columns.map(col => {
            const colProjects = filteredProjects.filter(t => t.status === col.id);
            return (
              <div
                key={col.id}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                onDragEnter={(e) => { e.preventDefault(); setDragOverCol(col.id); }}
                onDragLeave={(e) => { if (e.currentTarget === e.target) setDragOverCol(null); }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverCol(null);
                  const projectId = e.dataTransfer.getData('text/plain');
                  if (projectId) handleUpdateStatus(projectId, col.id);
                }}
                className={`bg-white/60 dark:bg-darkSurface/60 border rounded-xl p-4 flex flex-col max-h-[70vh] shadow-sm transition-colors duration-200 ${
                  dragOverCol === col.id
                    ? 'border-neonCyan/60 ring-2 ring-neonCyan/20'
                    : 'border-slate-200 dark:border-slate-800/80'
                }`}
              >
                <div className={`border-t-4 ${col.color} pt-2 pb-4 flex justify-between items-center`}>
                  <span className="font-mono font-bold text-slate-900 dark:text-textHeader text-sm tracking-wide">{col.title}</span>
                  <span className="text-xs font-mono bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-textMuted px-2 py-0.5 rounded-full">
                    {colProjects.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {colProjects.map(project => (
                    <div
                      key={project.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', project.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onClick={() => setSelectedProject(project)}
                      className="bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 hover:border-neonCyan/40 rounded-xl p-4 cursor-grab active:cursor-grabbing transition-all duration-300 group shadow-md"
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800/80">
                          {project.difficulty}
                        </span>
                        <span className="text-[10px] font-mono text-neonCyan">{(project.durationHours ?? 0).toFixed(1)} hrs</span>
                      </div>

                      <h4 className="font-mono text-sm font-bold text-slate-900 dark:text-textHeader mb-2 group-hover:text-neonCyan transition-colors line-clamp-1">
                        {project.title}
                      </h4>

                      <p className="text-xs text-slate-500 dark:text-textMuted line-clamp-2 mb-3">
                        {project.description || 'No description provided.'}
                      </p>

                      {/* Tech stack badges */}
                      {project.techStack && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {project.techStack.split(',').map(tech => (
                            <span key={tech} className="text-[9px] font-mono bg-slate-100 dark:bg-slate-900 text-neonTeal border border-neonTeal/20 px-1.5 py-0.5 rounded">
                              {tech.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {colProjects.length === 0 && (
                    <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl py-8 text-center text-xs font-mono text-slate-400 dark:text-slate-600">
                      Empty segment
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
              <div>
                <span className="text-xs font-mono text-neonCyan uppercase tracking-widest font-semibold">{selectedProject.difficulty} WORKSPACE ITEM</span>
                <h3 className="text-lg font-mono font-bold text-slate-900 dark:text-textHeader mt-1">{selectedProject.title}</h3>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-slate-400 hover:text-slate-600 dark:text-textMuted dark:hover:text-white font-mono text-xl"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Description */}
              <div>
                <h4 className="text-xs font-mono font-bold text-slate-900 dark:text-textHeader uppercase mb-2">Specifications</h4>
                <p className="text-sm text-slate-600 dark:text-textMuted bg-slate-100/50 dark:bg-slate-950/50 p-4 border border-slate-200 dark:border-slate-900 rounded-lg whitespace-pre-line leading-relaxed">
                  {selectedProject.description || 'No descriptive context attached.'}
                </p>
              </div>

              {/* Grid detail metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono text-xs">
                <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-900">
                  <span className="text-slate-500 dark:text-textMuted block">Coding Duration</span>
                  <span className="text-slate-900 dark:text-textHeader font-bold text-sm mt-1 block">{selectedProject.durationHours} Hours</span>
                </div>
                <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-900">
                  <span className="text-slate-500 dark:text-textMuted block">Assigned Tech Stack</span>
                  <span className="text-neonTeal font-bold text-sm mt-1 block truncate">{selectedProject.techStack || 'None'}</span>
                </div>
                <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-900 col-span-2 sm:col-span-1">
                  <span className="text-slate-500 dark:text-textMuted block">Current Status</span>
                  <select
                    value={selectedProject.status}
                    onChange={(e) => handleUpdateStatus(selectedProject.id, e.target.value)}
                    className="bg-transparent text-slate-900 dark:text-textHeader font-bold outline-none mt-1 text-sm cursor-pointer"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
              </div>

              {/* GitHub Link integration */}
              {selectedProject.githubLink && (
                <div>
                  <h4 className="text-xs font-mono font-bold text-slate-900 dark:text-textHeader uppercase mb-2">Repository Link</h4>
                  <a
                    href={selectedProject.githubLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-neonCyan hover:underline bg-slate-100/50 dark:bg-slate-950/50 p-3 border border-slate-200 dark:border-slate-900 rounded-lg"
                  >
                    <Github className="w-4 h-4" />
                    <span>{selectedProject.githubLink}</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-auto" />
                  </a>
                </div>
              )}

              {/* Code Snippet attachment */}
              {selectedProject.codeSnippet && (
                <div>
                  <h4 className="text-xs font-mono font-bold text-slate-900 dark:text-textHeader uppercase mb-2">Attached Snippet</h4>
                  <pre className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-lg p-4 font-mono text-xs text-emerald-600 dark:text-emerald-400 overflow-x-auto">
                    <code>{selectedProject.codeSnippet}</code>
                  </pre>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:justify-between gap-3 bg-slate-100/10 dark:bg-slate-950/20">
              <button
                onClick={() => handleDeleteProject(selectedProject.id)}
                className="w-full sm:w-auto px-4 py-2 border border-red-500/20 bg-red-500/10 text-red-500 dark:text-red-400 rounded-lg hover:bg-red-550 dark:hover:bg-red-500 hover:text-white transition-all text-xs font-mono flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Decommission Project
              </button>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={() => openEditModal(selectedProject)}
                  className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 dark:bg-darkHover text-slate-700 dark:text-textHeader border border-slate-200 dark:border-slate-800 rounded-lg hover:border-neonCyan/40 hover:text-neonCyan transition-all text-xs font-mono flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-4 h-4" /> Edit Project
                </button>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="flex-1 sm:flex-none px-4 py-2 bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-textMuted border border-slate-300 dark:border-slate-800 rounded-lg hover:text-slate-950 dark:hover:text-white transition-all text-xs font-mono"
                >
                  Close Panel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-mono font-bold text-slate-900 dark:text-textHeader">
                {editingProject ? 'Edit Workspace Project' : 'Create Workspace Project'}
              </h3>
              <button onClick={resetProjectForm} className="text-slate-400 hover:text-slate-600 dark:text-textMuted dark:hover:text-white text-xl">&times;</button>
            </div>

            <form onSubmit={handleCreateProject} noValidate className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-mono text-slate-500 dark:text-textMuted mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement OIDC Authorization server"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-textHeader font-mono focus:border-neonCyan outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 dark:text-textMuted mb-1">Description / Spec</label>
                <textarea
                  placeholder="Attach specifications or design notes..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows="3"
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-textHeader font-mono focus:border-neonCyan outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-500 dark:text-textMuted mb-1">Difficulty</label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-textHeader font-mono focus:border-neonCyan outline-none"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 dark:text-textMuted mb-1">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-textHeader font-mono focus:border-neonCyan outline-none"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-500 dark:text-textMuted mb-1">Duration (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="e.g. 2.5"
                    value={newDurationHours}
                    onChange={(e) => setNewDurationHours(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-textHeader font-mono focus:border-neonCyan outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-500 dark:text-textMuted mb-1">Tech Stack (comma-separated)</label>
                <input
                  type="text"
                  placeholder="React, Express, Prisma"
                  value={newTechStack}
                  onChange={(e) => setNewTechStack(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-textHeader font-mono focus:border-neonCyan outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 dark:text-textMuted mb-1">GitHub Repository Link</label>
                <input
                  type="text"
                  placeholder="https://github.com/user/repo"
                  value={newGithubLink}
                  onChange={(e) => setNewGithubLink(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-textHeader font-mono focus:border-neonCyan outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 dark:text-textMuted mb-1">Code Snippet (Optional)</label>
                <textarea
                  placeholder="Attach relevant code lines..."
                  value={newCodeSnippet}
                  onChange={(e) => setNewCodeSnippet(e.target.value)}
                  rows="3"
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400 font-mono focus:border-neonCyan outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={resetProjectForm}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-textMuted border border-slate-300 dark:border-slate-800 rounded-lg hover:text-slate-950 dark:hover:text-white text-xs font-mono"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-neonCyan to-neonTeal text-slate-950 font-bold rounded-lg text-xs font-mono shadow-lg hover:brightness-110"
                >
                  {editingProject ? 'Save Changes' : 'Commit Project'}
                </button>
              </div>
              {formError && (
                <p className="text-red-400 text-xs font-mono mt-2">{formError}</p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
