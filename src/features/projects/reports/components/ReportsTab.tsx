'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar, CheckCircle2, Circle, Clock, MessageSquare,
  User, Image as ImageIcon, X, ChevronRight, Loader2, BarChart2,
  TrendingUp, Activity, Download
} from 'lucide-react';
import api from '@/services/api.client';
import { useToast } from '@/providers/ToastContext';
import { SkeletonLoader } from '@/components/skeletons/SkeletonLoader';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ReportsTabProps {
  projectId: string;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ projectId }) => {
  const [reportType, setReportType] = useState<'Daily' | 'Monthly'>('Daily');
  const [milestones, setMilestones] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [snags, setSnags] = useState<any[]>([]);

  const toast = useToast();

  const getMemberName = (assignedTo: any) => {
    if (!assignedTo) return 'Unassigned';
    const id = assignedTo?._id || assignedTo;
    const member = members.find(m => m._id === id || m.id === id);
    return member?.name || assignedTo?.name || 'Assigned User';
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [msRes, usersRes] = await Promise.all([
          api.get(`/projects/${projectId}/milestones`),
          api.get(`/users?projectId=${projectId}`)
        ]);

        const msData = Array.isArray(msRes.data)
          ? msRes.data
          : Array.isArray(msRes.data?.milestones)
            ? msRes.data.milestones
            : [];
        setMilestones(msData);

        const rawUsers = Array.isArray(usersRes.data) ? usersRes.data : [];
        setMembers(rawUsers);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load reports data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  const { chartData, groupedTasks, totalFiltered } = useMemo(() => {
    const allCompletedTasks: any[] = [];
    milestones.forEach(m => {
      if (m.tasks) {
        m.tasks.forEach((t: any) => {
          if (t.isCompleted) {
            allCompletedTasks.push({
              ...t,
              milestoneName: m.name,
              completedAtDate: new Date(t.completedAt || m.updatedAt || new Date())
            });
          }
        });
      }
    });

    const cData: { value: number; label: string }[] = [];
    const grouped: Record<string, any[]> = {};
    let tFiltered = 0;

    if (reportType === 'Daily') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const count = allCompletedTasks.filter(t => 
          t.completedAtDate.getDate() === d.getDate() && 
          t.completedAtDate.getMonth() === d.getMonth() &&
          t.completedAtDate.getFullYear() === d.getFullYear()
        ).length;
        cData.push({ value: count, label: dateStr });
      }

      // Filter tasks for last 7 days for the list
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      // set hours to 0 to compare full days
      sevenDaysAgo.setHours(0, 0, 0, 0);
      const recentTasks = allCompletedTasks.filter(t => t.completedAtDate >= sevenDaysAgo);
      recentTasks.forEach(t => {
        if (!grouped[t.milestoneName]) grouped[t.milestoneName] = [];
        grouped[t.milestoneName].push(t);
        tFiltered++;
      });

    } else {
      // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthStr = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        const count = allCompletedTasks.filter(t => 
          t.completedAtDate.getMonth() === d.getMonth() &&
          t.completedAtDate.getFullYear() === d.getFullYear()
        ).length;
        cData.push({ value: count, label: monthStr });
      }

      // Filter tasks for last 6 months for the list
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      sixMonthsAgo.setHours(0, 0, 0, 0);
      const recentTasks = allCompletedTasks.filter(t => t.completedAtDate >= sixMonthsAgo);
      recentTasks.forEach(t => {
        if (!grouped[t.milestoneName]) grouped[t.milestoneName] = [];
        grouped[t.milestoneName].push(t);
        tFiltered++;
      });
    }

    return { chartData: cData, groupedTasks: grouped, totalFiltered: tFiltered };
  }, [milestones, reportType]);

  const handleExportReport = () => {
    if (Object.keys(groupedTasks).length === 0) {
      toast.error('No report data available to export');
      return;
    }

    const headers = ['Milestone Name', 'Task Title', 'Completed By', 'Completed Date', 'Completion Note'];
    const rows: any[] = [];

    Object.entries(groupedTasks).forEach(([milestoneName, tasks]) => {
      tasks.forEach((task: any) => {
        const completedDate = new Date(task.completedAtDate).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
        const completedBy = getMemberName(task.assignedTo);
        rows.push([
          milestoneName,
          task.title,
          completedBy,
          completedDate,
          task.completionNote || ''
        ]);
      });
    });

    const csv = [headers, ...rows].map(r =>
      r.map((v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Project_Report_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${reportType} report exported successfully`);
  };

  // SVG Chart calculation parameters (shrunk for neat high-density UI)
  const chartPoints = useMemo(() => {
    const maxVal = Math.max(...chartData.map(c => c.value), 1);
    return chartData.map((item, index) => {
      // chart viewBox: 0 0 600 135
      // x: ranges from 40 to 560
      // y: ranges from 20 to 110 (height offset: 110 - valuePct * 90)
      const x = 40 + (index / (chartData.length - 1)) * 520;
      const y = 110 - (item.value / maxVal) * 90;
      return { x, y, value: item.value, label: item.label };
    });
  }, [chartData]);

  const linePath = useMemo(() => {
    return chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [chartPoints]);

  const areaPath = useMemo(() => {
    if (chartPoints.length === 0) return '';
    return `${linePath} L ${chartPoints[chartPoints.length - 1].x} 110 L ${chartPoints[0].x} 110 Z`;
  }, [chartPoints, linePath]);

  return (
    <SkeletonLoader loading={loading} preset="list">
      <div className="space-y-4">
        {/* Toggle Box */}
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="flex p-1 bg-gray-100 border border-gray-200 rounded-xl w-fit">
              <button
                onClick={() => setReportType('Daily')}
                className={cn(
                  'py-1.5 px-4 rounded-lg text-xs font-bold transition-all',
                  reportType === 'Daily'
                    ? 'bg-white shadow text-blue-600'
                    : 'text-slate-500 hover:text-gray-700'
                )}
              >
                Daily
              </button>
              <button
                onClick={() => setReportType('Monthly')}
                className={cn(
                  'py-1.5 px-4 rounded-lg text-xs font-bold transition-all',
                  reportType === 'Monthly'
                    ? 'bg-white shadow text-blue-600'
                    : 'text-slate-500 hover:text-gray-700'
                )}
              >
                Monthly
              </button>
            </div>

            <button
              onClick={handleExportReport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-600 transition-all shadow-sm active:scale-95"
              title="Export Report to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Report</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              {reportType === 'Daily' ? 'Last 7 Days Activity' : 'Last 6 Months Activity'}
            </span>
          </div>
        </div>

        {/* Metric Header Card */}
        <GlassCard className="p-3.5 border-gray-200 flex justify-between items-center gap-4" gradient>
          <div>
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Completed Tasks</h4>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-extrabold text-gray-900 leading-none">{totalFiltered}</span>
              <span className="text-[11px] font-semibold text-slate-500">
                tasks in {reportType === 'Daily' ? 'last 7 days' : 'last 6 months'}
              </span>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-blue-50/80 border border-blue-100/50 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
        </GlassCard>

        {/* Custom SVG Line Chart */}
        <GlassCard className="p-4 border-gray-200 overflow-hidden" gradient>
          <div className="w-full overflow-x-auto scrollbar-hide">
            <div className="min-w-[500px]">
              <svg viewBox="0 0 600 135" className="w-full h-auto overflow-visible select-none">
                <defs>
                  <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                <line x1="40" y1="20" x2="560" y2="20" stroke="#F8FAFC" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="40" y1="65" x2="560" y2="65" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="40" y1="110" x2="560" y2="110" stroke="#E2E8F0" strokeWidth="1.5" />

                {/* Area under the line */}
                {areaPath && (
                  <path d={areaPath} fill="url(#chart-area-grad)" className="transition-all duration-500 ease-out" />
                )}

                {/* Line path */}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-500 ease-out"
                  />
                )}

                {/* Markers & Value Indicators */}
                {chartPoints.map((p, i) => (
                  <g key={i} className="group cursor-pointer">
                    {/* Glow ring */}
                    <circle cx={p.x} cy={p.y} r="8" className="fill-transparent group-hover:fill-blue-500/10 transition-colors" />
                    {/* Outer border dot */}
                    <circle cx={p.x} cy={p.y} r="5" className="fill-white stroke-blue-500 stroke-2" />
                    {/* Inner core dot */}
                    <circle cx={p.x} cy={p.y} r="2.5" className="fill-blue-500" />

                    {/* Value text above dot */}
                    <text
                      x={p.x}
                      y={p.y - 9}
                      textAnchor="middle"
                      className="text-[9px] font-black fill-blue-600 transition-opacity"
                    >
                      {p.value}
                    </text>

                    {/* Label at bottom */}
                    <text
                      x={p.x}
                      y="125"
                      textAnchor="middle"
                      className="text-[9px] font-bold fill-slate-400"
                    >
                      {p.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </GlassCard>

        {/* Milestone Breakdown List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Breakdown by Milestone</h3>

          {Object.keys(groupedTasks).length === 0 ? (
            <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-white">
              <CheckCircle2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-slate-400 font-medium text-xs">No tasks completed in this time range.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedTasks).map(([milestoneName, tasks], index) => (
                <div key={index} className="space-y-2">
                  <h4 className="text-[11px] font-extrabold text-slate-800 tracking-wide pl-1">
                    {milestoneName}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tasks.map((task, tIndex) => (
                      <GlassCard
                        key={tIndex}
                        className="p-2.5 border-gray-200 hover:border-blue-500/30 transition-colors flex items-center justify-between cursor-pointer group"
                        onClick={() => setSelectedTask(task)}
                        gradient
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                              {task.title}
                            </p>
                            <p className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1 font-medium">
                              <Calendar className="w-2.5 h-2.5" />
                              {new Date(task.completedAtDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-all group-hover:translate-x-0.5" />
                      </GlassCard>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Details Modal */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTask(null)}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="w-full max-w-md relative z-10"
            >
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 space-y-5 max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-base font-bold text-gray-900">Task Details</p>
                  </div>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="p-1.5 text-slate-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Task Title</h5>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedTask.title}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Completed By</h5>
                      <p className="text-xs font-medium text-slate-700 mt-1 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {getMemberName(selectedTask.assignedTo)}
                      </p>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Completed On</h5>
                      <p className="text-xs font-medium text-slate-700 mt-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(selectedTask.completedAtDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {selectedTask.completionNote && (
                    <div className="bg-blue-50/50 border border-blue-100/60 rounded-xl p-4">
                      <p className="text-xs font-bold text-blue-600 flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" /> Completion Note
                      </p>
                      <p className="text-xs text-slate-700 font-medium mt-2 leading-relaxed whitespace-pre-wrap">
                        {selectedTask.completionNote}
                      </p>
                    </div>
                  )}

                  <div>
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Proof of Work</h5>
                    {selectedTask.proofImage?.url ? (
                      <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-video relative group">
                        <img
                          src={selectedTask.proofImage.url}
                          alt="Proof of work"
                          className="w-full h-full object-cover"
                        />
                        <a
                          href={selectedTask.proofImage.url}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5"
                        >
                          <ImageIcon className="w-4 h-4" /> View Full Image
                        </a>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 border border-dashed border-gray-200 rounded-xl bg-gray-50 text-slate-400 text-center gap-1.5">
                        <ImageIcon className="w-5 h-5 text-gray-300" />
                        <p className="text-xs font-medium">No proof image provided</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-bold text-slate-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </SkeletonLoader>
  );
};
