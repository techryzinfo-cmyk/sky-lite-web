'use client';

import React, { useState } from 'react';
import {
  IndianRupee,
  History,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import { Project } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';

interface BudgetTabProps {
  project: Project;
  onUpdate: () => void;
}

export const BudgetTab: React.FC<BudgetTabProps> = ({ project, onUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    newBudget: '',
    budgetReason: '',
  });

  const toast = useToast();

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      await api.put(`/projects/${project._id}`, {
        newBudget: formData.newBudget,
        budgetReason: formData.budgetReason,
      });
      toast.success('Budget updated successfully!');
      onUpdate();
      setShowForm(false);
      setFormData({ newBudget: '', budgetReason: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update budget');
    } finally {
      setIsUpdating(false);
    }
  };

  const currentBudget = project.budgetHistory?.[project.budgetHistory.length - 1]?.amount || 0;
  const previousBudget = project.budgetHistory?.[project.budgetHistory.length - 2]?.amount || 0;
  const budgetChange = currentBudget - previousBudget;
  const percentChange = previousBudget !== 0 ? (budgetChange / previousBudget) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Budget Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6 border-gray-200" gradient>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Current Budget</p>
              <p className="text-3xl font-black text-gray-900 mt-1">₹{currentBudget.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-100 border border-emerald-200">
              <IndianRupee className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-2">
            {budgetChange >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span className={cn(
              "text-xs font-bold",
              budgetChange >= 0 ? "text-emerald-600" : "text-red-600"
            )}>
              {Math.abs(percentChange).toFixed(1)}% {budgetChange >= 0 ? 'increase' : 'decrease'}
            </span>
            <span className="text-xs text-slate-500">from previous version</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6 border-gray-200">
          <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Total Variations</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{project.budgetHistory?.length || 0}</p>
          <p className="text-xs text-slate-400 mt-4 italic">Approved variations in project lifecycle.</p>
        </GlassCard>

        <GlassCard className="p-6 border-gray-200 flex flex-col justify-center items-center text-center">
          {!showForm ? (
            <>
              <p className="text-sm text-slate-500 mb-4">Need to revise project budget?</p>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 border border-blue-500 rounded-xl text-sm font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Request Revision</span>
              </button>
            </>
          ) : (
            <div className="w-full space-y-4">
              <h4 className="text-sm font-bold text-gray-900">New Budget Revision</h4>
              <form onSubmit={handleUpdateBudget} className="space-y-3">
                <input
                  type="number"
                  required
                  placeholder="New Amount (₹)"
                  value={formData.newBudget}
                  onChange={(e) => setFormData({ ...formData, newBudget: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 text-sm text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <input
                  type="text"
                  required
                  placeholder="Reason for revision..."
                  value={formData.budgetReason}
                  onChange={(e) => setFormData({ ...formData, budgetReason: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 text-sm text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-2 text-xs font-bold text-slate-500 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1 py-2 bg-blue-600 rounded-lg text-xs font-bold text-white disabled:opacity-50"
                  >
                    {isUpdating ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Budget History */}
      <GlassCard className="p-8 border-gray-200" gradient>
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-2 rounded-lg bg-blue-100 border border-blue-200">
            <History className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Budget History & Audit Log</h3>
        </div>

        <div className="space-y-8 relative">
          <div className="absolute left-[21px] top-2 bottom-2 w-px bg-gray-200"></div>

          {project.budgetHistory?.slice().reverse().map((entry, index) => (
            <div key={index} className="relative pl-12">
              <div className={cn(
                "absolute left-0 top-0 w-11 h-11 rounded-2xl border flex items-center justify-center bg-white z-10 shadow-sm",
                entry.approvalStatus === 'Approved' ? 'border-emerald-200' : 'border-amber-200'
              )}>
                {entry.approvalStatus === 'Approved' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Clock className="w-5 h-5 text-amber-500" />
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:bg-gray-50 transition-all group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg font-black text-gray-900">₹{entry.amount.toLocaleString()}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                        entry.approvalStatus === 'Approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                      )}>
                        {entry.approvalStatus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Updated by <span className="text-blue-600 font-bold">{entry.updatedByName}</span> on {new Date(entry.timestamp).toLocaleDateString()} at {new Date(entry.timestamp).toLocaleTimeString()}</p>
                  </div>
                  <button className="flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-gray-900 transition-colors">
                    <span>View Audit</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-sm text-slate-500 italic">"{entry.reason}"</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};
