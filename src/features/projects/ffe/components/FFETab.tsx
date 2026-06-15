'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus, Loader2, Sofa, Trash2, Edit2, X, Check,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/services/api.client';
import { useToast } from '@/providers/ToastContext';
import { useAuth } from '@/providers/AuthContext';

const FFE_CATEGORIES = ['Furniture', 'Fixture', 'Equipment', 'Appliance', 'Lighting', 'Decor', 'Sanitary', 'Other'] as const;
const FFE_STATUSES = ['Planned', 'Ordered', 'Delivered', 'Installed', 'Rejected'] as const;

const STATUS_META: Record<string, { color: string; bg: string }> = {
  Planned:   { color: 'text-slate-600',   bg: 'bg-slate-100' },
  Ordered:   { color: 'text-blue-700',    bg: 'bg-blue-50' },
  Delivered: { color: 'text-purple-700',  bg: 'bg-purple-50' },
  Installed: { color: 'text-emerald-700', bg: 'bg-emerald-50' },
  Rejected:  { color: 'text-red-700',     bg: 'bg-red-50' },
};

const emptyForm = {
  name: '', category: 'Furniture' as typeof FFE_CATEGORIES[number],
  quantity: 1, unit: 'nos', unitCost: '',
  status: 'Planned' as typeof FFE_STATUSES[number],
  brand: '', modelNo: '', supplier: '', finish: '', colorCode: '', dimensions: '', notes: '',
  room: '',
};

interface FFETabProps {
  projectId: string;
  project?: any;
}

