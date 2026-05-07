'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Layers, Plus, Trash2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    estimatedBudget: 0,
    boqItems: [] as any[]
  });

  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      const fetchCategories = async () => {
        try {
          const response = await api.get('/template-categories');
          setCategories(response.data);
        } catch (error) {
          console.error('Error fetching categories:', error);
        }
      };
      fetchCategories();
    }
  }, [isOpen]);

  const addBOQItem = () => {
    setFormData({
      ...formData,
      boqItems: [...formData.boqItems, { groupName: 'General', description: '', unit: 'Sq.Ft', quantity: 1, rate: 0 }]
    });
  };

  const removeBOQItem = (index: number) => {
    const newItems = [...formData.boqItems];
    newItems.splice(index, 1);
    setFormData({ ...formData, boqItems: newItems });
  };

  const updateBOQItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.boqItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, boqItems: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.post('/templates', formData);
      toast.success('Blueprint created successfully!');
      onSuccess();
      onClose();
      setFormData({ name: '', category: '', description: '', estimatedBudget: 0, boqItems: [] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create template');
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
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-3xl relative z-10"
          >
            <GlassCard className="border-gray-200" gradient>
              <div className="p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
                      <Layers className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Design New Blueprint</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Create a reusable project template.</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2 text-slate-400 hover:text-gray-900 bg-gray-50 rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600 ml-1">Template Name</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                          placeholder="e.g. Standard 2BHK Villa"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600 ml-1">Category</label>
                        <select
                          required
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                        >
                          <option value="">Select Category</option>
                          {categories.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600 ml-1">Description</label>
                        <textarea
                          rows={3}
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm resize-none transition-all"
                          placeholder="What does this blueprint include?"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                      <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Base BOQ Structure</h3>
                      <button
                        type="button"
                        onClick={addBOQItem}
                        className="text-xs font-bold text-blue-600 hover:text-blue-500 flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Item</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {formData.boqItems.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-3 items-end bg-gray-50 p-3 rounded-xl border border-gray-200">
                          <div className="col-span-3 space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Group</label>
                            <input
                              type="text"
                              value={item.groupName}
                              onChange={(e) => updateBOQItem(index, 'groupName', e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-400"
                            />
                          </div>
                          <div className="col-span-5 space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateBOQItem(index, 'description', e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-400"
                            />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Est. Rate</label>
                            <input
                              type="number"
                              value={item.rate}
                              onChange={(e) => updateBOQItem(index, 'rate', Number(e.target.value))}
                              className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-400"
                            />
                          </div>
                          <div className="col-span-2 flex justify-center pb-1.5">
                            <button
                              type="button"
                              onClick={() => removeBOQItem(index)}
                              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {formData.boqItems.length === 0 && (
                        <div className="py-8 text-center border border-dashed border-gray-200 rounded-2xl">
                          <p className="text-xs text-slate-400">No BOQ structure added yet.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 flex space-x-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-600 font-medium transition-all active:scale-[0.98]"
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
                          <span>Architecting...</span>
                        </>
                      ) : (
                        <span>Publish Blueprint</span>
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
