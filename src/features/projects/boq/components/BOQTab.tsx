'use client';

import { SkeletonLoader } from '@/components/skeletons/SkeletonLoader';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Edit2, Trash2, History, Download, Upload,
  CheckCircle2, Loader2, GitBranch, FileText,
  DollarSign, ChevronLeft, Clock, Send, XCircle, RefreshCw,
  TrendingUp, BarChart3, ChevronRight,
} from 'lucide-react';
import { BOQItem } from '@/types';
import api from '@/services/api.client';
import { useToast } from '@/providers/ToastContext';
import { useAuth } from '@/providers/AuthContext';
import { useSocket } from '@/providers/SocketContext';
import { cn } from '@/lib/utils';
import { BOQModal } from '@/features/projects/boq/components/BOQModal';
import { BOQImportModal } from '@/features/projects/boq/components/BOQImportModal';
import { BOQHistoryModal } from '@/features/projects/boq/components/BOQHistoryModal';
import { BOQApproversModal } from '@/features/projects/boq/components/BOQApproversModal';

interface BOQTabProps {
  projectId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Status types match mobile exactly: Draft, Pending, Approved, Rejected
// ─────────────────────────────────────────────────────────────────────────────
type StatusKey = 'Draft' | 'Pending' | 'Approved' | 'Rejected';

const STATUS_STYLES: Record<StatusKey, {
  badge: string;
  row: string;
  dot: string;
  icon: React.ElementType;
}> = {
  Draft:    { badge: 'bg-slate-100 text-slate-600 border-slate-200',          row: '',                  dot: 'bg-slate-400',   icon: FileText },
  Pending:  { badge: 'bg-amber-50 text-amber-700 border-amber-200',           row: 'bg-amber-50/30',    dot: 'bg-amber-500',   icon: Clock },
  Approved: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',     row: 'bg-emerald-50/20',  dot: 'bg-emerald-500', icon: CheckCircle2 },
  Rejected: { badge: 'bg-red-50 text-red-700 border-red-200',                 row: 'bg-red-50/20',      dot: 'bg-red-500',     icon: XCircle },
};

// ─── Reusable Status Badge ────────────────────────────────────────────────────
const StatusBadge = ({ status, size = 'sm' }: { status: string; size?: 'xs' | 'sm' }) => {
  const s = STATUS_STYLES[status as StatusKey] ?? STATUS_STYLES.Draft;
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full font-semibold border whitespace-nowrap',
      size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
      s.badge
    )}>
      <span className={cn('rounded-full flex-shrink-0', size === 'xs' ? 'w-1 h-1' : 'w-1.5 h-1.5', s.dot)} />
      {status}
    </span>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({
  label, value, icon: Icon, accent, bg, sub,
}: { label: string; value: string | number; icon: React.ElementType; accent: string; bg: string; sub?: string }) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 flex items-center gap-3 sm:gap-4 min-w-0">
    <div className={cn('w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0', bg)}>
      <Icon className={cn('w-5 h-5', accent)} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{label}</p>
      <p className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5 leading-none truncate">{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// Custom skeleton removed in favor of boneyard-js
