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
      const payload = response.data;
      const normalized = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.surveys)
        ? payload.surveys
        : Array.isArray(payload?.data)
        ? payload.data
        : [];
      setSurveys(normalized);
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
      case 'Approved': return 'text-emerald-700 bg-emerald-100 border-emerald-200';
      case 'Needs Attention': return 'text-amber-700 bg-amber-100 border-amber-200';
      case 'Draft': return 'text-slate-600 bg-gray-100 border-gray-200';
      default: return 'text-blue-700 bg-blue-100 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading terrain data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Site Surveys & Audits</h3>
          <p className="text-sm text-slate-500 mt-1">Pre-construction assessments and site verification reports.</p>
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
        {Array.isArray(surveys) && surveys.map((survey) => (
          <GlassCard key={survey._id} className="p-6 border-gray-200 group hover:border-blue-500/50 transition-all cursor-pointer" gradient>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex flex-1 items-start space-x-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
                  <Map className="w-8 h-8 text-blue-600" />
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
                  <h4 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {survey.terrainNotes || 'Site Assessment Report'}
                  </h4>

                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-500">
                      <Zap className={cn("w-3 h-3", survey.powerAvailable ? "text-amber-500" : "text-gray-300")} />
                      <span>Power: {survey.powerAvailable ? 'Available' : 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-500">
                      <Droplets className={cn("w-3 h-3", survey.waterAvailable ? "text-blue-500" : "text-gray-300")} />
                      <span>Water: {survey.waterAvailable ? 'Available' : 'N/A'}</span>
                    </div>
                    {survey.affectsBudget && (
                      <div className="flex items-center space-x-2 text-[10px] font-bold text-red-600">
                        <DollarSign className="w-3 h-3" />
                        <span>Budget Impact Identified</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:items-end justify-between gap-4 border-t md:border-t-0 border-gray-100 pt-4 md:pt-0">
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 leading-tight">{survey.surveyor?.name || 'Assigned Surveyor'}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{new Date(survey.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-slate-500 uppercase">
                    {survey.surveyor?.name?.charAt(0) || 'S'}
                  </div>
                </div>
                <button className="flex items-center space-x-2 text-xs font-bold text-blue-600 hover:text-blue-500 transition-colors">
                  <span>View Full Audit</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </GlassCard>
        ))}

        {surveys.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-gray-200 rounded-[2rem]">
            <div className="p-6 rounded-full bg-gray-100 border border-gray-200 mb-6">
              <ClipboardCheck className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-500 mb-2">No surveys recorded yet</h3>
            <p className="text-slate-400 max-w-sm">Site surveys are essential for pre-construction planning. Record your first audit to get started.</p>
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
