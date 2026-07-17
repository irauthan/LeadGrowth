import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Target, 
  LineChart, 
  Users, 
  DollarSign, 
  Layers, 
  TrendingUp, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function Welcome() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: 'easeOut' as any },
    },
  };

  const featureCards = [
    { title: 'Marketing Analytics', desc: 'Consolidated click, impression, spend, and conversion tracking.', icon: BarChart3, color: 'from-blue-500 to-indigo-500' },
    { title: 'Live Lead Tracking', desc: 'Real-time WebSocket alerts and custom recent lead feeds.', icon: Target, color: 'from-rose-500 to-pink-500' },
    { title: 'Campaign Insights', desc: 'Drill down CPC, CTR, and platform conversion performance.', icon: LineChart, color: 'from-amber-500 to-orange-500' },
    { title: 'Team Collaboration', desc: 'Role-based access permissions, notes logging, and tasks board.', icon: Users, color: 'from-emerald-500 to-teal-500' },
    { title: 'Revenue Monitoring', desc: 'Calculate accurate ROAS and conversion metrics instantly.', icon: DollarSign, color: 'from-violet-500 to-purple-500' },
    { title: 'Multi Platform Integrations', desc: 'Simulated API sync connectors for Meta and Google Ads.', icon: Layers, color: 'from-cyan-500 to-sky-500' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Dynamic Background Gradients */}
      <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-brand-300 to-indigo-300 opacity-20 blur-[120px] dark:from-brand-900/30 dark:to-indigo-900/30" />
      <div className="absolute -right-40 bottom-0 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-rose-300 to-indigo-300 opacity-20 blur-[120px] dark:from-rose-950/20 dark:to-indigo-950/20" />

      {/* Welcome Top Header */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-lg nav-glow">
            <TrendingUp size={22} />
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-500 bg-clip-text text-transparent dark:from-white dark:to-indigo-400">
            Lead Growth
          </span>
        </div>
        <Link
          to="/auth"
          className="rounded-2xl border border-slate-200/60 bg-white/60 px-5 py-2.5 text-sm font-semibold shadow-sm backdrop-blur transition-all hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-slate-800"
        >
          Sign In
        </Link>
      </div>

      {/* Hero Section */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-10 text-center lg:pt-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center"
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="mb-6 flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-600 dark:border-brand-400/20 dark:text-brand-400"
          >
            <Sparkles size={14} className="animate-spin-slow" />
            <span>One Dashboard. Every Lead. Complete Growth.</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={itemVariants}
            className="max-w-4xl text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl"
          >
            Welcome to{' '}
            <span className="bg-gradient-to-r from-brand-600 to-indigo-500 bg-clip-text text-transparent dark:from-brand-400 dark:to-indigo-400">
              Lead Growth
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="mt-6 max-w-2xl text-lg text-slate-500 dark:text-slate-400 sm:text-xl leading-relaxed"
          >
            Manage Campaigns, Track Leads, Monitor Performance and Grow Revenue from one centralized platform.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/auth"
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-500 px-8 py-4 font-bold text-white shadow-xl shadow-brand-500/25 transition-all hover:scale-[1.02] hover:shadow-brand-500/35 nav-glow"
            >
              <span>Get Started Free</span>
              <ArrowRight size={18} />
            </Link>
            <a
              href="#features"
              className="rounded-2xl border border-slate-200 bg-white/60 px-8 py-4 font-semibold shadow-sm backdrop-blur transition-all hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-slate-800"
            >
              Explore Features
            </a>
          </motion.div>

          {/* Glassmorphic Floating Dashboard Mockup */}
          <motion.div
            variants={itemVariants}
            className="relative mt-20 w-full max-w-5xl rounded-3xl border border-white/20 bg-white/25 p-4 shadow-2xl backdrop-blur-md dark:border-slate-800/40 dark:bg-slate-900/25"
          >
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-slate-100 shadow-inner dark:border-slate-800/40 dark:bg-slate-950">
              {/* Fake dashboard headers */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-rose-500" />
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="flex gap-2">
                  <div className="h-4 w-4 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-4 rounded-full bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
              {/* Fake content image placeholder */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-200/40 bg-white/80 p-5 dark:border-slate-800/40 dark:bg-slate-900/40">
                  <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800 mb-4" />
                  <div className="h-8 w-16 rounded bg-brand-500/10 dark:bg-brand-500/20" />
                </div>
                <div className="rounded-xl border border-slate-200/40 bg-white/80 p-5 dark:border-slate-800/40 dark:bg-slate-900/40">
                  <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800 mb-4" />
                  <div className="h-8 w-16 rounded bg-indigo-500/10 dark:bg-indigo-500/20" />
                </div>
                <div className="rounded-xl border border-slate-200/40 bg-white/80 p-5 dark:border-slate-800/40 dark:bg-slate-900/40">
                  <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800 mb-4" />
                  <div className="h-8 w-16 rounded bg-emerald-500/10 dark:bg-emerald-500/20" />
                </div>
              </div>
            </div>
            {/* Ambient glows behind mockup */}
            <div className="absolute left-1/2 top-1/2 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/30 blur-[100px]" />
          </motion.div>
        </motion.div>

        {/* Feature Highlights Grid */}
        <section id="features" className="mt-32">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-800 dark:text-slate-100 mb-16">
            Everything you need to grow campaigns
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featureCards.map((feat, index) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="group relative rounded-3xl border border-slate-200/50 bg-white/40 p-8 text-left backdrop-blur hover:bg-white dark:border-slate-800/60 dark:bg-slate-900/30 dark:hover:bg-slate-900/65 transition-all shadow-sm"
              >
                <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feat.color} text-white shadow-md`}>
                  <feat.icon size={22} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors">
                  {feat.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {feat.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
