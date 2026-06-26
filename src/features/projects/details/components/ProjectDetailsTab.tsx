'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useProjectContext } from '@/features/projects/contexts/ProjectContext';
import { TeamManagementModal } from '@/features/projects/components/TeamManagementModal';
import { SendForSurveyModal } from '@/features/projects/site-survey/components/SendForSurveyModal';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthContext';
import { useSocket } from '@/providers/SocketContext';
import toast from 'react-hot-toast';
import {
  Map,
  Users,
  Compass,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  DollarSign,
  ChevronRight,
  User,
  X,
  Plus,
  Loader2,
  History,
  TrendingUp,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import api from '@/services/api.client';
import { motion } from 'framer-motion';

const formatCompact = (num: number) => {
  if (num == null || isNaN(num)) return '0';
  return Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);
};

export function ProjectDetailsTab() {
  const { project: typedProject, projectId, fetchProject } = useProjectContext();
  const project = typedProject as any;
  const { user } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [showBudgetHist, setShowBudgetHist] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Budget Action confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: (() => Promise<void>) | null;
    type: 'success' | 'destructive' | 'default';
  }>({
    visible: false,
    title: '',
    message: '',
    confirmText: '',
    onConfirm: null,
    type: 'default'
  });

  // Socket updates
  useEffect(() => {
    if (!socket || !fetchProject) return;
    
    const handleUpdate = () => {
      fetchProject();
    };

    socket.on('project:updated', handleUpdate);
    socket.on('budget:updated', handleUpdate);

    return () => {
      socket.off('project:updated', handleUpdate);
      socket.off('budget:updated', handleUpdate);
    };
  }, [socket, fetchProject]);

  if (!project) return null;

  const canApproveBudget = user?.role?.permissions?.includes('budget:approve') || user?.role?.permissions?.includes('*');
  const pendingRequests = project.budgetHistory?.filter((bh: any) => bh.approvalStatus === 'Pending') || [];

  const calculateDaysRemaining = () => {
    if (!project.endDate) return 'N/A';
    const end = new Date(project.endDate).getTime();
    const now = new Date().getTime();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleBudgetAction = (budgetId: string, action: 'Approved' | 'Rejected') => {
    setConfirmModal({
      visible: true,
      title: `${action === 'Approved' ? 'Approve' : 'Reject'} Budget Request`,
      message: `Are you sure you want to mark this budget request as ${action.toLowerCase()}?`,
      confirmText: action,
      type: action === 'Approved' ? 'success' : 'destructive',
      onConfirm: async () => {
        try {
          setIsProcessing(true);
          const res = await api.patch(`/projects/${project._id}/budget-action`, {
            budgetId,
            action,
          });

          if (res.status === 200 || res.status === 204) {
            toast.success(`Budget request ${action.toLowerCase()} successfully`);
            await fetchProject();
          } else {
            toast.error('Failed to update budget status');
          }
        } catch (e: any) {
          toast.error(e.response?.data?.message || 'Network error occurred');
        } finally {
          setIsProcessing(false);
          setConfirmModal((prev) => ({ ...prev, visible: false }));
        }
      },
    });
  };

  const daysRem = calculateDaysRemaining();

  return (
    <div className="space-y-6">
      {/* ── Active Site Survey Banner ── */}
      {project.siteSurveyor && project.status === 'Site Survey' && (
        <div className="flex items-center space-x-4 p-5 bg-blue-50 border border-blue-100 rounded-2xl">
          <div className="p-3 rounded-xl bg-white border border-blue-200 text-blue-600 shadow-sm shrink-0">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wider">Active Site Survey</h4>
            <p className="text-xs text-blue-600 mt-1">
              Assigned to <span className="font-extrabold text-blue-900">{(project.siteSurveyor as any).name || 'Site Surveyor'}</span>.
            </p>
          </div>
        </div>
      )}

      {/* ── Pending Budget Action Banner ── */}
      {canApproveBudget && pendingRequests.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-red-50 border border-red-100 rounded-2xl">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 rounded-xl bg-white border border-red-200 text-red-600 shadow-sm shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-800">Pending Budget Approvals ({pendingRequests.length})</h4>
              <p className="text-xs text-red-600 mt-1">
                There are active budget lifecycle change requests awaiting your approval.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowBudgetHist(true)}
            className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-500 transition-colors shadow-sm self-start sm:self-center"
          >
            <span>View Requests</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Under Snagging Banner ── */}
      {project.status === 'Under Snagging' && (
        <div className="flex items-center space-x-4 p-5 bg-amber-50 border border-amber-100 rounded-2xl">
          <div className="p-3 rounded-xl bg-white border border-amber-200 text-amber-600 shadow-sm shrink-0">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-800 uppercase tracking-wider">Project Under Snagging</h4>
            <p className="text-xs text-amber-600 mt-1">
              Quality assurance audits are ongoing. Check Handover tab for status.
            </p>
          </div>
        </div>
      )}

      {/* ── Snagging Completed Banner ── */}
      {project.status === 'Snagging Completed' && (
        <div className="flex items-center space-x-4 p-5 bg-emerald-50 border border-emerald-100 rounded-2xl">
          <div className="p-3 rounded-xl bg-white border border-emerald-200 text-emerald-600 shadow-sm shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-800 uppercase tracking-wider">Snagging Completed</h4>
            <p className="text-xs text-emerald-600 mt-1">
              The quality inspection phase is finished. Ready for handover operations.
            </p>
          </div>
        </div>
      )}

      {/* ── Bento Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Bento Card 1: Project Details Hero */}
        <GlassCard className="p-6 md:p-8 border-gray-200 lg:col-span-2 flex flex-col justify-between" gradient>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100">
                {project.status || 'Planning'}
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                {project.category?.name || 'General'}
              </span>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight mt-4">
              {project.name}
            </h2>
            <p className="text-slate-500 mt-3 text-sm leading-relaxed">
              {project.description || 'No description provided.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-100 rounded-2xl p-4 mt-8">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Start Date</span>
              <span className="text-sm font-bold text-slate-800 mt-1 block">
                {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Target Date</span>
              <span className="text-sm font-bold text-slate-800 mt-1 block">
                {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Bento Card 2: Total Budget */}
        <GlassCard
          onClick={() => setShowBudgetHist(true)}
          className="p-6 border-gray-200 flex flex-col justify-between hover:border-blue-500/30 hover:shadow-md cursor-pointer transition-all duration-300 group"
          gradient
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Budget</span>
              <History className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </div>
            
            <h3 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight mt-6">
              {project.currency || '$'}{' '}
              {formatCompact(project.budgetHistory?.[project.budgetHistory.length - 1]?.amount || 0)}
            </h3>
            <p className="text-xs text-slate-400 mt-2">Latest Approved Base Budget</p>
          </div>
          
          <div className="text-[10px] font-black text-blue-600 uppercase tracking-wider mt-6 group-hover:translate-x-1 transition-transform flex items-center space-x-1">
            <span>Budget Lifecycle</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </GlassCard>

        {/* Bento Card 3: Days Remaining */}
        <GlassCard className="p-6 border-gray-200 flex flex-col justify-between" gradient>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Days Remaining</span>
            
            <h3 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight mt-6">
              {daysRem !== 'N/A' ? `${daysRem} Days` : 'N/A'}
            </h3>
            <p className="text-xs text-slate-400 mt-2">Time Remaining Until Target Handover</p>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-400 mt-6">
            <Clock className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Scheduled Target</span>
          </div>
        </GlassCard>

        {/* Bento Card 4: Coordination Team */}
        <GlassCard className="p-6 border-gray-200 lg:col-span-2 flex flex-col justify-between" gradient>
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-slate-700" />
                <h3 className="text-base font-bold text-slate-900">Coordination Team</h3>
              </div>
              <button
                onClick={() => setIsTeamModalOpen(true)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 border border-blue-100 hover:border-blue-300 text-blue-600 rounded-xl text-xs font-black uppercase transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Manage</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Creator display */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-xs font-black text-white shrink-0">
                  {(project.createdBy?.name || 'S').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {project.createdBy?.name || 'Manager'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {project.createdBy?.email || 'admin@creator'}
                  </p>
                </div>
              </div>

              {/* Members display */}
              {project.members?.map((member: any, i: number) => {
                const u = member.user || member;
                const name = u.name || member.name || 'Member';
                const email = u.email || member.email || '—';
                return (
                  <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xs font-black text-blue-700 shrink-0">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{email}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* ── Budget History Modal ── */}
      {showBudgetHist && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-gray-200 max-w-lg w-full max-h-[80vh] flex flex-col p-6 shadow-2xl relative"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Budget Lifecycle</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">Historical log</p>
              </div>
              <button
                onClick={() => setShowBudgetHist(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {project.budgetHistory?.slice().reverse().map((bh: any, i: number) => {
                const badgeColor =
                  bh.approvalStatus === 'Approved'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    : bh.approvalStatus === 'Pending'
                    ? 'bg-amber-50 text-amber-600 border-amber-100'
                    : 'bg-red-50 text-red-600 border-red-100';

                return (
                  <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-extrabold text-blue-600">
                        {project.currency || '$'}{formatCompact(bh.amount)}
                      </span>
                      <span className={cn('text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border', badgeColor)}>
                        {bh.approvalStatus || 'Approved'}
                      </span>
                    </div>
                    
                    <p className="text-xs text-slate-600 leading-relaxed font-semibold">{bh.reason}</p>

                    {bh.approvalStatus === 'Pending' && canApproveBudget && (
                      <div className="flex items-center space-x-2 pt-2">
                        <button
                          onClick={() => handleBudgetAction(bh._id, 'Rejected')}
                          disabled={isProcessing}
                          className="flex-1 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleBudgetAction(bh._id, 'Approved')}
                          disabled={isProcessing}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1.5 disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <span>Approve</span>
                          )}
                        </button>
                      </div>
                    )}

                    <div className="border-t border-slate-200/50 pt-2 flex items-center justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>By: {bh.updatedByName || 'System'}</span>
                      <span>{new Date(bh.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
              {(!project.budgetHistory || project.budgetHistory.length === 0) && (
                <div className="text-center py-8 text-slate-400 text-xs font-medium">
                  No budget lifecycle updates recorded.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Confirmation Modal ── */}
      {confirmModal.visible && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <h4 className="text-base font-bold text-slate-900">{confirmModal.title}</h4>
            <p className="text-xs text-slate-500 leading-relaxed">{confirmModal.message}</p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, visible: false }))}
                disabled={isProcessing}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm || undefined}
                disabled={isProcessing}
                className={cn(
                  'px-4 py-2 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center space-x-1.5 disabled:opacity-50',
                  confirmModal.type === 'destructive'
                    ? 'bg-red-600 hover:bg-red-500'
                    : confirmModal.type === 'success'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-slate-900 hover:bg-slate-800'
                )}
              >
                {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{confirmModal.confirmText}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Original modally managed configurations */}
      <TeamManagementModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        onSuccess={fetchProject}
        projectId={projectId}
        currentMembers={project.members || []}
      />
    </div>
  );
}
