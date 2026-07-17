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
import { cn, formatCurrency } from '@/lib/utils';
import { useProjectContext } from '@/features/projects/contexts/ProjectContext';
import { BOQModal } from '@/features/projects/boq/components/BOQModal';
import { BOQImportModal } from '@/features/projects/boq/components/BOQImportModal';
import { BOQViewModal } from '@/features/projects/boq/components/BOQViewModal';
import { BOQRejectionModal } from '@/features/projects/boq/components/BOQRejectionModal';
import { BOQBudgetImpactModal, BudgetImpactData } from '@/features/projects/boq/components/BOQBudgetImpactModal';
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
  Draft: { badge: 'bg-slate-100 text-slate-600 border-slate-200', row: '', dot: 'bg-slate-400', icon: FileText },
  Pending: { badge: 'bg-amber-50 text-amber-700 border-amber-200', row: 'bg-amber-50/30', dot: 'bg-amber-500', icon: Clock },
  Approved: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', row: 'bg-emerald-50/20', dot: 'bg-emerald-500', icon: CheckCircle2 },
  Rejected: { badge: 'bg-red-50 text-red-700 border-red-200', row: 'bg-red-50/20', dot: 'bg-red-500', icon: XCircle },
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
  if (groupItems.some(i => i.status === 'Rejected')) return 'Rejected';
  if (groupItems.some(i => i.status === 'Pending')) return 'Pending';
  return 'Draft';
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export const BOQTab: React.FC<BOQTabProps> = ({ projectId }) => {
  const { project } = useProjectContext();
  const [items, setItems] = useState<BOQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedItem, setSelectedItem]     = useState<BOQItem | null>(null);
  const [viewingItem, setViewingItem]       = useState<BOQItem | null>(null);
  const [rejectionItemId, setRejectionItemId] = useState<string | null>(null);
  const [budgetImpactData, setBudgetImpactData] = useState<BudgetImpactData | null>(null);
  const [approversItem, setApproversItem] = useState<BOQItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isNewVersion, setIsNewVersion] = useState(false);
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const toast = useToast();
  const { user } = useAuth();
  const { socket } = useSocket();

  // ── Permissions (mirror mobile's isAdmin / canApprove) ──────────────────
  const isAdmin = (user?.role as any)?.name === 'Admin' || (user?.role as any)?.permissions?.includes('*');
  const canApprove = isAdmin || (user?.role as any)?.permissions?.includes('boq:approve');
  const canUpdate = isAdmin || (user?.role as any)?.permissions?.includes('boq:update');
  const canDelete = isAdmin || (user?.role as any)?.permissions?.includes('boq:delete');
  const canCreate = isAdmin || (user?.role as any)?.permissions?.includes('boq:create');

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
  const pendingCount = items.filter(i => i.status === 'Pending').length;
  const approvedCount = items.filter(i => i.status === 'Approved').length;
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

  // ✅ Per-item status update — strictly mirrors mobile's handleUpdateStatus()
  const handleUpdateItemStatus = async (item: BOQItem, status: 'Approved' | 'Rejected', overrideBudgetConfirm = false) => {
    // 1. Rejection Flow
    if (status === 'Rejected') {
      setRejectionItemId(item._id); // Opens the Rejection Modal
      return;
    }

    // 2. Budget Impact Check (for Approving v2+ items)
    if (status === 'Approved' && !overrideBudgetConfirm && (item as any).version > 1 && (item as any).effectiveTotalCost !== undefined) {
      const oldAmount = (item as any).effectiveTotalCost;
      const newAmount = item.totalCost || 0;
      const difference = newAmount - oldAmount;
      
      if (difference !== 0) {
        setBudgetImpactData({
          oldAmount,
          newAmount,
          difference,
          reason: `BOQ Adjustment: ${item.itemNumber || item.itemDescription} (v${(item as any).version})`,
          itemId: item._id
        });
        return; // Pause and wait for Budget Impact Modal confirmation
      }
    }

    // 3. Proceed with standard approval
    setUpdatingItemId(item._id);
    try {
      await api.patch(`/projects/${projectId}/boq/${item._id}/status`, { status });
      toast.success('Item approved');
      setViewingItem(null);
      setBudgetImpactData(null);
      fetchBOQ();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally { setUpdatingItemId(null); }
  };

  const handleConfirmRejection = async (reason: string) => {
    if (!rejectionItemId) return;
    setUpdatingItemId(rejectionItemId);
    try {
      await api.patch(`/projects/${projectId}/boq/${rejectionItemId}/status`, { 
        status: 'Rejected', 
        rejectionReason: reason 
      });
      toast.success('Item rejected');
      setRejectionItemId(null);
      setViewingItem(null);
      fetchBOQ();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject');
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
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `BOQ_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // ──────────────────────────────────────────────────────────────────────────
  // UNIFIED VIEW — All Groups and Items
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <SkeletonLoader loading={loading} preset="table">
      <div className="space-y-5 sm:space-y-6 pb-20 sm:pb-6">

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="Total BOQ Value"
            value={formatCurrency(totalBOQAmount, project?.currency || '$')}
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
          <div className="space-y-6">
            {/* ─────────────────────────────────────────────────────────────────
              DESKTOP TABLE
            ───────────────────────────────────────────────────────────────── */}
            <div className="hidden sm:block overflow-hidden rounded-2xl border border-gray-200 shadow-sm bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
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
                    {filteredGroups.map(groupName => {
                      const groupItems = groupedItems[groupName];
                      const status = getGroupStatus(groupItems);
                      const totalCost = groupItems.reduce((s, i) => s + ((i as any).effectiveTotalCost !== undefined ? (i as any).effectiveTotalCost : (i.totalCost || 0)), 0);
  
                      return (
                        <React.Fragment key={groupName}>
                          {/* Group Header Row */}
                          <tr className="bg-slate-50 border-y border-slate-200 group">
                            <td colSpan={6} className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                                <span className="font-black text-gray-900 text-sm uppercase tracking-wider">{groupName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-black text-gray-900">
                              {formatCurrency(totalCost, project?.currency || '$')}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <StatusBadge status={status} size="xs" />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {canDelete && (
                                  <button
                                    onClick={e => handleDeleteGroup(groupItems, e)}
                                    title="Delete Group"
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
  
                          {/* Items in the Group */}
                          {groupItems.map((item, idx) => {
                            const isUpdating = updatingItemId === item._id;
                            const isTargetApprover = String(user?.id || user?._id) === String((item as any).requestedApprover);
                            const canApproveThis = canApprove || isTargetApprover;
                            const rowStyle = STATUS_STYLES[item.status as StatusKey]?.row ?? '';
  
                            return (
                              <tr key={item._id} className={cn('transition-colors group/item hover:bg-blue-50/40', rowStyle)}>
                                <td className="px-4 py-3 text-slate-400 text-xs font-mono">{idx + 1}</td>
                                <td className="px-4 py-3">
                                  {item.itemNumber
                                    ? <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">{item.itemNumber}</span>
                                    : <span className="text-slate-300 text-xs">—</span>}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-gray-900 leading-snug">{item.itemDescription}</p>
                                    {(item as any).version > 1 && (
                                      <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                                        v{(item as any).version}
                                      </span>
                                    )}
                                  </div>
                                  {item.remark && (
                                    <p className="text-xs text-slate-400 italic mt-0.5 truncate max-w-xs">{item.remark}</p>
                                  )}
                                  {item.status === 'Pending' && (item as any).requestedApproverName && (
                                    <p className="text-[10px] text-amber-600 font-semibold mt-0.5">
                                      ↗ Awaiting: {(item as any).requestedApproverName}
                                    </p>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center text-slate-500 text-xs">{item.unit || '—'}</td>
                                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                  {Number(item.quantity).toLocaleString('en-IN')}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-600">
                                  {formatCurrency(Number(item.unitCost), project?.currency || '$')}
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-blue-700">
                                  {formatCurrency(Number(item.totalCost || 0), project?.currency || '$')}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <StatusBadge status={item.status} />
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-end gap-0.5">
                                    {isUpdating ? (
                                      <Loader2 className="w-4 h-4 animate-spin text-blue-500 mx-2" />
                                    ) : (
                                      <>
                                        {canApproveThis && item.status === 'Pending' && (
                                          <>
                                            <button onClick={() => handleUpdateItemStatus(item, 'Approved')}
                                              title="Approve" className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                                              <CheckCircle2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleUpdateItemStatus(item, 'Rejected')}
                                              title="Reject" className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                              <XCircle className="w-4 h-4" />
                                            </button>
                                          </>
                                        )}
                                        {item.status === 'Draft' && (
                                          <button onClick={() => setApproversItem(item)}
                                            title="Send for Approval" className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                            <Send className="w-4 h-4" />
                                          </button>
                                        )}
                                        {item.status === 'Approved' ? (
                                          <button onClick={() => { setSelectedItem(item); setIsNewVersion(true); setIsModalOpen(true); }}
                                            title="Create New Version" className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                                            <GitBranch className="w-4 h-4" />
                                          </button>
                                        ) : canUpdate && (
                                          <button onClick={() => { setSelectedItem(item); setIsNewVersion(false); setIsModalOpen(true); }}
                                            title="Edit" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                          </button>
                                        )}
                                        <button onClick={() => setViewingItem(item)}
                                          title="View Details" className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                                          <History className="w-4 h-4" />
                                        </button>
                                        {canDelete && (
                                          <button onClick={() => handleDeleteItem(item)}
                                            title="Delete" className="p-1.5 text-transparent group-hover/item:text-slate-300 hover:!text-red-500 hover:bg-red-50 rounded-lg transition-all">
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
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                  {filteredGroups.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-gray-200 bg-gray-50">
                        <td colSpan={6} className="px-4 py-3.5 text-right text-xs font-black text-slate-500 uppercase tracking-widest">
                          Grand Total
                        </td>
                        <td className="px-4 py-3.5 text-right font-black text-gray-900 text-base">
                          {formatCurrency(totalBOQAmount, project?.currency || '$')}
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────────
              MOBILE LIST
            ───────────────────────────────────────────────────────────────── */}
            <div className="sm:hidden space-y-6">
              {filteredGroups.map(groupName => {
                const groupItems = groupedItems[groupName];
                const status = getGroupStatus(groupItems);
                const totalCost = groupItems.reduce((s, i) => s + ((i as any).effectiveTotalCost !== undefined ? (i as any).effectiveTotalCost : (i.totalCost || 0)), 0);

                return (
                  <div key={groupName} className="space-y-3">
                    {/* Group Header */}
                    <div className="flex items-center justify-between px-2 pb-1 border-b-2 border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-5 bg-blue-500 rounded-full" />
                        <span className="font-bold text-gray-900 text-sm uppercase">{groupName}</span>
                      </div>
                      <span className="font-black text-gray-900 text-sm">{formatCurrency(totalCost, project?.currency || '$')}</span>
                    </div>

                    {/* Group Items */}
                    {groupItems.map((item, idx) => {
                      const isUpdating = updatingItemId === item._id;
                      const isTargetApprover = String(user?.id || user?._id) === String((item as any).requestedApprover);
                      const canApproveThis = canApprove || isTargetApprover;

                      return (
                        <div key={item._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                          <div className="px-4 pt-3 pb-2 border-b border-gray-100">
                            <div className="flex items-start gap-2.5">
                              <span className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center text-blue-700 text-[10px] font-black flex-shrink-0 mt-0.5">
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
                          <div className="grid grid-cols-3 gap-px bg-gray-100">
                            <div className="bg-white px-2 py-2 text-center">
                              <p className="text-[9px] uppercase tracking-wider text-slate-400 mb-0.5">Quantity</p>
                              <p className="font-bold text-xs text-gray-900">{Number(item.quantity).toLocaleString('en-IN')} {item.unit || ''}</p>
                            </div>
                            <div className="bg-white px-2 py-2 text-center">
                              <p className="text-[9px] uppercase tracking-wider text-slate-400 mb-0.5">Unit Cost</p>
                              <p className="font-bold text-xs text-gray-900">{formatCurrency(Number(item.unitCost), project?.currency || '$')}</p>
                            </div>
                            <div className="bg-blue-50 px-2 py-2 text-center">
                              <p className="text-[9px] uppercase tracking-wider text-blue-400 mb-0.5">Total Cost</p>
                              <p className="font-black text-xs text-blue-700">{formatCurrency(Number(item.totalCost || 0), project?.currency || '$')}</p>
                            </div>
                          </div>
                          <div className="px-3 py-2 flex items-center justify-between gap-2 border-t border-gray-50 bg-gray-50/50">
                            <span className="text-[10px] font-bold text-slate-400 bg-gray-200 px-2 py-0.5 rounded-full">
                              v{(item as any).version || 1}
                            </span>
                            {item.status === 'Pending' && (item as any).requestedApproverName && (
                              <p className="text-[10px] text-amber-600 font-semibold flex-1 text-center truncate">
                                ↗ {(item as any).requestedApproverName}
                              </p>
                            )}
                            <div className="flex items-center gap-0.5 justify-end flex-1">
                              {isUpdating ? (
                                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                              ) : (
                                <>
                                  {canApproveThis && item.status === 'Pending' && (
                                    <>
                                      <button onClick={() => handleUpdateItemStatus(item, 'Approved')}
                                        className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors">
                                        <CheckCircle2 className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => handleUpdateItemStatus(item, 'Rejected')}
                                        className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors">
                                        <XCircle className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                  {item.status === 'Draft' && (
                                    <button onClick={() => setApproversItem(item)}
                                      className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors">
                                      <Send className="w-4 h-4" />
                                    </button>
                                  )}
                                  {item.status === 'Approved' ? (
                                    <button onClick={() => { setSelectedItem(item); setIsNewVersion(true); setIsModalOpen(true); }}
                                      className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors">
                                      <GitBranch className="w-4 h-4" />
                                    </button>
                                  ) : canUpdate && (
                                    <button onClick={() => { setSelectedItem(item); setIsNewVersion(false); setIsModalOpen(true); }}
                                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button onClick={() => setViewingItem(item)}
                                    className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-100 rounded-lg transition-colors">
                                    <History className="w-4 h-4" />
                                  </button>
                                  {canDelete && (
                                    <button onClick={() => handleDeleteItem(item)}
                                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-100 rounded-lg transition-colors">
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
                  </div>
                );
              })}
            </div>
          </div>
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
          defaultGroupName={selectedGroupName || undefined}
        />
        <BOQImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={fetchBOQ}
          projectId={projectId}
        />
        <BOQViewModal
          isOpen={!!viewingItem}
          onClose={() => setViewingItem(null)}
          item={viewingItem}
          projectId={projectId}
          user={user}
          isAdmin={isAdmin}
          canApprove={canApprove}
          onUpdateStatus={(i, s) => handleUpdateItemStatus(i, s)}
          isUpdating={!!updatingItemId}
        />
        <BOQRejectionModal
          isOpen={!!rejectionItemId}
          onClose={() => setRejectionItemId(null)}
          onConfirm={handleConfirmRejection}
          isLoading={!!updatingItemId}
        />
        <BOQBudgetImpactModal
          isOpen={!!budgetImpactData}
          onClose={() => setBudgetImpactData(null)}
          impactData={budgetImpactData}
          onConfirm={async () => {
            const item = items.find(i => i._id === budgetImpactData?.itemId);
            if (item) await handleUpdateItemStatus(item, 'Approved', true);
          }}
          isLoading={!!updatingItemId}
        />
        <BOQApproversModal isOpen={!!approversItem} onClose={() => setApproversItem(null)} onSuccess={fetchBOQ} item={approversItem} projectId={projectId} />
      </div>
    </SkeletonLoader>
  );
};
