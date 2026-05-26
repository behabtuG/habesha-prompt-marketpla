"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { ConnectTelegram } from "@/components/ConnectTelegram";
import { 
  User, Mail, Shield, 
  LogOut, Star, ShoppingBag, 
  Settings, Zap, ChevronRight,
  ShieldCheck,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export default function ProfilePage() {
  const { user, logout, isAuthenticated } = useAuthStore();

  const getImageUrl = (path?: string | null) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:4060";
    return `${baseUrl}${path}`;
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-xl shadow-black/5">
          <User className="h-10 w-10 text-slate-400" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">Access Restricted</h1>
        <p className="text-slate-500 font-medium mb-8 max-w-xs mx-auto text-sm">Please authorize your account to view your personal marketplace hub.</p>
        <Link href="/auth">
          <Button className="h-12 px-10 bg-slate-900 text-white hover:bg-black rounded-2xl text-xs font-bold transition-all shadow-xl shadow-black/10 active:scale-95">
            Authorize Account
          </Button>
        </Link>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    toast.success("Safe logout completed");
    window.location.href = "/";
  };

  const StatItem = ({ icon: Icon, label, value, color }: any) => (
    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:shadow-lg hover:shadow-black/5 transition-all group">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-sm font-black text-slate-800 tabular-nums">{value}</span>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* ── High-End Profile Header ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[3rem] p-10 bg-[#0f172a] text-white shadow-2xl">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-400/10 rounded-full blur-[80px] -ml-20 -mb-20" />
        
        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-tr from-yellow-400 to-indigo-500 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-1000" />
            <div className="relative w-32 h-32 rounded-full bg-slate-800 border-4 border-white/10 flex items-center justify-center text-4xl font-black text-white shadow-2xl overflow-hidden">
              {user.avatarUrl ? (
                <img src={getImageUrl(user.avatarUrl)} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user.firstName?.charAt(0) || user.username?.charAt(0) || "U"
              )}
            </div>
            {user.isAdmin && (
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center shadow-lg border-4 border-[#0f172a]">
                <ShieldCheck className="w-5 h-5 text-slate-900" />
              </div>
            )}
          </div>
          
          <div className="text-center md:text-left flex-1">
            <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
              <h1 className="text-4xl font-black tracking-tight text-white">
                {user.firstName ? `${user.firstName} ${user.lastName || ""}` : user.username}
              </h1>
              {user.isAdmin && (
                <span className="px-3 py-1 bg-yellow-400 text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest">Administrator</span>
              )}
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
                <Mail className="w-4 h-4 text-indigo-400" />
                {user.email || "No secure email linked"}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <Zap className="w-3.5 h-3.5" />
                Verified Account
              </div>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-bold text-white transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            Safe Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Stats & Connections */}
        <div className="lg:col-span-4 space-y-8">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Ledger Summary</h3>
            <div className="space-y-3">
              <StatItem 
                icon={Star} 
                label="Available Stars" 
                value={`${user.balanceStars} ⭐`} 
                color="bg-amber-500" 
              />
              <StatItem 
                icon={Wallet} 
                label="Total Invested" 
                value={`${user.totalSpent} ⭐`} 
                color="bg-indigo-500" 
              />
              <button className="w-full flex items-center justify-between p-4 bg-slate-900 rounded-2xl text-white shadow-xl shadow-slate-900/10 hover:bg-black transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-yellow-400" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest">Transaction History</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <ConnectTelegram />
        </div>

        {/* Right Column: Settings & Admin */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="border-none shadow-sm overflow-hidden p-10 space-y-10">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-8 flex items-center gap-3">
                <Settings className="w-5 h-5 text-indigo-500" />
                Account Configuration
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal First Name</label>
                  <input 
                    type="text" 
                    defaultValue={user.firstName}
                    className="w-full h-12 px-5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Last Name</label>
                  <input 
                    type="text" 
                    defaultValue={user.lastName}
                    className="w-full h-12 px-5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>
              <Button className="mt-8 h-12 px-10 bg-slate-900 text-white hover:bg-black rounded-2xl text-xs font-bold transition-all shadow-xl shadow-black/10 active:scale-95">
                Save Configurations
              </Button>
            </div>

            <div className="h-px bg-slate-100" />

            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Security Shield</h3>
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-between group cursor-pointer hover:bg-white hover:shadow-xl hover:shadow-black/5 transition-all duration-500">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Security Credentials</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Manage your encryption keys and sessions</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full group-hover:bg-indigo-50 group-hover:text-indigo-600">
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {user.isAdmin && (
              <div className="pt-4">
                <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-6">Internal Access</h3>
                <Link href="/admin">
                  <button className="w-full group relative p-[2px] rounded-3xl overflow-hidden transition-all active:scale-95">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 animate-gradient-x" />
                    <div className="relative bg-[#0f172a] rounded-[calc(1.5rem+4px)] p-6 flex items-center justify-between text-white">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 flex items-center justify-center text-yellow-400">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-black uppercase tracking-tight">Access Control Center</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Authorized Administrative Access Only</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-yellow-400 transition-colors" />
                    </div>
                  </button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
