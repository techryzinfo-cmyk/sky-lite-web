'use client';

import React from 'react';
import { Menu, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { GlobalSearch } from '@/components/ui/GlobalSearch';
import { NotificationCenter } from '@/components/ui/NotificationCenter';
import Link from 'next/link';

interface TopnavProps {
  onMenuClick: () => void;
}

export const Topnav: React.FC<TopnavProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 fixed top-0 right-0 left-0 lg:left-64 bg-white border-b border-gray-200 z-30 transition-all">
      <div className="h-full px-4 lg:px-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-slate-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          <GlobalSearch />
        </div>

        <div className="flex items-center space-x-2 md:space-x-3">
          <NotificationCenter />

          <div className="h-8 w-px bg-gray-200 mx-1 hidden sm:block"></div>

          <div className="relative group">
            <button className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-gray-100 transition-all">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-gray-900 leading-tight">{user?.name || 'User'}</p>
                <p className="text-[10px] text-slate-500 leading-tight">{user?.role?.name || 'Member'}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            <div className="absolute right-0 mt-2 w-48 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200">
              <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden p-1">
                <Link href="/profile" className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Profile Settings</span>
                </Link>
                <button
                  onClick={logout}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
