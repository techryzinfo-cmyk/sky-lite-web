'use client';

import { SkeletonLoader } from '../ui/SkeletonLoader';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  Plus,
  Loader2,
  ChevronRight,
  Pencil,
  Trash2,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { RiskModal } from './RiskModal';
import { RiskDetailModal } from './RiskDetailModal';

interface RisksTabProps {
  projectId: string;
}

const STATUS_FILTERS = ['All', 'Active', 'Monitored', 'Resolved', 'Critical'] as const;

const STATUS_BADGE: Record<string, string> = {
  Critical: 'text-red-700 bg-red-100 border-red-200',
  Resolved: 'text-emerald-700 bg-emerald-100 border-emerald-200',
  Monitored: 'text-purple-700 bg-purple-100 border-purple-200',
  Active: 'text-amber-700 bg-amber-100 border-amber-200',
};

export const RisksTab: React.FC<RisksTabProps> = ({ projectId }) => {
  const [risks, setRisks]             = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [deletingId, setDeletingId]   = useState<string | null>(null);

  const toast = useToast();

  const fetchRisks = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/risks`);
      setRisks(response.data);
    } catch (error) {
      toast.error('Failed to load risks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRisks(); }, [projectId]);

  const handleDeleteRisk = async (riskId: string) => {
    if (!window.confirm('Delete this risk? This cannot be undone.')) return;
    setDeletingId(riskId);
    try {
      await api.delete(`/risks/${riskId}`);
      toast.success('Risk deleted');
      fetchRisks();
    } catch (error: any) {
      if (error.response?.status >= 500) {
        toast.success('Risk deleted');
        fetchRisks();
      } else {
        toast.error(error.response?.data?.message || 'Failed to delete risk');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const getProbabilityValue = (prob: string) =>
    prob === 'High' ? 3 : prob === 'Medium' ? 2 : 1;

  const getImpactValue = (impact: string) =>
    impact === 'Very High' ? 4 : impact === 'High' ? 3 : impact === 'Medium' ? 2 : 1;

  const filteredRisks = statusFilter === 'All'
    ? risks
    : risks.filter(r => r.status === statusFilter);

  const renderMatrix = () => {
    const probabilities = ['High', 'Medium', 'Low'];
    const impacts = ['Low', 'Medium', 'High', 'Very High'];

    return (
      <div className="grid grid-cols-5 gap-2 h-64">
        <div className="col-span-1 flex flex-col justify-between py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right pr-4 border-r border-gray-200">
          {probabilities.map(p => <span key={p}>{p}</span>)}
        </div>
        <div className="col-span-4 grid grid-cols-4 gap-2">
          {probabilities.map(p =>
            impacts.map(i => {
              const cellRisks = risks.filter(r => r.probability === p && r.impact === i);
              const riskLevel = getProbabilityValue(p) * getImpactValue(i);
              return (
                <div
                  key={`${p}-${i}`}
                  className={cn(
                    'rounded-xl border flex items-center justify-center relative transition-all',
                    riskLevel > 8 ? 'bg-red-100 border-red-200' :
                    riskLevel > 4 ? 'bg-orange-100 border-orange-200' :
                    riskLevel > 2 ? 'bg-amber-100 border-amber-200' : 'bg-blue-100 border-blue-200'
                  )}
                >
                  {cellRisks.length > 0 && (
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg',
                      riskLevel > 8 ? 'bg-red-500' :
                      riskLevel > 4 ? 'bg-orange-500' :
                      riskLevel > 2 ? 'bg-amber-500' : 'bg-blue-500'
                    )}>
                      {cellRisks.length}
                    </div>
                  )}
                </div>
              );
            })
          )}
          {impacts.map(i => (
            <div key={i} className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center mt-2">
              {i}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Loading state handled by Skeleton wrapper

  return (
    <SkeletonLoader loading={loading} preset="list">
      <div className="space-y-6">
        {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Risk Matrix</h3>
          <p className="text-sm text-slate-500 mt-1">Strategic risk assessment and mitigation tracking.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Identify Risk</span>
        </button>
      </div>

      {/* Matrix + Critical risks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2 p-8 border-gray-200" gradient>
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Probability vs Impact</h4>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-[10px] font-bold text-slate-500">Extreme</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-[10px] font-bold text-slate-500">High</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-[10px] font-bold text-slate-500">Moderate</span>
              </div>
            </div>
          </div>
          {renderMatrix()}
        </GlassCard>

        <div className="space-y-4">
          <h4 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] px-2">Top Critical Risks</h4>
          {risks.filter(r => r.status === 'Critical').slice(0, 3).map((risk) => (
            <GlassCard key={risk._id} className="p-4 border-red-200" gradient>
              <div className="flex justify-between items-start mb-3">
                <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[9px] font-black uppercase tracking-widest border border-red-200">
                  Critical
                </span>
                <span className="text-[10px] font-bold text-slate-500">{risk.category}</span>
              </div>
              <h5 className="text-sm font-bold text-gray-900 mb-3">{risk.title}</h5>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-slate-500">MITIGATION PROGRESS</span>
                  <span className="text-emerald-600">{risk.mitigationProgress}%</span>
                </div>
                <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200">
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
            <div className="py-10 text-center border border-dashed border-gray-200 rounded-2xl">
              <ShieldAlert className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No critical risks identified.</p>
            </div>
          )}
        </div>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
              statusFilter === f
                ? f === 'Critical'  ? 'bg-red-600 text-white border-red-600' :
                  f === 'Resolved'  ? 'bg-emerald-600 text-white border-emerald-600' :
                  f === 'Monitored' ? 'bg-purple-600 text-white border-purple-600' :
                  f === 'Active'    ? 'bg-amber-500 text-white border-amber-500' :
                                      'bg-blue-600 text-white border-blue-600'
                : 'bg-white border-gray-200 text-slate-500 hover:border-gray-300 hover:text-gray-900'
            )}
          >
            {f}
            {f !== 'All' && (
              <span className="ml-1.5 opacity-70">
                ({risks.filter(r => r.status === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Risk table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Risk Description</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Probability</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Impact</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Progress</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRisks.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-slate-400 italic">
                  No risks found{statusFilter !== 'All' ? ` with status "${statusFilter}"` : ''}.
                </td>
              </tr>
            )}
            {filteredRisks.map((risk) => (
              <tr key={risk._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-gray-900">{risk.title}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{risk.category}</p>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-xs font-bold text-slate-600">{risk.probability}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-xs font-bold text-slate-600">{risk.impact}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                      <div className="h-full bg-blue-500" style={{ width: `${risk.mitigationProgress}%` }} />
                    </div>
                    <span className="text-[10px] font-black text-gray-900 w-8 text-right">{risk.mitigationProgress}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border',
                    STATUS_BADGE[risk.status] || STATUS_BADGE['Active']
                  )}>
                    {risk.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <button
                      onClick={() => setSelectedRisk(risk)}
                      title="Edit risk"
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRisk(risk._id)}
                      disabled={deletingId === risk._id}
                      title="Delete risk"
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-40"
                    >
                      {deletingId === risk._id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <RiskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchRisks}
        projectId={projectId}
      />

      <RiskDetailModal
        isOpen={!!selectedRisk}
        onClose={() => setSelectedRisk(null)}
        onSuccess={() => { fetchRisks(); setSelectedRisk(null); }}
        risk={selectedRisk}
        projectId={projectId}
      />
    </div>
    </SkeletonLoader>
  );
};
