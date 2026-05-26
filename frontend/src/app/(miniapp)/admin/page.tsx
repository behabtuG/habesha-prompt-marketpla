// app/(miniapp)/admin/page.tsx
"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  Users,
  Package,
  DollarSign,
  CheckCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Calendar,
  ShieldCheck
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

export default function AdminDashboard() {
  const { user } = useAuthStore();

  const { data: statsData, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.get("/admin/stats").then((res) => res.data),
    enabled: !!user?.isAdmin,
  });

  const stats = statsData?.data || {};

  // Mock data for charts
  const chartData = [
    { name: "Mon", sales: 400 },
    { name: "Tue", sales: 300 },
    { name: "Wed", sales: 600 },
    { name: "Thu", sales: 800 },
    { name: "Fri", sales: 500 },
    { name: "Sat", sales: 900 },
    { name: "Sun", sales: 700 },
  ];

  const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
    <Card className="relative overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-500 group">
      <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-5 bg-gradient-to-br ${color}`} />
      <div className="p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${color} shadow-lg shadow-black/5`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</span>
          <span className="text-3xl font-black text-slate-800 tabular-nums">
            {isLoading ? "..." : value}
          </span>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ── Welcome Section ────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            Welcome back, <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">{user?.firstName}</span>
          </h1>
          <p className="text-slate-500 font-medium">Here's what's happening with your marketplace today.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="flex flex-col pr-4">
            <span className="text-[10px] font-black text-slate-400 uppercase">Today's Date</span>
            <span className="text-sm font-bold text-slate-800">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* ── Stat Grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers || 0}
          icon={Users}
          trend={12}
          color="from-indigo-500 to-purple-500"
        />
        <StatCard
          title="Total Prompts"
          value={stats.totalPrompts || 0}
          icon={Package}
          trend={8}
          color="from-blue-500 to-cyan-500"
        />
        <StatCard
          title="Revenue (Stars)"
          value={stats.totalRevenueStars || 0}
          icon={DollarSign}
          trend={24}
          color="from-amber-500 to-orange-500"
        />
        <StatCard
          title="Active Prompts"
          value={stats.activePrompts || 0}
          icon={CheckCircle}
          trend={-2}
          color="from-emerald-500 to-teal-500"
        />
      </div>

      {/* ── Charts & Activity ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 p-8 border-none shadow-sm overflow-hidden relative">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Sales Analytics</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">Last 7 Days</div>
            </div>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" minHeight={350}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontWeight: 700 }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#6366f1"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* System Activity */}
        <Card className="p-8 border-none shadow-sm bg-[#0f172a] text-white">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Real-time Logs</h3>
          </div>

          <div className="space-y-6">
            {[
              { type: 'user', msg: 'New user registered', time: '2 min ago', icon: Users, color: 'bg-indigo-500' },
              { type: 'prompt', msg: 'Prompt "AI Art" updated', time: '15 min ago', icon: Package, color: 'bg-emerald-500' },
              { type: 'payment', msg: 'Payment verified #394', time: '1 hour ago', icon: DollarSign, color: 'bg-amber-500' },
              { type: 'system', msg: 'Backup completed', time: '3 hours ago', icon: ShieldCheck, color: 'bg-slate-500' },
            ].map((log, i) => (
              <div key={i} className="flex items-center gap-4 group cursor-pointer">
                <div className={`w-10 h-10 rounded-xl ${log.color} flex items-center justify-center shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}>
                  <log.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-slate-100 truncate">{log.msg}</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">{log.time}</span>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full py-4 mt-12 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all border border-white/5">
            View All Audit Logs
          </button>
        </Card>
      </div>
    </div>
  );
}
