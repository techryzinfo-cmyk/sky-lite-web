'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Plus,
  Loader2,
  Target,
  Flag,
  X,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Trash2,
  LayoutGrid,
  AlignLeft,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';

interface MilestonesTabProps {
  projectId: string;
}

export const MilestonesTab: React.FC<MilestonesTabProps> = ({ projectId }) => {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [togglingTask, setTogglingTask] = useState<string | null>(null);
  const [view, setView] = useState<'cards' | 'gantt'>('cards');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dueDate: '',
    tasks: [] as { title: string; isCompleted: boolean }[],
  });
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const toast = useToast();

  const fetchMilestones = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/milestones`);
      setMilestones(response.data);
    } catch (error) {
      console.error('Error fetching milestones:', error);
      toast.error('Failed to load milestones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, [projectId]);

  const openModal = () => {
    setFormData({ name: '', description: '', dueDate: '', tasks: [] });
    setNewTaskTitle('');
    setIsModalOpen(true);
  };

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, { title: newTaskTitle.trim(), isCompleted: false }],
    }));
    setNewTaskTitle('');
  };

  const removeTask = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index),
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.post(`/projects/${projectId}/milestones`, formData);
      toast.success('Milestone created successfully!');
      setIsModalOpen(false);
      fetchMilestones();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create milestone');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTask = async (milestone: any, taskIndex: number) => {
    const taskId = milestone.tasks[taskIndex]?._id || taskIndex;
    setTogglingTask(`${milestone._id}-${taskIndex}`);
    const updatedTasks = milestone.tasks.map((t: any, i: number) =>
      i === taskIndex ? { ...t, isCompleted: !t.isCompleted } : t
    );
    try {
      await api.patch(`/projects/${projectId}/milestones/${milestone._id}`, {
        tasks: updatedTasks,
      });
      setMilestones(prev =>
        prev.map(m => m._id === milestone._id ? { ...m, tasks: updatedTasks } : m)
      );
    } catch {
      toast.error('Failed to update task');
    } finally {
      setTogglingTask(null);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-emerald-700 bg-emerald-100 border-emerald-200';
      case 'On Hold': return 'text-amber-700 bg-amber-100 border-amber-200';
      case 'Delayed': return 'text-red-700 bg-red-100 border-red-200';
      default: return 'text-blue-700 bg-blue-100 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Tracking milestones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Project Milestones</h3>
          <p className="text-sm text-slate-500 mt-1">Key targets and critical path objectives.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex p-1 bg-gray-100 border border-gray-200 rounded-xl">
            <button
              onClick={() => setView('cards')}
              className={cn('p-1.5 rounded-lg transition-all', view === 'cards' ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-gray-700')}
              title="Card view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('gantt')}
              className={cn('p-1.5 rounded-lg transition-all', view === 'gantt' ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-gray-700')}
              title="Timeline view"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={openModal}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Milestone</span>
          </button>
        </div>
      </div>

      {view === 'gantt' && (() => {
        const withDates = milestones.filter(m => m.dueDate || m.targetDate);
        if (withDates.length === 0) {
          return (
            <div className="py-16 text-center border-2 border-dashed border-gray-200 rounded-3xl">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No milestones with due dates to display on the timeline.</p>
            </div>
          );
        }
        const dates = withDates.map(m => new Date(m.dueDate || m.targetDate).getTime());
        const starts = milestones.map(m => new Date(m.createdAt).getTime());
        const rangeStart = Math.min(...starts);
        const rangeEnd = Math.max(...dates);
        const totalMs = rangeEnd - rangeStart || 1;

        const months: string[] = [];
        const cur = new Date(rangeStart);
        cur.setDate(1);
        while (cur.getTime() <= rangeEnd) {
          months.push(cur.toLocaleString('default', { month: 'short', year: '2-digit' }));
          cur.setMonth(cur.getMonth() + 1);
        }

        const statusColors: Record<string, string> = {
          Completed: 'bg-emerald-500',
          Delayed: 'bg-red-500',
          'On Hold': 'bg-amber-500',
          'In Progress': 'bg-blue-500',
          Pending: 'bg-slate-400',
        };

        return (
          <GlassCard className="p-6 border-gray-200 overflow-hidden" gradient>
            <div className="overflow-x-auto">
              <div style={{ minWidth: '600px' }}>
                {/* Month axis */}
                <div className="flex mb-4 pl-[200px]">
                  {months.map((m, i) => (
                    <div key={i} className="flex-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-l border-gray-200 pl-1">
                      {m}
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  {milestones.map((milestone) => {
                    const start = new Date(milestone.createdAt).getTime();
                    const end = milestone.dueDate || milestone.targetDate
                      ? new Date(milestone.dueDate || milestone.targetDate).getTime()
                      : start + totalMs * 0.1;
                    const leftPct = ((start - rangeStart) / totalMs) * 100;
                    const widthPct = Math.max(((end - start) / totalMs) * 100, 1.5);
                    const color = statusColors[milestone.status] || 'bg-slate-400';
                    const completedTasks = milestone.tasks?.filter((t: any) => t.isCompleted).length || 0;
                    const totalTasks = milestone.tasks?.length || 0;

                    return (
                      <div key={milestone._id} className="flex items-center gap-4">
                        <div className="w-[196px] shrink-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{milestone.name || milestone.title}</p>
                          <p className="text-[10px] text-slate-500">
                            {milestone.dueDate || milestone.targetDate
                              ? new Date(milestone.dueDate || milestone.targetDate).toLocaleDateString()
                              : 'No date'}
                          </p>
                        </div>
                        <div className="flex-1 relative h-8 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                          <div
                            className={cn('absolute h-full rounded-lg flex items-center px-2', color)}
                            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                          >
                            {widthPct > 8 && (
                              <span className="text-[10px] text-white font-bold truncate">
                                {totalTasks > 0 ? `${completedTasks}/${totalTasks}` : milestone.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center space-x-4 mt-6 pt-4 border-t border-gray-100">
                  {Object.entries(statusColors).map(([status, color]) => (
                    <div key={status} className="flex items-center space-x-1.5">
                      <div className={cn('w-3 h-3 rounded-sm', color)} />
                      <span className="text-[10px] font-semibold text-slate-500">{status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        );
      })()}

      {view === 'cards' && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {milestones.map((milestone) => {
          const completedTasks = milestone.tasks?.filter((t: any) => t.isCompleted).length || 0;
          const totalTasks = milestone.tasks?.length || 0;
          const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (milestone.progress || 0);
          const isExpanded = expandedId === milestone._id;

          return (
            <GlassCard key={milestone._id} className="border-gray-200 group hover:border-blue-500/50 transition-all" gradient>
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 rounded-2xl bg-blue-100 border border-blue-200">
                    <Flag className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                    getStatusStyle(milestone.status)
                  )}>
                    {milestone.status || 'Pending'}
                  </span>
                </div>

                <h4 className="text-lg font-bold text-gray-900 mb-1">{milestone.name || milestone.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4">{milestone.description}</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5 text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{milestone.dueDate || milestone.targetDate ? new Date(milestone.dueDate || milestone.targetDate).toLocaleDateString() : 'No date set'}</span>
                    </div>
                    <span className="font-black text-gray-900">{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.6 }}
                      className={cn(
                        "h-full rounded-full",
                        milestone.status === 'Completed' ? 'bg-emerald-500' :
                        milestone.status === 'Delayed' ? 'bg-red-500' : 'bg-blue-500'
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Task Checklist */}
              {totalTasks > 0 && (
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : milestone._id)}
                    className="w-full flex items-center justify-between px-6 py-3 text-xs font-bold text-slate-500 hover:bg-gray-50 transition-colors"
                  >
                    <span>{completedTasks}/{totalTasks} Tasks Complete</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-4 space-y-2">
                          {milestone.tasks.map((task: any, i: number) => {
                            const key = `${milestone._id}-${i}`;
                            const isToggling = togglingTask === key;
                            return (
                              <button
                                key={i}
                                onClick={() => toggleTask(milestone, i)}
                                disabled={isToggling}
                                className="w-full flex items-center space-x-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left group/task"
                              >
                                {isToggling ? (
                                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
                                ) : task.isCompleted ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                ) : (
                                  <Circle className="w-4 h-4 text-gray-300 group-hover/task:text-blue-400 shrink-0 transition-colors" />
                                )}
                                <span className={cn(
                                  "text-sm flex-1",
                                  task.isCompleted ? 'line-through text-slate-400' : 'text-gray-700'
                                )}>
                                  {task.title}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {totalTasks === 0 && (
                <div className="border-t border-gray-100 px-6 py-3">
                  <p className="text-[10px] text-slate-400 italic">No tasks added yet.</p>
                </div>
              )}
            </GlassCard>
          );
        })}

        {milestones.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-bold text-slate-500">No milestones set</h4>
            <p className="text-sm text-slate-400 max-w-xs mx-auto mt-1">Define key milestones to track the critical path of your project.</p>
            <button
              onClick={openModal}
              className="mt-4 text-sm font-bold text-blue-600 hover:text-blue-500 transition-colors"
            >
              + Add first milestone
            </button>
          </div>
        )}
      </div>}

      {/* Create Milestone Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg relative z-10"
            >
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
                      <Flag className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">New Milestone</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Set a target with optional task checklist.</p>
                    </div>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-gray-900 bg-gray-50 rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 ml-1">Milestone Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                      placeholder="e.g. Foundation Complete"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 ml-1">Description</label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm resize-none transition-all"
                      placeholder="What needs to be achieved?"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 ml-1">Due Date</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-600 ml-1">Tasks (Optional)</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTask(); } }}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                        placeholder="Add a task and press Enter"
                      />
                      <button
                        type="button"
                        onClick={addTask}
                        className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold text-gray-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>

                    {formData.tasks.length > 0 && (
                      <div className="space-y-2 max-h-36 overflow-y-auto">
                        {formData.tasks.map((task, i) => (
                          <div key={i} className="flex items-center space-x-3 p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                            <Circle className="w-4 h-4 text-gray-300 shrink-0" />
                            <span className="flex-1 text-sm text-gray-700">{task.title}</span>
                            <button
                              type="button"
                              onClick={() => removeTask(i)}
                              className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-600 font-medium transition-all active:scale-[0.98]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-2 py-3 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-blue-600/20 flex items-center justify-center space-x-2"
                    >
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Create Milestone</span>}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
