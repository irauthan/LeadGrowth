import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HoosshLogo } from '../components/HoosshLogo';
import {
  ArrowRight,
  BarChart3,
  DollarSign,
  Layers,
  LineChart,
  Sparkles,
  Target,
  Users
} from 'lucide-react';
import Footer from '../components/Footer';

export default function Welcome() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 30,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: 'easeOut' as const,
      },
    },
  };

  const featureCards = [
    {
      title: 'Marketing Analytics',
      desc: 'Monitor clicks, impressions, conversions and ad performance from one unified dashboard.',
      icon: BarChart3,
      color: 'from-blue-600 to-cyan-500',
    },
    {
      title: 'Live Lead Tracking',
      desc: 'Receive instant lead updates using real-time WebSocket events and automated distribution.',
      icon: Target,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Campaign Insights',
      desc: 'Analyze CTR, CPC, Cost and Conversion Rate effortlessly across all channels.',
      icon: LineChart,
      color: 'from-sky-500 to-blue-600',
    },
    {
      title: 'Team Collaboration',
      desc: 'Assign leads, create activity logs, set reminders and collaborate securely.',
      icon: Users,
      color: 'from-blue-700 to-indigo-500',
    },
    {
      title: 'Revenue Monitoring',
      desc: 'Track revenue, ROAS, financial metrics and business growth in real time.',
      icon: DollarSign,
      color: 'from-cyan-600 to-blue-600',
    },
    {
      title: 'Platform Integrations',
      desc: 'Connect Meta Ads, Google Ads and third-party SaaS integrations seamlessly.',
      icon: Layers,
      color: 'from-indigo-500 to-blue-500',
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-blue-50/40 to-white text-slate-900">

      {/* Background Grid Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f60d_1px,transparent_1px),linear-gradient(to_bottom,#3b82f60d_1px,transparent_1px)] bg-[size:60px_60px] opacity-70" />

      {/* Ambient Blue Background Glows */}
      <div className="absolute -left-48 -top-48 h-[650px] w-[650px] rounded-full bg-blue-400/15 blur-[160px]" />
      <div className="absolute -right-48 bottom-0 h-[650px] w-[650px] rounded-full bg-cyan-400/15 blur-[160px]" />
      <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-sky-300/10 blur-[180px]" />

      {/* Floating Blue Accent Orbs */}
      <div className="absolute top-36 left-16 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl animate-pulse" />
      <div className="absolute right-20 top-56 h-36 w-36 rounded-full bg-cyan-500/10 blur-2xl animate-pulse" />

      <div className="relative z-20">

        {/* Header Navigation */}
        <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 border-b border-blue-100/60 bg-white/70 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <HoosshLogo size={44} animated />
            <div>
              <h1 className="text-xl font-black tracking-tight text-blue-950">
                Hoossh
              </h1>
              <p className="text-[11px] text-blue-600/80 font-bold uppercase tracking-wider">
                Lead Management Platform
              </p>
            </div>
          </div>

          <Link
            to="/auth"
            className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 text-sm font-bold shadow-lg shadow-blue-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-blue-500/30 hover:from-blue-700 hover:to-indigo-700"
          >
            Sign In to Workspace
          </Link>
        </header>

        <main className="mx-auto max-w-7xl px-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center pt-12 pb-24 text-center lg:pt-20"
          >
            {/* White & Blue Pill Badge */}
            <motion.div
              variants={itemVariants}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-5 py-2 text-xs font-bold text-blue-700 shadow-sm"
            >
              <Sparkles size={15} className="text-blue-500" />
              <span>One Unified Dashboard • Every Lead • Enterprise Growth</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              variants={itemVariants}
              className="max-w-5xl text-5xl font-black leading-tight tracking-tight text-blue-950 sm:text-6xl lg:text-7xl"
            >
              Grow Your Business
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 bg-clip-text text-transparent">
                Smarter & Faster Than Ever
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              className="mt-8 max-w-3xl text-lg font-medium leading-8 text-slate-600"
            >
              Manage ad campaigns, monitor marketing performance, organize leads with automated RBAC distribution, collaborate with your team and scale revenue — all from one modern SaaS platform.
            </motion.p>

            {/* Primary Action Buttons */}
            <motion.div
              variants={itemVariants}
              className="mt-10 flex flex-wrap justify-center gap-4"
            >
              <Link
                to="/auth"
                className="group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-9 py-4 font-bold text-white transition-all duration-300 hover:-translate-y-1 shadow-xl shadow-blue-500/25"
              >
                Access Dashboard
                <ArrowRight
                  size={18}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>

              <a
                href="#features"
                className="rounded-2xl border border-blue-200 bg-white px-9 py-4 font-bold text-blue-900 shadow-md transition-all duration-300 hover:-translate-y-1 hover:bg-blue-50/50 hover:border-blue-300"
              >
                Explore Capabilities
              </a>
            </motion.div>

            {/* Key Metrics Showcase Cards */}
            <motion.div
              variants={itemVariants}
              className="mt-16 grid w-full max-w-4xl grid-cols-2 gap-5 md:grid-cols-4"
            >
              {[
                { value: "25K+", label: "Active Leads" },
                { value: "98%", label: "Conversion Tracking" },
                { value: "₹2.5M", label: "Revenue Managed" },
                { value: "120+", label: "Teams" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-blue-100 bg-white p-6 shadow-md shadow-blue-950/5 transition-all hover:-translate-y-1.5 hover:shadow-xl hover:border-blue-300"
                >
                  <h2 className="text-3xl font-black text-blue-600">
                    {item.value}
                  </h2>
                  <p className="mt-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {item.label}
                  </p>
                </div>
              ))}
            </motion.div>

            {/* Interactive Dashboard Mockup Preview */}
            <motion.div
              variants={itemVariants}
              className="relative mt-20 w-full max-w-6xl"
            >
              {/* Outer Blue Glow Frame */}
              <div className="absolute inset-0 -z-10 rounded-[40px] bg-gradient-to-r from-blue-500/15 via-sky-400/15 to-indigo-500/15 blur-2xl" />

              {/* Dashboard Container */}
              <div className="overflow-hidden rounded-[32px] border border-blue-200/80 bg-white shadow-2xl shadow-blue-950/10">

                {/* Top Window Header */}
                <div className="flex items-center justify-between border-b border-blue-100 bg-slate-50/80 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-rose-400" />
                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                    <div className="h-3 w-3 rounded-full bg-emerald-400" />
                  </div>

                  <div className="rounded-full border border-blue-200 bg-white px-5 py-1.5 text-xs font-bold text-blue-700 shadow-xs">
                    Hoossh Workspace Dashboard
                  </div>

                  <div className="flex gap-2">
                    <div className="h-7 w-7 rounded-lg bg-blue-100/70" />
                    <div className="h-7 w-7 rounded-lg bg-blue-100/70" />
                  </div>
                </div>

                {/* Dashboard Mockup Cards */}
                <div className="grid gap-6 p-8 lg:grid-cols-3 bg-slate-50/40">

                  {/* Revenue Card */}
                  <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                    <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Revenue Managed</p>
                    <h2 className="mt-3 text-4xl font-black text-blue-600">₹42.5K</h2>
                    <div className="mt-6 h-2.5 rounded-full bg-blue-100">
                      <div className="h-2.5 w-[82%] rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" />
                    </div>
                  </div>

                  {/* New Leads Card */}
                  <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                    <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">New Leads Intake</p>
                    <h2 className="mt-3 text-4xl font-black text-indigo-600">3,280</h2>
                    <div className="mt-6 flex items-end gap-2">
                      <div className="h-10 flex-1 rounded-t-lg bg-blue-200" />
                      <div className="h-16 flex-1 rounded-t-lg bg-blue-400" />
                      <div className="h-12 flex-1 rounded-t-lg bg-blue-300" />
                      <div className="h-20 flex-1 rounded-t-lg bg-blue-600" />
                      <div className="h-24 flex-1 rounded-t-lg bg-indigo-500" />
                    </div>
                  </div>

                  {/* Conversion Rate Card */}
                  <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                    <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Conversion Efficiency</p>
                    <h2 className="mt-3 text-4xl font-black text-cyan-600">91%</h2>
                    <div className="mt-6 flex items-end gap-2">
                      {[40, 60, 75, 50, 90, 70, 95].map((height, index) => (
                        <div
                          key={index}
                          className="flex-1 rounded-t-md bg-gradient-to-t from-blue-600 to-cyan-400"
                          style={{ height: `${height * 0.3}px` }}
                        />
                      ))}
                    </div>
                  </div>

                </div>

                {/* Bottom Campaign Rows */}
                <div className="border-t border-blue-100 bg-white p-8">
                  <div className="grid grid-cols-4 rounded-xl bg-blue-50/70 p-3.5 text-xs font-bold text-blue-900 uppercase tracking-wider">
                    <span>Campaign</span>
                    <span>Platform</span>
                    <span>Status</span>
                    <span>Revenue</span>
                  </div>

                  {[
                    ["Summer Growth", "Meta Ads", "Running", "₹12,500"],
                    ["Search High Intent", "Google Ads", "Active", "₹9,200"],
                    ["Retargeting Funnel", "Instagram", "Completed", "₹6,850"],
                  ].map((row, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-4 border-b border-slate-100 px-4 py-4 text-sm text-slate-700 font-medium"
                    >
                      <span className="font-bold text-slate-900">{row[0]}</span>
                      <span>{row[1]}</span>
                      <span className="text-emerald-600 font-bold">{row[2]}</span>
                      <span className="font-black text-blue-600">{row[3]}</span>
                    </div>
                  ))}
                </div>

              </div>
            </motion.div>

            {/* Features Showcase Section */}
            <section id="features" className="mt-32 w-full">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="mb-16 text-center"
              >
                <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.25em] text-blue-600">
                  PLATFORM CAPABILITIES
                </p>

                <h2 className="text-4xl font-black text-blue-950 lg:text-5xl">
                  Everything You Need to Scale
                </h2>

                <p className="mx-auto mt-4 max-w-2xl text-base font-medium text-slate-500">
                  Hoossh combines marketing analytics, lead management, campaign tracking, and team productivity tools into a unified, high-performance interface.
                </p>
              </motion.div>

              <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
                {featureCards.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.07,
                    }}
                    className="group relative overflow-hidden rounded-3xl border border-blue-100 bg-white p-8 shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-blue-300"
                  >
                    {/* Soft Hover Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-cyan-50/50 opacity-0 transition duration-300 group-hover:opacity-100" />

                    {/* Icon Container */}
                    <div
                      className={`relative mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} text-white shadow-lg shadow-blue-500/20 transition duration-300 group-hover:scale-105`}
                    >
                      <feature.icon size={26} />
                    </div>

                    {/* Card Title */}
                    <h3 className="relative text-xl font-black text-blue-950 transition group-hover:text-blue-600">
                      {feature.title}
                    </h3>

                    {/* Card Description */}
                    <p className="relative mt-3 text-sm leading-relaxed text-slate-500 font-medium">
                      {feature.desc}
                    </p>

                    {/* Bottom Accent Line */}
                    <div className="relative mt-6 h-1 w-12 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-300 group-hover:w-20" />
                  </motion.div>
                ))}
              </div>
            </section>

          </motion.div>
        </main>

        <Footer variant="public" />
      </div>
    </div>
  );
}
