'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Loader2, Tag, Hash, Scale, IndianRupee,
  MessageSquare, Plus, Trash2, Layout
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';
import { BOQItem } from '@/types';

interface BOQModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
  initialData: BOQItem | null;
}

interface RowItem {
  id: string;
  itemNumber: string;
  itemDescription: string;
  unit: string;
  quantity: number;
  unitCost: number;
  remark: string;
}

const emptyRow = (): RowItem => ({
  id: Math.random().toString(36).slice(2),
  itemNumber: '',
  itemDescription: '',
  unit: '',
  quantity: 0,
  unitCost: 0,
  remark: '',
});

export const BOQModal: React.FC<BOQModalProps> = ({
  isOpen, onClose, onSuccess, projectId, initialData
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // ── Edit mode (single item) ──
  const [editForm, setEditForm] = useState({
    groupName: '',
    itemNumber: '',
    itemDescription: '',
    unit: '',
    quantity: 0,
    unitCost: 0,
    remark: '',
  });

  // ── Create mode (multi-row) ──
  const [groupName, setGroupName] = useState('');
  const [rows, setRows] = useState<RowItem[]>([emptyRow()]);

  useEffect(() => {
    if (initialData) {
      setEditForm({
        groupName: initialData.groupName,
        itemNumber: initialData.itemNumber || '',
        itemDescription: initialData.itemDescription,
        unit: initialData.unit || '',
        quantity: initialData.quantity,
        unitCost: initialData.unitCost,
        remark: initialData.remark || '',
      });
    } else {
      setGroupName('');
      setRows([emptyRow()]);
    }
  }, [initialData, isOpen]);

  const updateRow = (id: string, field: keyof RowItem, value: string | number) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const lastRowValid = (r: RowItem) =>
    r.itemDescription.trim() !== '' && Number(r.quantity) > 0 && Number(r.unitCost) > 0;

  const addRow = () => {
    if (!lastRowValid(rows[rows.length - 1])) return;
    setRows(prev => [...prev, emptyRow()]);
  };
  const removeRow = (id: string) => setRows(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev);

  const grandTotal = rows.reduce((s, r) => s + (Number(r.quantity) || 0) * (Number(r.unitCost) || 0), 0);
  const editTotal = (Number(editForm.quantity) || 0) * (Number(editForm.unitCost) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (initialData) {
        await api.patch(`/projects/${projectId}/boq/${initialData._id}`, editForm);
        toast.success('BOQ item updated');
      } else {
        const items = rows.map(({ id: _id, ...r }) => ({
          ...r,
          groupName,
          quantity: Number(r.quantity),
          unitCost: Number(r.unitCost),
        }));
        await api.post(`/projects/${projectId}/boq`, { items });
        toast.success(`${items.length} item${items.length > 1 ? 's' : ''} added to BOQ`);
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save BOQ item');
    } finally {
      setIsLoading(false);
    }
  };

  const fieldCls = "w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-4xl relative z-10 max-h-[90vh] flex flex-col"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {initialData ? 'Edit BOQ Item' : 'Add BOQ Items'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {initialData ? 'Update item details.' : 'Set a group name then add as many items as you need.'}
                  </p>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-gray-900 bg-gray-50 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                  {/* ── EDIT MODE ── */}
                  {initialData && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Group Name</label>
                          <div className="relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input required value={editForm.groupName} onChange={e => setEditForm({ ...editForm, groupName: e.target.value })}
                              className={fieldCls + ' pl-9'} placeholder="e.g. Concrete Works" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Item # (Optional)</label>
                          <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input value={editForm.itemNumber} onChange={e => setEditForm({ ...editForm, itemNumber: e.target.value })}
                              className={fieldCls + ' pl-9'} placeholder="e.g. CW-01" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                        <div className="relative">
                          <Layout className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                          <textarea required rows={2} value={editForm.itemDescription}
                            onChange={e => setEditForm({ ...editForm, itemDescription: e.target.value })}
                            className={fieldCls + ' pl-9 resize-none'} placeholder="Detailed item description..." />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit</label>
                          <div className="relative">
                            <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input value={editForm.unit} onChange={e => setEditForm({ ...editForm, unit: e.target.value })}
                              className={fieldCls + ' pl-9'} placeholder="Cum" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantity</label>
                          <input required type="number" min={0} value={editForm.quantity}
                            onChange={e => setEditForm({ ...editForm, quantity: Number(e.target.value) })}
                            className={fieldCls} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit Cost (₹)</label>
                          <input required type="number" min={0} value={editForm.unitCost}
                            onChange={e => setEditForm({ ...editForm, unitCost: Number(e.target.value) })}
                            className={fieldCls} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Remark</label>
                        <div className="relative">
                          <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input value={editForm.remark} onChange={e => setEditForm({ ...editForm, remark: e.target.value })}
                            className={fieldCls + ' pl-9'} placeholder="Optional note..." />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-50 border border-blue-200">
                        <div className="flex items-center gap-2 text-blue-600">
                          <IndianRupee className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Total</span>
                        </div>
                        <span className="text-xl font-black text-gray-900">₹{editTotal.toLocaleString()}</span>
                      </div>
                    </>
                  )}

                  {/* ── CREATE MODE ── */}
                  {!initialData && (
                    <>
                      {/* Group name (shared) */}
                      <div className="flex items-end gap-4">
                        <div className="flex-1 space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Group Name</label>
                          <div className="relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                              required
                              value={groupName}
                              onChange={e => setGroupName(e.target.value)}
                              className={fieldCls + ' pl-9'}
                              placeholder="e.g. Concrete Works, Steel Works…"
                            />
                          </div>
                        </div>
                        <div className="shrink-0 pb-0.5">
                          <p className="text-xs text-slate-400">{rows.length} item{rows.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>

                      {/* Items table */}
                      <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full text-sm min-w-[780px]">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-20">Item #</th>
                              <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description *</th>
                              <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-20">Unit</th>
                              <th className="px-3 py-2.5 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider w-24">Qty *</th>
                              <th className="px-3 py-2.5 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider w-28">Unit Cost *</th>
                              <th className="px-3 py-2.5 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider w-28">Total</th>
                              <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-28">Remark</th>
                              <th className="w-10" />
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row, idx) => {
                              const rowTotal = (Number(row.quantity) || 0) * (Number(row.unitCost) || 0);
                              return (
                                <tr key={row.id} className="border-b border-gray-100 last:border-0">
                                  <td className="px-2 py-2">
                                    <input
                                      value={row.itemNumber}
                                      onChange={e => updateRow(row.id, 'itemNumber', e.target.value)}
                                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                      placeholder={`${idx + 1}`}
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <input
                                      required
                                      value={row.itemDescription}
                                      onChange={e => updateRow(row.id, 'itemDescription', e.target.value)}
                                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                      placeholder="Item description..."
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <input
                                      value={row.unit}
                                      onChange={e => updateRow(row.id, 'unit', e.target.value)}
                                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                      placeholder="Sqm"
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <input
                                      type="number" min={0} required
                                      value={row.quantity || ''}
                                      onChange={e => updateRow(row.id, 'quantity', e.target.value)}
                                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-right text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                      placeholder="0"
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <input
                                      type="number" min={0} required
                                      value={row.unitCost || ''}
                                      onChange={e => updateRow(row.id, 'unitCost', e.target.value)}
                                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-right text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                      placeholder="0"
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-right text-xs font-bold text-blue-600 tabular-nums">
                                    ₹{rowTotal.toLocaleString()}
                                  </td>
                                  <td className="px-2 py-2">
                                    <input
                                      value={row.remark}
                                      onChange={e => updateRow(row.id, 'remark', e.target.value)}
                                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                      placeholder="Note…"
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <button
                                      type="button"
                                      onClick={() => removeRow(row.id)}
                                      disabled={rows.length === 1}
                                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-0 disabled:pointer-events-none"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Add row + grand total */}
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={addRow}
                          disabled={!lastRowValid(rows[rows.length - 1])}
                          className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-xl text-xs font-bold transition-all disabled:border-gray-200 disabled:text-gray-300 disabled:cursor-not-allowed enabled:border-gray-300 enabled:text-slate-500 enabled:hover:border-blue-400 enabled:hover:bg-blue-50/40 enabled:hover:text-blue-600"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Another Item
                        </button>
                        <div className="flex items-center gap-3 px-5 py-2.5 bg-blue-50 border border-blue-200 rounded-xl">
                          <IndianRupee className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Grand Total</span>
                          <span className="text-lg font-black text-gray-900">₹{grandTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-600 text-sm font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                  >
                    {isLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                      : initialData
                        ? 'Update Item'
                        : `Add ${rows.length} Item${rows.length > 1 ? 's' : ''} to BOQ`
                    }
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
