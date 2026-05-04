'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ShoppingCart, Plus, Trash2, Calendar, User, DollarSign, FileText } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';

interface MaterialPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
  materials: any[];
}

export const MaterialPurchaseModal: React.FC<MaterialPurchaseModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  projectId,
  materials
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    vendorName: '',
    vendorEmail: '',
    vendorPhone: '',
    poNumber: `PO-${Math.floor(100000 + Math.random() * 900000)}`,
    items: [{ materialId: '', quantity: 0, unit: '', rate: 0 }],
    totalAmount: 0,
    advancePaid: 0,
    deliveryDate: '',
    terms: ''
  });
  
  const toast = useToast();

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { materialId: '', quantity: 0, unit: '', rate: 0 }]
    });
  };

  const removeItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    if (field === 'materialId') {
      const selected = materials.find(m => m._id === value);
      newItems[index] = { ...newItems[index], materialId: value, unit: selected?.unit || '' };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const total = formData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
      await api.post(`/projects/${projectId}/material-purchase`, {
        ...formData,
        totalAmount: total
      });
      toast.success('Purchase Order created successfully!');
      onSuccess();
      onClose();
      setFormData({
        vendorName: '', vendorEmail: '', vendorPhone: '',
        poNumber: `PO-${Math.floor(100000 + Math.random() * 900000)}`,
        items: [{ materialId: '', quantity: 0, unit: '', rate: 0 }],
        totalAmount: 0, advancePaid: 0, deliveryDate: '', terms: ''
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create PO');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-2xl relative z-10"
          >
            <GlassCard className="border-white/10" gradient>
              <div className="p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                      <ShoppingCart className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Create Purchase Order</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Formal procurement request to vendor.</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300 ml-1">Vendor Name</label>
                      <input
                        type="text"
                        required
                        value={formData.vendorName}
                        onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                        placeholder="e.g. UltraTech Cement"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300 ml-1">PO Number</label>
                      <input
                        type="text"
                        disabled
                        value={formData.poNumber}
                        className="w-full bg-slate-950 border border-white/5 rounded-xl py-2 px-4 text-slate-500 text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-300 ml-1">Order Items</label>
                      <button 
                        type="button"
                        onClick={addItem}
                        className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Item</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {formData.items.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-3 items-end bg-white/[0.02] p-3 rounded-xl border border-white/5">
                          <div className="col-span-4 space-y-1">
                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Material</label>
                            <select
                              required
                              value={item.materialId}
                              onChange={(e) => updateItem(index, 'materialId', e.target.value)}
                              className="w-full bg-slate-950 border border-white/5 rounded-lg py-1.5 px-3 text-xs text-white"
                            >
                              <option value="">Select Material</option>
                              {materials.map(m => (
                                <option key={m._id} value={m._id}>{m.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-3 space-y-1">
                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Quantity</label>
                            <div className="flex items-center bg-slate-950 border border-white/5 rounded-lg pr-2">
                              <input
                                type="number"
                                required
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                                className="w-full bg-transparent py-1.5 px-3 text-xs text-white focus:outline-none"
                              />
                              <span className="text-[9px] font-bold text-slate-500 uppercase">{item.unit || '-'}</span>
                            </div>
                          </div>
                          <div className="col-span-3 space-y-1">
                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Rate (₹)</label>
                            <input
                              type="number"
                              required
                              value={item.rate}
                              onChange={(e) => updateItem(index, 'rate', Number(e.target.value))}
                              className="w-full bg-slate-950 border border-white/5 rounded-lg py-1.5 px-3 text-xs text-white"
                            />
                          </div>
                          <div className="col-span-2 flex justify-center pb-1">
                            <button 
                              type="button"
                              onClick={() => removeItem(index)}
                              className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300 ml-1">Expected Delivery</label>
                      <input
                        type="date"
                        required
                        value={formData.deliveryDate}
                        onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300 ml-1">Advance Amount (₹)</label>
                      <input
                        type="number"
                        value={formData.advancePaid}
                        onChange={(e) => setFormData({ ...formData, advancePaid: Number(e.target.value) })}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex space-x-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-all active:scale-[0.98]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-2 py-3 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-blue-600/20 flex items-center justify-center space-x-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Generating PO...</span>
                        </>
                      ) : (
                        <span>Generate PO</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
