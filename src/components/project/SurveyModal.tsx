'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Loader2,
  Map,
  Zap,
  Droplets,
  Mountain,
  MessageSquare,
  DollarSign,
  AlertTriangle,
  Info
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface SurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
}

export const SurveyModal: React.FC<SurveyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projectId
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    accessibility: 'Good',
    powerAvailable: false,
    waterAvailable: false,
    terrainNotes: '',
    surveyorComments: '',
    affectsBudget: false,
    recommendedBudget: 0,
    budgetReason: ''
  });

  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.post(`/projects/${projectId}/survey`, {
        accessibility: formData.accessibility,
        powerAvailability: formData.powerAvailable ? 'Available' : 'Not Available',
        waterAvailability: formData.waterAvailable ? 'Available' : 'Not Available',
        terrainType: formData.terrainNotes,
        notes: formData.surveyorComments,
        budgetRecommendation: formData.recommendedBudget || undefined,
      });
      toast.success('Site survey submitted successfully!');
      onSuccess();
      onClose();
      setFormData({
        accessibility: 'Good',
        powerAvailable: false,
        waterAvailable: false,
        terrainNotes: '',
        surveyorComments: '',
        affectsBudget: false,
        recommendedBudget: 0,
        budgetReason: ''
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit survey');
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
            <GlassCard className="border-gray-200" gradient>
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
                      <Map className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Record Site Survey</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Physical terrain and resource assessment.</p>
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
                        <label className="text-sm font-medium text-slate-600 ml-1">Accessibility</label>
                        <select
                          value={formData.accessibility}
                          onChange={(e) => setFormData({ ...formData, accessibility: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                        >
                          <option value="Good">Good (Easy vehicle access)</option>
                          <option value="Fair">Fair (Minor obstacles)</option>
                          <option value="Poor">Poor (Difficult terrain)</option>
                          <option value="Hazardous">Hazardous (Special equipment needed)</option>
                        </select>
                      </div>

                      <div className="flex space-x-4">
                        <label className={cn(
                          "flex-1 p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center space-y-2",
                          formData.powerAvailable ? "bg-amber-50 border-amber-300 text-amber-600" : "bg-gray-50 border-gray-200 text-slate-400"
                        )}>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={formData.powerAvailable}
                            onChange={(e) => setFormData({ ...formData, powerAvailable: e.target.checked })}
                          />
                          <Zap className="w-6 h-6" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Power Ready</span>
                        </label>

                        <label className={cn(
                          "flex-1 p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center space-y-2",
                          formData.waterAvailable ? "bg-blue-50 border-blue-300 text-blue-600" : "bg-gray-50 border-gray-200 text-slate-400"
                        )}>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={formData.waterAvailable}
                            onChange={(e) => setFormData({ ...formData, waterAvailable: e.target.checked })}
                          />
                          <Droplets className="w-6 h-6" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Water Ready</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600 ml-1">Terrain Notes</label>
                        <textarea
                          required
                          rows={2}
                          value={formData.terrainNotes}
                          onChange={(e) => setFormData({ ...formData, terrainNotes: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all resize-none"
                          placeholder="Soil type, slope, clearing needed..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600 ml-1">Surveyor Comments</label>
                        <textarea
                          rows={2}
                          value={formData.surveyorComments}
                          onChange={(e) => setFormData({ ...formData, surveyorComments: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all resize-none"
                          placeholder="General observations..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className={cn(
                    "p-4 rounded-2xl border transition-all",
                    formData.affectsBudget ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"
                  )}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className={cn("p-2 rounded-lg", formData.affectsBudget ? "bg-red-100" : "bg-gray-100")}>
                          <DollarSign className={cn("w-4 h-4", formData.affectsBudget ? "text-red-600" : "text-slate-400")} />
                        </div>
                        <span className="text-sm font-bold text-gray-900">Affects Project Budget?</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, affectsBudget: !formData.affectsBudget })}
                        className={cn(
                          "w-12 h-6 rounded-full relative transition-all",
                          formData.affectsBudget ? "bg-red-600" : "bg-gray-300"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                          formData.affectsBudget ? "right-1" : "left-1"
                        )} />
                      </button>
                    </div>

                    {formData.affectsBudget && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Estimated Impact Amt</label>
                          <input
                            type="number"
                            required
                            value={formData.recommendedBudget}
                            onChange={(e) => setFormData({ ...formData, recommendedBudget: Number(e.target.value) })}
                            className="w-full bg-white border border-red-200 rounded-xl py-2 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Reason for Budget Impact</label>
                          <input
                            type="text"
                            required
                            value={formData.budgetReason}
                            onChange={(e) => setFormData({ ...formData, budgetReason: e.target.value })}
                            className="w-full bg-white border border-red-200 rounded-xl py-2 px-4 text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 text-sm"
                            placeholder="e.g. Extra clearing needed"
                          />
                        </div>
                      </div>
                    )}
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
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <span>Submit Audit</span>
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
