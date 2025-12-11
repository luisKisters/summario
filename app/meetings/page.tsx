"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { mockMeetings, MockMeeting } from "./mock-data";
import {
  Plus,
  Shield,
  Clock,
  Users,
  Hash,
  ChevronRight,
  Activity,
  Search,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Components ---

function Header() {
  return (
    <div className="relative z-10 mb-12 border-b border-purple-500/30 pb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 text-purple-400 mb-2"
          >
            <Shield className="w-5 h-5" />
            <span className="text-xs font-mono tracking-[0.2em] uppercase">
              Authorized Personnel Only
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-white to-purple-200"
            style={{ fontFamily: "Impact, sans-serif" }} // Fallback to Impact or similar heavy font
          >
            Mission Protocols
          </motion.h1>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.8, delay: 0.5, ease: "circOut" }}
            className="h-1 bg-purple-600 mt-2 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/50 w-full h-full animate-pulse" />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col items-end"
        >
          <div className="text-right font-mono text-xs text-purple-300/70 mb-1">
            SYS.STATUS: ONLINE
          </div>
          <div className="text-right font-mono text-xs text-purple-300/70">
            ENCRYPTION: AES-256
          </div>
          <Link href="/meeting-setup">
            <motion.button
              whileHover={{
                scale: 1.05,
                backgroundColor: "rgba(168, 85, 247, 0.2)",
              }}
              whileTap={{ scale: 0.95 }}
              className="mt-4 flex items-center gap-2 bg-purple-900/40 border border-purple-500 text-purple-100 px-6 py-2 uppercase font-bold tracking-widest text-sm hover:border-purple-300 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Protocol
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  delay,
}: {
  label: string;
  value: string;
  icon: any;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-black/40 border border-purple-500/20 p-4 flex items-center gap-4 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-1">
        <div className="w-2 h-2 bg-purple-500 rounded-full opacity-50 group-hover:animate-ping" />
      </div>
      <div className="bg-purple-900/30 p-2 rounded-sm text-purple-400">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-xs text-purple-400/60 font-mono uppercase tracking-wider">
          {label}
        </div>
        <div className="text-xl font-bold text-white tracking-tight">
          {value}
        </div>
      </div>
      {/* Scanline effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent h-[200%] w-full -translate-y-full group-hover:translate-y-full transition-transform duration-1000 pointer-events-none" />
    </motion.div>
  );
}

function MeetingCard({
  meeting,
  index,
}: {
  meeting: MockMeeting;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: "backOut" }}
      className="group relative"
    >
      <Link href={`/meeting/${meeting.id}`} className="block h-full">
        <div className="relative h-full bg-slate-950 border border-purple-900/50 p-6 overflow-hidden transition-all duration-300 group-hover:border-purple-400 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]">
          {/* Decorative Corner Markers */}
          <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-purple-500 transition-all duration-300 group-hover:w-4 group-hover:h-4" />
          <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 border-purple-500 transition-all duration-300 group-hover:w-4 group-hover:h-4" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-purple-500 transition-all duration-300 group-hover:w-4 group-hover:h-4" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-purple-500 transition-all duration-300 group-hover:w-4 group-hover:h-4" />

          {/* Background Grid Pattern */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(rgba(168, 85, 247, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(168, 85, 247, 0.5) 1px, transparent 1px)`,
              backgroundSize: "20px 20px",
            }}
          />

          <div className="relative z-10 flex flex-col h-full gap-4">
            <div className="flex justify-between items-start">
              <div className="bg-purple-950/50 border border-purple-800 px-2 py-0.5 text-[10px] font-mono text-purple-300 uppercase tracking-widest">
                {meeting.sector}
              </div>
              <div
                className={cn(
                  "px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border",
                  meeting.priority === "CRITICAL"
                    ? "text-red-400 border-red-900 bg-red-950/30"
                    : meeting.priority === "HIGH"
                    ? "text-orange-400 border-orange-900 bg-orange-950/30"
                    : "text-blue-400 border-blue-900 bg-blue-950/30"
                )}
              >
                {meeting.priority}
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors uppercase font-mono">
                {meeting.name}
              </h3>
              <div className="grid grid-cols-2 gap-y-2 text-xs font-mono text-gray-400">
                <div className="flex items-center gap-1">
                  <Hash className="w-3 h-3 text-purple-600" />
                  {meeting.id}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-purple-600" />
                  {meeting.duration}
                </div>
                <div className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-purple-600" />
                  {meeting.status}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-purple-600" />
                  {meeting.participants.length} AGENTS
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-purple-900/30 flex justify-between items-center text-xs text-gray-500 font-mono">
              <span>{new Date(meeting.date).toLocaleDateString()}</span>
              <ChevronRight className="w-4 h-4 text-purple-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function MeetingsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial system boot/loading
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center font-mono text-purple-500 overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5"></div>
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-4 relative z-10"
        >
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm tracking-[0.3em] uppercase animate-pulse">
            Initializing Echelon Core...
          </p>
        </motion.div>
        {/* Scanning line */}
        <motion.div
          initial={{ top: "-10%" }}
          animate={{ top: "110%" }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 w-full h-1 bg-purple-500/30 blur-sm z-0"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020205] text-white p-4 md:p-8 font-sans relative selection:bg-purple-500/30 selection:text-purple-200">
      {/* Global Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-96 bg-purple-900/10 blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-900/10 blur-[100px]" />
        {/* Tech Grid */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <Header />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <StatCard
            label="Active Protocols"
            value="3"
            icon={Activity}
            delay={0.2}
          />
          <StatCard
            label="Total Archived"
            value="128"
            icon={Database}
            delay={0.3}
          />
          <StatCard
            label="Security Level"
            value="OMEGA"
            icon={Shield}
            delay={0.4}
          />
          <StatCard
            label="Next Briefing"
            value="0800 HRS"
            icon={Clock}
            delay={0.5}
          />
        </div>

        {/* Filter/Search Bar (Visual Only) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col md:flex-row gap-4 mb-8 items-center bg-white/5 border border-white/10 p-2 rounded-sm"
        >
          <div className="flex-1 flex items-center gap-2 px-3">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="SEARCH PROTOCOLS..."
              className="bg-transparent border-none outline-none text-sm font-mono text-white w-full placeholder:text-gray-600"
            />
          </div>
          <div className="flex gap-2">
            {["ALL", "ACTIVE", "ARCHIVED", "CLASSIFIED"].map((filter) => (
              <button
                key={filter}
                className="px-3 py-1 text-[10px] font-mono border border-white/10 hover:bg-purple-900/30 hover:border-purple-500/50 transition-colors uppercase"
              >
                {filter}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {mockMeetings.map((meeting, index) => (
              <MeetingCard key={meeting.id} meeting={meeting} index={index} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
