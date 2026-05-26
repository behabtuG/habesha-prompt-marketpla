// app/(miniapp)/layout.tsx
"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { Toaster } from "@/components/ui/sonner";
import {
  MoreHorizontal,
  ShieldCheck,
  User as UserIcon,
  Settings,
  Bookmark,
  ShoppingBag,
  LogOut,
  Users,
  Share2,
  ChevronDown
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

export default function MiniAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const { isAuthenticated, user, logout } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use the custom hook for both menus
  useOutsideClick(menuRef, () => setIsMenuOpen(false));
  useOutsideClick(profileMenuRef, () => setIsProfileMenuOpen(false));


  const handleLogout = () => {
    logout();
    setIsProfileMenuOpen(false);
    toast.success("Safe logout completed");
  };

  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-yellow-200 relative">
      {!isAdminPage && (
        <div className="absolute top-8 left-0 right-0 z-50 px-6 flex justify-center">
          <header className="w-full max-w-6xl h-16 bg-white border border-slate-200/60 rounded-full px-8 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <span className="text-xs font-black tracking-[0.2em] uppercase">Habesha PROMPTS</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-10">
              <Link href="/" className="text-[13px] font-bold text-slate-500 hover:text-slate-900 transition-colors">Home</Link>
              <Link href="/prompts?category=Images" className="text-[13px] font-bold text-slate-500 hover:text-slate-900 transition-colors">Images</Link>
              <Link href="/prompts?category=Code" className="text-[13px] font-bold text-slate-500 hover:text-slate-900 transition-colors">Code</Link>
              <Link href="/prompts?category=Business" className="text-[13px] font-bold text-slate-500 hover:text-slate-900 transition-colors">Business</Link>
            </nav>

            <div className="flex items-center gap-4">
              {mounted && user?.isAdmin && (
                <Link href="/admin" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full group hover:bg-indigo-600 transition-all active:scale-95">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 group-hover:text-white transition-colors" />
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest group-hover:text-white transition-colors">Admin Hub</span>
                </Link>
              )}

              {mounted && !isAuthenticated && (
                <Link href="/auth">
                  <Button className="h-10 px-6 bg-slate-900 text-white hover:bg-black rounded-full text-xs font-bold transition-all active:scale-95">Login / Register</Button>
                </Link>
              )}

              <div className="flex items-center gap-3 relative">
                {/* General Menu Toggle (Three Dots) */}
                <div className="relative" ref={menuRef}>
                  <button
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border active:scale-95 group ${isMenuOpen ? 'bg-slate-100 border-slate-200 text-slate-900' : 'hover:bg-slate-50 border-slate-100 text-slate-400'}`}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>

                  {isMenuOpen && (
                    <div className="absolute top-12 right-0 w-64 bg-white/95 backdrop-blur-2xl border border-slate-100 rounded-[2rem] py-4 shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[60] animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                      {user?.isAdmin && (
                        <>
                          <Link href="/admin" className="flex items-center gap-3 px-6 py-3 text-sm font-black text-indigo-600 hover:bg-indigo-50 transition-all" onClick={() => setIsMenuOpen(false)}>
                            <ShieldCheck className="w-4 h-4" /> Admin Hub
                          </Link>
                          <div className="h-px bg-slate-100 my-3 mx-6" />
                        </>
                      )}

                      <Link href="/bookmarks" className="flex items-center gap-3 px-6 py-3 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all" onClick={() => setIsMenuOpen(false)}>
                        <Bookmark className="w-4 h-4 text-indigo-500" /> Bookmarks
                      </Link>

                      <Link href="/community" className="flex items-center gap-3 px-6 py-3 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all" onClick={() => setIsMenuOpen(false)}>
                        <Users className="w-4 h-4 text-slate-400" /> Community
                      </Link>
                      <Link href="/share" className="flex items-center gap-3 px-6 py-3 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all" onClick={() => setIsMenuOpen(false)}>
                        <Share2 className="w-4 h-4 text-slate-400" /> Share a Prompt
                      </Link>
                    </div>
                  )}
                </div>

                {/* Identity Menu Toggle (Profile Icon) */}
                {mounted && isAuthenticated && (
                  <div className="relative" ref={profileMenuRef}>
                    <button
                      onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                      className={`h-10 px-3 pr-4 rounded-full bg-slate-50 border transition-all active:scale-95 flex items-center gap-2 group ${isProfileMenuOpen ? 'border-indigo-200 bg-indigo-50' : 'border-slate-100 hover:bg-slate-100'}`}
                    >
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase group-hover:bg-indigo-500 group-hover:text-white transition-all">
                        {user ? (user.firstName?.slice(0, 2) || user.username?.slice(0, 2)) : "US"}
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${isProfileMenuOpen ? 'rotate-180 text-indigo-500' : ''}`} />
                    </button>

                    {isProfileMenuOpen && (
                      <div className="absolute top-12 right-0 w-64 bg-white/95 backdrop-blur-2xl border border-slate-100 rounded-[2rem] py-4 shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[60] animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                        <div className="px-6 py-3 mb-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Identity</p>
                          <p className="text-sm font-black text-slate-900 truncate">{user?.firstName || user?.username}</p>
                        </div>
                        <div className="h-px bg-slate-100 mb-2 mx-6" />

                        <Link href="/profile" className="flex items-center gap-3 px-6 py-3 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all" onClick={() => setIsProfileMenuOpen(false)}>
                          <UserIcon className="w-4 h-4 text-indigo-500" /> Profile
                        </Link>
                        <Link href="/my-prompts" className="flex items-center gap-3 px-6 py-3 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all" onClick={() => setIsProfileMenuOpen(false)}>
                          <ShoppingBag className="w-4 h-4 text-indigo-500" /> My Prompts
                        </Link>
                        <Link href="/settings" className="flex items-center gap-3 px-6 py-3 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all" onClick={() => setIsProfileMenuOpen(false)}>
                          <Settings className="w-4 h-4 text-indigo-500" /> Settings
                        </Link>

                        <div className="h-px bg-slate-100 my-3 mx-6" />
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-6 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all text-left">
                          <LogOut className="w-4 h-4" /> Logout
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </header>
        </div>
      )}

      <main className={isAdminPage ? "w-full" : "max-w-6xl mx-auto p-4 pt-32"}>
        {children}
      </main>

      {!isAdminPage && (
        <footer className="border-t p-4 text-center text-sm text-muted-foreground mt-20">
          <p>Powered by Telegram Web Apps • Secure payments with Telegram Stars</p>
        </footer>
      )}
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}
