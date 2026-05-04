'use client';

import React, { useState } from 'react';
import { Layers, Plus, Search, Filter, LayoutGrid, List } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { TemplateList } from '@/components/templates/TemplateList';
import { CategoryList } from '@/components/templates/CategoryList';

export default function TemplatesPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'categories'>('templates');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Project Templates</h1>
          <p className="text-slate-400 mt-2 text-lg">Standardize your workflows with reusable project blueprints.</p>
        </div>

        <div className="flex p-1 bg-slate-900/50 border border-white/5 rounded-2xl">
          <button 
            onClick={() => setActiveTab('templates')}
            className={cn(
              "flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === 'templates' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Templates</span>
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={cn(
              "flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === 'categories' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <List className="w-4 h-4" />
            <span>Categories</span>
          </button>
        </div>
      </div>

      <div className="min-h-[600px]">
        {activeTab === 'templates' ? <TemplateList /> : <CategoryList />}
      </div>
    </div>
  );
}
