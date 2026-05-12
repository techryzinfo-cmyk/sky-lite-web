'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Search, MoreVertical, ChevronRight,
  Loader2, Layers, IndianRupee, Clock, Layout,
  Eye, Pencil, Trash2, Maximize2, SquareStack,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { TemplateModal } from './TemplateModal';
import { TemplateDetailModal } from './TemplateDetailModal';
import { Pagination, usePagination } from '@/components/ui/Pagination';

export const TemplateList = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [viewTemplateId, setViewTemplateId] = useState<string | null>(null);
  const [templateMenuId, setTemplateMenuId] = useState<string | null>(null);
  const templateMenuRef = useRef<HTMLDivElement>(null);

  const toast = useToast();

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/templates');
      setTemplates(Array.isArray(response.data) ? response.data : response.data?.templates ?? []);
    } catch {
      toast.error('Failed to load project templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  useEffect(() => {
    if (!templateMenuId) return;
    const close = (e: MouseEvent) => {
      if (templateMenuRef.current && !templateMenuRef.current.contains(e.target as Node)) {
        setTemplateMenuId(null);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [templateMenuId]);

  const filteredTemplates = templates.filter(t =>
    t.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { currentPage, totalPages, paginated: pagedTemplates, setCurrentPage } = usePagination(filteredTemplates, 9);

  const handleDelete = async (e: React.MouseEvent, templateId: string, name: string) => {
    e.stopPropagation();
    setTemplateMenuId(null);
    if (!window.confirm(`Delete template "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/templates/${templateId}`);
      toast.success('Template deleted');
      fetchTemplates();
    } catch {
      toast.error('Failed to delete template');
    }
  };

  const openEdit = (template: any) => {
    setTemplateMenuId(null);
    setEditingTemplate(template);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pl-12 pr-4 text-sm text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Create Project Template</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pagedTemplates.map((template) => {
          const coverImage = template.images?.[0];
          return (
            <GlassCard
              key={template._id}
              onClick={() => setViewTemplateId(template._id)}
              className="p-0 border-gray-200 group hover:border-blue-500/50 transition-all cursor-pointer overflow-hidden"
              gradient
            >
              {/* Cover image / fallback */}
              <div className="h-36 relative overflow-hidden">
                {coverImage ? (
                  <img
                    src={coverImage}
                    alt={template.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <Layers className="w-12 h-12 text-blue-400 group-hover:scale-110 transition-transform duration-500" />
                  </div>
                )}

                {/* Category badge over image */}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-[9px] font-black text-blue-700 uppercase tracking-widest border border-blue-100 shadow-sm">
                    {template.category?.name || 'General'}
                  </span>
                </div>

                {/* 3-dot menu */}
                <div
                  className="absolute top-3 right-3"
                  ref={templateMenuId === template._id ? templateMenuRef : null}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); setTemplateMenuId(templateMenuId === template._id ? null : template._id); }}
                    className="p-1.5 rounded-lg bg-white/80 text-slate-500 hover:text-gray-900 backdrop-blur-md border border-gray-200 transition-all"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {templateMenuId === template._id && (
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden">
                      <button
                        onClick={(e) => { e.stopPropagation(); setTemplateMenuId(null); setViewTemplateId(template._id); }}
                        className="w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        View Template
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(template); }}
                        className="w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <Pencil className="w-3.5 h-3.5 text-slate-400" />
                        Edit Details
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, template._id, template.name)}
                        className="w-full px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Template
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Card body */}
              <div className="p-5">
                <h4 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-1 line-clamp-1">
                  {template.name}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4 min-h-[32px]">
                  {template.description || 'No description provided for this template.'}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 py-3 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Budget</p>
                    <p className="text-xs font-bold text-emerald-600">
                      {template.minBudget || template.maxBudget
                        ? `₹${((template.minBudget || 0) / 100000).toFixed(0)}L–₹${((template.maxBudget || 0) / 100000).toFixed(0)}L`
                        : '—'
                      }
                    </p>
                  </div>
                  <div className="text-center border-x border-gray-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Area</p>
                    <p className="text-xs font-bold text-gray-700">
                      {template.area ? `${template.area.toLocaleString()} sqft` : '—'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Days</p>
                    <p className="text-xs font-bold text-gray-700">
                      {template.estimatedDays ? `${template.estimatedDays}d` : '—'}
                    </p>
                  </div>
                </div>

                {/* Image count + View button */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                    <SquareStack className="w-3 h-3" />
                    <span>{template.images?.length || 0} photos</span>
                    {template.files?.length > 0 && (
                      <span className="ml-1">· {template.files.length} files</span>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setViewTemplateId(template._id); }}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    View Details
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </GlassCard>
          );
        })}

        {filteredTemplates.length === 0 && (
          <div className="col-span-full py-40 flex flex-col items-center justify-center text-center">
            <Layout className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-500">No templates found</h3>
            <p className="text-slate-400 mt-1">Start building your project library.</p>
          </div>
        )}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* Create modal */}
      <TemplateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchTemplates}
      />

      {/* Edit modal */}
      <TemplateModal
        isOpen={!!editingTemplate}
        onClose={() => setEditingTemplate(null)}
        onSuccess={() => { fetchTemplates(); setEditingTemplate(null); }}
        initialData={editingTemplate}
        templateId={editingTemplate?._id}
      />

      {/* View modal */}
      <TemplateDetailModal
        isOpen={!!viewTemplateId}
        onClose={() => setViewTemplateId(null)}
        templateId={viewTemplateId}
        onEdit={(t) => { setViewTemplateId(null); setEditingTemplate(t); }}
      />
    </div>
  );
};
