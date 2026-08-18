import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Github, Code, ExternalLink, Trash2, Calendar, CheckSquare, AlertTriangle, Edit3 } from 'lucide-react';

export default function TaskBoard() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  
  // Form states for new task
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newStatus, setNewStatus] = useState('TODO');
  const [newDifficulty, setNewDifficulty] = useState('BEGINNER');
  const [newTechStack, setNewTechStack] = useState('');
  const [newGithubLink, setNewGithubLink] = useState('');
  const [newCodeSnippet, setNewCodeSnippet] = useState('');
  const [newDurationHours, setNewDurationHours] = useState('0.0');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (err) {
      console.error('Error fetching tasks', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
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

      const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks';
      const method = editingTask ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        resetTaskForm();
        fetchTasks();
      }
    } catch (err) {
      console.error('Error saving task', err);
    }
  };

  const resetTaskForm = () => {
    setNewTitle('');
    setNewDescription('');
    setNewStatus('TODO');
    setNewDifficulty('BEGINNER');
    setNewTechStack('');
    setNewGithubLink('');
    setNewCodeSnippet('');
    setNewDurationHours('0.0');
    setEditingTask(null);
    setShowAddModal(false);
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setNewStatus('TODO');
    setNewDifficulty('BEGINNER');
    setShowAddModal(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setNewTitle(task.title);
    setNewDescription(task.description || '');
    setNewStatus(task.status);
    setNewDifficulty(task.difficulty);
    setNewTechStack(task.techStack || '');
    setNewGithubLink(task.githubLink || '');
    setNewCodeSnippet(task.codeSnippet || '');
    setNewDurationHours(String(task.durationHours || 0));
    setShowAddModal(true);
  };

  const handleUpdateStatus = async (taskId, nextStatus) => {
    try {
      const taskToUpdate = tasks.find(t => t.id === taskId);
      if (!taskToUpdate) return;

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...taskToUpdate,
          status: nextStatus
        })
      });

      if (response.ok) {
        fetchTasks();
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(prev => ({ ...prev, status: nextStatus }));
        }
      }
    } catch (err) {
      console.error('Error updating task status', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to decommission this task?')) return;
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setSelectedTask(null);
        fetchTasks();
      }
    } catch (err) {
      console.error('Error deleting task', err);
    }
  };

  const filteredTasks = tasks.filter(t => 
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
          <Plus className="w-4 h-4 stroke-[2.5]" /> Create Workspace Task
        </button>
      </div>

      {/* Grid Columns */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-neonCyan font-mono">
          <span>Loading tasks...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 flex-1 items-start">
          {columns.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.id);
            return (
              <div
                key={col.id}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                onDragEnter={(e) => { e.preventDefault(); setDragOverCol(col.id); }}
                onDragLeave={(e) => { if (e.currentTarget === e.target) setDragOverCol(null); }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverCol(null);
                  const taskId = e.dataTransfer.getData('text/plain');
                  if (taskId) handleUpdateStatus(taskId, col.id);
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
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {colTasks.map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', task.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onClick={() => setSelectedTask(task)}
                      className="bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 hover:border-neonCyan/40 rounded-xl p-4 cursor-grab active:cursor-grabbing transition-all duration-300 group shadow-md"
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800/80">
                          {task.difficulty}
                        </span>
                        <span className="text-[10px] font-mono text-neonCyan">{task.durationHours.toFixed(1)} hrs</span>
                      </div>

                      <h4 className="font-mono text-sm font-bold text-slate-900 dark:text-textHeader mb-2 group-hover:text-neonCyan transition-colors line-clamp-1">
                        {task.title}
                      </h4>

                      <p className="text-xs text-slate-500 dark:text-textMuted line-clamp-2 mb-3">
                        {task.description || 'No description provided.'}
                      </p>

                      {/* Tech stack badges */}
                      {task.techStack && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {task.techStack.split(',').map(tech => (
                            <span key={tech} className="text-[9px] font-mono bg-slate-100 dark:bg-slate-900 text-neonTeal border border-neonTeal/20 px-1.5 py-0.5 rounded">
                              {tech.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {colTasks.length === 0 && (
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

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
              <div>
                <span className="text-xs font-mono text-neonCyan uppercase tracking-widest font-semibold">{selectedTask.difficulty} WORKSPACE ITEM</span>
                <h3 className="text-lg font-mono font-bold text-slate-900 dark:text-textHeader mt-1">{selectedTask.title}</h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
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
                  {selectedTask.description || 'No descriptive context attached.'}
                </p>
              </div>

              {/* Grid detail metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono text-xs">
                <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-900">
                  <span className="text-slate-500 dark:text-textMuted block">Coding Duration</span>
                  <span className="text-slate-900 dark:text-textHeader font-bold text-sm mt-1 block">{selectedTask.durationHours} Hours</span>
                </div>
                <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-900">
                  <span className="text-slate-500 dark:text-textMuted block">Assigned Tech Stack</span>
                  <span className="text-neonTeal font-bold text-sm mt-1 block truncate">{selectedTask.techStack || 'None'}</span>
                </div>
                <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-900 col-span-2 sm:col-span-1">
                  <span className="text-slate-500 dark:text-textMuted block">Current Status</span>
                  <select
                    value={selectedTask.status}
                    onChange={(e) => handleUpdateStatus(selectedTask.id, e.target.value)}
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
              {selectedTask.githubLink && (
                <div>
                  <h4 className="text-xs font-mono font-bold text-slate-900 dark:text-textHeader uppercase mb-2">Repository Link</h4>
                  <a
                    href={selectedTask.githubLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-neonCyan hover:underline bg-slate-100/50 dark:bg-slate-950/50 p-3 border border-slate-200 dark:border-slate-900 rounded-lg"
                  >
                    <Github className="w-4 h-4" />
                    <span>{selectedTask.githubLink}</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-auto" />
                  </a>
                </div>
              )}

              {/* Code Snippet attachment */}
              {selectedTask.codeSnippet && (
                <div>
                  <h4 className="text-xs font-mono font-bold text-slate-900 dark:text-textHeader uppercase mb-2">Attached Snippet</h4>
                  <pre className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-lg p-4 font-mono text-xs text-emerald-600 dark:text-emerald-400 overflow-x-auto">
                    <code>{selectedTask.codeSnippet}</code>
                  </pre>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:justify-between gap-3 bg-slate-100/10 dark:bg-slate-950/20">
              <button
                onClick={() => handleDeleteTask(selectedTask.id)}
                className="w-full sm:w-auto px-4 py-2 border border-red-500/20 bg-red-500/10 text-red-500 dark:text-red-400 rounded-lg hover:bg-red-550 dark:hover:bg-red-500 hover:text-white transition-all text-xs font-mono flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Decommission Task
              </button>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={() => openEditModal(selectedTask)}
                  className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 dark:bg-darkHover text-slate-700 dark:text-textHeader border border-slate-200 dark:border-slate-800 rounded-lg hover:border-neonCyan/40 hover:text-neonCyan transition-all text-xs font-mono flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-4 h-4" /> Edit Task
                </button>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="flex-1 sm:flex-none px-4 py-2 bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-textMuted border border-slate-300 dark:border-slate-800 rounded-lg hover:text-slate-950 dark:hover:text-white transition-all text-xs font-mono"
                >
                  Close Panel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-mono font-bold text-slate-900 dark:text-textHeader">
                {editingTask ? 'Edit Workspace Task' : 'Create Workspace Task'}
              </h3>
              <button onClick={resetTaskForm} className="text-slate-400 hover:text-slate-600 dark:text-textMuted dark:hover:text-white text-xl">&times;</button>
            </div>

            <form onSubmit={handleCreateTask} noValidate className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-mono text-slate-500 dark:text-textMuted mb-1">Task Title</label>
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
                  onClick={resetTaskForm}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-textMuted border border-slate-300 dark:border-slate-800 rounded-lg hover:text-slate-950 dark:hover:text-white text-xs font-mono"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-neonCyan to-neonTeal text-slate-950 font-bold rounded-lg text-xs font-mono shadow-lg hover:brightness-110"
                >
                  {editingTask ? 'Save Changes' : 'Commit Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
