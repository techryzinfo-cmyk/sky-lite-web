'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Plus,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Target,
  Flag,
  MoreVertical
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
        <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20">
          <Plus className="w-4 h-4" />
          <span>New Milestone</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {milestones.map((milestone, i) => (
          <GlassCard key={milestone._id} className="p-6 border-gray-200 group hover:border-blue-500/50 transition-all" gradient>
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 rounded-2xl bg-blue-100 border border-blue-200">
                <Flag className="w-6 h-6 text-blue-600" />
              </div>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                milestone.status === 'Completed' ? 'text-emerald-700 bg-emerald-100 border-emerald-200' :
                milestone.status === 'Delayed' ? 'text-red-700 bg-red-100 border-red-200' :
                'text-blue-700 bg-blue-100 border-blue-200'
              )}>
                {milestone.status}
              </span>
            </div>

            <h4 className="text-lg font-bold text-gray-900 mb-2">{milestone.title}</h4>
            <p className="text-xs text-slate-500 line-clamp-2 mb-6">{milestone.description}</p>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-500">Target Date</span>
                </div>
                <span className="text-xs font-bold text-gray-900">{new Date(milestone.targetDate).toLocaleDateString()}</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <span>PROGRESS</span>
                  <span>{milestone.progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${milestone.progress}%` }}
                    className={cn(
                      "h-full rounded-full",
                      milestone.status === 'Completed' ? 'bg-emerald-500' :
                      milestone.status === 'Delayed' ? 'bg-red-500' : 'bg-blue-500'
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="flex -space-x-2">
                {[1, 2].map(u => (
                  <div key={u} className="w-6 h-6 rounded-lg bg-gray-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-500 uppercase">
                    M
                  </div>
                ))}
              </div>
              <button className="text-xs font-bold text-blue-600 hover:text-blue-500 flex items-center space-x-1">
                <span>Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </GlassCard>
        ))}

        {milestones.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-bold text-slate-500">No milestones set</h4>
            <p className="text-sm text-slate-400 max-w-xs mx-auto mt-1">Define key milestones to track the critical path of your project.</p>
          </div>
        )}
      </div>
    </div>
  );
};
