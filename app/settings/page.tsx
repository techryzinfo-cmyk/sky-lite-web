'use client';

import React, { useState, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';
import {
  Building2, Bell, Shield, Trash2, Save, Loader2,
  Globe, Mail, Phone, ToggleLeft, ToggleRight, AlertTriangle,
  Palette, Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TOGGLE = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
  <button onClick={onToggle} className="shrink-0">
    {on
      ? <ToggleRight className="w-8 h-8 text-blue-600" />
      : <ToggleLeft className="w-8 h-8 text-gray-300" />}
  </button>
);

export default function SettingsPage() {
  const { user } = useAuth() as any;
  const toast = useToast();

  const [orgForm, setOrgForm] = useState({ name: '', website: '', phone: '', email: '' });
  const [savingOrg, setSavingOrg] = useState(false);

  const [notifs, setNotifs] = useState({
    issueAlerts: true,
    budgetAlerts: true,
    milestoneReminders: true,
    weeklyDigest: false,
    riskEscalations: true,
  });

  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('light');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    api.get('/organization').then(r => {
      const org = r.data;
      setOrgForm({
        name: org.name || '',
        website: org.website || '',
        phone: org.phone || '',
        email: org.email || '',
      });
    }).catch(() => {
      if (user?.organization) {
        setOrgForm(f => ({ ...f, name: typeof user.organization === 'string' ? user.organization : user.organization?.name || '' }));
      }
    });
  }, [user]);

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingOrg(true);
    try {
      await api.patch('/organization', orgForm);
      toast.success('Organization settings saved');
    } catch {
      toast.error('Failed to save organization settings');
    } finally {
      setSavingOrg(false);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await api.get('/projects');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `skylite_data_export_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch {
      toast.error('Failed to export data');
    }
  };

  const Section = ({ title, description, icon: Icon, iconBg, iconColor, children }: any) => (
    <GlassCard className="p-8 border-gray-200" gradient>
      <div className="flex items-center space-x-4 mb-7">
        <div className={cn('p-2.5 rounded-xl border', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </GlassCard>
  );

  return (
    <Shell>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your organization, notifications, and platform preferences.</p>
        </div>

        {/* Organization */}
        <Section
          title="Organization"
          description="Update your company name and contact details."
          icon={Building2}
          iconBg="bg-blue-50 border-blue-200"
          iconColor="text-blue-600"
        >
          <form onSubmit={handleSaveOrg} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { label: 'Organization Name', field: 'name', icon: Building2, placeholder: 'Acme Construction Ltd.' },
                { label: 'Website', field: 'website', icon: Globe, placeholder: 'https://yourcompany.com' },
                { label: 'Contact Email', field: 'email', icon: Mail, placeholder: 'hello@company.com' },
                { label: 'Contact Phone', field: 'phone', icon: Phone, placeholder: '+91 98765 43210' },
              ].map(({ label, field, icon: Icon, placeholder }) => (
                <div key={field} className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 ml-1 flex items-center space-x-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </label>
                  <input
                    type="text"
                    value={(orgForm as any)[field]}
                    onChange={e => setOrgForm(f => ({ ...f, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingOrg}
                className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20"
              >
                {savingOrg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </Section>

        {/* Notifications */}
        <Section
          title="Notifications"
          description="Control which events trigger alerts and emails."
          icon={Bell}
          iconBg="bg-purple-50 border-purple-200"
          iconColor="text-purple-600"
        >
          <div className="space-y-4">
            {[
              { key: 'issueAlerts', label: 'Issue & Snag Alerts', desc: 'Get notified when new issues are reported or escalated.' },
              { key: 'budgetAlerts', label: 'Budget Threshold Alerts', desc: 'Alert when project spend exceeds 80% of budget.' },
              { key: 'milestoneReminders', label: 'Milestone Reminders', desc: 'Remind team 3 days before milestone due dates.' },
              { key: 'riskEscalations', label: 'Risk Escalations', desc: 'Notify when a risk moves to Critical status.' },
              { key: 'weeklyDigest', label: 'Weekly Digest Email', desc: 'Receive a weekly summary of all project activity.' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
                <TOGGLE
                  on={(notifs as any)[key]}
                  onToggle={() => setNotifs(n => ({ ...n, [key]: !(n as any)[key] }))}
                />
              </div>
            ))}
          </div>
        </Section>

        {/* Appearance */}
        <Section
          title="Appearance"
          description="Choose your display theme preference."
          icon={Palette}
          iconBg="bg-amber-50 border-amber-200"
          iconColor="text-amber-600"
        >
          <div className="grid grid-cols-3 gap-3">
            {(['light', 'dark', 'system'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={cn(
                  'p-4 rounded-2xl border-2 text-center transition-all',
                  theme === t ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-xl mx-auto mb-3 border-2',
                  t === 'light' ? 'bg-white border-gray-200' :
                  t === 'dark' ? 'bg-gray-900 border-gray-700' :
                  'bg-gradient-to-br from-white to-gray-900 border-gray-300'
                )} />
                <p className={cn('text-xs font-bold capitalize', theme === t ? 'text-blue-700' : 'text-slate-600')}>{t}</p>
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3 italic">Theme switching is a UI preference — full dark mode coming soon.</p>
        </Section>

        {/* Data Export */}
        <Section
          title="Data & Privacy"
          description="Export your data or manage data retention."
          icon={Download}
          iconBg="bg-emerald-50 border-emerald-200"
          iconColor="text-emerald-600"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-900">Export All Projects</p>
                <p className="text-xs text-slate-500 mt-0.5">Download all project data as a JSON file.</p>
              </div>
              <button
                onClick={handleExportData}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-gray-100 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </Section>

        {/* Danger Zone */}
        <GlassCard className="p-8 border-red-200 bg-red-50/30">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Danger Zone</h2>
              <p className="text-xs text-slate-500 mt-0.5">These actions are irreversible. Proceed with caution.</p>
            </div>
          </div>
          <div className="p-5 rounded-2xl border-2 border-red-200 bg-white space-y-4">
            <div>
              <p className="text-sm font-bold text-gray-900 mb-1">Delete Organization Account</p>
              <p className="text-xs text-slate-500 mb-4">Permanently removes all projects, users, and data. This cannot be undone.</p>
              <div className="space-y-3">
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder={`Type "DELETE" to confirm`}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
                <button
                  disabled={deleteConfirm !== 'DELETE'}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-red-600/20"
                  onClick={() => toast.error('Contact support to delete your account.')}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Organization</span>
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </Shell>
  );
}
