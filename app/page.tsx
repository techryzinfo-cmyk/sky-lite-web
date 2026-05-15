'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import {
  BarChart3,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  DollarSign,
  FileText,
  HardHat,
  Layers,
  Menu,
  Package,
  Shield,
  Users,
  X,
  Zap,
  ArrowRight,
  Star,
  Building2,
  TrendingUp,
  Clock,
} from 'lucide-react';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Stats', href: '#stats' },
];

const FEATURES = [
  {
    icon: Briefcase,
    title: 'Project Pipeline',
    description: 'Manage every project phase from planning to handover with real-time status tracking across your entire portfolio.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: DollarSign,
    title: 'Budget & BOQ',
    description: 'Track budgets, approve revisions, and monitor spend against Bill of Quantities with full audit history.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Package,
    title: 'Materials Management',
    description: 'Raise material requests, track deliveries, and reconcile inventory across all active sites.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: ClipboardList,
    title: 'Quality Control',
    description: 'Log snags, run inspections, and close quality issues before they delay handover.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: FileText,
    title: 'Document Approvals',
    description: 'Upload drawings and plans, route them for multi-stage approval, and maintain a signed-off document trail.',
    color: 'bg-rose-50 text-rose-600',
  },
  {
    icon: Users,
    title: 'Team & Roles',
    description: 'Assign granular permissions per role, manage site surveyors, and keep every stakeholder in the loop.',
    color: 'bg-cyan-50 text-cyan-600',
  },
  {
    icon: HardHat,
    title: 'Site Surveys',
    description: 'Schedule and capture site survey data, link findings to project phases, and track remediation progress.',
    color: 'bg-yellow-50 text-yellow-600',
  },
  {
    icon: Layers,
    title: 'Templates',
    description: 'Standardise your workflow with reusable project templates — create once, deploy across every new project.',
    color: 'bg-indigo-50 text-indigo-600',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Create your organisation',
    description: 'Sign up, set up your company profile, and invite your team. Roles and permissions are configured in minutes.',
  },
  {
    step: '02',
    title: 'Launch a project',
    description: 'Start from scratch or pick a template. Define phases, assign members, set budgets, and you\'re live.',
  },
  {
    step: '03',
    title: 'Track everything in one place',
    description: 'Monitor progress, approve documents, manage materials, and close snags — all from a single dashboard.',
  },
];

const STATS = [
  { value: '10x', label: 'Faster document approvals', icon: Zap },
  { value: '360°', label: 'Project visibility', icon: BarChart3 },
  { value: '100%', label: 'Audit trail coverage', icon: Shield },
  { value: '∞', label: 'Projects per plan', icon: Building2 },
];

