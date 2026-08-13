import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Plus, Trash2, Edit3, Award, ExternalLink, Sliders } from 'lucide-react';

export default function Courses() {
  const { token } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  // Form input fields
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('');
  const [status, setStatus] = useState('NOT_STARTED');
  const [progressPercent, setProgressPercent] = useState(0);
  const [totalHours, setTotalHours] = useState(0.0);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (err) {
      console.error('Error fetching courses', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, platform, status, progressPercent, totalHours })
      });
      if (response.ok) {
        resetForm();
        fetchCourses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    if (!editingCourse) return;
    try {
      const response = await fetch(`/api/courses/${editingCourse.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, platform, status, progressPercent, totalHours })
      });
      if (response.ok) {
        resetForm();
        fetchCourses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Decommission this roadmap?')) return;
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchCourses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (course) => {
    setEditingCourse(course);
    setTitle(course.title);
    setPlatform(course.platform);
    setStatus(course.status);
    setProgressPercent(course.progressPercent);
    setTotalHours(course.totalHours);
    setShowAddModal(true);
  };

  const resetForm = () => {
    setTitle('');
    setPlatform('');
    setStatus('NOT_STARTED');
    setProgressPercent(0);
    setTotalHours(0.0);
    setEditingCourse(null);
    setShowAddModal(false);
  };

  const statusBadges = {
    NOT_STARTED: { label: 'Queued', style: 'bg-slate-100 dark:bg-darkHover border-slate-200 dark:border-darkBorder text-slate-500 dark:text-slate-400' },
    IN_PROGRESS: { label: 'In Progress', style: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' },
    COMPLETED: { label: 'Completed', style: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' }
  };

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-50 dark:bg-darkBg text-slate-800 dark:text-textMuted flex flex-col max-h-[calc(100vh-80px)]">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-lg font-mono font-bold text-slate-900 dark:text-textHeader">Syllabus & Roadmaps</h2>
          <p className="text-xs text-slate-500 dark:text-textMuted mt-1">Configure study tracks and curriculum status</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-neonCyan to-neonTeal text-slate-950 font-mono font-bold text-sm rounded-lg hover:brightness-110 flex items-center justify-center gap-2 shadow-lg neon-glow-cyan transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" /> Add Study Track
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-neonCyan font-mono">
          <span>Syncing academic nodes...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <div key={course.id} className="bg-white dark:bg-darkSurface border border-slate-200 dark:border-darkBorder rounded-xl p-6 flex flex-col justify-between shadow-md relative overflow-hidden group">
              {course.status === 'COMPLETED' && (
                <div className="absolute right-3 top-3 text-emerald-400/20">
                  <Award className="w-12 h-12" />
                </div>
              )}

              <div>
                <div className="flex justify-between items-start gap-4 mb-3">
                  <span className={`text-[10px] font-mono font-bold border px-2 py-0.5 rounded ${statusBadges[course.status].style}`}>
                    {statusBadges[course.status].label}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-textMuted">{course.platform}</span>
                </div>

                <h3 className="font-mono text-sm font-bold text-slate-900 dark:text-textHeader mb-2 group-hover:text-neonCyan transition-colors">
                  {course.title}
                </h3>

                <div className="flex justify-between text-xs font-mono text-slate-500 dark:text-textMuted mb-2">
                  <span>Progress Velocity</span>
                  <span>{course.progressPercent}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 dark:bg-darkInput h-1.5 rounded-full overflow-hidden border border-slate-200 dark:border-darkInput mb-4">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      course.status === 'COMPLETED' ? 'bg-emerald-400' : 'bg-neonCyan'
                    }`}
                    style={{ width: `${course.progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 dark:border-darkInput pt-4 mt-2">
                <span className="text-xs font-mono text-slate-500 dark:text-textMuted">Estimate: {course.totalHours} hrs</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(course)}
                    className="p-1.5 rounded bg-slate-100 dark:bg-darkHover border border-slate-200 dark:border-darkBorder text-slate-400 hover:text-neonCyan transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="p-1.5 rounded bg-slate-100 dark:bg-darkHover border border-slate-200 dark:border-darkBorder text-slate-400 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {courses.length === 0 && (
            <div className="col-span-full border border-dashed border-slate-200 dark:border-darkBorder rounded-xl py-12 text-center">
              <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-sm font-mono text-slate-500">No syllabuses or tracks configured.</p>
              <button
                onClick={() => { resetForm(); setShowAddModal(true); }}
                className="mt-3 text-xs font-mono text-neonCyan hover:underline"
              >
                Configure first learning module &rarr;
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-darkSurface border border-slate-200 dark:border-darkBorder rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-200 dark:border-darkBorder flex justify-between items-center">
              <h3 className="text-lg font-mono font-bold text-slate-900 dark:text-textHeader">
                {editingCourse ? 'Configure Syllabus Module' : 'Add Learning Roadmap'}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 dark:text-textMuted dark:hover:text-white text-xl">&times;</button>
            </div>

            <form onSubmit={editingCourse ? handleUpdateCourse : handleCreateCourse} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-500 dark:text-textMuted mb-1">Course / Roadmap Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Go Programming Mastery Course"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-darkInput border border-slate-200 dark:border-darkBorder rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-textHeader font-mono focus:border-neonCyan outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 dark:text-textMuted mb-1">Platform / Institution</label>
                <input
                  type="text"
                  placeholder="e.g. Udemy, Coursera, MIT OpenCourseWare"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-darkInput border border-slate-200 dark:border-darkBorder rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-textHeader font-mono focus:border-neonCyan outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-500 dark:text-textMuted mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => {
                      const newStat = e.target.value;
                      setStatus(newStat);
                      if (newStat === 'COMPLETED') setProgressPercent(100);
                      if (newStat === 'NOT_STARTED') setProgressPercent(0);
                    }}
                    className="w-full bg-slate-100 dark:bg-darkInput border border-slate-200 dark:border-darkBorder rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-textHeader font-mono focus:border-neonCyan outline-none"
                  >
                    <option value="NOT_STARTED">Queued</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 dark:text-textMuted mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="e.g. 24"
                    value={totalHours}
                    onChange={(e) => setTotalHours(Number(e.target.value) || 0)}
                    className="w-full bg-slate-100 dark:bg-darkInput border border-slate-200 dark:border-darkBorder rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-textHeader font-mono focus:border-neonCyan outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono text-slate-500 dark:text-textMuted mb-1">
                  <span>Current Progress</span>
                  <span>{progressPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressPercent}
                  onChange={(e) => {
                    const progress = Number(e.target.value);
                    setProgressPercent(progress);
                    if (progress === 100) setStatus('COMPLETED');
                    else if (progress === 0) setStatus('NOT_STARTED');
                    else setStatus('IN_PROGRESS');
                  }}
                  className="w-full h-1 bg-slate-100 dark:bg-darkInput rounded-lg appearance-none cursor-pointer accent-neonCyan"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-darkBorder">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-slate-200 dark:bg-darkHover text-slate-700 dark:text-textMuted border border-slate-300 dark:border-darkBorder rounded-lg hover:text-slate-950 dark:hover:text-white text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-neonCyan to-neonTeal text-slate-950 font-bold rounded-lg text-xs font-mono shadow-lg hover:brightness-110"
                >
                  {editingCourse ? 'Save Changes' : 'Initialize Track'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
