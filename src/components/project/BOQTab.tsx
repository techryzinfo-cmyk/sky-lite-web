'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  History,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
  Users,
} from 'lucide-react';
import { BOQItem } from '@/types';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { BOQModal } from './BOQModal';
import { BOQImportModal } from './BOQImportModal';
import { BOQHistoryModal } from './BOQHistoryModal';
import { BOQApproversModal } from './BOQApproversModal';

interface BOQTabProps {
  projectId: string;
}

export const BOQTab: React.FC<BOQTabProps> = ({ projectId }) => {
  const [items, setItems] = useState<BOQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BOQItem | null>(null);
  const [historyItem, setHistoryItem] = useState<BOQItem | null>(null);
  const [approversItem, setApproversItem] = useState<BOQItem | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const toast = useToast();

  const fetchBOQ = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/boq`);
      setItems(response.data);

      const groups = response.data.reduce((acc: Record<string, boolean>, item: BOQItem) => {
        acc[item.groupName] = true;
        return acc;
      }, {});
      setExpandedGroups(groups);
    } catch (error) {
      console.error('Error fetching BOQ:', error);
      toast.error('Failed to load BOQ items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBOQ();
  }, [projectId]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const groupedItems = items.reduce((acc: Record<string, BOQItem[]>, item) => {
    if (!acc[item.groupName]) acc[item.groupName] = [];
    acc[item.groupName].push(item);
    return acc;
  }, {});

  const filteredGroups = Object.keys(groupedItems).reduce((acc: Record<string, BOQItem[]>, groupName) => {
    const filteredItems = groupedItems[groupName].filter(item =>
      item.itemDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filteredItems.length > 0) {
      acc[groupName] = filteredItems;
    }
    return acc;
  }, {});

  const totalBOQAmount = items.reduce((sum, item) => sum + (item.totalCost || 0), 0);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Approved': return 'text-emerald-700 bg-emerald-100 border-emerald-200';
      case 'Pending': return 'text-amber-700 bg-amber-100 border-amber-200';
      case 'Rejected': return 'text-red-700 bg-red-100 border-red-200';
      default: return 'text-slate-600 bg-gray-100 border-gray-200';
    }
  };

  const toggleCheck = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleGroupCheck = (groupItems: BOQItem[]) => {
    const ids = groupItems.map(i => i._id!);
    const allChecked = ids.every(id => checkedIds.has(id));
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (allChecked) ids.forEach(id => next.delete(id));
      else ids.forEach(id => next.add(id));
      return next;
    });
  };

  const handleExportCSV = () => {
    const headers = ['Group', 'Item #', 'Description', 'Unit', 'Quantity', 'Unit Cost (₹)', 'Total Cost (₹)', 'Status'];
    const rows = items.map(item => [
      item.groupName,
      item.itemNumber || '',
      item.itemDescription,
      item.unit || '',
      item.quantity,
      item.unitCost,
      item.totalCost,
      item.status,
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

  const bulkUpdateStatus = async (status: 'Approved' | 'Rejected') => {
    setIsBulkUpdating(true);
    try {
      await api.patch(`/projects/${projectId}/boq/bulk-status`, {
        ids: Array.from(checkedIds),
        status,
      });
      toast.success(`${checkedIds.size} item(s) ${status.toLowerCase()}`);
      setCheckedIds(new Set());
      fetchBOQ();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bulk update failed');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading BOQ data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* BOQ Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6 border-gray-200" gradient>
          <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Total BOQ Value</p>
          <p className="text-3xl font-black text-gray-900 mt-1">₹{totalBOQAmount.toLocaleString()}</p>
        </GlassCard>
        <GlassCard className="p-6 border-gray-200">
          <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Total Items</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{items.length}</p>
        </GlassCard>
        <GlassCard className="p-6 border-gray-200">
          <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Pending Approval</p>
          <p className="text-3xl font-black text-amber-600 mt-1">
            {items.filter(i => i.status === 'Pending').length}
          </p>
        </GlassCard>
      </div>

      {/* Toolbar */}
      <GlassCard className="p-4 border-gray-200" gradient>
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by description or item #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-slate-500 hover:text-gray-900 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-slate-500 hover:text-gray-900 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Import</span>
            </button>
            <button
              onClick={() => {
                setSelectedItem(null);
                setIsModalOpen(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 border border-blue-500 rounded-xl text-sm font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
          </div>
        </div>
      </GlassCard>

      {checkedIds.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-2xl">
          <span className="text-sm font-bold text-blue-700">{checkedIds.size} item{checkedIds.size > 1 ? 's' : ''} selected</span>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => bulkUpdateStatus('Approved')}
              disabled={isBulkUpdating}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-sm shadow-emerald-600/20"
            >
              {isBulkUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Approve</span>
            </button>
            <button
              onClick={() => bulkUpdateStatus('Rejected')}
              disabled={isBulkUpdating}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-sm shadow-red-600/20"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Reject</span>
            </button>
            <button
              onClick={() => setCheckedIds(new Set())}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-slate-500 hover:text-gray-900 transition-all"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {Object.entries(filteredGroups).map(([groupName, groupItems]) => (
          <div key={groupName} className="space-y-1">
            <div className="flex items-center">
              <div
                className="p-4 cursor-pointer"
                onClick={(e) => { e.stopPropagation(); toggleGroupCheck(groupItems as BOQItem[]); }}
              >
                <input
                  type="checkbox"
                  readOnly
                  checked={groupItems.every(i => checkedIds.has(i._id!))}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </div>
              <button
                onClick={() => toggleGroup(groupName)}
                className="flex-1 flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  {expandedGroups[groupName] ? <ChevronDown className="w-5 h-5 text-blue-500" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                  <h4 className="font-bold text-gray-900">{groupName}</h4>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-[10px] text-slate-500">{groupItems.length} items</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Group Total</p>
                  <p className="text-sm font-bold text-blue-600">₹{groupItems.reduce((sum, i) => sum + (i.totalCost || 0), 0).toLocaleString()}</p>
                </div>
              </button>
            </div>

            {expandedGroups[groupName] && (
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-4 py-3 w-10"></th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Item #</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Unit</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Qty</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Unit Cost</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Total</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupItems.map((item) => (
                      <tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group/row">
                        <td className="px-4 py-4 w-10">
                          <input
                            type="checkbox"
                            checked={checkedIds.has(item._id!)}
                            onChange={() => toggleCheck(item._id!)}
                            className="w-4 h-4 accent-blue-600 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-4 text-xs font-mono text-slate-500">{item.itemNumber || '-'}</td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-medium text-gray-900">{item.itemDescription}</p>
                          {item.remark && <p className="text-[10px] text-slate-400 mt-1 italic">{item.remark}</p>}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="px-2 py-1 rounded-md bg-gray-100 border border-gray-200 text-[10px] font-bold text-slate-500">
                            {item.unit || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right text-sm font-bold text-slate-600">{item.quantity.toLocaleString()}</td>
                        <td className="px-4 py-4 text-right text-sm font-medium text-slate-500">₹{item.unitCost.toLocaleString()}</td>
                        <td className="px-4 py-4 text-right text-sm font-black text-blue-600">₹{item.totalCost.toLocaleString()}</td>
                        <td className="px-4 py-4 text-center">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                            getStatusStyle(item.status)
                          )}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end space-x-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setSelectedItem(item);
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all"
                              title="Delete item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setHistoryItem(item)}
                              className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-100 rounded-lg transition-all"
                              title="View History"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setApproversItem(item)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                              title="Assign Approvers"
                            >
                              <Users className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      <BOQModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchBOQ}
        projectId={projectId}
        initialData={selectedItem}
      />

      <BOQImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchBOQ}
        projectId={projectId}
      />

      <BOQHistoryModal
        isOpen={!!historyItem}
        onClose={() => setHistoryItem(null)}
        item={historyItem}
        projectId={projectId}
      />

      <BOQApproversModal
        isOpen={!!approversItem}
        onClose={() => setApproversItem(null)}
        onSuccess={fetchBOQ}
        item={approversItem}
        projectId={projectId}
      />
    </div>
  );
};
