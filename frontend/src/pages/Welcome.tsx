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
  Play,
  Layers,
  Inbox
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
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Contact', href: '#contact' },
  ];

  const features = [
    {
      title: 'Lead Management',
      desc: 'Capture, organize, and track leads throughout their lifecycle with custom statuses and source attribution.',
      icon: Target,
    },
    {
      title: 'Sales CRM & Pipeline',
      desc: 'Manage clients, follow-ups, and deal stages from one unified collaborative workspace.',
      icon: Layers,
    },
    {
      title: 'Performance Analytics',
      desc: 'Understand CTR, CPC, conversion rates, and revenue impact across marketing campaigns.',
      icon: BarChart3,
    },
    {
      title: 'Automated Lead Assignment',
      desc: 'Distribute incoming leads to sales reps based on availability and role permissions.',
      icon: UserCheck,
    },
    {
      title: 'Real-Time Notifications',
      desc: 'Instant alerts for hot lead activity, calendar reminders, and task deadlines.',
      icon: Zap,
    },
    {
      title: 'Team Productivity',
      desc: 'Monitor rep activity, task completion velocity, call logs, and audit histories.',
      icon: Users,
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Capture Leads',
      desc: 'Ingest leads directly from ad campaigns, webhooks, and forms.',
      icon: Inbox,
    },
    {
      step: '02',
      title: 'Organize & Assign',
      desc: 'Categorize by status and route instantly to the right reps.',
      icon: UserCheck,
    },
    {
      step: '03',
      title: 'Follow Up & Engage',
      desc: 'Log calls, set calendar reminders, and nurture prospects to deal close.',
      icon: PhoneCall,
    },
    {
      step: '04',
      title: 'Measure & Grow',
      desc: 'Analyze conversions, calculate ROI, and scale revenue with confidence.',
      icon: TrendingUp,
    },
  ];

  const pricingPlans = [
    {
      name: 'Free',
      price: '₹0',
      period: 'Forever free',
      desc: 'Essential lead tracking for solo founders and small teams.',
      features: [
        'Up to 5 Team Members',
        '1,000 Active Leads',
        'Standard Lead Queue & Notes',
        'Personal Task Manager',
        'Basic Pipeline Analytics',
      ],
      popular: false,
      cta: 'Start Free',
    },
    {
      name: 'Professional',
      price: '₹7,999',
      period: 'Per month',
      desc: 'Complete CRM and analytics suite for growing sales teams.',
      features: [
        'Up to 25 Team Members',
        '10,000 Active Leads',
        'Full Campaign Analytics',
        'Automated Lead Assignment',
        'Follow-up & Calendar Engine',
        'WebSocket Realtime Live Updates',
      ],
      popular: true,
      cta: 'Get Started',
    },
    {
      name: 'Enterprise',
      price: '₹24,999',
      period: 'Per month',
      desc: 'Dedicated infrastructure, governance, and priority support.',
      features: [
        'Up to 100 Team Members',
        '100,000 Active Leads',
        'Executive Work Monitor & RBAC',
        'API Management & Webhooks',
        'Security Center & Audit Log Export',
        'Dedicated Account Manager',
      ],
      popular: false,
      cta: 'Contact Sales',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800 selection:bg-blue-600 selection:text-white font-sans antialiased">
      
      {/* ========================================================================= */}
      {/* 1. NAVBAR (CLEAN WHITE)                                                   */}
      {/* ========================================================================= */}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <HoosshLogo size={42} variant="full" animated showTagline tagline="Lead Growth" />
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/auth"
              className="rounded-xl px-4 py-2 text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition-all hover:shadow-md active:scale-95"
            >
              <span>Get Started</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-900 md:hidden"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="border-b border-slate-200 bg-white px-6 py-5 md:hidden shadow-lg">
            <div className="flex flex-col space-y-2">
              {navLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <Link
                  to="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50"
                >
                  Login
                </Link>
                <Link
                  to="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION (CLEAN WHITE)                                             */}
      {/* ========================================================================= */}
      <section className="pt-14 pb-16 sm:pt-20 sm:pb-24 bg-gradient-to-b from-slate-50/60 to-white border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">

          {/* Headline */}
          <h1 className="mx-auto max-w-4xl text-4xl sm:text-6xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.15]">
            Turn Every Lead Into <br className="hidden sm:inline" />
            <span className="text-blue-600">Measurable Growth</span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Capture inbound leads, automate sales assignments, monitor ad conversions, and scale your sales pipeline with Hoossh Lead Growth CRM.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
            >
              <span>Get Started</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-7 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all shadow-xs"
            >
              <Play size={15} className="text-blue-600 fill-blue-600" />
              <span>Live Demo</span>
            </Link>
          </div>

          {/* Clean Dashboard Mockup Preview */}
          <div className="mt-14 mx-auto max-w-5xl text-left">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 overflow-hidden">
              
              {/* Window Bar */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <span className="text-xs font-bold text-slate-500">
                  Hoossh Lead Growth Workspace Dashboard
                </span>
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Live
                </span>
              </div>

              {/* Dashboard Content */}
              <div className="p-6 sm:p-8 space-y-6">
                
                {/* 4 Metric Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="text-xs font-bold uppercase tracking-wider">Total Leads</span>
                      <Target size={18} className="text-blue-600" />
                    </div>
                    <div className="mt-2 text-2xl font-black text-slate-900">4,820</div>
                    <p className="mt-1 text-xs font-semibold text-emerald-600">↑ +18.4% this month</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="text-xs font-bold uppercase tracking-wider">Active Pipeline</span>
                      <Activity size={18} className="text-indigo-600" />
                    </div>
                    <div className="mt-2 text-2xl font-black text-slate-900">1,240</div>
                    <p className="mt-1 text-xs font-semibold text-blue-600">94.2% assigned</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="text-xs font-bold uppercase tracking-wider">Conversions</span>
                      <TrendingUp size={18} className="text-emerald-600" />
                    </div>
                    <div className="mt-2 text-2xl font-black text-slate-900">428</div>
                    <p className="mt-1 text-xs font-semibold text-emerald-600">8.9% conversion</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="text-xs font-bold uppercase tracking-wider">Revenue Impact</span>
                      <DollarSign size={18} className="text-cyan-600" />
                    </div>
                    <div className="mt-2 text-2xl font-black text-slate-900">₹2.85M</div>
                    <p className="mt-1 text-xs font-semibold text-cyan-600">3.4x ROAS on ads</p>
                  </div>
                </div>

                {/* Table & Funnel Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Recent Leads */}
                  <div className="lg:col-span-2 rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900">Live Inbound Leads</h3>
                      <span className="text-xs font-bold text-blue-600">Real-Time Routing</span>
                    </div>

                    <div className="mt-2 divide-y divide-slate-100 text-sm">
                      {[
                        { name: 'Dr. Arjun Verma', company: 'Healthcare Clinic', source: 'Meta Ads', rep: 'Alex M.', status: 'Proposal', bg: 'bg-indigo-50 text-indigo-700' },
                        { name: 'Priya Sharma', company: 'NovaTech', source: 'Google Ads', rep: 'Rohan G.', status: 'Qualified', bg: 'bg-emerald-50 text-emerald-700' },
                        { name: 'Michael Chang', company: 'Apex Real Estate', source: 'Website Webhook', rep: 'Sarah J.', status: 'Contacted', bg: 'bg-amber-50 text-amber-700' },
                        { name: 'Neha Patel', company: 'ScaleUp Ventures', source: 'Instagram Form', rep: 'Alex M.', status: 'New', bg: 'bg-blue-50 text-blue-700' },
                      ].map((lead, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2.5">
                          <div>
                            <span className="font-bold text-slate-900">{lead.name}</span>
                            <span className="text-xs text-slate-500 ml-1.5">({lead.company})</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500 hidden sm:inline">{lead.source}</span>
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${lead.bg}`}>
                              {lead.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Campaign ROAS */}
                  <div className="rounded-xl border border-slate-200 p-4 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Campaign ROAS</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Ad Returns Across Channels</p>

                      <div className="mt-4 space-y-3.5">
                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-slate-700">Meta Ads Funnel</span>
                            <span className="text-blue-600 font-bold">3.8x</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full w-[78%]" />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-slate-700">Google Search</span>
                            <span className="text-emerald-600 font-bold">4.2x</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full w-[88%]" />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-slate-700">Retargeting</span>
                            <span className="text-indigo-600 font-bold">2.9x</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full w-[62%]" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Team SLA</span>
                      <span className="text-emerald-600 font-bold">98.2% on time</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. CAPABILITIES / FEATURES (CLEAN WHITE)                                  */}
      {/* ========================================================================= */}
      <section id="features" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600">
              CORE CAPABILITIES
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Everything Needed to Accelerate Sales
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Structured tools designed to help your team respond faster, nurture better, and close consistently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white p-7 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-5">
                  <item.icon size={22} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. HOW IT WORKS (CLEAN STEPPER)                                           */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600">
              SIMPLE 4-STEP PROCESS
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              How Hoossh Drives Growth
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-blue-600">{item.step}</span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <item.icon size={18} />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. PRICING SECTION (CLEAN WHITE)                                          */}
      {/* ========================================================================= */}
      <section id="pricing" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600">
              TRANSPARENT PRICING
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Plans Scaled to Your Business
            </h2>
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
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                    Most Popular
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                  <p className="mt-2 text-xs text-slate-500 min-h-[32px]">{plan.desc}</p>

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

                <div className="mt-6 pt-5 border-t border-slate-100">
                  <Link
                    to="/auth"
                    className={`block w-full text-center rounded-xl py-2.5 text-sm font-bold transition-all ${
                      plan.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                        : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
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
      {/* 6. CONTACT / INQUIRY SECTION (CLEAN WHITE)                                */}
      {/* ========================================================================= */}
      <section id="contact" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600">
                GET IN TOUCH
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Let’s Discuss Your Team’s Growth Goals
              </h2>
              <p className="mt-3 text-base text-slate-600 leading-relaxed">
                Have questions about custom workflows, team onboarding, or enterprise setup? Our product specialists are ready to help.
              </p>

              <div className="mt-6 space-y-3.5 text-sm text-slate-700">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Mail size={16} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Direct Inquiries</span>
                    <span className="font-bold text-slate-900">support@hoossh.com</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Enterprise Security</span>
                    <span className="font-bold text-slate-900">SOC-2 & GDPR Ready Architecture</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Clean Form Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs">
              {contactSubmitted ? (
                <div className="text-center py-8 space-y-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Thank You for Reaching Out!</h3>
                  <p className="text-xs text-slate-600">A Hoossh specialist will respond within one business day.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3.5">
                  <h3 className="text-base font-bold text-slate-900">Send an Inquiry</h3>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Work Email</label>
                      <input
                        type="email"
                        required
                        placeholder="rahul@company.com"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Company</label>
                      <input
                        type="text"
                        placeholder="Company Ltd."
                        value={contactForm.company}
                        onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Message</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Tell us about your team size, lead sources, or specific needs..."
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <span>Submit Inquiry</span>
                    <Send size={14} />
                  </button>
                </form>
              )}
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FOOTER (CLEAN WHITE / LIGHT)                                           */}
      {/* ========================================================================= */}
      <footer className="border-t border-slate-200 bg-white py-10 text-slate-600 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
            
            {/* Logo & Description */}
            <div className="space-y-2 max-w-sm">
              <Link to="/" className="flex items-center gap-2.5">
                <HoosshLogo size={32} variant="full" animated showTagline tagline="Lead Growth" />
              </Link>
              <p className="text-xs text-slate-500">
                Enterprise lead management and sales CRM platform.
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 font-semibold text-slate-700">
              <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How It Works</a>
              <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
              <a href="#contact" className="hover:text-blue-600 transition-colors">Contact</a>
              <Link to="/auth" className="hover:text-blue-600 transition-colors">Login</Link>
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
