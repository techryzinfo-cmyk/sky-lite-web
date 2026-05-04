'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, 
  Plus, 
  Loader2, 
  Info, 
  ChevronRight,
  User,
  Activity,
  Target,
  BarChart3
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';

interface RisksTabProps {
  projectId: string;
}

export const RisksTab: React.FC<RisksTabProps> = ({ projectId }) => {
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const toast = useToast();

  const fetchRisks = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/risks`);
      setRisks(response.data);
    } catch (error) {
      console.error('Error fetching risks:', error);
      toast.error('Failed to load risks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRisks();
  }, [projectId]);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Very High': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-amber-500';
      default: return 'bg-blue-500';
    }
  };

  const getProbabilityValue = (prob: string) => {
    switch (prob) {
      case 'High': return 3;
      case 'Medium': return 2;
      default: return 1;
    }
  };

  const getImpactValue = (impact: string) => {
    switch (impact) {
      case 'Very High': return 4;
      case 'High': return 3;
      case 'Medium': return 2;
      default: return 1;
    }
  };

  // Matrix Grid (Probability vs Impact)
  const renderMatrix = () => {
    const probabilities = ['High', 'Medium', 'Low'];
    const impacts = ['Low', 'Medium', 'High', 'Very High'];

    return (
      <div className="grid grid-cols-5 gap-2 h-64">
        {/* Y-Axis Label (Probability) */}
        <div className="col-span-1 flex flex-col justify-between py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right pr-4 border-r border-white/5">
          {probabilities.map(p => <span key={p}>{p}</span>)}
        </div>
        
        {/* Matrix Cells */}
        <div className="col-span-4 grid grid-cols-4 gap-2">
          {probabilities.map(p => (
            impacts.map(i => {
              const cellRisks = risks.filter(r => r.probability === p && r.impact === i);
              const riskLevel = getProbabilityValue(p) * getImpactValue(i);
              
              return (
                <div 
                  key={`${p}-${i}`}
                  className={cn(
                    "rounded-xl border flex items-center justify-center relative group transition-all",
                    riskLevel > 8 ? "bg-red-500/10 border-red-500/20" :
                    riskLevel > 4 ? "bg-orange-500/10 border-orange-500/20" :
                    riskLevel > 2 ? "bg-amber-500/10 border-amber-500/20" : "bg-blue-500/10 border-blue-500/20"
                  )}
                >
                  {cellRisks.length > 0 && (
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg",
                      riskLevel > 8 ? "bg-red-500" :
                      riskLevel > 4 ? "bg-orange-500" :
                      riskLevel > 2 ? "bg-amber-500" : "bg-blue-500"
                    )}>
                      {cellRisks.length}
                    </div>
                  )}
                </div>
              );
            })
          ))}
          {/* X-Axis Labels (Impact) */}
          {impacts.map(i => (
            <div key={i} className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center mt-2">
              {i}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Calculating risk vectors...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">Risk Matrix</h3>
          <p className="text-sm text-slate-400 mt-1">Strategic risk assessment and mitigation tracking.</p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20">
          <Plus className="w-4 h-4" />
          <span>Identify Risk</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Matrix Visualization */}
        <GlassCard className="lg:col-span-2 p-8 border-white/5" gradient>
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Probability vs Impact</h4>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-[10px] font-bold text-slate-500">Extreme</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <span className="text-[10px] font-bold text-slate-500">High</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-[10px] font-bold text-slate-500">Moderate</span>
              </div>
            </div>
          </div>
          {renderMatrix()}
        </GlassCard>

        {/* Top Risks */}
        <div className="space-y-4">
          <h4 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] px-2">Top Critical Risks</h4>
          {risks.filter(r => r.status === 'Critical').slice(0, 3).map((risk) => (
            <GlassCard key={risk._id} className="p-4 border-red-500/20" gradient>
              <div className="flex justify-between items-start mb-3">
                <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 text-[9px] font-black uppercase tracking-widest border border-red-500/20">
                  Critical
                </span>
                <span className="text-[10px] font-bold text-slate-500">{risk.category}</span>
              </div>
              <h5 className="text-sm font-bold text-white mb-3">{risk.title}</h5>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-slate-500">MITIGATION PROGRESS</span>
                  <span className="text-emerald-400">{risk.mitigationProgress}%</span>
                </div>
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${risk.mitigationProgress}%` }}
                    className="h-full bg-emerald-500"
                  />
                </div>
              </div>
            </GlassCard>
          ))}

          {risks.filter(r => r.status === 'Critical').length === 0 && (
            <div className="py-10 text-center border border-dashed border-white/5 rounded-2xl">
              <ShieldAlert className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-600">No critical risks identified.</p>
            </div>
          )}
        </div>
      </div>

      {/* Risks List */}
      <div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-900/20">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Risk Description</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Probability</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Impact</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Progress</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody>
            {risks.map((risk) => (
              <tr key={risk._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-white">{risk.title}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{risk.category}</p>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-xs font-bold text-slate-400">{risk.probability}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-xs font-bold text-slate-400">{risk.impact}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${risk.mitigationProgress}%` }} />
                    </div>
                    <span className="text-[10px] font-black text-white">{risk.mitigationProgress}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                    risk.status === 'Critical' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 
                    risk.status === 'Resolved' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 
                    'text-amber-400 bg-amber-500/10 border-amber-500/20'
                  )}>
                    {risk.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-slate-500 hover:text-white transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
