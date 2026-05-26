// app/(miniapp)/admin/layout.tsx
"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Package, 
  Users, 
  DollarSign, 
  ShoppingBag,
  LogOut,
  ChevronRight,
  Zap,
  Menu,
  X
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Protection logic
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/auth");
      return;
    }
    if (!user.isAdmin) {
      toast.error("Unauthorized: Admin access required");
      router.push("/");
    }
  }, [user, isAuthenticated, router]);

  const navItems = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Prompts", href: "/admin/prompts", icon: Package },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Payments", href: "/admin/manual-payments", icon: DollarSign },
    { name: "Purchases", href: "/admin/purchases", icon: ShoppingBag },
  ];

  if (!user?.isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex overflow-hidden">
      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#0f172a] text-slate-300 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} shadow-2xl lg:shadow-none`}>
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="p-8 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-400/20 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6 text-slate-900" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-black text-sm tracking-widest uppercase">Admin Hub</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Marketplace Control</span>
              </div>
            </Link>
            <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 space-y-2 py-4">
            <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 ml-2">Main Menu</div>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group ${
                    isActive 
                      ? 'bg-white/10 text-white shadow-xl shadow-black/20' 
                      : 'hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-yellow-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span className="flex-1">{item.name}</span>
                  {isActive && <ChevronRight className="w-4 h-4 text-yellow-400" />}
                </Link>
              );
            })}
          </nav>

          {/* User Profile Area */}
          <div className="p-6 mt-auto">
            <div className="bg-white/5 rounded-[2rem] p-5 border border-white/10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center">
                   <span className="text-xs font-bold text-white">
                     {user.firstName?.slice(0, 2).toUpperCase() || "AD"}
                   </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-white truncate">{user.firstName}</span>
                  <span className="text-[10px] text-slate-500 truncate">System Administrator</span>
                </div>
              </div>
              <button 
                onClick={() => router.push('/')}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                Exit to Store
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header Bar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
             <button className="lg:hidden p-2 hover:bg-slate-100 rounded-lg" onClick={() => setIsSidebarOpen(true)}>
               <Menu className="w-6 h-6" />
             </button>
             <div className="hidden lg:block w-1.5 h-8 bg-yellow-400 rounded-full" />
             <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">
               {navItems.find(i => i.href === pathname)?.name || "Dashboard"}
             </h2>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Platform Status</span>
                <span className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase">
                  <Zap className="w-3 h-3 animate-pulse" /> All Systems Online
                </span>
             </div>
             <div className="w-px h-10 bg-slate-200" />
             <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-full pl-4 pr-1 py-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">System Time</span>
                <div className="w-20 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
                   {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
             </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
