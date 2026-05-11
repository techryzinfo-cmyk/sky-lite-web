'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Plus,
  Loader2,
  Calendar,
  CheckCircle2,
  Clock,
  ImageIcon,
  ChevronRight,
  TrendingUp,
  Layout,
  MessageSquare,
  Camera,
  Activity,
  History
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { DPRModal } from './DPRModal';

interface DPRTabProps {
  projectId: string;
}

export const DPRTab: React.FC<DPRTabProps> = ({ projectId }) => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toast = useToast();

  const fetchReports = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/work-progress`);
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching DPRs:', error);
      toast.error('Failed to load progress reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [projectId]);

  const groupedReports = reports.reduce((acc: any, report: any) => {
    const date = report.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(report);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedReports).sort((a, b) => b.localeCompare(a));

  const latestProgress = reports.length > 0
    ? Math.max(...reports.map(r => r.progressPercent || 0))
    : 0;
  const activeDays = Object.keys(groupedReports).length;
  const avgProgress = reports.length > 0
    ? Math.round(reports.reduce((s, r) => s + (r.progressPercent || 0), 0) / reports.length)
    : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Syncing progress timeline...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Daily Progress Reports (DPR)</h3>
          <p className="text-sm text-slate-500 mt-1">Real-time site updates and milestone tracking.</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-4 mr-4 border-r border-gray-200 pr-6">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Reports</p>
              <p className="text-xl font-black text-gray-900">{reports.length}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Update</p>
              <p className="text-xl font-black text-blue-600">{reports[0] ? new Date(reports[0].createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Post Update</span>
          </button>
        </div>
      </div>

      {reports.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Latest Progress', value: `${latestProgress}%`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Avg Progress', value: `${avgProgress}%`, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Active Days', value: activeDays, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Total Reports', value: reports.length, icon: BarChart, color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map((s, i) => (
              <GlassCard key={i} className="p-5 border-gray-200" gradient>
                <div className={`inline-flex p-2.5 rounded-xl ${s.bg} mb-3`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              </GlassCard>
            ))}
          </div>

          {/* Progress Over Time Chart */}
          {(() => {
            const chartData = [...reports]
              .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
              .map(r => ({ pct: r.progressPercent || 0, label: new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) }));

            const W = 600, H = 160, PAD_L = 36, PAD_R = 16, PAD_T = 12, PAD_B = 28;
            const innerW = W - PAD_L - PAD_R;
            const innerH = H - PAD_T - PAD_B;
            const n = chartData.length;

            const xOf = (i: number) => PAD_L + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
            const yOf = (pct: number) => PAD_T + innerH - (pct / 100) * innerH;

            const polyline = chartData.map((d, i) => `${xOf(i)},${yOf(d.pct)}`).join(' ');
            const areaPath = n > 0
              ? `M${xOf(0)},${yOf(chartData[0].pct)} ` +
                chartData.slice(1).map((d, i) => `L${xOf(i + 1)},${yOf(d.pct)}`).join(' ') +
                ` L${xOf(n - 1)},${PAD_T + innerH} L${xOf(0)},${PAD_T + innerH} Z`
              : '';

            const yTicks = [0, 25, 50, 75, 100];

            return (
              <GlassCard className="p-6 border-gray-200" gradient>
                <div className="flex items-center space-x-3 mb-5">
                  <div className="p-2 rounded-xl bg-blue-50 border border-blue-200">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Progress Over Time</h4>
                    <p className="text-[10px] text-slate-500">Completion % across all reports</p>
                  </div>
                </div>
                <div className="w-full overflow-x-auto">
                  <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 280 }}>
                    <defs>
                      <linearGradient id="progressGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Y grid lines + labels */}
                    {yTicks.map(tick => {
                      const y = yOf(tick);
                      return (
                        <g key={tick}>
                          <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray={tick === 0 ? '0' : '3 3'} />
                          <text x={PAD_L - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#94a3b8" fontWeight="700">{tick}</text>
                        </g>
                      );
                    })}

                    {/* Area fill */}
                    {n > 1 && <path d={areaPath} fill="url(#progressGrad)" />}

                    {/* Line */}
                    {n > 1 && (
                      <polyline points={polyline} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                    )}

                    {/* Data points + x-labels */}
                    {chartData.map((d, i) => (
                      <g key={i}>
                        <circle cx={xOf(i)} cy={yOf(d.pct)} r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
                        {(n <= 8 || i % Math.ceil(n / 8) === 0) && (
                          <text x={xOf(i)} y={H - 4} textAnchor="middle" fontSize="8" fill="#94a3b8" fontWeight="600">{d.label}</text>
                        )}
                      </g>
                    ))}
                  </svg>
                </div>
              </GlassCard>
            );
          })()}
        </>
      )}

      <div className="relative space-y-12">
        <div className="absolute left-8 md:left-12 top-2 bottom-0 w-px bg-gradient-to-b from-blue-400 via-gray-200 to-transparent" />

        {sortedDates.map((date) => (
          <div key={date} className="relative pl-20 md:pl-32">
            <div className="absolute left-0 top-1 flex flex-col items-center">
              <div className="w-16 md:w-24 py-2 rounded-xl bg-white border border-gray-200 text-center shadow-sm">
                <p className="text-[10px] font-black text-blue-600 uppercase">{new Date(date).toLocaleString('default', { month: 'short' })}</p>
                <p className="text-xl font-black text-gray-900">{new Date(date).getDate()}</p>
                <p className="text-[8px] font-bold text-slate-500 uppercase">{new Date(date).getFullYear()}</p>
              </div>
              <div className="w-3 h-3 rounded-full bg-blue-500 border-4 border-white mt-4 z-10" />
            </div>

            <div className="space-y-4">
              {groupedReports[date].map((report: any) => (
                <GlassCard key={report._id} className="p-6 border-gray-200 group hover:border-blue-500/50 transition-all" gradient>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center space-x-3">
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 border border-blue-200 text-[9px] font-black text-blue-700 uppercase tracking-widest">
                          {report.milestoneName || 'General'}
                        </span>
                        <div className="flex items-center space-x-1 text-[10px] font-bold text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      <h4 className="text-lg font-bold text-gray-900 leading-relaxed">{report.description}</h4>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                            {report.loggedByName?.charAt(0) || 'U'}
                          </div>
                          <span className="text-xs font-bold text-slate-500">{report.loggedByName}</span>
                        </div>
                        {report.photos?.length > 0 && (
                          <div className="flex items-center space-x-1 text-blue-600">
                            <ImageIcon className="w-4 h-4" />
                            <span className="text-xs font-bold">{report.photos.length} Photos</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Progress</p>
                        <p className="text-3xl font-black text-blue-600 leading-none">{report.progressPercent}%</p>
                      </div>
                      <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${report.progressPercent}%` }}
                          className="h-full bg-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {report.photos?.length > 0 && (
                    <div className="mt-6 flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                      {report.photos.map((photo: string, i: number) => (
                        <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                          <img src={photo} alt="Progress" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              ))}
            </div>
          </div>
        ))}

        {reports.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="p-8 rounded-full bg-gray-100 border border-gray-200 mb-6 text-gray-400">
              <History className="w-16 h-16" />
            </div>
            <h3 className="text-xl font-bold text-slate-500 mb-2">No updates posted yet</h3>
            <p className="text-slate-400 max-w-sm">Capture daily site progress to keep stakeholders informed and track project momentum.</p>
          </div>
        )}
      </div>

      <DPRModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchReports}
        projectId={projectId}
      />
    </div>
  );
};
