'use client';

import React, { useState, useEffect } from 'react';
import { Shell } from '@/components/layouts/Shell';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuth } from '@/providers/AuthContext';
import { useToast } from '@/providers/ToastContext';
import api from '@/services/api.client';
import {
  Building2, Bell, Trash2, Save, Loader2,
  Globe, Mail, Phone, ToggleLeft, ToggleRight, AlertTriangle,
  CreditCard, Star, Crown, Zap, CheckCircle2, XCircle,
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

  const [subData, setSubData] = useState<any>(null);
  const [subLoading, setSubLoading] = useState(true);

  const [notifs, setNotifs] = useState({
    issueAlerts: true,
    budgetAlerts: true,
    milestoneReminders: true,
    weeklyDigest: false,
    riskEscalations: true,
  });
  const [savingNotifs, setSavingNotifs] = useState(false);

  const handleSaveNotifs = async () => {
    setSavingNotifs(true);
    try {
      await api.patch('/organization/notifications', notifs);
      toast.success('Notification preferences saved');
    } catch {
      toast.error('Failed to save notification preferences');
    } finally {
      setSavingNotifs(false);
    }
  };

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

    api.get('/organization/subscription').then(r => setSubData(r.data)).catch(() => {}).finally(() => setSubLoading(false));
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

        {/* Plan & Billing */}
        <Section
          title="Plan & Billing"
          description="Your current subscription plan and usage."
          icon={CreditCard}
          iconBg="bg-amber-50 border-amber-200"
          iconColor="text-amber-600"
        >
          {subLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : (() => {
            const sub = subData?.subscription;
            const usage = subData?.usage || {};
            const plan = sub?.plan || 'Silver';
            const status = sub?.status || 'Trial';
            const limits = sub?.limits || {};
            const maxP = limits.maxProjects ?? 10;
            const maxU = limits.maxUsers ?? 20;
            const trialEnd = sub?.trialEndsAt ? new Date(sub.trialEndsAt) : null;
            const isTrialExpired = subData?.isTrialExpired;

            const PLAN_STYLES: Record<string, { color: string; bg: string; border: string; icon: React.ElementType; gradient: string }> = {
              Silver:   { color: 'text-slate-600',  bg: 'bg-slate-50',   border: 'border-slate-200', icon: Star,  gradient: 'from-slate-400 to-slate-600' },
              Gold:     { color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200', icon: Crown, gradient: 'from-amber-400 to-amber-600' },
              Platinum: { color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200',  icon: Zap,   gradient: 'from-blue-400 to-blue-600' },
            };
            const pm = PLAN_STYLES[plan] ?? PLAN_STYLES.Silver;
            const PlanIcon = pm.icon;

            const FEATURES_BY_PLAN: Record<string, { label: string; included: boolean }[]> = {
              Silver: [
                { label: 'Projects (up to 10)',         included: true },
                { label: 'Users (up to 20)',             included: true },
                { label: 'Milestones, Materials, BOQ',   included: true },
                { label: 'BOQ Import (XLS/XER)',         included: false },
                { label: 'Interior project type',        included: false },
                { label: 'Custom roles',                 included: false },
                { label: 'Export reports',               included: false },
                { label: 'Arabic / RTL UI',              included: false },
              ],
              Gold: [
                { label: 'Projects (up to 50)',          included: true },
                { label: 'Users (up to 100)',             included: true },
                { label: 'Milestones, Materials, BOQ',   included: true },
                { label: 'BOQ Import (XLS/XER)',         included: true },
                { label: 'Interior project type',        included: true },
                { label: 'Custom roles',                 included: true },
                { label: 'Export reports',               included: true },
                { label: 'Arabic / RTL UI',              included: false },
              ],
              Platinum: [
                { label: 'Unlimited projects & users',   included: true },
                { label: 'Milestones, Materials, BOQ',   included: true },
                { label: 'BOQ Import (XLS/XER)',         included: true },
                { label: 'Interior project type',        included: true },
                { label: 'Custom roles',                 included: true },
                { label: 'Export reports',               included: true },
                { label: 'Arabic / RTL UI',              included: true },
                { label: 'API access + Dedicated support', included: true },
              ],
            };

            return (
              <div className="space-y-5">
                {/* Current plan card */}
                {isTrialExpired && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    Your free trial has expired. Contact your administrator to upgrade your plan and restore full access.
                  </div>
                )}
                {status === 'Suspended' && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    Your organization account is currently suspended. Please contact support.
                  </div>
                )}

                <div className={cn('flex items-center justify-between p-5 rounded-2xl border-2', pm.bg, pm.border)}>
                  <div className="flex items-center gap-4">
                    <div className={cn('w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center', pm.gradient)}>
                      <PlanIcon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-0.5">Current Plan</p>
                      <p className={cn('text-2xl font-black', pm.color)}>{plan}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold',
                          status === 'Active'    ? 'bg-emerald-100 text-emerald-700' :
                          status === 'Trial'     ? 'bg-purple-100 text-purple-700'  :
                          status === 'Suspended' ? 'bg-red-100 text-red-700'        :
                          'bg-gray-100 text-gray-600'
                        )}>
                          <span className={cn('w-1 h-1 rounded-full', status === 'Active' ? 'bg-emerald-500' : status === 'Trial' ? 'bg-purple-500' : 'bg-red-500')} />
                          {status}
                        </span>
                        {status === 'Trial' && trialEnd && (
                          <span className="text-[10px] text-slate-400">
                            Trial ends {trialEnd.toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <a
                    href="mailto:support@skylite.app?subject=Upgrade%20Request"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-bold text-slate-700 hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <Crown className="w-4 h-4 text-amber-500" />
                    Upgrade
                  </a>
                </div>

                {/* Usage meters */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Projects Used',  used: usage.projects ?? 0, max: maxP },
                    { label: 'Team Members',   used: usage.users    ?? 0, max: maxU },
                  ].map(({ label, used, max }) => {
                    const pct = max === null ? 0 : Math.min(100, Math.round((used / max) * 100));
                    const isOver = max !== null && used > max;
                    return (
                      <div key={label} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
                          <span>{label}</span>
                          <span className={cn(isOver && 'text-red-600 font-bold')}>{used} / {max ?? '∞'}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all', isOver ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500')}
                            style={{ width: `${max === null ? 30 : pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Feature list */}
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">What&apos;s included in {plan}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(FEATURES_BY_PLAN[plan] ?? []).map(f => (
                      <div key={f.label} className="flex items-center gap-2.5 text-sm">
                        {f.included
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          : <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />}
                        <span className={f.included ? 'text-gray-700' : 'text-slate-400 line-through'}>{f.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
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
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveNotifs}
                disabled={savingNotifs}
                className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20"
              >
                {savingNotifs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Preferences</span>
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
