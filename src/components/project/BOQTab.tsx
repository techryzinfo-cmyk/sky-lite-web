'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  History, 
  Download, 
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { BOQItem } from '@/types';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { BOQModal } from './BOQModal';
import { BOQImportModal } from './BOQImportModal';

interface BOQTabProps {
  projectId: string;
}

export const BOQTab: React.FC<BOQTabProps> = ({ projectId }) => {
  const [items, setItems] = useState<BOQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BOQItem | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  const toast = useToast();

  const fetchBOQ = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/boq`);
      setItems(response.data);
      
      // Expand all groups by default
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
      case 'Approved': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Pending': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'Rejected': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Loading BOQ data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* BOQ Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6 border-white/5" gradient>
          <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Total BOQ Value</p>
          <p className="text-3xl font-black text-white mt-1">₹{totalBOQAmount.toLocaleString()}</p>
        </GlassCard>
        <GlassCard className="p-6 border-white/5">
          <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Total Items</p>
          <p className="text-3xl font-black text-white mt-1">{items.length}</p>
        </GlassCard>
        <GlassCard className="p-6 border-white/5">
          <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Pending Approval</p>
          <p className="text-3xl font-black text-amber-400 mt-1">
            {items.filter(i => i.status === 'Pending').length}
          </p>
        </GlassCard>
      </div>

      {/* Toolbar */}
      <GlassCard className="p-4 border-white/5" gradient>
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by description or item #..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-all">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-all"
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

      <div className="space-y-4">
        {Object.entries(filteredGroups).map(([groupName, groupItems]) => (
          <div key={groupName} className="space-y-1">
            <button 
              onClick={() => toggleGroup(groupName)}
              className="w-full flex items-center justify-between p-4 bg-slate-900/40 border border-white/5 rounded-xl hover:bg-slate-900/60 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                {expandedGroups[groupName] ? <ChevronDown className="w-5 h-5 text-blue-500" /> : <ChevronRight className="w-5 h-5 text-slate-500" />}
                <h4 className="font-bold text-white">{groupName}</h4>
                <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-slate-500 border border-white/5">{groupItems.length} items</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Group Total</p>
                <p className="text-sm font-bold text-blue-400">₹{groupItems.reduce((sum, i) => sum + (i.totalCost || 0), 0).toLocaleString()}</p>
              </div>
            </button>

            {expandedGroups[groupName] && (
              <div className="overflow-x-auto rounded-xl border border-white/5 bg-slate-900/20">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
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
                      <tr key={item._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group/row">
                        <td className="px-4 py-4 text-xs font-mono text-slate-500">{item.itemNumber || '-'}</td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-medium text-white">{item.itemDescription}</p>
                          {item.remark && <p className="text-[10px] text-slate-500 mt-1 italic">{item.remark}</p>}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold text-slate-400">
                            {item.unit || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right text-sm font-bold text-slate-300">{item.quantity.toLocaleString()}</td>
                        <td className="px-4 py-4 text-right text-sm font-medium text-slate-400">₹{item.unitCost.toLocaleString()}</td>
                        <td className="px-4 py-4 text-right text-sm font-black text-blue-400">₹{item.totalCost.toLocaleString()}</td>
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
                              className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                              <Trash2 className="w-4 h-4" />
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
    </div>
  );
};
