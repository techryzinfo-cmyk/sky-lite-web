'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  UserPlus,
  MoreVertical,
  Mail,
  Shield,
  Clock,
  Loader2,
  XCircle,
  Filter,
  Pencil,
  Trash2,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { UserModal } from './UserModal';
import { Pagination, usePagination } from '@/components/ui/Pagination';

export const UserList = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toast = useToast();

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      await api.delete(`/users/${deletingUser._id}`);
      toast.success(`${deletingUser.name} has been removed`);
      setDeletingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove user');
    } finally {
      setIsDeleting(false);
    }
  };

  const openEdit = (user: any) => {
    setEditingUser(user);
    setOpenMenuId(null);
    setIsModalOpen(true);
  };

  const openDelete = (user: any) => {
    setDeletingUser(user);
    setOpenMenuId(null);
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { currentPage, totalPages, paginated: pagedUsers, setCurrentPage } = usePagination(filteredUsers, 9);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Syncing directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pl-12 pr-4 text-sm text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center space-x-3">
          <button className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-slate-400 hover:text-gray-900 transition-all">
            <Filter className="w-5 h-5" />
          </button>
          <button
            onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Onboard User</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pagedUsers.map((user) => (
          <GlassCard key={user._id} className="p-6 border-gray-200 group hover:border-blue-500/50 transition-all" gradient>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xl font-black text-white shadow-lg shadow-blue-600/20">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{user.name}</h4>
                  <div className="flex items-center space-x-1.5 mt-1">
                    <Shield className="w-3 h-3 text-blue-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em]">
                      {typeof user.role === 'object' ? user.role?.name : user.role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative" ref={openMenuId === user._id ? menuRef : null}>
                <button
                  onClick={() => setOpenMenuId(openMenuId === user._id ? null : user._id)}
                  className="p-2 text-slate-400 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                {openMenuId === user._id && (
                  <div className="absolute right-0 top-9 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                    <button
                      onClick={() => openEdit(user)}
                      className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-slate-400" />
                      <span>Edit Member</span>
                    </button>
                    <button
                      onClick={() => openDelete(user)}
                      className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-slate-500">
                <Mail className="w-4 h-4" />
                <span className="text-sm truncate">{user.email}</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-500">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active</span>
              </div>
              <button
                onClick={() => openEdit(user)}
                className="text-[10px] font-black text-blue-600 hover:text-blue-500 uppercase tracking-widest transition-colors"
              >
                Edit Profile
              </button>
            </div>
          </GlassCard>
        ))}

        {filteredUsers.length === 0 && (
          <div className="col-span-full py-40 flex flex-col items-center justify-center text-center">
            <XCircle className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-500">No users found</h3>
            <p className="text-slate-400 mt-1">Try adjusting your search query.</p>
          </div>
        )}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      <UserModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingUser(null); }}
        onSuccess={fetchUsers}
        initialData={editingUser}
      />

      <ConfirmModal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDelete}
        title="Remove Team Member"
        message={`Are you sure you want to remove ${deletingUser?.name}? This action cannot be undone.`}
        confirmText="Remove"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
