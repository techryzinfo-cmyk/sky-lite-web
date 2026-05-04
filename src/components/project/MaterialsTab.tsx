'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  ShoppingCart, 
  ClipboardList, 
  FileCheck, 
  History, 
  Plus, 
  Search, 
  Loader2,
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  MoreVertical,
  MinusCircle,
  PlusCircle,
  Truck,
  CreditCard,
  Zap
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { MaterialModal } from './MaterialModal';
import { MaterialRequestModal } from './MaterialRequestModal';
import { MaterialReceiptModal } from './MaterialReceiptModal';
import { MaterialPurchaseModal } from './MaterialPurchaseModal';
import { MaterialUsageModal } from './MaterialUsageModal';

interface MaterialsTabProps {
  projectId: string;
}

const subTabs = [
  { id: 'inventory', name: 'Inventory', icon: Package },
  { id: 'requests', name: 'Requests', icon: ClipboardList },
  { id: 'purchase', name: 'Purchase Orders', icon: ShoppingCart },
  { id: 'receipts', name: 'Receipts (GRN)', icon: FileCheck },
  { id: 'usage', name: 'Usage Log', icon: History },
];

export const MaterialsTab: React.FC<MaterialsTabProps> = ({ projectId }) => {
  const [activeSubTab, setActiveSubTab] = useState('inventory');
  const [materials, setMaterials] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [usageLogs, setUsageLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'stock-in' | 'stock-out'>('create');
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);

  const toast = useToast();

  const fetchMaterials = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/materials`);
      setMaterials(response.data);
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Failed to load materials');
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/material-requests`);
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load material requests');
    }
  };

  const fetchReceipts = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/material-receipts`);
      setReceipts(response.data);
    } catch (error) {
      console.error('Error fetching receipts:', error);
      toast.error('Failed to load material receipts');
    }
  };

  const fetchPurchases = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/material-purchase`);
      setPurchases(response.data);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      toast.error('Failed to load purchase orders');
    }
  };

  const fetchUsage = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/material-usage`);
      setUsageLogs(response.data);
    } catch (error) {
      console.error('Error fetching usage:', error);
      toast.error('Failed to load usage logs');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (activeSubTab === 'inventory') {
        await fetchMaterials();
      } else if (activeSubTab === 'requests') {
        await Promise.all([fetchMaterials(), fetchRequests()]);
      } else if (activeSubTab === 'receipts') {
        await Promise.all([fetchMaterials(), fetchReceipts()]);
      } else if (activeSubTab === 'purchase') {
        await Promise.all([fetchMaterials(), fetchPurchases()]);
      } else if (activeSubTab === 'usage') {
        await Promise.all([fetchMaterials(), fetchUsage()]);
      }
      setLoading(false);
    };
    loadData();
  }, [projectId, activeSubTab]);

  return (
    <div className="space-y-6">
      {/* Sub-Tabs */}
      <div className="flex space-x-2 bg-slate-900/40 p-1.5 rounded-2xl border border-white/5 w-fit">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeSubTab === tab.id 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {activeSubTab === 'inventory' && (
        <div className="space-y-6">
          {/* Inventory Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <GlassCard className="p-4 border-white/5" gradient>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total Materials</p>
              <p className="text-2xl font-black text-white mt-1">{materials.length}</p>
            </GlassCard>
            <GlassCard className="p-4 border-white/5">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Low Stock Items</p>
              <p className="text-2xl font-black text-red-400 mt-1">0</p>
            </GlassCard>
            <GlassCard className="p-4 border-white/5">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total Received</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                {materials.reduce((sum, m) => sum + (m.totalReceived || 0), 0)}
              </p>
            </GlassCard>
            <GlassCard className="p-4 border-white/5">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total Consumed</p>
              <p className="text-2xl font-black text-blue-400 mt-1">
                {materials.reduce((sum, m) => sum + (m.totalConsumed || 0), 0)}
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
                  placeholder="Search materials..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
              
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => {
                    setModalMode('create');
                    setSelectedMaterial(null);
                    setIsModalOpen(true);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 border border-blue-500 rounded-xl text-sm font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Material</span>
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Inventory Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
              <p className="text-slate-400 font-medium">Syncing inventory...</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-900/20">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Material Name</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Unit</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Received</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Consumed</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">In Stock</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody>
                  {materials.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase())).map((material) => (
                    <tr key={material._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Package className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{material.name}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Last updated: {new Date(material.updatedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold text-slate-400">
                          {material.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <ArrowDownLeft className="w-3 h-3 text-emerald-500" />
                          <span className="text-sm font-bold text-emerald-400">{material.totalReceived || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <ArrowUpRight className="w-3 h-3 text-red-500" />
                          <span className="text-sm font-bold text-red-400">{material.totalConsumed || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-lg font-black text-white">{(material.totalReceived || 0) - (material.totalConsumed || 0)}</span>
                          <div className="h-1 w-16 bg-slate-800 rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-blue-500 w-full" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setModalMode('stock-in');
                              setSelectedMaterial(material);
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all"
                            title="Stock In"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              setModalMode('stock-out');
                              setSelectedMaterial(material);
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Stock Out"
                          >
                            <MinusCircle className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {materials.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center text-slate-500 italic">
                        No materials in inventory for this project.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'requests' && (
        <div className="space-y-6">
          {/* Toolbar */}
          <GlassCard className="p-4 border-white/5" gradient>
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="flex-1 max-w-md">
                <h3 className="text-lg font-bold text-white">Material Requests</h3>
                <p className="text-xs text-slate-400">Track and manage project material requisitions.</p>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setIsRequestModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 border border-blue-500 rounded-xl text-sm font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Request</span>
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Requests List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
              <p className="text-slate-400 font-medium">Loading requests...</p>
            </div>
          ) : requests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {requests.map((request) => (
                <GlassCard key={request._id} className="p-6 border-white/5 hover:border-blue-500/30 transition-all" gradient>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <ClipboardList className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">REQ-{request._id.slice(-6).toUpperCase()}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{new Date(request.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                      request.status === 'Approved' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 
                      request.status === 'Rejected' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 
                      'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    )}>
                      {request.status}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6">
                    {request.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">{item.materialId?.name || 'Unknown Material'}</span>
                        <span className="font-bold text-white">{item.quantity} {item.unit}</span>
                      </div>
                    ))}
                  </div>

                  {request.commonNote && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 mb-6">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Note</p>
                      <p className="text-xs text-slate-300 italic">"{request.commonNote}"</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                        {request.requestedByName?.charAt(0) || 'U'}
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">{request.requestedByName}</span>
                    </div>
                    <button className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">Details &rarr;</button>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ClipboardList className="w-16 h-16 text-slate-700 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No requests found</h3>
              <p className="text-slate-500 max-w-xs">There are no material requests for this project yet.</p>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'receipts' && (
        <div className="space-y-6">
          {/* Toolbar */}
          <GlassCard className="p-4 border-white/5" gradient>
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="flex-1 max-w-md">
                <h3 className="text-lg font-bold text-white">Material Receipts (GRN)</h3>
                <p className="text-xs text-slate-400">Log and verify incoming material deliveries.</p>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setIsReceiptModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 border border-emerald-500 rounded-xl text-sm font-bold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Log Receipt</span>
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Receipts List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
              <p className="text-slate-400 font-medium">Loading receipts...</p>
            </div>
          ) : receipts.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-900/20">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Receipt Info</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vendor & Docs</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Items Received</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((receipt) => (
                    <tr key={receipt._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-white">GRN-{receipt._id.slice(-6).toUpperCase()}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{new Date(receipt.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center space-x-2">
                            <Truck className="w-3 h-3 text-slate-500" />
                            <span className="text-sm font-medium text-slate-300">{receipt.vendorName}</span>
                          </div>
                          <div className="flex items-center space-x-4 text-[10px] text-slate-500 font-bold uppercase">
                            <span>Challan: {receipt.challanNumber}</span>
                            {receipt.invoiceNumber && <span>Invoice: {receipt.invoiceNumber}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {receipt.items.map((item: any, i: number) => (
                            <span key={i} className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold text-slate-400">
                              {item.materialId?.name || 'Item'}: {item.quantity} {item.unit}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                          receipt.status === 'Verified' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 
                          receipt.status === 'Rejected' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 
                          'text-amber-400 bg-amber-500/10 border-amber-500/20'
                        )}>
                          {receipt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">Verify &rarr;</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FileCheck className="w-16 h-16 text-slate-700 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No receipts found</h3>
              <p className="text-slate-500 max-w-xs">Record incoming material deliveries using the GRN form.</p>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'purchase' && (
        <div className="space-y-6">
          <GlassCard className="p-4 border-white/5" gradient>
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="flex-1 max-w-md">
                <h3 className="text-lg font-bold text-white">Purchase Orders</h3>
                <p className="text-xs text-slate-400">Formal procurement requests to vendors.</p>
              </div>
              <button 
                onClick={() => setIsPurchaseModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 border border-blue-500 rounded-xl text-sm font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create PO</span>
              </button>
            </div>
          </GlassCard>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
              <p className="text-slate-400 font-medium">Loading POs...</p>
            </div>
          ) : purchases.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {purchases.map((po) => (
                <GlassCard key={po._id} className="p-6 border-white/5" gradient>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-sm font-bold text-white">{po.poNumber}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{po.vendorName}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {po.status || 'Active'}
                    </span>
                  </div>
                  <div className="space-y-2 mb-6">
                    {po.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-slate-400">{item.materialId?.name}</span>
                        <span className="text-white font-bold">{item.quantity} {item.unit}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Amount</span>
                      <span className="text-sm font-bold text-emerald-400">₹{po.totalAmount?.toLocaleString()}</span>
                    </div>
                    <button className="text-xs font-bold text-blue-400 hover:text-blue-300">View PO &rarr;</button>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ShoppingCart className="w-16 h-16 text-slate-700 mb-4" />
              <p className="text-slate-500">No purchase orders found.</p>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'usage' && (
        <div className="space-y-6">
          <GlassCard className="p-4 border-white/5" gradient>
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="flex-1 max-w-md">
                <h3 className="text-lg font-bold text-white">Usage Log</h3>
                <p className="text-xs text-slate-400">Track on-site material consumption.</p>
              </div>
              <button 
                onClick={() => setIsUsageModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 border border-purple-500 rounded-xl text-sm font-bold text-white hover:bg-purple-500 shadow-lg shadow-purple-600/20 transition-all"
              >
                <Zap className="w-4 h-4" />
                <span>Log Consumption</span>
              </button>
            </div>
          </GlassCard>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
              <p className="text-slate-400 font-medium">Loading usage logs...</p>
            </div>
          ) : usageLogs.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-900/20">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date & User</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Location / Work</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Materials Consumed</th>
                  </tr>
                </thead>
                <tbody>
                  {usageLogs.map((log) => (
                    <tr key={log._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-white">{new Date(log.createdAt).toLocaleDateString()}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{log.userName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-300 font-medium">{log.location}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{log.workType}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {log.items.map((item: any, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold text-purple-400">
                              {item.materialId?.name}: {item.quantity} {item.unit}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <History className="w-16 h-16 text-slate-700 mb-4" />
              <p className="text-slate-500">No usage logs found.</p>
            </div>
          )}
        </div>
      )}

      <MaterialModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchMaterials}
        projectId={projectId}
        initialData={selectedMaterial}
        mode={modalMode}
      />

      <MaterialRequestModal 
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={fetchRequests}
        projectId={projectId}
        materials={materials}
      />

      <MaterialReceiptModal 
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        onSuccess={fetchReceipts}
        projectId={projectId}
        materials={materials}
      />

      <MaterialPurchaseModal 
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        onSuccess={fetchPurchases}
        projectId={projectId}
        materials={materials}
      />

      <MaterialUsageModal 
        isOpen={isUsageModalOpen}
        onClose={() => setIsUsageModalOpen(false)}
        onSuccess={fetchUsage}
        projectId={projectId}
        materials={materials}
      />
    </div>
  );
};
