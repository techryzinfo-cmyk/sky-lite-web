'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Upload, FileSpreadsheet, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';

interface BOQImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
}

export const BOQImportModal: React.FC<BOQImportModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  projectId 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  const toast = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/projects/${projectId}/boq/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('BOQ imported successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to import BOQ');
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
            className="w-full max-w-lg relative z-10"
          >
            <GlassCard className="border-white/10" gradient>
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                      <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Import BOQ</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Upload Excel (.xlsx) file to bulk import items.</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-8">
                  <div className="flex space-x-3">
                    <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-blue-400">Template Instructions</p>
                      <p className="text-xs text-blue-300/70 mt-1">Ensure your Excel has: Group, Description, Unit, Quantity, and Rate columns.</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <label className="block border-2 border-dashed border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 rounded-2xl p-10 text-center cursor-pointer transition-all group">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".xlsx, .xls"
                      onChange={handleFileChange}
                    />
                    <div className="flex flex-col items-center">
                      <div className="p-4 rounded-full bg-slate-900 group-hover:bg-emerald-600/10 transition-colors mb-4">
                        <Upload className="w-8 h-8 text-slate-500 group-hover:text-emerald-500" />
                      </div>
                      <p className="text-sm font-bold text-white mb-1">
                        {file ? file.name : 'Click to upload Excel'}
                      </p>
                      <p className="text-xs text-slate-500">Maximum size: 5MB</p>
                    </div>
                  </label>

                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-all active:scale-[0.98]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !file}
                      className="flex-2 py-3 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Importing...</span>
                        </>
                      ) : (
                        <span>Process File</span>
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
