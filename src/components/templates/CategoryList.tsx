'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  MoreVertical,
  Folder,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Layers
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';

export const CategoryList = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const toast = useToast();

  const fetchCategories = async () => {
    try {
      const response = await api.get('/template-categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load template categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) return;

    setIsCreating(true);
    try {
      await api.post('/template-categories', { name: newCategoryName });
      toast.success('Category created successfully!');
      setNewCategoryName('');
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create category');
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Categorizing systems...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <GlassCard className="p-8 border-gray-200" gradient>
        <form onSubmit={handleCreate} className="flex flex-col md:flex-row items-end gap-6">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-bold text-slate-600 ml-1">New Category Name</label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g. Residential, Infrastructure, Commercial..."
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isCreating}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20 flex items-center space-x-2"
          >
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>Add Category</span>
          </button>
        </form>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((cat) => (
          <GlassCard key={cat._id} className="p-6 border-gray-200 group hover:border-blue-500/50 transition-all" gradient>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-blue-100 border border-blue-200">
                <Folder className="w-6 h-6 text-blue-600" />
              </div>
              <button className="p-2 text-slate-400 hover:text-gray-900 transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
            <h4 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{cat.name}</h4>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Layers className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cat.templateCount || 0} Blueprints</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </div>
          </GlassCard>
        ))}

        {categories.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-slate-500 italic">No categories defined yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
