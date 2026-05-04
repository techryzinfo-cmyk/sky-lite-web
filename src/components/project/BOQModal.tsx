'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Info, Layout, Tag, Hash, Scale, IndianRupee, MessageSquare } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
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

export const BOQModal: React.FC<BOQModalProps> = ({ isOpen, onClose, onSuccess, projectId, initialData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const [formData, setFormData] = useState({
    groupName: '',
    itemNumber: '',
    itemDescription: '',
    unit: '',
    quantity: 0,
    unitCost: 0,
    remark: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        groupName: initialData.groupName,
        itemNumber: initialData.itemNumber || '',
        itemDescription: initialData.itemDescription,
        unit: initialData.unit || '',
        quantity: initialData.quantity,
        unitCost: initialData.unitCost,
        remark: initialData.remark || '',
      });
    } else {
      setFormData({
        groupName: '',
        itemNumber: '',
        itemDescription: '',
        unit: '',
        quantity: 0,
        unitCost: 0,
        remark: '',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (initialData) {
        await api.patch(`/projects/${projectId}/boq/${initialData._id}`, formData);
        toast.success('BOQ item updated successfully!');
      } else {
        await api.post(`/projects/${projectId}/boq`, { items: [formData] });
        toast.success('BOQ item added successfully!');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save BOQ item');
    } finally {
      setIsLoading(false);
    }
  };

  const totalCost = (Number(formData.quantity) || 0) * (Number(formData.unitCost) || 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
            className="w-full max-w-lg relative z-10"
          >
            <GlassCard className="border-white/10" gradient>
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{initialData ? 'Edit BOQ Item' : 'Add BOQ Item'}</h2>
                    <p className="text-sm text-slate-400 mt-1">Specify item details for project costing.</p>
                  </div>
                  <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300 ml-1">Group Name</label>
                      <div className="relative group">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                        <input
                          type="text"
                          required
                          value={formData.groupName}
                          onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                          className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                          placeholder="e.g. Concrete Works"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300 ml-1">Item # (Optional)</label>
                      <div className="relative group">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                        <input
                          type="text"
                          value={formData.itemNumber}
                          onChange={(e) => setFormData({ ...formData, itemNumber: e.target.value })}
                          className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                          placeholder="e.g. CW-01"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Description</label>
                    <div className="relative group">
                      <Layout className="absolute left-3 top-3 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                      <textarea
                        required
                        rows={3}
                        value={formData.itemDescription}
                        onChange={(e) => setFormData({ ...formData, itemDescription: e.target.value })}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm resize-none"
                        placeholder="Detailed item description..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300 ml-1">Unit</label>
                      <div className="relative group">
                        <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                        <input
                          type="text"
                          value={formData.unit}
                          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                          className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                          placeholder="e.g. Cum"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300 ml-1">Quantity</label>
                      <input
                        type="number"
                        required
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300 ml-1">Unit Cost (₹)</label>
                      <input
                        type="number"
                        required
                        value={formData.unitCost}
                        onChange={(e) => setFormData({ ...formData, unitCost: Number(e.target.value) })}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <IndianRupee className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Calculated Total</span>
                    </div>
                    <span className="text-lg font-black text-white">₹{totalCost.toLocaleString()}</span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Remark (Optional)</label>
                    <div className="relative group">
                      <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="text"
                        value={formData.remark}
                        onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                        placeholder="Any additional notes..."
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
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>{initialData ? 'Update Item' : 'Add to BOQ'}</span>
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
