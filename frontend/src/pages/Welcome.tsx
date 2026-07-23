import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  DollarSign,
  Layers,
  LineChart,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';

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
      desc: 'Monitor clicks, impressions, conversions and ad performance from one dashboard.',
      icon: BarChart3,
      color: 'from-blue-500 to-indigo-500',
    },
    {
      title: 'Live Lead Tracking',
      desc: 'Receive instant lead updates using real-time WebSocket events.',
      icon: Target,
      color: 'from-pink-500 to-rose-500',
    },
    {
      title: 'Campaign Insights',
      desc: 'Analyze CTR, CPC, Cost and Conversion Rate effortlessly.',
      icon: LineChart,
      color: 'from-orange-500 to-amber-500',
    },
    {
      title: 'Team Collaboration',
      desc: 'Assign leads, create notes and collaborate securely.',
      icon: Users,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      title: 'Revenue Monitoring',
      desc: 'Track revenue, ROAS and business growth in real time.',
      icon: DollarSign,
      color: 'from-purple-500 to-violet-500',
    },
    {
      title: 'Platform Integrations',
      desc: 'Connect Meta, Google Ads and many other marketing platforms.',
      icon: Layers,
      color: 'from-cyan-500 to-sky-500',
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">

      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#94a3b810_1px,transparent_1px),linear-gradient(to_bottom,#94a3b810_1px,transparent_1px)] bg-[size:70px_70px] opacity-40 dark:opacity-10" />

      {/* Glow Left */}
      <div className="absolute -left-56 -top-56 h-[700px] w-[700px] rounded-full bg-brand-500/15 blur-[180px]" />

      {/* Glow Right */}
      <div className="absolute -right-56 bottom-0 h-[700px] w-[700px] rounded-full bg-indigo-500/15 blur-[180px]" />

      {/* Center Glow */}
<div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-cyan-500/5 blur-[220px]" />

      {/* Floating Blobs */}
      <div className="absolute top-40 left-20 h-28 w-28 rounded-full bg-blue-500/10 blur-3xl animate-pulse" />

      <div className="absolute right-24 top-60 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl animate-pulse" />

      <div className="relative z-20">

        {/* Header */}

        <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-blue-600 text-white shadow-xl">

              <TrendingUp size={22} />

            </div>

            <div>

              <h1 className="text-xl font-black tracking-tight">

                Lead Growth

              </h1>

              <p className="text-xs text-slate-500 dark:text-slate-400">

                Marketing Intelligence Platform

              </p>

            </div>

          </div>

          <Link
            to="/auth"
            className="rounded-2xl border border-slate-300 bg-white px-6 py-3 font-semibold shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900"
          >
            Sign In
          </Link>

        </header>

        <main className="mx-auto max-w-7xl px-6">
                    <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center pt-10 pb-24 text-center lg:pt-20"
          >
            {/* Badge */}
            <motion.div
              variants={itemVariants}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-5 py-2 text-sm font-semibold text-brand-600 backdrop-blur dark:text-brand-400"
            >
              <Sparkles size={15} />
              <span>One Dashboard • Every Lead • Maximum Growth</span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              variants={itemVariants}
              className="max-w-5xl text-5xl font-black leading-tight tracking-tight text-slate-900 dark:text-white sm:text-6xl lg:text-7xl"
            >
              Grow Your Business

              <br />

              {/* antialiased + text-stroke removes the whitish halo that shows up on
                  bold gradient-clipped glyphs (most visible on curved letters like "S") */}
             <span
  className="bg-blue-500 bg-clip-text text-transparent"
  style={{ WebkitTextFillColor: "transparent" }}
>
  Smarter Than Ever
</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              className="mt-8 max-w-3xl text-xl leading-9 text-slate-600 dark:text-slate-400"
            >
              Manage campaigns, monitor marketing performance,
              organize leads, collaborate with your team and increase
              revenue — all from one modern dashboard.
            </motion.p>

            {/* Buttons */}
            <motion.div
              variants={itemVariants}
              className="mt-12 flex flex-wrap justify-center gap-5"
            >
          <Link
  to="/auth"
  className="group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-400 px-9 py-4 font-bold text-white transition-all duration-300 hover:-translate-y-1 hover:scale-105 shadow-none ring-0 outline-none border-0"
>
  Get Started

  <ArrowRight
    size={18}
    className="transition-transform duration-300 group-hover:translate-x-1"
  />
</Link>

              <a
                href="#features"
                className="rounded-2xl border border-slate-300 bg-white px-9 py-4 font-semibold shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                Explore Features
              </a>
            </motion.div>

            {/* Stats */}

            <motion.div
              variants={itemVariants}
              className="mt-16 grid w-full max-w-4xl grid-cols-2 gap-5 md:grid-cols-4"
            >
              {[
                {
                  value: "25K+",
                  label: "Active Leads",
                },
                {
                  value: "98%",
                  label: "Conversion Tracking",
                },
                {
                  value: "$2.5M",
                  label: "Revenue Managed",
                },
                {
                  value: "120+",
                  label: "Teams",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg transition-all hover:-translate-y-2 dark:border-slate-800 dark:bg-slate-900"
                >
                  <h2 className="text-3xl font-black text-brand-600">
                    {item.value}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {item.label}
                  </p>
                </div>
              ))}
            </motion.div>

            {/* Dashboard starts below */}
                        <motion.div
              variants={itemVariants}
              className="relative mt-24 w-full max-w-6xl"
            >
              {/* Glow */}
              <div className="absolute inset-0 -z-10 rounded-[40px] bg-gradient-to-r from-brand-500/20 via-indigo-500/20 to-purple-500/20 blur-3xl" />

              {/* Dashboard */}
              <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">

                {/* Top Bar */}
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">

                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>

                  <div className="rounded-full bg-slate-100 px-5 py-2 text-sm font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    LeadGrowth Dashboard
                  </div>

                  <div className="flex gap-2">
                    <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800" />
                    <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800" />
                  </div>

                </div>

                {/* Dashboard Body */}
                <div className="grid gap-6 p-8 lg:grid-cols-3">

                  {/* Revenue */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md transition hover:-translate-y-2 hover:shadow-xl dark:border-slate-800 dark:bg-slate-950">

                    <p className="text-sm text-slate-500">
                      Revenue
                    </p>

                    <h2 className="mt-3 text-4xl font-black text-emerald-500">
                      $42.5K
                    </h2>

                    <div className="mt-6 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                      <div className="h-2 w-[82%] rounded-full bg-gradient-to-r from-emerald-500 to-green-400" />
                    </div>

                  </div>

                  {/* Leads */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md transition hover:-translate-y-2 hover:shadow-xl dark:border-slate-800 dark:bg-slate-950">

                    <p className="text-sm text-slate-500">
                      New Leads
                    </p>

                    <h2 className="mt-3 text-4xl font-black text-brand-600">
                      3,280
                    </h2>

                    <div className="mt-6 flex gap-2">

                      <div className="h-16 w-4 rounded-full bg-brand-300" />

                      <div className="h-24 w-4 rounded-full bg-brand-500" />

                      <div className="h-12 w-4 rounded-full bg-brand-400" />

                      <div className="h-20 w-4 rounded-full bg-brand-600" />

                      <div className="h-28 w-4 rounded-full bg-indigo-500" />

                      <div className="h-16 w-4 rounded-full bg-brand-400" />

                    </div>

                  </div>

                  {/* Conversion */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md transition hover:-translate-y-2 hover:shadow-xl dark:border-slate-800 dark:bg-slate-950">

                    <p className="text-sm text-slate-500">
                      Conversion Rate
                    </p>

                    <h2 className="mt-3 text-4xl font-black text-blue-600">
                      91%
                    </h2>

                    <div className="mt-6 flex items-end gap-2">

                      {[45, 65, 80, 55, 95, 72, 100].map((height, index) => (
                        <div
                          key={index}
                          className="flex-1 rounded-full bg-gradient-to-t from-purple-400 to-indigo-500"
                          style={{
                            height: `${height}px`,
                          }}
                        />
                      ))}

                    </div>

                  </div>

                </div>

                {/* Bottom Table */}
                <div className="border-t border-slate-200 p-8 dark:border-slate-800">

                  <div className="grid grid-cols-4 rounded-2xl bg-slate-100 p-4 text-sm font-semibold dark:bg-slate-800">

                    <span>Campaign</span>

                    <span>Platform</span>

                    <span>Status</span>

                    <span>Revenue</span>

                  </div>

                  {[
                    ["Summer Sale", "Meta Ads", "Running", "$12,500"],
                    ["Google Search", "Google", "Active", "$9,200"],
                    ["Retargeting", "Instagram", "Completed", "$6,850"],
                  ].map((row, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-4 border-b border-slate-200 px-4 py-5 text-sm dark:border-slate-800"
                    >
                      <span>{row[0]}</span>
                      <span>{row[1]}</span>
                      <span className="text-emerald-500">{row[2]}</span>
                      <span className="font-bold">{row[3]}</span>
                    </div>
                  ))}

                </div>

              </div>

            </motion.div>

            {/* Features Section Starts */}
            <section
              id="features"
              className="mt-36"
            >
                            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="mb-20 text-center"
              >
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-brand-600">
                  FEATURES
                </p>

                <h2 className="text-4xl font-black text-slate-900 dark:text-white lg:text-5xl">
                  Everything You Need
                </h2>

                <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-500 dark:text-slate-400">
                  Lead Growth combines marketing analytics, CRM,
                  campaign monitoring, collaboration and revenue
                  intelligence into one beautiful dashboard.
                </p>
              </motion.div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">

                {featureCards.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.08,
                    }}
                    className="group relative overflow-hidden rounded-[30px] border border-slate-200 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900"
                  >
                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-indigo-500/5 opacity-0 transition duration-500 group-hover:opacity-100" />

                    {/* Icon */}
                    <div
                      className={`relative mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} text-white shadow-xl transition duration-300 group-hover:scale-110 group-hover:rotate-6`}
                    >
                      <feature.icon size={28} />
                    </div>

                    {/* Title */}
                    <h3 className="relative text-2xl font-bold text-slate-900 transition group-hover:text-brand-600 dark:text-white">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="relative mt-5 leading-8 text-slate-500 dark:text-slate-400">
                      {feature.desc}
                    </p>

                    {/* Bottom line */}
                    <div className="relative mt-8 h-1 w-14 rounded-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all duration-300 group-hover:w-24" />
                  </motion.div>
                ))}

              </div>

            </section>

          
          </motion.div>

        </main>

      </div>

    </div>
  );
}
