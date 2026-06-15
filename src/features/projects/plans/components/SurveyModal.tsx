'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Loader2, Map, Zap, Droplets, Mountain,
  DollarSign, Home, Wind, Ruler,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useToast } from '@/providers/ToastContext';
import api from '@/services/api.client';
import { cn } from '@/lib/utils';

interface SurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
  projectType?: 'Construction' | 'Interior';
}

const Toggle = ({ checked, onChange, label, subLabel, icon: Icon, activeColor = 'bg-blue-50 border-blue-300 text-blue-600' }: any) => (
  <label className={cn(
    'flex-1 p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-2',
    checked ? activeColor : 'bg-gray-50 border-gray-200 text-slate-400'
  )}>
    <input type="checkbox" className="hidden" checked={checked} onChange={e => onChange(e.target.checked)} />
    <Icon className="w-5 h-5" />
    <div className="text-center">
      <p className="text-[10px] font-black uppercase tracking-widest leading-tight">{label}</p>
      {subLabel && <p className="text-[9px] opacity-60 mt-0.5 leading-tight">{subLabel}</p>}
    </div>
  </label>
);

export const SurveyModal: React.FC<SurveyModalProps> = ({
  isOpen, onClose, onSuccess, projectId, projectType = 'Construction',
}) => {
  const isInterior = projectType === 'Interior';
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Common fields
  const [accessibility, setAccessibility] = useState('Good');
  const [powerAvailable, setPowerAvailable] = useState(false);
  const [waterAvailable, setWaterAvailable] = useState(false);
  const [notes, setNotes] = useState('');
  const [affectsBudget, setAffectsBudget] = useState(false);
  const [recommendedBudget, setRecommendedBudget] = useState('');
  const [budgetReason, setBudgetReason] = useState('');

  // Construction-only
  const [terrainNotes, setTerrainNotes] = useState('');

  // Interior-only
  const [roomCount, setRoomCount] = useState('');
  const [ceilingHeight, setCeilingHeight] = useState('');
  const [naturalLighting, setNaturalLighting] = useState('Good');
  const [ventilationAvailable, setVentilationAvailable] = useState(false);
  const [structuralModNeeded, setStructuralModNeeded] = useState(false);
  const [structuralNotes, setStructuralNotes] = useState('');
  const [clientStylePref, setClientStylePref] = useState('');

  const reset = () => {
    setAccessibility('Good'); setPowerAvailable(false); setWaterAvailable(false);
    setNotes(''); setAffectsBudget(false); setRecommendedBudget(''); setBudgetReason('');
    setTerrainNotes(''); setRoomCount(''); setCeilingHeight('');
    setNaturalLighting('Good'); setVentilationAvailable(false);
    setStructuralModNeeded(false); setStructuralNotes(''); setClientStylePref('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload: any = {
        accessibility,
        powerAvailability: powerAvailable ? 'Available' : 'Not Available',
        waterAvailability: waterAvailable ? 'Available' : 'Not Available',
        notes,
        budgetRecommendation: affectsBudget && recommendedBudget ? Number(recommendedBudget) : undefined,
        budgetReason: affectsBudget ? budgetReason : undefined,
        projectType,
      };

      if (isInterior) {
        payload.roomCount           = roomCount ? Number(roomCount) : undefined;
        payload.ceilingHeight       = ceilingHeight || undefined;
        payload.naturalLighting     = naturalLighting;
        payload.ventilationAvailable = ventilationAvailable;
        payload.structuralModNeeded = structuralModNeeded;
        payload.structuralNotes     = structuralModNeeded ? structuralNotes : undefined;
        payload.clientStylePref     = clientStylePref || undefined;
      } else {
        payload.terrainNotes = terrainNotes;
      }

      await api.post(`/projects/${projectId}/survey`, payload);
      toast.success(`${isInterior ? 'Interior space' : 'Site'} survey submitted!`);
      onSuccess();
      onClose();
      reset();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit survey');
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls = 'w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all';

  const accessibilityOptions = isInterior
    ? ['Good', 'Fair', 'Poor', 'Needs Work']
    : ['Good', 'Fair', 'Poor', 'Hazardous'];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-2xl relative z-10 max-h-[90vh] overflow-y-auto"
          >
            <GlassCard className="border-gray-200" gradient>
              <div className="p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-3 rounded-2xl border', isInterior ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200')}>
                      {isInterior ? <Home className="w-6 h-6 text-purple-600" /> : <Map className="w-6 h-6 text-blue-600" />}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {isInterior ? 'Interior Space Survey' : 'Record Site Survey'}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isInterior ? 'Space condition & design assessment' : 'Physical terrain and resource assessment'}
                      </p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2 text-slate-400 hover:text-gray-900 bg-gray-50 rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Section: Conditions & Utilities */}
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      {isInterior ? 'Space & Condition Assessment' : 'Conditions & Utilities'}
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-slate-600 ml-1 mb-1 block">
                          {isInterior ? 'Overall Space Condition' : 'Overall Accessibility'}
                        </label>
                        <select value={accessibility} onChange={e => setAccessibility(e.target.value)} className={inputCls}>
                          {accessibilityOptions.map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-3">
                        <Toggle checked={powerAvailable} onChange={setPowerAvailable} icon={Zap}
                          label={isInterior ? 'Electrical Points' : 'Power Ready'}
                          subLabel={isInterior ? 'Outlets accessible' : 'Grid connection'}
                          activeColor="bg-amber-50 border-amber-300 text-amber-600"
                        />
                        <Toggle checked={waterAvailable} onChange={setWaterAvailable} icon={Droplets}
                          label={isInterior ? 'Plumbing Access' : 'Water Ready'}
                          subLabel={isInterior ? 'Kitchen/bath lines' : 'Municipal/well'}
                          activeColor="bg-blue-50 border-blue-300 text-blue-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Construction-only: Terrain */}
                  {!isInterior && (
                    <div>
                      <label className="text-sm font-medium text-slate-600 ml-1 mb-1 block">Terrain / Soil Notes</label>
                      <textarea required rows={2} value={terrainNotes} onChange={e => setTerrainNotes(e.target.value)}
                        className={`${inputCls} resize-none`} placeholder="Soil type, slope, clearing needed..." />
                    </div>
                  )}

                  {/* Interior-only sections */}
                  {isInterior && (
                    <>
                      {/* Room Details */}
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Room Details</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-slate-600 ml-1 mb-1 block">Room Count</label>
                            <input type="number" min="1" value={roomCount} onChange={e => setRoomCount(e.target.value)}
                              className={inputCls} placeholder="e.g. 8" />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-slate-600 ml-1 mb-1 block">Ceiling Height</label>
                            <input type="text" value={ceilingHeight} onChange={e => setCeilingHeight(e.target.value)}
                              className={inputCls} placeholder="e.g. 3.2m" />
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="text-sm font-medium text-slate-600 ml-1 mb-1 block">Natural Lighting</label>
                          <div className="grid grid-cols-4 gap-2">
                            {['Excellent', 'Good', 'Limited', 'None'].map(o => (
                              <button key={o} type="button" onClick={() => setNaturalLighting(o)}
                                className={cn('py-2 rounded-xl border text-xs font-bold transition-all',
                                  naturalLighting === o ? 'bg-amber-50 border-amber-400 text-amber-700' : 'bg-gray-50 border-gray-200 text-slate-500 hover:border-gray-300'
                                )}>{o}</button>
                            ))}
                          </div>
                        </div>
                        <div className="mt-3 flex gap-3">
                          <Toggle checked={ventilationAvailable} onChange={setVentilationAvailable} icon={Wind}
                            label="Ventilation / AC" subLabel="Existing HVAC" activeColor="bg-cyan-50 border-cyan-300 text-cyan-600" />
                        </div>
                      </div>

                      {/* Structural & Design */}
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Structural & Design</p>
                        <div className={cn('p-4 rounded-2xl border transition-all', structuralModNeeded ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200')}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-900">Structural Modifications Needed?</span>
                            <button type="button" onClick={() => setStructuralModNeeded(v => !v)}
                              className={cn('w-12 h-6 rounded-full relative transition-all', structuralModNeeded ? 'bg-orange-500' : 'bg-gray-300')}>
                              <div className={cn('absolute top-1 w-4 h-4 rounded-full bg-white transition-all', structuralModNeeded ? 'right-1' : 'left-1')} />
                            </button>
                          </div>
                          {structuralModNeeded && (
                            <textarea rows={2} value={structuralNotes} onChange={e => setStructuralNotes(e.target.value)}
                              className={`${inputCls} mt-3 resize-none`} placeholder="Describe structural changes required..." />
                          )}
                        </div>
                        <div className="mt-3">
                          <label className="text-sm font-medium text-slate-600 ml-1 mb-1 block">Client Style Preference</label>
                          <textarea rows={2} value={clientStylePref} onChange={e => setClientStylePref(e.target.value)}
                            className={`${inputCls} resize-none`} placeholder="e.g. Modern minimalist, warm tones, open-plan..." />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Surveyor Comments (common) */}
                  <div>
                    <label className="text-sm font-medium text-slate-600 ml-1 mb-1 block">Surveyor Comments</label>
                    <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                      className={`${inputCls} resize-none`} placeholder="General observations..." />
                  </div>

                  {/* Budget Impact (common) */}
                  <div className={cn('p-4 rounded-2xl border transition-all', affectsBudget ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200')}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className={cn('w-4 h-4', affectsBudget ? 'text-red-600' : 'text-slate-400')} />
                        <span className="text-sm font-bold text-gray-900">Affects Initial Budget?</span>
                      </div>
                      <button type="button" onClick={() => setAffectsBudget(v => !v)}
                        className={cn('w-12 h-6 rounded-full relative transition-all', affectsBudget ? 'bg-red-600' : 'bg-gray-300')}>
                        <div className={cn('absolute top-1 w-4 h-4 rounded-full bg-white transition-all', affectsBudget ? 'right-1' : 'left-1')} />
                      </button>
                    </div>
                    {affectsBudget && (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Estimated Impact ($)</label>
                          <input type="number" required value={recommendedBudget} onChange={e => setRecommendedBudget(e.target.value)}
                            className="w-full bg-white border border-red-200 rounded-xl py-2 px-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Reason</label>
                          <input type="text" required value={budgetReason} onChange={e => setBudgetReason(e.target.value)}
                            className="w-full bg-white border border-red-200 rounded-xl py-2 px-3 text-gray-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                            placeholder="e.g. Extra structural work" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-600 font-medium transition-all">Cancel</button>
                    <button type="submit" disabled={isLoading}
                      className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
                      {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Submitting...</span></> : <span>Submit Assessment</span>}
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
