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

  // Group reports by date
  const groupedReports = reports.reduce((acc: any, report: any) => {
    const date = report.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(report);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedReports).sort((a, b) => b.localeCompare(a));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Syncing progress timeline...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-bold text-white">Daily Progress Reports (DPR)</h3>
          <p className="text-sm text-slate-400 mt-1">Real-time site updates and milestone tracking.</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-4 mr-4 border-r border-white/10 pr-6">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Reports</p>
              <p className="text-xl font-black text-white">{reports.length}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Update</p>
              <p className="text-xl font-black text-blue-400">{reports[0] ? new Date(reports[0].createdAt).toLocaleDateString() : 'N/A'}</p>
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

      {/* Timeline View */}
      <div className="relative space-y-12">
        {/* Timeline Stem */}
        <div className="absolute left-8 md:left-12 top-2 bottom-0 w-px bg-gradient-to-b from-blue-500 via-slate-800 to-transparent" />

        {sortedDates.map((date) => (
          <div key={date} className="relative pl-20 md:pl-32">
            {/* Date Indicator */}
            <div className="absolute left-0 top-1 flex flex-col items-center">
              <div className="w-16 md:w-24 py-2 rounded-xl bg-slate-900 border border-white/5 text-center shadow-xl">
                <p className="text-[10px] font-black text-blue-500 uppercase">{new Date(date).toLocaleString('default', { month: 'short' })}</p>
                <p className="text-xl font-black text-white">{new Date(date).getDate()}</p>
                <p className="text-[8px] font-bold text-slate-500 uppercase">{new Date(date).getFullYear()}</p>
              </div>
              <div className="w-3 h-3 rounded-full bg-blue-500 border-4 border-[#0F172A] mt-4 z-10" />
            </div>

            {/* Reports for this date */}
            <div className="space-y-4">
              {groupedReports[date].map((report: any) => (
                <GlassCard key={report._id} className="p-6 border-white/5 group hover:border-white/10 transition-all" gradient>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center space-x-3">
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[9px] font-black text-blue-400 uppercase tracking-widest">
                          {report.milestoneName || 'General'}
                        </span>
                        <div className="flex items-center space-x-1 text-[10px] font-bold text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      
                      <h4 className="text-lg font-bold text-white leading-relaxed">{report.description}</h4>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                            {report.loggedByName?.charAt(0) || 'U'}
                          </div>
                          <span className="text-xs font-bold text-slate-500">{report.loggedByName}</span>
                        </div>
                        {report.photos?.length > 0 && (
                          <div className="flex items-center space-x-1 text-blue-400">
                            <ImageIcon className="w-4 h-4" />
                            <span className="text-xs font-bold">{report.photos.length} Photos</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Progress</p>
                        <p className="text-3xl font-black text-blue-400 leading-none">{report.progressPercent}%</p>
                      </div>
                      <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${report.progressPercent}%` }}
                          className="h-full bg-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Photo Preview Strip */}
                  {report.photos?.length > 0 && (
                    <div className="mt-6 flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                      {report.photos.map((photo: string, i: number) => (
                        <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-white/10 shrink-0">
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
            <div className="p-8 rounded-full bg-slate-900/50 border border-white/5 mb-6 text-slate-700">
              <History className="w-16 h-16" />
            </div>
            <h3 className="text-xl font-bold text-slate-500 mb-2">No updates posted yet</h3>
            <p className="text-slate-600 max-w-sm">Capture daily site progress to keep stakeholders informed and track project momentum.</p>
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
