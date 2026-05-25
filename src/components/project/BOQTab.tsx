'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Edit2, Trash2, History, Download, Upload,
  CheckCircle2, AlertCircle, Loader2, Users, GitBranch,
  Package, IndianRupee, ChevronLeft, Clipboard, Clock,
} from 'lucide-react';
import { BOQItem } from '@/types';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { BOQModal } from './BOQModal';
import { BOQImportModal } from './BOQImportModal';
import { BOQHistoryModal } from './BOQHistoryModal';
import { BOQApproversModal } from './BOQApproversModal';

interface BOQTabProps {
  projectId: string;
}

type GroupStatus = 'approved' | 'rejected' | 'pending' | 'draft';

const STATUS_CONFIG: Record<GroupStatus, { color: string; bg: string; border: string; label: string }> = {
  approved: { color: '#10B981', bg: '#D1FAE5', border: '#A7F3D0', label: 'Approved' },
  rejected: { color: '#EF4444', bg: '#FEE2E2', border: '#FECACA', label: 'Rejected' },
  pending:  { color: '#F59E0B', bg: '#FEF3C7', border: '#FDE68A', label: 'Pending' },
  draft:    { color: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB', label: 'Draft' },
};

export const BOQTab: React.FC<BOQTabProps> = ({ projectId }) => {
  const [items, setItems] = useState<BOQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BOQItem | null>(null);
  const [historyItem, setHistoryItem] = useState<BOQItem | null>(null);
  const [approversItem, setApproversItem] = useState<BOQItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewVersion, setIsNewVersion] = useState(false);
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const toast = useToast();

  const fetchBOQ = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/boq`);
      const data: BOQItem[] = Array.isArray(response.data) ? response.data : response.data?.items ?? [];
      setItems(data);
    } catch {
      toast.error('Failed to load BOQ items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBOQ(); }, [projectId]);

  const groupedItems = items.reduce((acc: Record<string, BOQItem[]>, item) => {
    if (!acc[item.groupName]) acc[item.groupName] = [];
    acc[item.groupName].push(item);
    return acc;
  }, {});

  const getGroupStatus = (groupItems: BOQItem[]): GroupStatus => {
    if (groupItems.every(i => i.status === 'Approved')) return 'approved';
    if (groupItems.some(i => i.status === 'Rejected')) return 'rejected';
    if (groupItems.some(i => i.status === 'Pending')) return 'pending';
    return 'draft';
  };

  const totalBOQAmount = items.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  const existingGroups = [...new Set(items.map(i => i.groupName))];

  const filteredGroups = Object.keys(groupedItems).filter(g =>
    g.toLowerCase().includes(searchQuery.toLowerCase()) ||
    groupedItems[g].some(i => i.itemDescription.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDeleteGroup = async (groupItems: BOQItem[], e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete all items in "${groupItems[0]?.groupName}"?`)) return;
    try {
      await Promise.all(groupItems.map(i => api.delete(`/projects/${projectId}/boq/${i._id}`)));
      toast.success('Group deleted');
      if (selectedGroupName === groupItems[0]?.groupName) setSelectedGroupName(null);
      fetchBOQ();
    } catch {
      toast.error('Failed to delete group');
    }
  };

  const handleDeleteItem = async (item: BOQItem) => {
    if (!window.confirm(`Delete "${item.itemDescription}"?`)) return;
    try {
      await api.delete(`/projects/${projectId}/boq/${item._id}`);
      toast.success('Item deleted');
      fetchBOQ();
    } catch {
      toast.error('Failed to delete item');
    }
  };

  const bulkUpdateGroup = async (status: 'Approved' | 'Rejected') => {
    if (!selectedGroupName) return;
    const ids = (groupedItems[selectedGroupName] || []).map(i => i._id!);
    setIsBulkUpdating(true);
    try {
      await api.patch(`/projects/${projectId}/boq/bulk-status`, { itemIds: ids, status });
      toast.success(`All items ${status.toLowerCase()}`);
      fetchBOQ();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Group', 'Item #', 'Description', 'Unit', 'Quantity', 'Unit Cost', 'Total Cost', 'Status'];
    const rows = items.map(item => [
      item.groupName, item.itemNumber || '', item.itemDescription,
      item.unit || '', item.quantity, item.unitCost, item.totalCost, item.status,
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `BOQ_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading BOQ data...</p>
      </div>
    );
  }

  // ── DETAIL VIEW ──
  if (selectedGroupName && groupedItems[selectedGroupName]) {
    const detailItems = groupedItems[selectedGroupName];
    const detailTotal = detailItems.reduce((s, i) => s + (i.totalCost || 0), 0);
    const detailVersion = Math.max(...detailItems.map(i => (i as any).version || 1));
    const detailStatus = getGroupStatus(detailItems);
    const cfg = STATUS_CONFIG[detailStatus];
    const allApproved = detailStatus === 'approved';
    const pendingCount = detailItems.filter(i => i.status === 'Pending').length;
    const approvedCount = detailItems.filter(i => i.status === 'Approved').length;

    return (
      <div className="space-y-5">
        {/* Back button */}
        <button
          onClick={() => setSelectedGroupName(null)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to BOQ Groups
        </button>

        {/* Hero gradient — matches mobile BOQDetailScreen */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Clipboard className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold leading-tight truncate">{selectedGroupName}</h3>
              <p className="text-white/80 text-sm mt-0.5">Bill of Quantities</p>
            </div>
          </div>
          <div className="flex bg-white/15 rounded-2xl p-4">
            <div className="flex-1 flex flex-col items-center gap-1">
              <Package className="w-5 h-5 opacity-80" />
              <p className="text-[10px] uppercase tracking-wider opacity-70">Items</p>
              <p className="text-lg font-bold">{detailItems.length}</p>
            </div>
            <div className="w-px bg-white/20" />
            <div className="flex-1 flex flex-col items-center gap-1">
              <IndianRupee className="w-5 h-5 opacity-80" />
              <p className="text-[10px] uppercase tracking-wider opacity-70">Total</p>
              <p className="text-lg font-bold">₹{detailTotal.toLocaleString()}</p>
            </div>
            <div className="w-px bg-white/20" />
            <div className="flex-1 flex flex-col items-center gap-1">
              <GitBranch className="w-5 h-5 opacity-80" />
              <p className="text-[10px] uppercase tracking-wider opacity-70">Version</p>
              <p className="text-lg font-bold">v{detailVersion}</p>
            </div>
          </div>
        </div>

        {/* Approval status cards — matches mobile approvalGrid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-blue-500" />
              <p className="font-semibold text-sm text-gray-900">Approved</p>
            </div>
            <div className="flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-sm"
              style={{ backgroundColor: STATUS_CONFIG.approved.bg, color: STATUS_CONFIG.approved.color }}>
              <CheckCircle2 className="w-4 h-4" />
              {approvedCount} / {detailItems.length} Items
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-blue-500" />
              <p className="font-semibold text-sm text-gray-900">Pending</p>
            </div>
            <div className="flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-sm"
              style={{ backgroundColor: pendingCount > 0 ? STATUS_CONFIG.pending.bg : STATUS_CONFIG.approved.bg, color: pendingCount > 0 ? STATUS_CONFIG.pending.color : STATUS_CONFIG.approved.color }}>
              <Clock className="w-4 h-4" />
              {pendingCount} Items
            </div>
          </div>
        </div>

        {/* Items header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-500" />
            <h4 className="font-bold text-gray-900 text-lg">Bill of Quantities</h4>
          </div>
          <span className="px-3 py-1 rounded-xl bg-gray-100 text-xs font-semibold text-slate-500">
            {detailItems.length} items
          </span>
        </div>

        {/* Item cards — matches mobile item cards */}
        <div className="space-y-3">
          {detailItems.map((item, idx) => {
            const itemStatus = (item.status?.toLowerCase() || 'draft') as GroupStatus;
            const sCfg = STATUS_CONFIG[itemStatus] || STATUS_CONFIG.draft;
            const itemTotal = (Number(item.quantity) || 0) * (Number(item.unitCost) || 0);
            return (
              <div key={item._id} className="bg-white border border-gray-200 rounded-2xl p-5">
                {/* Item header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-white">{idx + 1}</span>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm leading-snug flex-1">{item.itemDescription}</p>
                </div>

                {/* Item stats grid */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Quantity</p>
                    <p className="font-semibold text-sm text-slate-700">
                      {item.quantity.toLocaleString()}
                      {item.unit && <span className="text-xs text-slate-400 ml-1">{item.unit}</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Unit Price</p>
                    <p className="font-semibold text-sm text-slate-700">₹{item.unitCost.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Total</p>
                    <p className="font-bold text-sm text-blue-600">₹{itemTotal.toLocaleString()}</p>
                  </div>
                </div>

                {item.remark && (
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-xs text-slate-400 italic">{item.remark}</p>
                  </div>
                )}

                {/* Item footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                    style={{ backgroundColor: sCfg.bg, color: sCfg.color }}>
                    {item.status}
                  </div>
                  <div className="flex items-center gap-1">
                    {item.status === 'Approved' ? (
                      <button
                        onClick={() => { setSelectedItem(item); setIsNewVersion(true); setIsModalOpen(true); }}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                        title="Create new version"
                      >
                        <GitBranch className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => { setSelectedItem(item); setIsNewVersion(false); setIsModalOpen(true); }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="Edit item"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleDeleteItem(item)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setHistoryItem(item)}
                      className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all">
                      <History className="w-4 h-4" />
                    </button>
                    <button onClick={() => setApproversItem(item)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                      <Users className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom action bar — matches mobile actionContainer */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 flex gap-3">
          {!allApproved && (
            <>
              <button
                onClick={() => bulkUpdateGroup('Rejected')}
                disabled={isBulkUpdating}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-500 hover:bg-red-400 text-white rounded-2xl font-bold text-sm transition-all disabled:opacity-50"
              >
                {isBulkUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <AlertCircle className="w-5 h-5" />}
                Reject All
              </button>
              <button
                onClick={() => bulkUpdateGroup('Approved')}
                disabled={isBulkUpdating}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-sm transition-all disabled:opacity-50"
              >
                {isBulkUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Approve All
              </button>
            </>
          )}
          {allApproved && (
            <button
              onClick={() => { setSelectedItem(null); setIsNewVersion(false); setIsModalOpen(true); }}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm transition-all"
            >
              <Plus className="w-5 h-5" />
              Create New Version
            </button>
          )}
          <button
            onClick={() => { setSelectedItem(null); setIsNewVersion(false); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 px-5 py-3.5 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-2xl font-bold text-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Items
          </button>
        </div>

        <BOQModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setIsNewVersion(false); }}
          onSuccess={() => { fetchBOQ(); }}
          projectId={projectId}
          initialData={selectedItem}
          existingGroups={existingGroups}
          isNewVersion={isNewVersion}
          defaultGroupName={selectedGroupName}
        />
        <BOQHistoryModal isOpen={!!historyItem} onClose={() => setHistoryItem(null)} item={historyItem} projectId={projectId} />
        <BOQApproversModal isOpen={!!approversItem} onClose={() => setApproversItem(null)} onSuccess={fetchBOQ} item={approversItem} projectId={projectId} />
      </div>
    );
  }

  // ── LIST VIEW — matches mobile BOQListScreen ──
  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <GlassCard className="p-5 border-gray-200" gradient>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total BOQ Value</p>
          <p className="text-3xl font-black text-gray-900 mt-1">₹{totalBOQAmount.toLocaleString()}</p>
        </GlassCard>
        <GlassCard className="p-5 border-gray-200">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Groups</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{Object.keys(groupedItems).length}</p>
        </GlassCard>
        <GlassCard className="p-5 border-gray-200">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pending Approval</p>
          <p className="text-3xl font-black text-amber-600 mt-1">
            {items.filter(i => i.status === 'Pending').length}
          </p>
        </GlassCard>
      </div>

      {/* Toolbar — matches mobile header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search groups or items..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-slate-500 hover:text-gray-900 transition-all">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-slate-500 hover:text-gray-900 transition-all">
            <Upload className="w-4 h-4" /> Import
          </button>
          <button
            onClick={() => { setSelectedItem(null); setIsNewVersion(false); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 rounded-xl text-sm font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4" /> New BOQ
          </button>
        </div>
      </div>

      {/* Group cards — matches mobile BOQ cards */}
      {filteredGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200">
          <Clipboard className="w-16 h-16 text-gray-200 mb-4" />
          <p className="font-bold text-gray-900 text-lg">No BOQ Groups Yet</p>
          <p className="text-slate-400 text-sm mt-1 mb-5">Create your first BOQ group for this project</p>
          <button
            onClick={() => { setSelectedItem(null); setIsNewVersion(false); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-500 transition-all"
          >
            <Plus className="w-4 h-4" /> Create BOQ Group
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map(groupName => {
            const groupItems = groupedItems[groupName];
            const status = getGroupStatus(groupItems);
            const cfg = STATUS_CONFIG[status];
            const totalCost = groupItems.reduce((s, i) => s + (i.totalCost || 0), 0);
            const latestVersion = Math.max(...groupItems.map(i => (i as any).version || 1));
            const createdAt = groupItems[0] ? new Date((groupItems[0] as any).createdAt || Date.now()).toLocaleDateString() : '';
            const isFullyApproved = status === 'approved';

            return (
              <div
                key={groupName}
                onClick={() => setSelectedGroupName(groupName)}
                className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md cursor-pointer transition-all"
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-bold text-gray-900 text-lg flex-1 mr-3 leading-tight">{groupName}</h4>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shrink-0"
                    style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                    {cfg.label.toUpperCase()}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-6 mt-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium text-slate-600">{groupItems.length} items</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-slate-600">₹{totalCost.toLocaleString()}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <span className="text-xs text-slate-400">
                    Version {latestVersion}{createdAt ? ` • ${createdAt}` : ''}
                  </span>
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    {!isFullyApproved && (
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedItem(groupItems[0]); setIsNewVersion(false); setIsModalOpen(true); }}
                        className="p-2 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                        title="Edit group"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                    )}
                    <button
                      onClick={e => handleDeleteGroup(groupItems, e)}
                      className="p-2 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                      title="Delete group"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BOQModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setIsNewVersion(false); }}
        onSuccess={fetchBOQ}
        projectId={projectId}
        initialData={selectedItem}
        existingGroups={existingGroups}
        isNewVersion={isNewVersion}
      />
      <BOQImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onSuccess={fetchBOQ} projectId={projectId} />
      <BOQHistoryModal isOpen={!!historyItem} onClose={() => setHistoryItem(null)} item={historyItem} projectId={projectId} />
      <BOQApproversModal isOpen={!!approversItem} onClose={() => setApproversItem(null)} onSuccess={fetchBOQ} item={approversItem} projectId={projectId} />
    </div>
  );
};
