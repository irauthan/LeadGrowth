import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HoosshLogo } from '../components/HoosshLogo';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Users,
  Target,
  TrendingUp,
  ShieldCheck,
  Zap,
  PhoneCall,
  DollarSign,
  UserCheck,
  Menu,
  X,
  Activity,
  Mail,
  Send,
  Layers,
  Calendar,
  Clock,
  ChevronRight,
  Shield
} from 'lucide-react';

export default function Welcome() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', company: '', message: '' });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
  };

  const navLinks = [
    { label: 'Capabilities', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Impact & ROI', href: '#impact' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Contact', href: '#contact' },
  ];

  const features = [
    {
      title: 'Ad Campaign Intelligence',
      desc: 'Track Meta Ads and Google Ads spend, impressions, clicks, CPC, CPA, and live ROAS across all ad sets.',
      icon: BarChart3,
      tag: 'Marketing ROI'
    },
    {
      title: 'Smart Lead Auto-Assignment',
      desc: 'Intelligently distribute inbound leads to sales reps based on live availability, capacity, and workload scores.',
      icon: UserCheck,
      tag: 'Instant Routing'
    },
    {
      title: 'Multi-Stage Kanban Pipelines',
      desc: 'Visual sales funnel from New lead to Contacted, Proposal, Negotiation, and Closed Won conversions.',
      icon: Layers,
      tag: 'Pipeline CRM'
    },
    {
      title: 'Call Duration & Telemetry Audit',
      desc: 'Accurately track call durations, session logs, discussion outcomes, and sales rep outreach effort.',
      icon: PhoneCall,
      tag: 'Call Analytics'
    },
    {
      title: 'Follow-ups & Conflict Calendar',
      desc: 'Automated 9 AM – 7 PM working hour follow-up schedules with built-in conflict detection and notifications.',
      icon: Calendar,
      tag: 'Smart Scheduling'
    },
    {
      title: 'Executive Work Monitoring',
      desc: 'Real-time administrative visibility into team presence, daily activity logs, SLA compliance, and conversion rates.',
      icon: Shield,
      tag: 'Team Governance'
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Ad Ingestion & Webhooks',
      desc: 'Captures leads automatically from Meta Forms, Google Search, and Website Webhooks without manual data entry.',
      icon: Target,
    },
    {
      step: '02',
      title: 'Workload-Balanced Routing',
      desc: 'Directs every lead to the best available sales executive using round-robin or capacity workload scoring.',
      icon: UserCheck,
    },
    {
      step: '03',
      title: 'Follow-ups & Call Telemetry',
      desc: 'Sales reps conduct calls, log client discussions, advance pipeline stages, and schedule reminders.',
      icon: PhoneCall,
    },
    {
      step: '04',
      title: 'Conversions & ROAS Analytics',
      desc: 'Converts prospects into paying clients while computing true revenue returns on performance ad spend.',
      icon: TrendingUp,
    },
  ];

  const impactMetrics = [
    { value: '3.4x', label: 'Average Blended ROAS', desc: 'Across Meta & Google performance ad campaigns' },
    { value: '< 2 min', label: 'Lead Response SLA', desc: 'Instant auto-assignment to active available sales reps' },
    { value: '+42%', label: 'Conversion Velocity', desc: 'Faster pipeline progression with structured follow-ups' },
    { value: '98.5%', label: 'Schedule Adherence', desc: 'Zero missed client meetings and reminder conflicts' },
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '₹0',
      period: 'Forever free',
      desc: 'Essential lead tracking for solo founders and small pilot teams.',
      features: [
        'Up to 5 Team Members',
        '1,000 Active Inbound Leads',
        'Standard Kanban Sales Pipeline',
        'Personal Task & Follow-up Manager',
        'CSV Export Capabilities',
      ],
      popular: false,
      cta: 'Start Free Trial',
    },
    {
      name: 'Professional',
      price: '₹7,999',
      period: 'Per month',
      desc: 'Complete CRM, campaign analytics, and auto-routing suite for growing teams.',
      features: [
        'Up to 25 Team Members',
        '10,000 Active Inbound Leads',
        'Full Ad Campaign ROAS Tracking',
        'Smart Auto-Assignment Engine',
        'Call Duration Tracking & Telemetry',
        'SignalR Real-time Notifications',
        'Multi-Format Exports (Excel, PDF, CSV)',
      ],
      popular: true,
      cta: 'Get Started',
    },
    {
      name: 'Enterprise',
      price: '₹24,999',
      period: 'Per month',
      desc: 'Dedicated infrastructure, custom workflows, and executive governance.',
      features: [
        'Unlimited Team Members',
        '100,000+ Active Inbound Leads',
        'Executive Work Monitor Console',
        'Custom Webhooks & REST API Access',
        'Enterprise Security Center & Audit Trail',
        'Dedicated Account Specialist & 99.9% SLA',
      ],
      popular: false,
      cta: 'Contact Sales',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800 selection:bg-blue-600 selection:text-white font-sans antialiased">
      
      {/* ========================================================================= */}
      {/* 1. NAVBAR                                                                 */}
      {/* ========================================================================= */}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-18">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <HoosshLogo size={38} variant="full" animated showTagline tagline="Lead Growth" />
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="rounded-lg px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/auth"
              className="rounded-xl px-4 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all"
            >
              <span>Get Started</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 md:hidden"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="border-b border-slate-200 bg-white px-6 py-4 md:hidden shadow-lg space-y-2">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                {item.label}
              </a>
            ))}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Sign In
              </Link>
              <Link
                to="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center rounded-xl bg-blue-600 py-2 text-xs font-bold text-white"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION (FOCUSED 1ST FOLD)                                        */}
      {/* ========================================================================= */}
      <section className="py-20 sm:py-28 lg:py-32 bg-gradient-to-b from-slate-50/70 via-white to-white border-b border-slate-100 flex items-center justify-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.15]">
            Turn Every Ad Lead Into <br className="hidden sm:inline" />
            <span className="text-blue-600">Measurable Closed Revenue</span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            Unify Meta & Google ad campaign tracking, intelligent workload lead routing, interactive sales pipelines, call duration audits, and client follow-up scheduling in one cohesive platform.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-7 py-3.5 text-xs sm:text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition-all active:scale-95"
            >
              <span>Start Free Trial</span>
              <ArrowRight size={15} />
            </Link>

            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-7 py-3.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-xs"
            >
              <UserCheck size={15} className="text-blue-600" />
              <span>Login to Workspace</span>
            </Link>
          </div>

          {/* Value Badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <TrendingUp size={14} className="text-emerald-600" />
              <span>3.4x Average ROAS</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <Clock size={14} className="text-blue-600" />
              <span>&lt; 2 Min Auto-Routing</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <PhoneCall size={14} className="text-cyan-600" />
              <span>Call Telemetry Audit</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <ShieldCheck size={14} className="text-indigo-600" />
              <span>Enterprise RBAC Security</span>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.5 WORKSPACE SHOWCASE (DEDICATED FULL-VIEW SECTION)                       */}
      {/* ========================================================================= */}
      <section className="py-20 bg-slate-50/60 border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600">
              LIVE WORKSPACE PREVIEW
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Unified Command Center & Real-Time Telemetry
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Experience how sales reps and marketing managers track inbound routing, campaign returns, and team SLA adherence in real time.
            </p>
          </div>

          {/* Interactive Clean Dashboard Preview Mockup */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 overflow-hidden">
            
            {/* Window Bar */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                LeadGrowth Workspace • Live Command Center Preview
              </span>
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live Telemetry
              </span>
            </div>

            {/* Mockup Dashboard Content */}
            <div className="p-6 sm:p-8 space-y-6">
              
              {/* 4 Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Ingested Leads</span>
                  <div className="text-2xl font-black text-slate-900">4,820</div>
                  <p className="text-[10px] font-bold text-emerald-600">↑ +18.4% this month</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Pipeline</span>
                  <div className="text-2xl font-black text-slate-900">1,240</div>
                  <p className="text-[10px] font-bold text-blue-600">94.2% assigned</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Conversions Won</span>
                  <div className="text-2xl font-black text-slate-900">428</div>
                  <p className="text-[10px] font-bold text-emerald-600">8.9% win rate</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Blended Ad ROAS</span>
                  <div className="text-2xl font-black text-slate-900">3.4x</div>
                  <p className="text-[10px] font-bold text-emerald-600">₹2.85M revenue</p>
                </div>
              </div>

              {/* Table & Funnel Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Recent Leads */}
                <div className="lg:col-span-2 rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-bold text-slate-900">Live Inbound Lead Stream</h4>
                    <span className="text-[10px] font-bold text-blue-600">Auto-Routed</span>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs">
                    {[
                      { name: 'Dr. Arjun Verma', company: 'Healthcare Clinic', source: 'Meta Ads', rep: 'Alex M.', status: 'Proposal Sent', badge: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
                      { name: 'Priya Sharma', company: 'NovaTech Solutions', source: 'Google Ads', rep: 'Rohan G.', status: 'Interaction', badge: 'text-amber-700 bg-amber-50 border-amber-200' },
                      { name: 'Michael Chang', company: 'Apex Real Estate', source: 'Website Webhook', rep: 'Sarah J.', status: 'Converted', badge: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                      { name: 'Neha Patel', company: 'ScaleUp Ventures', source: 'Instagram Form', rep: 'Alex M.', status: 'New Lead', badge: 'text-blue-700 bg-blue-50 border-blue-200' },
                    ].map((lead, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2">
                        <div>
                          <span className="font-bold text-slate-900">{lead.name}</span>
                          <span className="text-[10px] text-slate-500 ml-1.5">({lead.company})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-500 hidden sm:inline">{lead.source}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${lead.badge}`}>
                            {lead.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Campaign ROAS */}
                <div className="rounded-xl border border-slate-200 p-4 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 className="text-xs font-bold text-slate-900">Campaign Ad Returns</h4>
                      <span className="text-[10px] font-bold text-emerald-600">Live ROI</span>
                    </div>

                    <div className="mt-3 space-y-3">
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold mb-1">
                          <span className="text-slate-700">Meta Ads Funnel</span>
                          <span className="text-blue-600 font-bold">3.8x ROAS</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full w-[78%]" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] font-semibold mb-1">
                          <span className="text-slate-700">Google Search</span>
                          <span className="text-emerald-600 font-bold">4.2x ROAS</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full w-[88%]" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] font-semibold mb-1">
                          <span className="text-slate-700">Retargeting</span>
                          <span className="text-indigo-600 font-bold">2.9x ROAS</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full w-[62%]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Team SLA Rate</span>
                    <span className="text-emerald-600 font-bold">98.2% on time</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. CORE CAPABILITIES                                                      */}
      {/* ========================================================================= */}
      <section id="features" className="py-20 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600">
              CORE CAPABILITIES
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Built for Sales Velocity & Marketing ROI
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Everything your team needs to capture leads, accelerate follow-ups, and convert deals consistently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-blue-300 hover:shadow-md transition-all space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <item.icon size={20} />
                  </div>
                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {item.tag}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. HOW IT WORKS (STEP-BY-STEP WORKFLOW)                                   */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600">
              END-TO-END WORKFLOW
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              How LeadGrowth Drives Pipeline Success
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              From the instant an ad form is submitted to deal conversion and ROAS reporting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between space-y-6 shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-blue-600">{item.step}</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <item.icon size={16} />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. IMPACT & ROI METRICS                                                    */}
      {/* ========================================================================= */}
      <section id="impact" className="py-20 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
              PROVEN RESULTS
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Measurable Growth Metrics
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Empirical impact on performance marketing ROI and sales conversion rates.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {impactMetrics.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 text-center space-y-2"
              >
                <div className="text-3xl sm:text-4xl font-black text-blue-600">{item.value}</div>
                <h4 className="text-xs font-bold text-slate-900">{item.label}</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. TRANSPARENT PRICING                                                    */}
      {/* ========================================================================= */}
      <section id="pricing" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600">
              TRANSPARENT PLANS
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Flexible Tiers for Every Stage
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Choose the right plan to scale your sales operations with zero hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col justify-between rounded-2xl p-7 bg-white transition-all ${
                  plan.popular
                    ? 'border-2 border-blue-600 shadow-lg'
                    : 'border border-slate-200 hover:border-slate-300'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white shadow-sm">
                    Most Popular
                  </div>
                )}

                <div>
                  <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                  <p className="mt-1.5 text-xs text-slate-500 min-h-[30px]">{plan.desc}</p>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">{plan.price}</span>
                    <span className="text-xs font-semibold text-slate-500">/ {plan.period}</span>
                  </div>

                  <div className="mt-6 space-y-2.5 border-t border-slate-100 pt-5">
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                        <CheckCircle2 size={14} className="text-blue-600 flex-shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-5 border-t border-slate-100">
                  <Link
                    to="/auth"
                    className={`block w-full text-center rounded-xl py-2.5 text-xs font-bold transition-all ${
                      plan.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. CONTACT & INQUIRY SECTION                                              */}
      {/* ========================================================================= */}
      <section id="contact" className="py-20 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600">
                GET IN TOUCH
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Discuss Custom Workflows & Enterprise Onboarding
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Have questions about ad platform integrations, team training, or custom webhook routing? Our product specialists are ready to help.
              </p>

              <div className="mt-6 space-y-3 text-xs text-slate-700">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Mail size={15} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Direct Product Support</span>
                    <span className="font-bold text-slate-900">support@leadgrowth.io</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <ShieldCheck size={15} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Enterprise Security</span>
                    <span className="font-bold text-slate-900">Role-Based Access Control & Encrypted Sessions</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Clean Form Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs">
              {contactSubmitted ? (
                <div className="text-center py-8 space-y-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto">
                    <CheckCircle2 size={20} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Inquiry Submitted Successfully!</h3>
                  <p className="text-xs text-slate-600">A LeadGrowth specialist will get back to you within one business day.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3.5">
                  <h3 className="text-sm font-bold text-slate-900">Send Product Inquiry</h3>

                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Work Email</label>
                      <input
                        type="email"
                        required
                        placeholder="rahul@company.com"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Company</label>
                      <input
                        type="text"
                        placeholder="Company Ltd."
                        value={contactForm.company}
                        onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Message</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Tell us about your sales team size, lead sources, or specific CRM requirements..."
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-xs font-bold text-white transition-colors shadow-xs"
                  >
                    <span>Submit Inquiry</span>
                    <Send size={13} />
                  </button>
                </form>
              )}
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer className="bg-white py-10 text-slate-500 text-xs border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
            
            {/* Logo & Description */}
            <div className="space-y-2 max-w-sm">
              <Link to="/" className="flex items-center gap-2.5">
                <HoosshLogo size={32} variant="full" animated showTagline tagline="Lead Growth" />
              </Link>
              <p className="text-[11px] text-slate-500">
                Enterprise marketing analytics & lead management CRM platform.
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 font-bold text-slate-700">
              <a href="#features" className="hover:text-blue-600 transition-colors">Capabilities</a>
              <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How It Works</a>
              <a href="#impact" className="hover:text-blue-600 transition-colors">Impact</a>
              <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
              <a href="#contact" className="hover:text-blue-600 transition-colors">Contact</a>
              <Link to="/auth" className="hover:text-blue-600 transition-colors">Sign In</Link>
            </div>

          </div>

          {/* Copyright */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
            <p>© 2026 Hoossh Lead Growth CRM. All rights reserved.</p>
            <div className="flex items-center gap-3">
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Terms of Service</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
