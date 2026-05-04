'use client';

import React, { useState, useEffect } from 'react';
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
  Layout
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { TemplateModal } from './TemplateModal';

export const TemplateList = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Assembling blueprints...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Create Blueprint</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <GlassCard key={template._id} className="p-0 border-white/5 group hover:border-blue-500/30 transition-all cursor-pointer overflow-hidden" gradient>
            {/* Header Image / Placeholder */}
            <div className="h-32 bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center relative">
              <Layers className="w-12 h-12 text-blue-500/40 group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute top-4 right-4">
                <button className="p-2 rounded-lg bg-slate-950/40 text-slate-400 hover:text-white backdrop-blur-md border border-white/10 transition-all">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center space-x-2 mb-3">
                <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[9px] font-black text-blue-400 uppercase tracking-widest">
                  {template.category?.name || 'General'}
                </span>
                <div className="w-1 h-1 rounded-full bg-slate-700" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">v{template.version || '1.0'}</span>
              </div>
              
              <h4 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors mb-2">{template.name}</h4>
              <p className="text-sm text-slate-500 line-clamp-2 mb-6">{template.description || 'No description provided for this blueprint.'}</p>

              <div className="grid grid-cols-2 gap-4 py-4 border-t border-white/5">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">BOQ Items</p>
                  <div className="flex items-center space-x-1.5 text-white font-bold">
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    <span>{template.boqItems?.length || 0} Items</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Est. Budget</p>
                  <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>{template.estimatedBudget?.toLocaleString() || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button className="flex-1 py-3 px-4 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-bold hover:bg-blue-600 hover:text-white transition-all">
                  Use Template
                </button>
                <button className="p-3 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-all">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </GlassCard>
        ))}

        {filteredTemplates.length === 0 && (
          <div className="col-span-full py-40 flex flex-col items-center justify-center text-center">
            <Layout className="w-16 h-16 text-slate-700 mb-4" />
            <h3 className="text-xl font-bold text-slate-500">No templates found</h3>
            <p className="text-slate-600 mt-1">Start building your project library.</p>
          </div>
        )}
      </div>

      <TemplateModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTemplates}
      />
    </div>
  );
};
