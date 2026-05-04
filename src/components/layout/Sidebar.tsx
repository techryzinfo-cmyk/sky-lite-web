'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  Package, 
  AlertCircle, 
  CheckSquare, 
  Users, 
  Settings,
  X,
  CreditCard,
  ShieldAlert,
  Calendar,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: Briefcase },
  { name: 'BOQ & Budget', href: '/boq', icon: FileText },
  { name: 'Materials', href: '/materials', icon: Package },
  { name: 'Issues', href: '/issues', icon: AlertCircle },
  { name: 'Snags', href: '/snags', icon: CheckSquare },
  { name: 'Risks', href: '/risks', icon: ShieldAlert },
  { name: 'Milestones', href: '/milestones', icon: Calendar },
  { name: 'Financials', href: '/financials', icon: CreditCard },
  { name: 'Templates', href: '/templates', icon: Layers },
  { name: 'Users & Roles', href: '/users', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed top-0 left-0 bottom-0 w-64 bg-[#0F172A]/80 backdrop-blur-xl border-r border-white/10 z-50 transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
            <Link href="/dashboard" className="text-xl font-black tracking-tight text-white">
              SKY<span className="text-blue-500">LITE</span>
            </Link>
            <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                    isActive 
                      ? "bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
                      : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-blue-500" : "text-slate-500 group-hover:text-slate-300"
                  )} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/5">
            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl p-4 border border-white/10">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Pro Plan</p>
              <p className="text-xs text-slate-400 mb-3">Unlimited projects & storage active.</p>
              <button className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold transition-colors">
                View Billing
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