const TESTIMONIALS = [
  {
    name: 'Ravi Menon',
    role: 'Project Director, AlRashidi Contracting',
    text: 'SKYLITE replaced three separate tools we were using. Our site teams now raise material requests and get approvals the same day.',
    stars: 5,
  },
  {
    name: 'Priya Nair',
    role: 'QC Manager, Skyline Builders',
    text: 'The snag-tracking and quality control module alone saved us weeks before our last handover. Absolutely recommend it.',
    stars: 5,
  },
  {
    name: 'Omar Khalid',
    role: 'Finance Controller, BuildCo',
    text: 'Budget revisions used to be a black box. Now every change has an approver name, a timestamp, and a reason. Audit-ready.',
    stars: 5,
  },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFF]">
        <h1 className="text-4xl font-black tracking-tight text-gray-900">
          SKY<span className="text-blue-600">LITE</span>
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      {/* ── Navbar ── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur shadow-sm border-b border-gray-100' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <span className="text-2xl font-black tracking-tight text-gray-900">
            SKY<span className="text-blue-600">LITE</span>
          </span>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors px-4 py-2"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Get started free
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4 space-y-1">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="block py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <div className="pt-3 flex flex-col gap-2">
              <Link href="/login" className="text-center py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50">
                Sign in
              </Link>
              <Link href="/register" className="text-center py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700">
                Get started free
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background gradient blobs */}
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-blue-100/60 blur-3xl pointer-events-none" />
        <div className="absolute top-40 -left-32 w-[400px] h-[400px] rounded-full bg-indigo-100/40 blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
            <TrendingUp className="w-3.5 h-3.5" />
            Construction project intelligence — built for site teams
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-gray-900 leading-[1.08] mb-6">
            Build smarter.<br />
            <span className="text-blue-600">Deliver faster.</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            SKYLITE brings your projects, budgets, documents, quality checks, and site teams
            into one command centre — so nothing falls through the cracks.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-700 transition-colors text-base shadow-lg shadow-blue-200"
            >
              Get started free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-gray-800 font-semibold px-8 py-3.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-base"
            >
              Sign in to your account
            </Link>
          </div>

          <p className="mt-5 text-xs text-gray-400">No credit card required · Free forever for small teams</p>
        </div>

        {/* Dashboard preview card */}
        <div className="relative max-w-5xl mx-auto mt-20">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl shadow-gray-200/80 overflow-hidden">
            {/* Fake browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-4 flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-400 border border-gray-200">
                app.skylite.io/dashboard
              </span>
            </div>
            {/* Dashboard mockup */}
            <div className="bg-[#F8FAFF] p-6">
              <div className="flex gap-4 mb-4">
                {[
                  { label: 'Active Projects', value: '12', color: 'bg-blue-100 text-blue-700' },
                  { label: 'Total Budget', value: '₹48.2M', color: 'bg-emerald-100 text-emerald-700' },
                  { label: 'Milestones Done', value: '34/41', color: 'bg-purple-100 text-purple-700' },
                  { label: 'Completed', value: '5', color: 'bg-orange-100 text-orange-700' },
                ].map((stat) => (
                  <div key={stat.label} className="flex-1 bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
                    <p className={`text-xl font-black ${stat.color} rounded-lg px-2 py-0.5 inline-block`}>{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-4 h-32">
                  <p className="text-xs font-semibold text-gray-500 mb-3">Project Pipeline</p>
                  <div className="space-y-2">
                    {[
                      { name: 'Tower A — Block 3', pct: 72, color: 'bg-blue-500' },
                      { name: 'Villa Complex Phase 2', pct: 45, color: 'bg-emerald-500' },
                      { name: 'Commercial Hub', pct: 91, color: 'bg-purple-500' },
                    ].map((p) => (
                      <div key={p.name} className="flex items-center gap-3">
                        <p className="text-xs text-gray-600 w-40 truncate">{p.name}</p>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${p.color} rounded-full`} style={{ width: `${p.pct}%` }} />
                        </div>
                        <p className="text-xs text-gray-500 w-8 text-right">{p.pct}%</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 h-32">
                  <p className="text-xs font-semibold text-gray-500 mb-3">Live Feed</p>
                  <div className="space-y-2">
                    {[
                      { text: 'Drawing A-103 approved', time: '2m ago' },
                      { text: 'Snag #47 closed', time: '18m ago' },
                      { text: 'Material request raised', time: '1h ago' },
                    ].map((e) => (
                      <div key={e.text} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-700 leading-tight">{e.text}</p>
                          <p className="text-[9px] text-gray-400">{e.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-4xl font-black text-gray-900 mb-4">Everything your site team needs</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              From foundation to handover — SKYLITE covers every phase of the construction lifecycle.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section id="stats" className="py-24 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                  <s.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-4xl font-black text-white mb-1">{s.value}</p>
                <p className="text-blue-200 text-sm font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-4xl font-black text-gray-900 mb-4">Up and running in minutes</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              No lengthy onboarding. No consultants. Just sign up and go.
            </p>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden lg:block absolute top-8 left-[16.67%] right-[16.67%] h-px bg-gray-200" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {STEPS.map((step, i) => (
                <div key={step.step} className="relative text-center lg:text-left">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white text-xl font-black mb-5 lg:mx-0 mx-auto">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-3">Testimonials</p>
            <h2 className="text-4xl font-black text-gray-900 mb-4">Trusted by construction teams</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-12 text-white shadow-2xl shadow-blue-200">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <HardHat className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-4xl font-black mb-4">Ready to take control?</h2>
            <p className="text-blue-200 text-lg mb-8 max-w-lg mx-auto">
              Join construction teams who've replaced spreadsheets and group chats with SKYLITE.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-blue-600 font-bold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-colors text-base"
              >
                Get started free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/20 transition-colors text-base border border-white/20"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xl font-black tracking-tight text-gray-900">
            SKY<span className="text-blue-600">LITE</span>
          </span>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <a href="#features" className="hover:text-gray-700 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-gray-700 transition-colors">How It Works</a>
            <Link href="/login" className="hover:text-gray-700 transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-gray-700 transition-colors">Register</Link>
          </div>
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} SKYLITE. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
