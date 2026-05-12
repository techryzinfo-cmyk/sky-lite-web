'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  MoreVertical,
  Copy,
  ChevronRight,
  Loader2,
  Layers,
  Tag,
  DollarSign,
  FileText,
  Clock,
  Layout,
  Trash2
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailTemplateId, setDetailTemplateId] = useState<string | null>(null);
  const [templateMenuId, setTemplateMenuId] = useState<string | null>(null);
  const templateMenuRef = useRef<HTMLDivElement>(null);

  const toast = useToast();

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load project templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

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
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { currentPage, totalPages, paginated: pagedTemplates, setCurrentPage } = usePagination(filteredTemplates, 9);

  const handleDeleteTemplate = async (e: React.MouseEvent, templateId: string, templateName: string) => {
    e.stopPropagation();
    setTemplateMenuId(null);
    if (!window.confirm(`Delete template "${templateName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/templates/${templateId}`);
      toast.success('Template deleted');
      fetchTemplates();
    } catch {
      toast.error('Failed to delete template');
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    try {
      await api.post(`/templates/${templateId}/duplicate`);
      toast.success('Template duplicated');
      fetchTemplates();
    } catch {
      toast.error('Failed to duplicate template');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Assembling blueprints...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Create Project Template</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pagedTemplates.map((template) => (
          <GlassCard key={template._id} onClick={() => setDetailTemplateId(template._id)} className="p-0 border-gray-200 group hover:border-blue-500/50 transition-all cursor-pointer overflow-hidden" gradient>
            <div className="h-32 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center relative">
              <Layers className="w-12 h-12 text-blue-400 group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute top-4 right-4" ref={templateMenuId === template._id ? templateMenuRef : null}>
                <button
                  onClick={(e) => { e.stopPropagation(); setTemplateMenuId(templateMenuId === template._id ? null : template._id); }}
                  className="p-2 rounded-lg bg-white/80 text-slate-500 hover:text-gray-900 backdrop-blur-md border border-gray-200 transition-all"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {templateMenuId === template._id && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden">
                    <button
                      onClick={(e) => handleDuplicate(e, template._id)}
                      className="w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-600 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Duplicate</span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteTemplate(e, template._id, template.name)}
                      className="w-full px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center space-x-2 mb-3">
                <span className="px-2 py-0.5 rounded-md bg-blue-100 border border-blue-200 text-[9px] font-black text-blue-700 uppercase tracking-widest">
                  {template.category?.name || 'General'}
                </span>
                <div className="w-1 h-1 rounded-full bg-gray-300" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">v{template.version || '1.0'}</span>
              </div>

              <h4 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">{template.name}</h4>
              <p className="text-sm text-slate-500 line-clamp-2 mb-6">{template.description || 'No description provided for this blueprint.'}</p>

              <div className="grid grid-cols-2 gap-4 py-4 border-t border-gray-100">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BOQ Items</p>
                  <div className="flex items-center space-x-1.5 text-gray-900 font-bold">
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    <span>{template.boqItems?.length || 0} Items</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Budget</p>
                  <div className="flex items-center space-x-1.5 text-emerald-600 font-bold">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>{template.estimatedBudget?.toLocaleString() || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={(e) => { e.stopPropagation(); setDetailTemplateId(template._id); }}
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
                >
                  View Details
                </button>
                <button
                  onClick={(e) => handleDuplicate(e, template._id)}
                  title="Duplicate template"
                  className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </GlassCard>
        ))}

        {filteredTemplates.length === 0 && (
          <div className="col-span-full py-40 flex flex-col items-center justify-center text-center">
            <Layout className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-500">No templates found</h3>
            <p className="text-slate-400 mt-1">Start building your project library.</p>
          </div>
        )}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      <TemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTemplates}
      />

      <TemplateDetailModal
        isOpen={!!detailTemplateId}
        onClose={() => setDetailTemplateId(null)}
        templateId={detailTemplateId}
      />
    </div>
  );
};
