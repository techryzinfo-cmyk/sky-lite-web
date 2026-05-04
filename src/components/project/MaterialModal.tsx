'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Package, Scale, ArrowDownLeft, ArrowUpRight, MessageSquare, Info } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
  initialData?: any;
  mode?: 'create' | 'stock-in' | 'stock-out';
}

export const MaterialModal: React.FC<MaterialModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  projectId, 
  initialData,
  mode = 'create'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    quantity: 0,
    note: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        unit: initialData.unit,
        quantity: 0,
        note: '',
      });
    } else {
      setFormData({
        name: '',
        unit: '',
        quantity: 0,
        note: '',
      });
    }
  }, [initialData, isOpen, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'create') {
        await api.post(`/projects/${projectId}/materials`, {
          name: formData.name,
          unit: formData.unit,
          initialStock: formData.quantity,
        });
        toast.success('Material added successfully!');
      } else {
        // Stock In/Out logic via bulk action or specific endpoint
        // Let's use bulk-action if available or individual update
        const type = mode === 'stock-in' ? 'In' : 'Out';
        await api.post(`/projects/${projectId}/materials/bulk-action`, {
          materialIds: [initialData._id],
          actionType: type,
          quantity: formData.quantity,
          note: formData.note
        });
        toast.success(`Stock ${mode === 'stock-in' ? 'added' : 'removed'} successfully!`);
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to process material');
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    if (mode === 'create') return 'Add New Material';
    if (mode === 'stock-in') return 'Material Stock In';
    return 'Material Stock Out';
  };

  const getIcon = () => {
    if (mode === 'create') return <Package className="w-6 h-6 text-blue-400" />;
    if (mode === 'stock-in') return <ArrowDownLeft className="w-6 h-6 text-emerald-400" />;
    return <ArrowUpRight className="w-6 h-6 text-red-400" />;
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
            className="w-full max-w-md relative z-10"
          >
            <GlassCard className="border-white/10" gradient>
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                      {getIcon()}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{getTitle()}</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Project Inventory Management</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {mode === 'create' ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 ml-1">Material Name</label>
                        <div className="relative group">
                          <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                            placeholder="e.g. Cement, Steel Bars"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-300 ml-1">Unit</label>
                          <div className="relative group">
                            <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                            <input
                              type="text"
                              required
                              value={formData.unit}
                              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                              placeholder="e.g. Bags, kg"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-300 ml-1">Initial Stock</label>
                          <input
                            type="number"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-6">
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Material</span>
                          <span className="text-sm font-black text-white">{initialData.name}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Current Balance</span>
                          <span className="text-sm font-black text-blue-400">{(initialData.totalReceived || 0) - (initialData.totalConsumed || 0)} {initialData.unit}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 ml-1">Quantity to {mode === 'stock-in' ? 'Add' : 'Remove'}</label>
                        <div className="relative group">
                          {mode === 'stock-in' ? <ArrowDownLeft className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" /> : <ArrowUpRight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />}
                          <input
                            type="number"
                            required
                            min="1"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm font-bold"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 ml-1">Note (Optional)</label>
                        <div className="relative group">
                          <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                          <textarea
                            rows={2}
                            value={formData.note}
                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm resize-none"
                            placeholder="Reason for adjustment..."
                          />
                        </div>
                      </div>
                    </div>
                  )}

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
                      disabled={isLoading || (mode !== 'create' && formData.quantity <= 0)}
                      className={cn(
                        "flex-2 py-3 px-8 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg flex items-center justify-center space-x-2",
                        mode === 'stock-in' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' : 
                        mode === 'stock-out' ? 'bg-red-600 hover:bg-red-500 shadow-red-600/20' : 
                        'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
                      )}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <span>{mode === 'create' ? 'Add Material' : mode === 'stock-in' ? 'Confirm Addition' : 'Confirm Removal'}</span>
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
