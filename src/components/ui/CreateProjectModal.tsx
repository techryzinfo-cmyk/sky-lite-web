'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Loader2, ChevronLeft, ChevronRight, FolderOpen,
  FileText, Zap, Upload, Trash2, MapPin, Check,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';
import { uploadToCloudinary } from '@/lib/upload';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
  projectId?: string;
}

const inputCls = 'w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all';
const labelCls = 'block text-xs font-bold text-slate-600 mb-1.5 ml-0.5';

const emptyForm = {
  name: '',
  siteLocation: '',
  area: '',
  budget: '',
  priority: 'Medium',
  description: '',
  startDate: '',
  endDate: '',
  needSiteSurvey: false,
  clientName: '',
  clientEmail: '',
  clientPhone: '',
};

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen, onClose, onSuccess, initialData, projectId,
}) => {
  const isEditing = !!initialData && !!projectId;
  const toast = useToast();

  // ── Step state (only for create mode) ──
  const [step, setStep] = useState<'category' | 'template' | 'configure'>('category');
  const [categories, setCategories] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null); // null = custom
  const [isCustom, setIsCustom] = useState(false);
  const [loadingModal, setLoadingModal] = useState(false);

  // ── Form state ──
  const [form, setForm] = useState(emptyForm);
  const [documents, setDocuments] = useState<{ name: string; url: string; size: number; mimeType: string }[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);

  // ── Open effect ──
  React.useEffect(() => {
    if (!isOpen) return;
    if (isEditing) {
      setStep('configure');
      setForm({
        name: initialData.name || '',
        siteLocation: initialData.siteLocation || '',
        area: initialData.area || '',
        budget: '',
        priority: initialData.priority || 'Medium',
        description: initialData.description || '',
        startDate: initialData.startDate ? initialData.startDate.split('T')[0] : '',
        endDate: initialData.endDate ? initialData.endDate.split('T')[0] : '',
        needSiteSurvey: initialData.needSiteSurvey || false,
        clientName: initialData.clientName || '',
        clientEmail: initialData.clientEmail || '',
        clientPhone: initialData.clientPhone || '',
      });
      setDocuments(initialData.documents || []);
    } else {
      setStep('category');
      setForm(emptyForm);
      setDocuments([]);
      setSelectedCategory(null);
      setSelectedTemplate(null);
      setIsCustom(false);
      fetchModalData();
    }
  }, [isOpen]);

  const fetchModalData = async () => {
    setLoadingModal(true);
    try {
      const [catRes, tempRes] = await Promise.all([
        api.get('/template-categories'),
        api.get('/templates'),
      ]);
      setCategories(catRes.data);
      setTemplates(tempRes.data);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoadingModal(false);
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    setUploadingDoc(true);
    try {
      const uploaded = await Promise.all(
        picked.map(async f => {
          const url = await uploadToCloudinary(f);
          return { name: f.name, url, size: f.size, mimeType: f.type };
        })
      );
      setDocuments(prev => [...prev, ...uploaded]);
    } catch {
      toast.error('Document upload failed');
    } finally {
      setUploadingDoc(false);
      e.target.value = '';
    }
  };

  const handleSelectTemplate = (tpl: any) => {
    setSelectedTemplate(tpl);
    setIsCustom(false);
    // Pre-fill form from template
    setForm(f => ({
      ...f,
      name: f.name || tpl.name,
      area: tpl.area?.toString() || f.area,
      budget: tpl.maxBudget?.toString() || f.budget,
    }));
    setStep('configure');
  };

  const handleCustom = () => {
    setIsCustom(true);
    setSelectedTemplate(null);
    setStep('configure');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Project name is required'); return; }
    setIsSubmitting(true);
    try {
      if (isEditing) {
        const { budget, area, ...rest } = form;
        await api.patch(`/projects/${projectId}`, { ...rest });
        toast.success('Project updated successfully!');
      } else {
        const payload: any = {
          name: form.name,
          description: form.siteLocation ? `Location: ${form.siteLocation}` : form.description,
          siteLocation: form.siteLocation,
          area: Number(form.area) || undefined,
          budget: form.budget,
          priority: form.priority,
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
          needSiteSurvey: form.needSiteSurvey,
          clientName: form.clientName,
          clientEmail: form.clientEmail,
          clientPhone: form.clientPhone,
          documents,
        };
        if (selectedTemplate) payload.templateId = selectedTemplate._id;
        await api.post('/projects', payload);
        toast.success('Project created successfully!');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const templatesForCategory = selectedCategory
    ? templates.filter(t => {
        const catId = typeof t.category === 'object' ? t.category?._id : t.category;
        return catId === selectedCategory._id;
      })
    : templates;

  const stepTitle =
    step === 'category' ? 'Select Category' :
    step === 'template' ? 'Select Template' :
    isEditing ? 'Update Details' : 'Configure Setup';

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
            className="w-full max-w-2xl relative z-10"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="p-8">

                {/* ── Header ── */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    {!isEditing && step !== 'category' && (
                      <button
                        onClick={() => setStep(step === 'configure' ? 'template' : 'category')}
                        className="p-2 rounded-xl bg-gray-50 border border-gray-200 text-slate-500 hover:text-gray-900 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    )}
                    <div>
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                        {isEditing ? 'Edit Project' : 'New Project'}
                      </p>
                      <h2 className="text-xl font-black text-gray-900">{stepTitle}</h2>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2 text-slate-400 hover:text-gray-900 bg-gray-50 rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* ── STEP 1: Category ── */}
                {step === 'category' && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500">Choose a project category to get started.</p>
                    {loadingModal ? (
                      <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {categories.map((cat, i) => {
                          const colors = [
                            'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
                            'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100',
                            'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100',
                            'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100',
                            'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
                            'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100',
                          ];
                          const c = colors[i % colors.length];
                          return (
                            <button
                              key={cat._id}
                              onClick={() => { setSelectedCategory(cat); setStep('template'); }}
                              className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 font-bold text-sm transition-all ${c}`}
                            >
                              <FolderOpen className="w-8 h-8" />
                              <span className="text-center leading-tight">{cat.name}</span>
                            </button>
                          );
                        })}
                        {categories.length === 0 && (
                          <div className="col-span-full text-center py-12 text-slate-400">
                            No categories available
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── STEP 2: Template ── */}
                {step === 'template' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                      <FolderOpen className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-sm font-bold text-blue-800">{selectedCategory?.name}</span>
                    </div>
                    <p className="text-sm text-slate-500">Select a template or start with a custom setup.</p>

                    {/* Custom Requirement card */}
                    <button
                      onClick={handleCustom}
                      className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 hover:bg-amber-100 transition-all text-left"
                    >
                      <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
                        <Zap className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-bold text-amber-800">Custom Requirement</p>
                        <p className="text-xs text-amber-600 mt-0.5">Build from scratch without a template</p>
                      </div>
                    </button>

                    {/* Template cards */}
                    {templatesForCategory.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Templates</p>
                        {templatesForCategory.map(tpl => (
                          <button
                            key={tpl._id}
                            onClick={() => handleSelectTemplate(tpl)}
                            className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50/30 transition-all text-left group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 text-sm truncate group-hover:text-blue-700 transition-colors">{tpl.name}</p>
                              {(tpl.area || tpl.estimatedDays) && (
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {tpl.area ? `${tpl.area} sqft` : ''}
                                  {tpl.area && tpl.estimatedDays ? ' · ' : ''}
                                  {tpl.estimatedDays ? `${tpl.estimatedDays} days` : ''}
                                </p>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}

                    {templatesForCategory.length === 0 && (
                      <p className="text-sm text-center text-slate-400 py-4">No templates for this category.</p>
                    )}
                  </div>
                )}

                {/* ── STEP 3: Configure Setup ── */}
                {step === 'configure' && (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Info card */}
                    {!isEditing && (
                      <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                          <FolderOpen className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Category</p>
                          <p className="text-sm font-bold text-gray-900">{selectedCategory?.name || '—'}</p>
                        </div>
                        <div className="w-px h-8 bg-gray-200 mx-2" />
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: isCustom ? '#FEF3C7' : '#EFF6FF' }}>
                          {isCustom ? <Zap className="w-5 h-5 text-amber-600" /> : <FileText className="w-5 h-5 text-blue-600" />}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Configuration</p>
                          <p className="text-sm font-bold text-gray-900">
                            {isCustom ? 'Custom Build' : `Template: ${selectedTemplate?.name}`}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Project Details */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Project Details</h3>

                      <div>
                        <label className={labelCls}>Project Name *</label>
                        <input required type="text" value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          className={inputCls} placeholder="e.g. Skyline Residency"
                        />
                      </div>

                      <div>
                        <label className={labelCls}>Site Location</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input type="text" value={form.siteLocation}
                            onChange={e => setForm(f => ({ ...f, siteLocation: e.target.value }))}
                            className={`${inputCls} pl-10`} placeholder="e.g. 123 Luxury Ave, Mumbai"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Project Area (sqft)</label>
                          <input type="number" value={form.area}
                            onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                            className={inputCls} placeholder="e.g. 2400"
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Budget (₹)</label>
                          <input type="number" value={form.budget}
                            onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                            className={inputCls} placeholder="e.g. 50,00,000"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Start Date</label>
                          <input type="date" value={form.startDate}
                            onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Target End Date</label>
                          <input type="date" value={form.endDate}
                            onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                            className={inputCls}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Priority</label>
                          <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className={inputCls}>
                            {['Low', 'Medium', 'High', 'Urgent'].map(p => <option key={p}>{p}</option>)}
                          </select>
                        </div>
                        <div className="flex items-end pb-1">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <div
                              onClick={() => setForm(f => ({ ...f, needSiteSurvey: !f.needSiteSurvey }))}
                              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${form.needSiteSurvey ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}
                            >
                              {form.needSiteSurvey && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <span className="text-sm font-semibold text-slate-600">Need Site Survey</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className={labelCls}>Description</label>
                        <textarea rows={2} value={form.description}
                          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                          className={`${inputCls} resize-none`} placeholder="Project overview..."
                        />
                      </div>
                    </div>

                    {/* Client Info */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Client Details</h3>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className={labelCls}>Client Name</label>
                          <input type="text" value={form.clientName}
                            onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                            className={inputCls} placeholder="Name"
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Email</label>
                          <input type="email" value={form.clientEmail}
                            onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))}
                            className={inputCls} placeholder="email@example.com"
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Phone</label>
                          <input type="text" value={form.clientPhone}
                            onChange={e => setForm(f => ({ ...f, clientPhone: e.target.value }))}
                            className={inputCls} placeholder="+91 00000 00000"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Documents */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Project Documents</h3>
                        <button
                          type="button" onClick={() => docInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-xl text-xs font-bold text-blue-700 hover:bg-blue-100 transition-all"
                          disabled={uploadingDoc}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Add File</span>
                        </button>
                      </div>
                      <input ref={docInputRef} type="file" multiple className="hidden" onChange={handleDocUpload} />

                      {documents.length > 0 ? (
                        <div className="space-y-2">
                          {documents.map((doc, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4 text-blue-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-900 truncate">{doc.name}</p>
                                <p className="text-[10px] text-slate-400">{(doc.size / 1024).toFixed(1)} KB</p>
                              </div>
                              <button type="button" onClick={() => setDocuments(prev => prev.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          {uploadingDoc && (
                            <div className="flex items-center gap-2 p-3 border border-dashed border-blue-200 rounded-xl text-blue-500">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="text-xs font-semibold">Uploading...</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button" onClick={() => docInputRef.current?.click()}
                          className="w-full border border-dashed border-gray-300 rounded-xl p-5 text-center text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all text-xs font-semibold"
                          disabled={uploadingDoc}
                        >
                          {uploadingDoc ? 'Uploading...' : 'No documents attached. Upload site plans or images.'}
                        </button>
                      )}
                    </div>

                    {/* Submit */}
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-600 font-bold transition-all">
                        Cancel
                      </button>
                      <button
                        type="submit" disabled={isSubmitting || uploadingDoc}
                        className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                      >
                        {isSubmitting
                          ? <><Loader2 className="w-4 h-4 animate-spin" /><span>{isEditing ? 'Saving...' : 'Creating...'}</span></>
                          : <span>{isEditing ? 'Save Changes' : 'Finalize & Create'}</span>
                        }
                      </button>
                    </div>
                  </form>
                )}

              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
