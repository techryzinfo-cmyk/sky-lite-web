'use client';

import React from 'react';
import { Menu, Bell, Search, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface TopnavProps {
  onMenuClick: () => void;
}

export const Topnav: React.FC<TopnavProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 fixed top-0 right-0 left-0 lg:left-64 bg-[#0F172A]/40 backdrop-blur-md border-b border-white/5 z-30 transition-all">
      <div className="h-full px-4 lg:px-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="hidden md:flex items-center bg-slate-900/50 border border-white/10 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all w-64 lg:w-80">
            <Search className="w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search projects, tasks..." 
              className="bg-transparent border-none outline-none text-sm text-white px-2 w-full placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          <button className="relative p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#0F172A]"></span>
          </button>

          <div className="h-8 w-px bg-white/10 mx-2 hidden sm:block"></div>

          <div className="relative group">
            <button className="flex items-center space-x-3 p-1 rounded-xl hover:bg-white/5 transition-all">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-blue-500/20">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-white leading-tight">{user?.name || 'User'}</p>
                <p className="text-[10px] text-slate-500 leading-tight">{user?.role?.name || 'Member'}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>

            {/* Dropdown */}
            <div className="absolute right-0 mt-2 w-48 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200">
              <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-1">
                <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                  <User className="w-4 h-4" />
                  <span>Profile Settings</span>
                </button>
                <button 
                  onClick={logout}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
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