export const FFETab: React.FC<FFETabProps> = ({ projectId, project }) => {
  const [items, setItems] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role?.permissions?.includes('*');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ffeRes, roomsRes] = await Promise.allSettled([
        api.get(`/projects/${projectId}/ffe`),
        api.get(`/projects/${projectId}/rooms`),
      ]);
      if (ffeRes.status === 'fulfilled') setItems(ffeRes.value.data || []);
      if (roomsRes.status === 'fulfilled') setRooms(roomsRes.value.data || []);
    } catch {
      toast.error('Failed to load FFE items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [projectId]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      name: item.name || '', category: item.category || 'Furniture',
      quantity: item.quantity || 1, unit: item.unit || 'nos', unitCost: item.unitCost?.toString() || '',
      status: item.status || 'Planned',
      brand: item.brand || '', modelNo: item.modelNo || '', supplier: item.supplier || '',
      finish: item.finish || '', colorCode: item.colorCode || '', dimensions: item.dimensions || '',
      notes: item.notes || '', room: item.room?._id || item.room || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Item name is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        unitCost: form.unitCost !== '' ? Number(form.unitCost) : undefined,
        room: form.room || undefined,
      };
      if (editing) {
        await api.patch(`/projects/${projectId}/ffe/${editing._id}`, payload);
        toast.success('FFE item updated');
      } else {
        await api.post(`/projects/${projectId}/ffe`, payload);
        toast.success('FFE item added');
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: any) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    try {
      await api.delete(`/projects/${projectId}/ffe/${item._id}`);
      toast.success('Item deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete item');
    }
  };

  // Derived stats
  const totalCost = items.reduce((s, i) => s + ((i.unitCost || 0) * (i.quantity || 1)), 0);
  const installed = items.filter(i => i.status === 'Installed').length;
  const installPct = items.length > 0 ? Math.round((installed / items.length) * 100) : 0;

  const statusCounts = FFE_STATUSES.reduce((acc, s) => {
    acc[s] = items.filter(i => i.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  const filtered = filterStatus === 'All' ? items : items.filter(i => i.status === filterStatus);

  const inputCls = 'w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all';

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-5">
      {/* Summary banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Items</p>
          <p className="text-2xl font-black text-gray-900">{items.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Cost</p>
          <p className="text-2xl font-black text-gray-900">
            {totalCost >= 1_000_000 ? `$${(totalCost / 1_000_000).toFixed(1)}M` : totalCost >= 1000 ? `$${(totalCost / 1000).toFixed(1)}K` : `$${totalCost}`}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Installed</p>
          <p className="text-2xl font-black text-emerald-600">{installed} / {items.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Progress</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${installPct}%` }} />
            </div>
            <span className="text-sm font-black text-gray-900">{installPct}%</span>
          </div>
        </div>
      </div>

      {/* Status filter + Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-2 flex-wrap flex-1">
          {['All', ...FFE_STATUSES].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                'px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors',
                filterStatus === s
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-200 text-slate-500 hover:border-blue-300'
              )}
            >
              {s}
              {s !== 'All' && <span className="ml-1 opacity-60">({statusCounts[s] || 0})</span>}
            </button>
          ))}
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-sm shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        )}
      </div>

      {/* Item list */}
      <div className="space-y-3">
        {filtered.map(item => {
          const totalItem = (item.unitCost || 0) * (item.quantity || 1);
          const sm = STATUS_META[item.status] || STATUS_META.Planned;
          const roomName = rooms.find(r => r._id === (item.room?._id || item.room))?.name;
          const isExpanded = expandedId === item._id;
          return (
            <div key={item._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <Sofa className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900 text-sm truncate">{item.name}</p>
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', sm.color, sm.bg)}>{item.status}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-slate-500">{item.category}</span>
                    {roomName && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700">{roomName}</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Qty: {item.quantity} {item.unit} · {item.unitCost ? `$${item.unitCost}/unit · Total: $${totalItem.toLocaleString()}` : 'No cost set'}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setExpandedId(isExpanded ? null : item._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-gray-700 hover:bg-gray-50 transition-colors">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {isAdmin && (
                    <>
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              {isExpanded && (
                <div className="border-t border-gray-100 px-4 pb-4 pt-3 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-slate-600">
                  {item.brand && <div><span className="font-bold text-slate-400">Brand:</span> {item.brand}</div>}
                  {item.modelNo && <div><span className="font-bold text-slate-400">Model:</span> {item.modelNo}</div>}
                  {item.supplier && <div><span className="font-bold text-slate-400">Supplier:</span> {item.supplier}</div>}
                  {item.finish && <div><span className="font-bold text-slate-400">Finish:</span> {item.finish}</div>}
                  {item.colorCode && <div><span className="font-bold text-slate-400">Color:</span> {item.colorCode}</div>}
                  {item.dimensions && <div><span className="font-bold text-slate-400">Dimensions:</span> {item.dimensions}</div>}
                  {item.notes && <div className="col-span-full"><span className="font-bold text-slate-400">Notes:</span> {item.notes}</div>}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-2xl">
            <Sofa className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-slate-400 font-semibold">No FFE items{filterStatus !== 'All' ? ` with status "${filterStatus}"` : ''}</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-900">{editing ? 'Edit FFE Item' : 'Add FFE Item'}</h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1">Item Name *</label>
                    <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="e.g. Executive Desk" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Category</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))} className={inputCls}>
                      {FFE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Status</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))} className={inputCls}>
                      {FFE_STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Quantity</label>
                    <input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Unit</label>
                    <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className={inputCls} placeholder="nos" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Unit Cost ($)</label>
                    <input type="number" min="0" value={form.unitCost} onChange={e => setForm(f => ({ ...f, unitCost: e.target.value }))} className={inputCls} placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Assign to Room</label>
                    <select value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} className={inputCls}>
                      <option value="">— None —</option>
                      {rooms.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                    </select>
                  </div>
                </div>

                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Specifications (optional)</p>
                <div className="grid grid-cols-2 gap-3">
                  {([['brand', 'Brand'], ['modelNo', 'Model No.'], ['supplier', 'Supplier'], ['finish', 'Finish'], ['colorCode', 'Color/Code'], ['dimensions', 'Dimensions']] as [keyof typeof emptyForm, string][]).map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-xs font-bold text-slate-600 mb-1">{label}</label>
                      <input value={form[key] as string} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className={inputCls} placeholder={label} />
                    </div>
                  ))}
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1">Notes</label>
                    <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={`${inputCls} resize-none`} />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-600 font-bold text-sm transition-all">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {editing ? 'Save Changes' : 'Add Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
