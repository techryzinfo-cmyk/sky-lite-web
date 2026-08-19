'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '@/components/layouts/Shell';
import { GlassCard } from '@/components/ui/GlassCard';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { useToast } from '@/providers/ToastContext';
import { useAuth } from '@/providers/AuthContext';
import api from '@/services/api.client';
import {
  ArrowLeft, Search, Plus, Pencil, Trash2, X, Loader2,
  Building2, User, Mail, Phone,
} from 'lucide-react';

interface Vendor {
  _id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phoneNumber?: string;
  status: 'Active' | 'Inactive';
}

export default function VendorManagementPage() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth() as any;
  const isAdmin = user?.role?.name === 'Admin' || (user?.role?.permissions?.includes('*') ?? false);

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({ name: '', contactPerson: '', email: '', phoneNumber: '' });

  const fetchVendors = async () => {
    try {
      const res = await api.get('/vendors');
      setVendors(res.data || []);
    } catch {
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVendors(); }, []);

  const openCreate = () => {
    setEditingVendor(null);
    setFormData({ name: '', contactPerson: '', email: '', phoneNumber: '' });
    setIsModalOpen(true);
  };

  const openEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      contactPerson: vendor.contactPerson || '',
      email: vendor.email || '',
      phoneNumber: vendor.phoneNumber || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Vendor name is required');
      return;
    }
    setIsSaving(true);
    try {
      if (editingVendor) {
        const res = await api.put(`/vendors/${editingVendor._id}`, formData);
        setVendors(prev => prev.map(v => v._id === editingVendor._id ? res.data : v));
        toast.success('Vendor updated successfully');
      } else {
        const res = await api.post('/vendors', formData);
        setVendors(prev => [res.data, ...prev]);
        toast.success('Vendor created successfully');
      }
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingVendor) return;
    setIsDeleting(true);
    try {
      await api.delete(`/vendors/${deletingVendor._id}`);
      setVendors(prev => prev.filter(v => v._id !== deletingVendor._id));
      toast.success('Vendor deleted successfully');
      setDeletingVendor(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete vendor');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredVendors = useMemo(() => {
    return vendors.filter(v =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.contactPerson || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [vendors, searchQuery]);

  return (
    <Shell>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-11 h-11 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Vendor Management</h1>
              <p className="text-gray-500 mt-1">Suppliers and vendor settings.</p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-2xl text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              Add Vendor
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pl-11 pr-4 text-sm text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Vendor list */}
        {loading ? (
          <div className="py-24 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : filteredVendors.length === 0 ? (
          <GlassCard className="p-16 text-center border-gray-200">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-slate-500 font-bold">No vendors found.</p>
            <p className="text-slate-400 text-sm mt-1">
              {isAdmin ? 'Add your first vendor to get started.' : 'No vendors have been added yet.'}
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVendors.map(vendor => (
              <GlassCard key={vendor._id} className="p-5 border-gray-200" gradient>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-gray-900 truncate">{vendor.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        vendor.status === 'Active'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-gray-100 border-gray-200 text-slate-500'
                      }`}>
                        {vendor.status}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      {vendor.contactPerson && (
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                          <User className="w-3 h-3 text-slate-400" /> {vendor.contactPerson}
                        </p>
                      )}
                      {vendor.email && (
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-400" /> {vendor.email}
                        </p>
                      )}
                      {vendor.phoneNumber && (
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" /> {vendor.phoneNumber}
                        </p>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => openEdit(vendor)}
                        className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingVendor(vendor)}
                        className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-100 hover:border-red-200 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="w-full max-w-md relative z-10">
            <GlassCard className="border-gray-200" gradient>
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900">
                    {editingVendor ? 'Update Vendor' : 'Add Vendor'}
                  </h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-gray-900 bg-gray-50 rounded-xl transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Vendor Name *</label>
                    <input
                      type="text" required value={formData.name}
                      onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                      className="w-full mt-1.5 bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="e.g. Acme Corp"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Contact Person</label>
                    <input
                      type="text" value={formData.contactPerson}
                      onChange={e => setFormData(f => ({ ...f, contactPerson: e.target.value }))}
                      className="w-full mt-1.5 bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email" value={formData.email}
                      onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                      className="w-full mt-1.5 bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="e.g. john@acme.com"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Phone Number</label>
                    <input
                      type="tel" value={formData.phoneNumber}
                      onChange={e => setFormData(f => ({ ...f, phoneNumber: e.target.value }))}
                      className="w-full mt-1.5 bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="e.g. +1 234 567 8900"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                  >
                    {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving...</span></> : <span>{editingVendor ? 'Save Changes' : 'Add Vendor'}</span>}
                  </button>
                </form>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingVendor}
        onClose={() => setDeletingVendor(null)}
        onConfirm={handleDelete}
        title="Delete Vendor"
        message={`Are you sure you want to remove "${deletingVendor?.name}"? This cannot be undone.`}
        confirmText="Delete"
        type="danger"
        isLoading={isDeleting}
      />
    </Shell>
  );
}