// ─── Helper to get group's overall status ────────────────────────────────────
const getGroupStatus = (groupItems: BOQItem[]): StatusKey => {
  if (groupItems.every(i => i.status === 'Approved')) return 'Approved';
  if (groupItems.some(i => i.status === 'Rejected'))  return 'Rejected';
  if (groupItems.some(i => i.status === 'Pending'))   return 'Pending';
  return 'Draft';
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export const BOQTab: React.FC<BOQTabProps> = ({ projectId }) => {
  const [items, setItems]                   = useState<BOQItem[]>([]);
  const [loading, setLoading]               = useState(true);
  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedItem, setSelectedItem]     = useState<BOQItem | null>(null);
  const [historyItem, setHistoryItem]       = useState<BOQItem | null>(null);
  const [approversItem, setApproversItem]   = useState<BOQItem | null>(null);
  const [searchQuery, setSearchQuery]       = useState('');
  const [statusFilter, setStatusFilter]     = useState<string>('All');
  const [isNewVersion, setIsNewVersion]     = useState(false);
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const toast      = useToast();
  const { user }   = useAuth();
  const { socket } = useSocket();

  // ── Permissions (mirror mobile's isAdmin / canApprove) ──────────────────
  const isAdmin    = (user?.role as any)?.name === 'Admin' || (user?.role as any)?.permissions?.includes('*');
  const canApprove = isAdmin || (user?.role as any)?.permissions?.includes('boq:approve');
  const canUpdate  = isAdmin || (user?.role as any)?.permissions?.includes('boq:update');
  const canDelete  = isAdmin || (user?.role as any)?.permissions?.includes('boq:delete');
  const canCreate  = isAdmin || (user?.role as any)?.permissions?.includes('boq:create');

  // ── Fetch BOQ ────────────────────────────────────────────────────────────
  const fetchBOQ = useCallback(async () => {
    try {
      const res = await api.get(`/projects/${projectId}/boq`);
      const data: BOQItem[] = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
      setItems(data);
    } catch {
      toast.error('Failed to load BOQ items');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchBOQ(); }, [fetchBOQ]);

  // ✅ Real-time: mirrors mobile socket.on('boq:updated', fetchBOQ)
  useEffect(() => {
    if (!socket) return;
    socket.on('boq:updated', fetchBOQ);
    return () => { socket.off('boq:updated', fetchBOQ); };
  }, [socket, fetchBOQ]);

  // ── Derived data ─────────────────────────────────────────────────────────
  const groupedItems = items.reduce((acc: Record<string, BOQItem[]>, item) => {
    if (!acc[item.groupName]) acc[item.groupName] = [];
    acc[item.groupName].push(item);
    return acc;
  }, {});

  const totalBOQAmount = items.reduce((s, i) => s + ((i as any).effectiveTotalCost !== undefined ? (i as any).effectiveTotalCost : (i.totalCost || 0)), 0);
  const pendingCount   = items.filter(i => i.status === 'Pending').length;
  const approvedCount  = items.filter(i => i.status === 'Approved').length;
  const existingGroups = [...new Set(items.map(i => i.groupName))];

  const filteredGroups = Object.keys(groupedItems).filter(g => {
    const matchSearch = g.toLowerCase().includes(searchQuery.toLowerCase()) ||
      groupedItems[g].some(i => i.itemDescription.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchStatus = statusFilter === 'All' || getGroupStatus(groupedItems[g]) === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleDeleteGroup = async (groupItems: BOQItem[], e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete all ${groupItems.length} items in "${groupItems[0]?.groupName}"?`)) return;
    try {
      await Promise.all(groupItems.map(i => api.delete(`/projects/${projectId}/boq/${i._id}`)));
      toast.success('Group deleted');
      if (selectedGroupName === groupItems[0]?.groupName) setSelectedGroupName(null);
      fetchBOQ();
    } catch { toast.error('Failed to delete group'); }
  };

  const handleDeleteItem = async (item: BOQItem) => {
    if (!window.confirm(`Delete "${item.itemDescription}"?`)) return;
    try {
      await api.delete(`/projects/${projectId}/boq/${item._id}`);
      toast.success('Item deleted');
      fetchBOQ();
    } catch { toast.error('Failed to delete item'); }
  };

  const bulkUpdateGroup = async (status: 'Approved' | 'Rejected') => {
    if (!selectedGroupName) return;
    const ids = (groupedItems[selectedGroupName] || []).map(i => i._id!);
    setIsBulkUpdating(true);
    try {
      await api.patch(`/projects/${projectId}/boq/bulk-status`, { itemIds: ids, status });
      toast.success(`All items ${status.toLowerCase()}`);
      fetchBOQ();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setIsBulkUpdating(false); }
  };

  // ✅ Per-item status update — mirrors mobile's handleUpdateStatus()
  // Calls PATCH /projects/:id/boq/:itemId/status (not the bulk endpoint)
  const handleUpdateItemStatus = async (item: BOQItem, status: 'Approved' | 'Rejected') => {
    if (status === 'Rejected') {
      const reason = window.prompt('Reason for rejection (required):');
      if (!reason?.trim()) { toast.error('Rejection reason is required'); return; }
      setUpdatingItemId(item._id);
      try {
        await api.patch(`/projects/${projectId}/boq/${item._id}/status`, { status, rejectionReason: reason.trim() });
        toast.success('Item rejected');
        fetchBOQ();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to reject');
      } finally { setUpdatingItemId(null); }
      return;
    }
    setUpdatingItemId(item._id);
    try {
      await api.patch(`/projects/${projectId}/boq/${item._id}/status`, { status });
      toast.success('Item approved');
      fetchBOQ();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally { setUpdatingItemId(null); }
  };

  const handleExportCSV = () => {
    const headers = ['Group Name', 'Item Number', 'Item Description', 'Unit', 'Quantity', 'Unit Cost', 'Total Cost', 'Status', 'Version'];
    const rows = items.map(i => [
      i.groupName, i.itemNumber || '', i.itemDescription,
      i.unit || '', i.quantity, i.unitCost, i.totalCost, i.status, (i as any).version || 1,
    ]);
    const csv = [headers, ...rows].map(r =>
      r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `BOQ_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // Loading state handled by Skeleton wrapper

  // ──────────────────────────────────────────────────────────────────────────
  // DETAIL VIEW — group drill-down
  // ──────────────────────────────────────────────────────────────────────────
  if (selectedGroupName && groupedItems[selectedGroupName]) {
    const detailItems    = groupedItems[selectedGroupName];
    const detailTotal    = detailItems.reduce((s, i) => s + ((i as any).effectiveTotalCost !== undefined ? (i as any).effectiveTotalCost : (i.totalCost || 0)), 0);
    const detailVersion  = Math.max(...detailItems.map(i => (i as any).version || 1));
    const groupStatus    = getGroupStatus(detailItems);
    const approvedItems  = detailItems.filter(i => i.status === 'Approved');
    const pendingItems   = detailItems.filter(i => i.status === 'Pending');
    const progress       = detailItems.length > 0 ? (approvedItems.length / detailItems.length) * 100 : 0;
    const allApproved    = groupStatus === 'Approved';

    return (
      <SkeletonLoader loading={loading} preset="table">
        <div className="space-y-5 pb-20 sm:pb-6">

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-1.5 text-sm">
          <button
            onClick={() => setSelectedGroupName(null)}
            className="flex items-center gap-1 font-semibold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Bill of Quantities</span>
          </button>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="font-bold text-gray-900 truncate max-w-[180px] sm:max-w-xs">{selectedGroupName}</span>
        </nav>

        {/* ── Hero header ── */}
        <div className="rounded-2xl overflow-hidden shadow-lg shadow-blue-600/10">
          <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 px-5 sm:px-6 pt-6 pb-5 text-white">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mb-1">Bill of Quantities</p>
                <h2 className="text-xl sm:text-2xl font-black leading-tight">{selectedGroupName}</h2>
              </div>
              <StatusBadge status={groupStatus} />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { label: 'Items',       value: detailItems.length,                           icon: BarChart3 },
                { label: 'Total Value', value: `$${detailTotal.toLocaleString('en-IN')}`,   icon: DollarSign },
                { label: 'Version',     value: `v${detailVersion}`,                          icon: GitBranch },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 text-center">
                  <Icon className="w-3.5 h-3.5 opacity-60 mx-auto mb-1" />
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-wider opacity-70 mb-0.5">{label}</p>
                  <p className="font-black text-sm sm:text-base leading-tight truncate">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Approval progress bar */}
          <div className="bg-white border-x border-b border-gray-200 px-5 sm:px-6 py-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-600">Approval Progress</span>
              <span className="font-bold text-gray-900">
                {approvedItems.length} / {detailItems.length} approved
                {pendingItems.length > 0 && (
                  <span className="ml-2 text-amber-600">· {pendingItems.length} pending</span>
                )}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── Toolbar row ── */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-500">
            {detailItems.length} item{detailItems.length !== 1 ? 's' : ''}
          </p>
          {canCreate && (
            <button
              onClick={() => { setSelectedItem(null); setIsNewVersion(false); setIsModalOpen(true); }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 transition-all shadow-sm shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              Add Items
            </button>
          )}
        </div>

        {/* ───────────────────────────────────────────────────────────────────
            DESKTOP TABLE — hidden on mobile
        ─────────────────────────────────────────────────────────────────── */}
        <div className="hidden sm:block overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
          <table className="min-w-full text-sm bg-white">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="w-10 px-4 py-3.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">#</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Item No.</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[200px]">Item Description</th>
                <th className="px-4 py-3.5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit</th>
                <th className="px-4 py-3.5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity</th>
                <th className="px-4 py-3.5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Cost</th>
                <th className="px-4 py-3.5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Cost</th>
                <th className="px-4 py-3.5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-4 py-3.5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {detailItems.map((item, idx) => {
                const isUpdating      = updatingItemId === item._id;
                const isTargetApprover = String(user?.id || user?._id) === String((item as any).requestedApprover);
                const canApproveThis  = canApprove || isTargetApprover;
                const rowStyle        = STATUS_STYLES[item.status as StatusKey]?.row ?? '';

                return (
                  <tr key={item._id} className={cn('transition-colors group hover:bg-blue-50/40', rowStyle)}>
                    {/* # */}
                    <td className="px-4 py-3.5 text-slate-400 text-xs font-mono">{idx + 1}</td>

                    {/* Item Number */}
                    <td className="px-4 py-3.5">
                      {item.itemNumber
                        ? <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">{item.itemNumber}</span>
                        : <span className="text-slate-300 text-xs">—</span>}
                    </td>

                    {/* Item Description + remark + approver info */}
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-gray-900 leading-snug">{item.itemDescription}</p>
                      {item.remark && (
                        <p className="text-xs text-slate-400 italic mt-0.5 truncate max-w-xs">{item.remark}</p>
                      )}
                      {item.status === 'Pending' && (item as any).requestedApproverName && (
                        <p className="text-[10px] text-amber-600 font-semibold mt-0.5">
                          ↗ Awaiting: {(item as any).requestedApproverName}
                        </p>
                      )}
                    </td>

                    {/* Unit */}
                    <td className="px-4 py-3.5 text-center text-slate-500 text-xs">{item.unit || '—'}</td>

                    {/* Quantity */}
                    <td className="px-4 py-3.5 text-right font-semibold text-gray-900">
                      {Number(item.quantity).toLocaleString('en-IN')}
                    </td>

                    {/* Unit Cost */}
                    <td className="px-4 py-3.5 text-right text-slate-600">
                      ${Number(item.unitCost).toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-3.5 text-right font-bold text-blue-700">
                      ${Number((item as any).effectiveTotalCost !== undefined ? (item as any).effectiveTotalCost : (item.totalCost || 0)).toLocaleString('en-IN')}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 text-center">
                      <StatusBadge status={item.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-0.5">
                        {isUpdating ? (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500 mx-2" />
                        ) : (
                          <>
                            {/* Approve / Reject — for Pending items where user is the target approver or admin */}
                            {canApproveThis && item.status === 'Pending' && (
                              <>
                                <button
                                  onClick={() => handleUpdateItemStatus(item, 'Approved')}
                                  title="Approve"
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleUpdateItemStatus(item, 'Rejected')}
                                  title="Reject"
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {/* Submit for Approval — Draft items only */}
                            {item.status === 'Draft' && (
                              <button
                                onClick={() => setApproversItem(item)}
                                title="Send for Approval"
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            )}

                            {/* New Version (Approved) / Edit (others) */}
                            {item.status === 'Approved' ? (
                              <button
                                onClick={() => { setSelectedItem(item); setIsNewVersion(true); setIsModalOpen(true); }}
                                title="Create New Version"
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              >
                                <GitBranch className="w-4 h-4" />
                              </button>
                            ) : canUpdate && (
                              <button
                                onClick={() => { setSelectedItem(item); setIsNewVersion(false); setIsModalOpen(true); }}
                                title="Edit"
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}

                            {/* Version History */}
                            <button
                              onClick={() => setHistoryItem(item)}
                              title="Version History"
                              className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            >
                              <History className="w-4 h-4" />
                            </button>

                            {/* Delete — visible on row hover only */}
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteItem(item)}
                                title="Delete"
                                className="p-1.5 text-transparent group-hover:text-slate-300 hover:!text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Grand Total footer row */}
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td colSpan={6} className="px-4 py-3.5 text-right text-xs font-black text-slate-500 uppercase tracking-widest">
                  Group Total
                </td>
                <td className="px-4 py-3.5 text-right font-black text-gray-900 text-base">
                  ${detailTotal.toLocaleString('en-IN')}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ───────────────────────────────────────────────────────────────────
            MOBILE CARDS — hidden on sm+
        ─────────────────────────────────────────────────────────────────── */}
        <div className="sm:hidden space-y-3">
          {detailItems.map((item, idx) => {
            const isUpdating       = updatingItemId === item._id;
            const isTargetApprover = String(user?.id || user?._id) === String((item as any).requestedApprover);
            const canApproveThis   = canApprove || isTargetApprover;

            return (
              <div key={item._id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                {/* Card header */}
                <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      {item.itemNumber && (
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-0.5">{item.itemNumber}</p>
                      )}
                      <p className="font-semibold text-gray-900 text-sm leading-snug">{item.itemDescription}</p>
                      {item.remark && (
                        <p className="text-[10px] text-slate-400 italic mt-0.5">"{item.remark}"</p>
                      )}
                    </div>
                    <StatusBadge status={item.status} size="xs" />
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-px bg-gray-100">
                  {[
                    { label: 'Quantity',  value: `${Number(item.quantity).toLocaleString('en-IN')} ${item.unit || ''}`, mono: false },
                    { label: 'Unit Cost', value: `$${Number(item.unitCost).toLocaleString('en-IN')}`, mono: false },
                    { label: 'Total Cost',value: `$${Number((item as any).effectiveTotalCost !== undefined ? (item as any).effectiveTotalCost : (item.totalCost || 0)).toLocaleString('en-IN')}`, highlight: true },
                  ].map(({ label, value, highlight }) => (
                    <div key={label} className={cn('px-3 py-2.5 text-center', highlight ? 'bg-blue-50' : 'bg-white')}>
                      <p className={cn('text-[9px] uppercase tracking-wider mb-0.5', highlight ? 'text-blue-400' : 'text-slate-400')}>{label}</p>
                      <p className={cn('font-black text-xs leading-tight', highlight ? 'text-blue-600' : 'text-gray-900')}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Footer: version + actions */}
                <div className="px-4 py-3 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-slate-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    v{(item as any).version || 1}
                  </span>
                  {item.status === 'Pending' && (item as any).requestedApproverName && (
                    <p className="text-[10px] text-amber-600 font-semibold flex-1 text-center truncate">
                      ↗ {(item as any).requestedApproverName}
                    </p>
                  )}
                  <div className="flex items-center gap-0.5">
                    {isUpdating ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    ) : (
                      <>
                        {canApproveThis && item.status === 'Pending' && (
                          <>
                            <button onClick={() => handleUpdateItemStatus(item, 'Approved')}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleUpdateItemStatus(item, 'Rejected')}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {item.status === 'Draft' && (
                          <button onClick={() => setApproversItem(item)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        {item.status === 'Approved' ? (
                          <button onClick={() => { setSelectedItem(item); setIsNewVersion(true); setIsModalOpen(true); }}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                            <GitBranch className="w-4 h-4" />
                          </button>
                        ) : canUpdate && (
                          <button onClick={() => { setSelectedItem(item); setIsNewVersion(false); setIsModalOpen(true); }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => setHistoryItem(item)}
                          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                          <History className="w-4 h-4" />
                        </button>
                        {canDelete && (
                          <button onClick={() => handleDeleteItem(item)}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Mobile total */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-gray-900 text-white rounded-2xl">
            <span className="text-xs font-black uppercase tracking-widest text-gray-400">Group Total</span>
            <span className="text-lg font-black">${detailTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* ── Sticky bottom action bar (Approve All / Reject All) ── */}
        {canApprove && !allApproved && (
          <div className={cn(
            'flex gap-3 sm:mt-2',
            // Fixed on mobile, relative on desktop
            'fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-t border-gray-200 p-4',
            'sm:static sm:border-0 sm:bg-transparent sm:backdrop-blur-none sm:p-0 sm:z-auto',
          )}>
            <button
              onClick={() => bulkUpdateGroup('Rejected')}
              disabled={isBulkUpdating}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-red-200 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 rounded-2xl font-bold text-sm transition-all disabled:opacity-50"
            >
              {isBulkUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Reject All
            </button>
            <button
              onClick={() => bulkUpdateGroup('Approved')}
              disabled={isBulkUpdating}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-sm transition-all disabled:opacity-50 shadow-lg shadow-emerald-600/20"
            >
              {isBulkUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Approve All
            </button>
          </div>
        )}

        {canApprove && allApproved && canCreate && (
          <button
            onClick={() => { setSelectedItem(null); setIsNewVersion(false); setIsModalOpen(true); }}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            Create New Version
          </button>
        )}

        {/* Modals */}
        <BOQModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setIsNewVersion(false); }}
          onSuccess={fetchBOQ}
          projectId={projectId}
          initialData={selectedItem}
          existingGroups={existingGroups}
          isNewVersion={isNewVersion}
          defaultGroupName={selectedGroupName}
        />
        <BOQHistoryModal isOpen={!!historyItem} onClose={() => setHistoryItem(null)} item={historyItem} projectId={projectId} />
        <BOQApproversModal isOpen={!!approversItem} onClose={() => setApproversItem(null)} onSuccess={fetchBOQ} item={approversItem} projectId={projectId} />
      </div>
      </SkeletonLoader>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // LIST VIEW — BOQ Group overview
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <SkeletonLoader loading={loading} preset="table">
      <div className="space-y-5 sm:space-y-6">

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total BOQ Value"
          value={`$${totalBOQAmount.toLocaleString('en-IN')}`}
          icon={DollarSign}
          accent="text-blue-600"
          bg="bg-blue-50"
          sub={`${items.length} total items`}
        />
        <StatCard
          label="BOQ Groups"
          value={Object.keys(groupedItems).length}
          icon={FileText}
          accent="text-violet-600"
          bg="bg-violet-50"
        />
        <StatCard
          label="Pending Approval"
          value={pendingCount}
          icon={Clock}
          accent="text-amber-600"
          bg="bg-amber-50"
          sub={pendingCount > 0 ? 'requires action' : 'all clear'}
        />
        <StatCard
          label="Approved Items"
          value={approvedCount}
          icon={TrendingUp}
          accent="text-emerald-600"
          bg="bg-emerald-50"
          sub={items.length > 0 ? `${Math.round((approvedCount / items.length) * 100)}% of total` : ''}
        />
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search groups or items..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer w-full sm:w-auto"
        >
          {['All', 'Draft', 'Pending', 'Approved', 'Rejected'].map(s => (
            <option key={s} value={s}>{s === 'All' ? 'All Status' : s}</option>
          ))}
        </select>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchBOQ}
            className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-slate-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-gray-100 transition-all"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-gray-100 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import</span>
          </button>
          {canCreate && (
            <button
              onClick={() => { setSelectedItem(null); setIsNewVersion(false); setIsModalOpen(true); }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 rounded-xl text-sm font-bold text-white hover:bg-blue-500 transition-all shadow-md shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>New BOQ</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Empty state ── */}
      {filteredGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />
          </div>
          <p className="font-black text-gray-900 text-lg sm:text-xl mb-1">
            {searchQuery || statusFilter !== 'All' ? 'No results found' : 'No BOQ Groups Yet'}
          </p>
          <p className="text-slate-400 text-sm mb-6 text-center max-w-xs px-4">
            {searchQuery
              ? `No groups match "${searchQuery}"`
              : statusFilter !== 'All'
              ? `No groups with status "${statusFilter}"`
              : 'Add your first Bill of Quantities group to get started'}
          </p>
          {!searchQuery && statusFilter === 'All' && canCreate && (
            <button
              onClick={() => { setSelectedItem(null); setIsNewVersion(false); setIsModalOpen(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-500 transition-all shadow-md shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              Create BOQ Group
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ─────────────────────────────────────────────────────────────────
              DESKTOP TABLE
          ───────────────────────────────────────────────────────────────── */}
          <div className="hidden sm:block overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <table className="min-w-full text-sm bg-white">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-5 py-3.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Group Name</th>
                  <th className="px-5 py-3.5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Items</th>
                  <th className="px-5 py-3.5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Cost</th>
                  <th className="px-5 py-3.5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</th>
                  <th className="px-5 py-3.5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Version</th>
                  <th className="px-5 py-3.5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-5 py-3.5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredGroups.map(groupName => {
                  const groupItems    = groupedItems[groupName];
                  const status        = getGroupStatus(groupItems);
                  const totalCost     = groupItems.reduce((s, i) => s + (i.totalCost || 0), 0);
                  const latestVersion = Math.max(...groupItems.map(i => (i as any).version || 1));
                  const groupPending  = groupItems.filter(i => i.status === 'Pending').length;

                  return (
                    <tr
                      key={groupName}
                      onClick={() => setSelectedGroupName(groupName)}
                      className="hover:bg-blue-50/30 cursor-pointer transition-colors group"
                    >
                      {/* Group Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-100 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-blue-500" />
                          </div>
                          <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {groupName}
                          </span>
                        </div>
                      </td>

                      {/* Items count */}
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-xs font-bold text-slate-700">
                          {groupItems.length}
                        </span>
                      </td>

                      {/* Total Cost */}
                      <td className="px-5 py-4 text-right font-bold text-gray-900">
                        ${totalCost.toLocaleString('en-IN')}
                      </td>

                      {/* Pending count */}
                      <td className="px-5 py-4 text-center">
                        {groupPending > 0 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-black">
                            {groupPending}
                          </span>
                        ) : (
                          <span className="text-slate-200 text-lg">·</span>
                        )}
                      </td>

                      {/* Version */}
                      <td className="px-5 py-4 text-center">
                        <span className="text-xs font-bold text-slate-500 bg-gray-100 px-2.5 py-1 rounded-full">
                          v{latestVersion}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 text-center">
                        <StatusBadge status={status} />
                      </td>

                      {/* Actions — visible on row hover */}
                      <td className="px-5 py-4">
                        <div
                          className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={e => e.stopPropagation()}
                        >
                          {canUpdate && status !== 'Approved' && (
                            <button
                              onClick={() => { setSelectedItem(groupItems[0]); setIsNewVersion(false); setIsModalOpen(true); }}
                              title="Edit"
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={e => handleDeleteGroup(groupItems, e)}
                              title="Delete Group"
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <ChevronRight className="w-4 h-4 text-slate-300 ml-1" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Grand total footer */}
              {filteredGroups.length > 1 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td className="px-5 py-3.5 font-black text-slate-500 text-xs uppercase tracking-widest">
                      Grand Total · {filteredGroups.length} groups
                    </td>
                    <td className="px-5 py-3.5 text-center text-xs text-slate-400">{items.length} items</td>
                    <td className="px-5 py-3.5 text-right font-black text-gray-900 text-base">
                      ${filteredGroups.reduce((s, g) => s + groupedItems[g].reduce((a, i) => a + (i.totalCost || 0), 0), 0).toLocaleString('en-IN')}
                    </td>
                    <td colSpan={4} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* ─────────────────────────────────────────────────────────────────
              MOBILE CARDS (xs to sm-1)
          ───────────────────────────────────────────────────────────────── */}
          <div className="sm:hidden space-y-3">
            {filteredGroups.map(groupName => {
              const groupItems    = groupedItems[groupName];
              const status        = getGroupStatus(groupItems);
              const totalCost     = groupItems.reduce((s, i) => s + (i.totalCost || 0), 0);
              const latestVersion = Math.max(...groupItems.map(i => (i as any).version || 1));
              const groupPending  = groupItems.filter(i => i.status === 'Pending').length;

              return (
                <div
                  key={groupName}
                  onClick={() => setSelectedGroupName(groupName)}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm active:bg-gray-50 transition-colors"
                >
                  {/* Card header */}
                  <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                      <p className="font-bold text-gray-900 truncate text-sm">{groupName}</p>
                    </div>
                    <StatusBadge status={status} size="xs" />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-px bg-gray-100 border-t border-gray-100">
                    <div className="bg-white px-3 py-2.5 text-center">
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">Items</p>
                      <p className="font-black text-sm text-gray-900">{groupItems.length}</p>
                    </div>
                    <div className="bg-white px-3 py-2.5 text-center">
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">Total Cost</p>
                      <p className="font-black text-xs text-blue-600">${totalCost.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-white px-3 py-2.5 text-center">
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">Version</p>
                      <p className="font-black text-sm text-gray-900">v{latestVersion}</p>
                    </div>
                  </div>

                  {/* Pending alert */}
                  {groupPending > 0 && (
                    <div className="mx-3 my-2 flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-xl">
                      <Clock className="w-3 h-3 text-amber-500 flex-shrink-0" />
                      <p className="text-[10px] font-semibold text-amber-700">
                        {groupPending} item{groupPending > 1 ? 's' : ''} pending approval
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-[10px] text-slate-400">Tap to view items</p>
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      {canDelete && (
                        <button
                          onClick={e => handleDeleteGroup(groupItems, e)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modals */}
      <BOQModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setIsNewVersion(false); }}
        onSuccess={fetchBOQ}
        projectId={projectId}
        initialData={selectedItem}
        existingGroups={existingGroups}
        isNewVersion={isNewVersion}
      />
      <BOQImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchBOQ}
        projectId={projectId}
      />
      <BOQHistoryModal isOpen={!!historyItem} onClose={() => setHistoryItem(null)} item={historyItem} projectId={projectId} />
      <BOQApproversModal isOpen={!!approversItem} onClose={() => setApproversItem(null)} onSuccess={fetchBOQ} item={approversItem} projectId={projectId} />
    </div>
    </SkeletonLoader>
  );
};
