'use client';

import React, { useState, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import { ProjectCard } from '@/components/ui/ProjectCard';
import { CreateProjectModal } from '@/components/ui/CreateProjectModal';
import { 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  Loader2,
  FolderOpen
} from 'lucide-react';
import api from '@/lib/api';
import { Project } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<(Project & { hasPendingPlans?: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.clientName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses = ['All', 'Initialized', 'Planning', 'Site Survey', 'In Progress', 'Under Snagging', 'Snagging Completed', 'Completed', 'On Hold', 'Cancelled'];

  return (
    <Shell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Projects</h1>
            <p className="text-slate-400 mt-1">Manage and track your construction projects.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-5 h-5" />
            <span>New Project</span>
          </button>
        </div>

        {/* Toolbar */}
        <GlassCard className="p-4 border-white/5" gradient>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search projects or clients..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-900/50 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-8 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="flex bg-slate-900/50 border border-slate-700/50 rounded-xl p-1">
                <button className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400">
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300">
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Projects Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-400 font-medium">Loading projects...</p>
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-6 rounded-full bg-slate-900/50 border border-white/5 mb-6">
              <FolderOpen className="w-16 h-16 text-slate-700" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No projects found</h3>
            <p className="text-slate-500 max-w-xs">
              {searchQuery || statusFilter !== 'All' 
                ? "We couldn't find any projects matching your criteria." 
                : "Get started by creating your first construction project."}
            </p>
            {!searchQuery && statusFilter === 'All' && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="mt-6 text-blue-400 font-bold hover:text-blue-300 transition-colors"
              >
                Create a project now &rarr;
              </button>
            )}
          </div>
        )}
      </div>

      <CreateProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchProjects}
      />
    </Shell>
  );
}
