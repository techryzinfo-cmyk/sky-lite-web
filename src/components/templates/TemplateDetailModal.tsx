'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, FileText, DollarSign, Loader2, Tag, Copy } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';

interface TemplateDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string | null;
}

export const TemplateDetailModal: React.FC<TemplateDetailModalProps> = ({
  isOpen,
  onClose,
  templateId,
}) => {
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const toast = useToast();

  const handleDuplicate = async () => {
    if (!templateId) return;
    setDuplicating(true);
    try {
      await api.post(`/templates/${templateId}/duplicate`);
      toast.success('Template duplicated successfully');
      onClose();
    } catch {
      toast.error('Failed to duplicate template');
    } finally {
      setDuplicating(false);
    }
  };

  useEffect(() => {
    if (isOpen && templateId) {
      setLoading(true);
      api.get(`/templates/${templateId}`)
        .then(res => setTemplate(res.data))
        .catch(() => toast.error('Failed to load template details'))
        .finally(() => setLoading(false));
    } else {
      setTemplate(null);
    }
  }, [isOpen, templateId]);

  const totalAmount = template?.boqItems?.reduce(
    (sum: number, item: any) => sum + (item.quantity * item.unitRate || 0),
    0
  ) ?? 0;

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
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
                    <Layers className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {loading ? 'Loading...' : (template?.name || 'Template')}
                    </h2>
                    {template && (
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 border border-blue-200 text-[9px] font-black text-blue-700 uppercase tracking-widest">
                          {template.category?.name || 'General'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">v{template.version || '1.0'}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-gray-900 bg-gray-50 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="overflow-y-auto flex-1">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
                    <p className="text-slate-500 font-medium text-sm">Loading BOQ...</p>
                  </div>
                ) : template ? (
                  <div className="p-6 space-y-6">
                    {template.description && (
                      <p className="text-sm text-slate-600 leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100">
                        {template.description}
                      </p>
                    )}

                    {/* Summary stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">BOQ Items</p>
                        <p className="text-2xl font-black text-gray-900">{template.boqItems?.length || 0}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Est. Budget</p>
                        <p className="text-2xl font-black text-emerald-600">
                          ₹{(template.estimatedBudget || totalAmount).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">BOQ Total</p>
                        <p className="text-2xl font-black text-blue-600">₹{totalAmount.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* BOQ Table */}
                    {template.boqItems?.length > 0 ? (
                      <div className="rounded-2xl border border-gray-200 overflow-hidden">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">#</th>
                              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</th>
                              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Unit</th>
                              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Qty</th>
                              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Rate (₹)</th>
                              <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Amount (₹)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {template.boqItems.map((item: any, i: number) => (
                              <tr key={item._id || i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 text-xs font-bold text-slate-400">{i + 1}</td>
                                <td className="px-4 py-3">
                                  <p className="text-sm font-semibold text-gray-900">{item.description}</p>
                                  {item.specifications && (
                                    <p className="text-[11px] text-slate-500 mt-0.5">{item.specifications}</p>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-600 text-center">{item.unit}</td>
                                <td className="px-4 py-3 text-xs font-semibold text-gray-900 text-right">{item.quantity}</td>
                                <td className="px-4 py-3 text-xs font-semibold text-gray-900 text-right">
                                  {item.unitRate?.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm font-bold text-emerald-600 text-right">
                                  {((item.quantity || 0) * (item.unitRate || 0)).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gray-50 border-t-2 border-gray-200">
                              <td colSpan={5} className="px-4 py-3 text-sm font-black text-gray-900 uppercase tracking-wider">
                                Total
                              </td>
                              <td className="px-4 py-3 text-sm font-black text-emerald-600 text-right">
                                ₹{totalAmount.toLocaleString()}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <div className="py-12 text-center border border-dashed border-gray-200 rounded-2xl">
                        <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm">No BOQ items in this template.</p>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-gray-100 transition-all"
                >
                  Close
                </button>
                {template && (
                  <button
                    onClick={handleDuplicate}
                    disabled={duplicating}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20"
                  >
                    {duplicating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                    <span>Duplicate Template</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
