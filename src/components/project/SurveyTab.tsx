'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardCheck, 
  Plus, 
  Loader2, 
  Map, 
  Zap, 
  Droplets, 
  Mountain, 
  MessageSquare, 
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  User,
  Calendar,
  MoreVertical,
  DollarSign
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { SurveyModal } from './SurveyModal';

interface SurveyTabProps {
  projectId: string;
}

export const SurveyTab: React.FC<SurveyTabProps> = ({ projectId }) => {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const toast = useToast();

  const fetchSurveys = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/survey`);
      setSurveys(response.data);
    } catch (error) {
      console.error('Error fetching surveys:', error);
      toast.error('Failed to load site surveys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, [projectId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Needs Attention': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'Draft': return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
      default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Loading terrain data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">Site Surveys & Audits</h3>
          <p className="text-sm text-slate-400 mt-1">Pre-construction assessments and site verification reports.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Survey</span>
        </button>
      </div>

      {/* Survey List */}
      <div className="grid grid-cols-1 gap-4">
        {surveys.map((survey) => (
          <GlassCard key={survey._id} className="p-6 border-white/5 group hover:border-blue-500/30 transition-all cursor-pointer" gradient>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex flex-1 items-start space-x-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Map className="w-8 h-8 text-blue-400" />
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                      getStatusColor(survey.status)
                    )}>
                      {survey.status}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Accessibility: {survey.accessibility}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                    {survey.terrainNotes || 'Site Assessment Report'}
                  </h4>
                  
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-500">
                      <Zap className={cn("w-3 h-3", survey.powerAvailable ? "text-amber-400" : "text-slate-700")} />
                      <span>Power: {survey.powerAvailable ? 'Available' : 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-500">
                      <Droplets className={cn("w-3 h-3", survey.waterAvailable ? "text-blue-400" : "text-slate-700")} />
                      <span>Water: {survey.waterAvailable ? 'Available' : 'N/A'}</span>
                    </div>
                    {survey.affectsBudget && (
                      <div className="flex items-center space-x-2 text-[10px] font-bold text-red-400">
                        <DollarSign className="w-3 h-3" />
                        <span>Budget Impact Identified</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:items-end justify-between gap-4 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-white leading-tight">{survey.surveyor?.name || 'Assigned Surveyor'}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{new Date(survey.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center text-xs font-bold text-slate-400 uppercase">
                    {survey.surveyor?.name?.charAt(0) || 'S'}
                  </div>
                </div>
                <button className="flex items-center space-x-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
                  <span>View Full Audit</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </GlassCard>
        ))}

        {surveys.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
            <div className="p-6 rounded-full bg-slate-900/50 border border-white/5 mb-6">
              <ClipboardCheck className="w-12 h-12 text-slate-700" />
            </div>
            <h3 className="text-xl font-bold text-slate-500 mb-2">No surveys recorded yet</h3>
            <p className="text-slate-600 max-w-sm">Site surveys are essential for pre-construction planning. Record your first audit to get started.</p>
          </div>
        )}
      </div>

      <SurveyModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchSurveys}
        projectId={projectId}
      />
    </div>
  );
};
