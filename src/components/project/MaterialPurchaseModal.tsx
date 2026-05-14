'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ShoppingCart, Plus, Trash2, Calendar, User, DollarSign, FileText } from 'lucide-react';
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
    items: [{ materialId: '', quantity: 0, unit: '', unitPrice: 0 }],
    totalAmount: 0,
    advancePaid: 0,
    deliveryDate: '',
    terms: ''
  });

  const toast = useToast();

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { materialId: '', quantity: 0, unit: '', unitPrice: 0 }]
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
      await api.post(`/projects/${projectId}/material-purchase`, {
        vendorName: formData.vendorName,
        poNumber: formData.poNumber,
        advancePayment: formData.advancePaid,
        items: formData.items.map(({ materialId, quantity, unitPrice }) => ({ materialId, quantity, unitPrice })),
      });
      toast.success('Purchase Order created successfully!');
      onSuccess();
      onClose();
      setFormData({
        vendorName: '', vendorEmail: '', vendorPhone: '',
        poNumber: `PO-${Math.floor(100000 + Math.random() * 900000)}`,
        items: [{ materialId: '', quantity: 0, unit: '', unitPrice: 0 }],
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
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-2xl relative z-10"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
              <div className="p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200">
                      <ShoppingCart className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Create Purchase Order</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Formal procurement request to vendor.</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2 text-slate-400 hover:text-gray-900 bg-gray-50 rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600 ml-1">Vendor Name</label>
                      <input
                        type="text"
                        required
                        value={formData.vendorName}
                        onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                        placeholder="e.g. UltraTech Cement"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600 ml-1">PO Number</label>
                      <input
                        type="text"
                        disabled
                        value={formData.poNumber}
                        className="w-full bg-gray-100 border border-gray-200 rounded-xl py-2 px-4 text-slate-400 text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-600 ml-1">Order Items</label>
                      <button
                        type="button"
                        onClick={addItem}
                        className="text-xs font-bold text-blue-600 hover:text-blue-500 flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Item</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {formData.items.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-3 items-end bg-gray-50 p-3 rounded-xl border border-gray-200">
                          <div className="col-span-4 space-y-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Material</label>
                            <select
                              required
                              value={item.materialId}
                              onChange={(e) => updateItem(index, 'materialId', e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                            >
                              <option value="">Select Material</option>
                              {materials.map(m => (
                                <option key={m._id} value={m._id}>{m.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-3 space-y-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Quantity</label>
                            <div className="flex items-center bg-white border border-gray-200 rounded-lg pr-2">
                              <input
                                type="number"
                                required
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                                className="w-full bg-transparent py-1.5 px-3 text-xs text-gray-900 focus:outline-none"
                              />
                              <span className="text-[9px] font-bold text-slate-400 uppercase">{item.unit || '-'}</span>
                            </div>
                          </div>
                          <div className="col-span-3 space-y-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Rate (₹)</label>
                            <input
                              type="number"
                              required
                              value={item.unitPrice}
                              onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))}
                              className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div className="col-span-2 flex justify-center pb-1">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600 ml-1">Expected Delivery</label>
                      <input
                        type="date"
                        required
                        value={formData.deliveryDate}
                        onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600 ml-1">Advance Amount (₹)</label>
                      <input
                        type="number"
                        value={formData.advancePaid}
                        onChange={(e) => setFormData({ ...formData, advancePaid: Number(e.target.value) })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex space-x-4">
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
                          <span>Generating PO...</span>
                        </>
                      ) : (
                        <span>Generate PO</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
