// app/(miniapp)/settings/page.tsx
"use client";

import {
  User,
  Bell,
  Shield,
  CreditCard,
  ArrowLeft,
  LogOut,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Zap,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/useAuthStore";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function SettingsPage() {
  const { user, token, logout, updateUser, updateBalance } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");
  
  // States
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    username: user?.username || "",
    email: user?.email || "",
  });

  const getImageUrl = (path?: string | null) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:4060";
    return `${baseUrl}${path}`;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size exceeds 2MB limit");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    setAvatarUploading(true);
    try {
      const { data } = await api.put("/auth/profile/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      if (data.success) {
        updateUser(data.data);
        toast.success("Avatar updated successfully! 📸");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to upload avatar";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setAvatarUploading(false);
    }
  };

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    telegramAlerts: true,
    newReleases: true,
    weeklyDigest: false,
  });

  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  // Sync tab from URL query param if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab && ["profile", "notifications", "billing", "security"].includes(tab)) {
        setActiveTab(tab);
      }
    }
  }, []);

  // Update profileForm whenever user store changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const handleProfileChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handlePasswordChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleDiscardProfile = () => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
        email: user.email || "",
      });
      toast.info("Changes discarded");
    }
  };

  const handleSaveProfile = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const { data } = await api.put("/auth/profile", profileForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        updateUser(data.data);
        toast.success("Profile configuration saved! ✨");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update profile";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setSaving(true);
    try {
      await api.post(
        "/auth/change-password",
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Security credentials updated! 🔒");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to change password";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      toast.success("Alert preferences updated!");
      return updated;
    });
  };

  const handleRecharge = async (amount: number) => {
    if (!token) return;
    setRechargeLoading(true);
    try {
      const { data } = await api.post(
        "/auth/recharge",
        { amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        updateBalance(data.balanceStars);
        toast.success(`Successfully recharged ${amount} Stars! ⭐`);
        setRechargeOpen(false);
        setCustomAmount("");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Recharge failed";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setRechargeLoading(false);
    }
  };

  const handleDeauthorize = () => {
    logout();
    toast.success("Deauthorized successfully. Goodbye! 👋");
    window.location.href = "/auth";
  };

  const NavItem = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all group ${activeTab === id
          ? 'bg-[#0f172a] text-white shadow-xl shadow-black/10'
          : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
        }`}
    >
      <div className="flex items-center gap-4">
        <Icon className={`w-4 h-4 ${activeTab === id ? 'text-yellow-400' : 'text-slate-300 group-hover:text-slate-500'}`} />
        {label}
      </div>
      {activeTab === id && <ChevronRight className="w-3 h-3 text-yellow-400" />}
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="px-2">
        <Link href="/profile" className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-indigo-500 transition-colors group mb-4">
          <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
          User Profile
        </Link>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-[1.5rem] bg-white border border-slate-100 flex items-center justify-center text-slate-800 shadow-sm">
            <ShieldCheck className="w-8 h-8 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Settings Hub</h1>
            <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-yellow-500" />
              Manage your identity and platform preferences
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 px-2">
        {/* ── Sidebar Navigation ─────────────────────────────────────────── */}
        <aside className="lg:col-span-3 space-y-3">
          <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-6 mb-4">Categories</div>
          <NavItem id="profile" label="Identity" icon={User} />
          <NavItem id="notifications" label="Alerts" icon={Bell} />
          <NavItem id="billing" label="Treasury" icon={CreditCard} />
          <NavItem id="security" label="Shield" icon={Shield} />

          <div className="pt-6 mt-6 border-t border-slate-100">
            <button
              onClick={handleDeauthorize}
              className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Deauthorize
            </button>
          </div>
        </aside>

        {/* ── Content Area ────────────────────────────────────────────────── */}
        <div className="lg:col-span-9 space-y-8">

          {/* ── PROFILE TAB ── */}
          {activeTab === "profile" && (
            <Card className="border-none shadow-sm overflow-hidden p-10 space-y-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Personal Identity</h2>
                <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">Sync Active</div>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-10 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-tr from-yellow-400 to-indigo-500 rounded-full blur opacity-20" />
                    <div className="relative w-24 h-24 rounded-full bg-white flex items-center justify-center border-4 border-white shadow-xl text-3xl font-black text-slate-400 uppercase overflow-hidden">
                      {user?.avatarUrl ? (
                        <img src={getImageUrl(user.avatarUrl)} alt="Avatar" className="w-full h-full object-cover animate-in fade-in" />
                      ) : (
                        profileForm.firstName?.charAt(0) || user?.username?.charAt(0) || "U"
                      )}
                    </div>
                  </div>
                  <div>
                    <input
                      type="file"
                      id="avatar-upload"
                      className="hidden"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={handleAvatarUpload}
                    />
                    <Button
                      variant="outline"
                      className="h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest border-slate-200 hover:bg-white"
                      disabled={avatarUploading}
                      onClick={() => document.getElementById("avatar-upload")?.click()}
                    >
                      {avatarUploading ? "Uploading..." : "Change Avatar"}
                    </Button>
                    <p className="text-[10px] text-slate-400 mt-3 font-bold uppercase tracking-widest">JPG / PNG • Max 2MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                    <Input
                      value={profileForm.firstName}
                      onChange={handleProfileChange("firstName")}
                      className="h-14 rounded-2xl border-none bg-slate-50 px-6 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                    <Input
                      value={profileForm.lastName}
                      onChange={handleProfileChange("lastName")}
                      className="h-14 rounded-2xl border-none bg-slate-50 px-6 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">System Handle (@username)</label>
                    <Input
                      value={profileForm.username}
                      onChange={handleProfileChange("username")}
                      className="h-14 rounded-2xl border-none bg-slate-50 px-6 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Email</label>
                    <Input
                      value={profileForm.email}
                      onChange={handleProfileChange("email")}
                      placeholder="Enter secure email"
                      className="h-14 rounded-2xl border-none bg-slate-50 px-6 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Save Actions */}
              <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                <Button variant="ghost" className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900" onClick={handleDiscardProfile}>Discard</Button>
                <Button disabled={saving} className="h-14 px-12 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black shadow-2xl shadow-black/10 active:scale-95 transition-all" onClick={handleSaveProfile}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Configuration"}
                </Button>
              </div>
            </Card>
          )}

          {/* ── NOTIFICATIONS TAB ── */}
          {activeTab === "notifications" && (
            <Card className="border-none shadow-sm overflow-hidden p-10 space-y-10">
              <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Alert Configuration</h2>
                <p className="text-sm text-slate-500">Configure how and when you receive platform alerts</p>
              </div>

              <div className="divide-y divide-slate-100">
                <div className="flex items-center justify-between py-6">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Email Alerts</h4>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Receive email updates for transactions and security updates</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={notifications.emailAlerts} onChange={() => handleToggleNotification("emailAlerts")} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-6">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Telegram Alerts</h4>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Receive telegram messages via official helper bot</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={notifications.telegramAlerts} onChange={() => handleToggleNotification("telegramAlerts")} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-6">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">New Prompt Releases</h4>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Get notified when creators post premium new prompts</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={notifications.newReleases} onChange={() => handleToggleNotification("newReleases")} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-6">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Weekly Digest</h4>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">A brief summary of trending code prompts and discounts</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={notifications.weeklyDigest} onChange={() => handleToggleNotification("weeklyDigest")} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </Card>
          )}

          {/* ── TREASURY TAB ── */}
          {activeTab === "billing" && (
            <Card className="border-none shadow-sm overflow-hidden p-10 bg-[#0f172a] text-white">
              <h2 className="text-xl font-black mb-10 flex items-center gap-3 uppercase tracking-tight">
                <Sparkles className="w-6 h-6 text-yellow-400" /> Digital Treasury
              </h2>
              <div className="flex items-center justify-between p-8 bg-white/5 rounded-[2.5rem] border border-white/10 group hover:bg-white/10 transition-all duration-500">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Available Balance</p>
                  <p className="text-5xl font-black tabular-nums">{user?.balanceStars || 0} <span className="text-lg text-slate-600 font-bold uppercase tracking-widest ml-1">Stars</span></p>
                </div>
                <Button className="h-14 px-10 bg-yellow-400 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-yellow-300 shadow-2xl shadow-yellow-400/20 active:scale-95 transition-all" onClick={() => setRechargeOpen(true)}>
                  Recharge
                </Button>
              </div>
            </Card>
          )}

          {/* ── SECURITY TAB ── */}
          {activeTab === "security" && (
            <Card className="border-none shadow-sm overflow-hidden p-10 space-y-10">
              <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Security Credentials</h2>
                <p className="text-sm text-slate-500">Update your access passwords and manage encryption shields</p>
              </div>

              <form onSubmit={handleSavePassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                  <div className="relative">
                    <Input
                      type={showCurrent ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange("currentPassword")}
                      required
                      className="h-14 rounded-2xl border-none bg-slate-50 pl-6 pr-12 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                    <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                    <div className="relative">
                      <Input
                        type={showNew ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange("newPassword")}
                        required
                        className="h-14 rounded-2xl border-none bg-slate-50 pl-6 pr-12 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                      <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                    <div className="relative">
                      <Input
                        type={showConfirm ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange("confirmPassword")}
                        required
                        className="h-14 rounded-2xl border-none bg-slate-50 pl-6 pr-12 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                  <Button type="button" variant="ghost" className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900" onClick={() => setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })}>Clear</Button>
                  <Button disabled={saving} type="submit" className="h-14 px-12 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black shadow-2xl shadow-black/10 active:scale-95 transition-all">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Password"}
                  </Button>
                </div>
              </form>
            </Card>
          )}

        </div>
      </div>

      {/* ── Recharge Balance Modal ────────────────────────────────────────── */}
      <Dialog open={rechargeOpen} onOpenChange={setRechargeOpen}>
        <DialogContent className="max-w-md bg-[#0f172a] text-white border-white/10 rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
              <Sparkles className="w-5 h-5 text-yellow-400" /> Recharge Stars
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs font-bold uppercase tracking-widest">
              Instantly replenish your balance and acquire premium prompts.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 my-6">
            {[
              { stars: 50, price: "$0.99" },
              { stars: 250, price: "$4.99" },
              { stars: 1000, price: "$18.99" },
              { stars: 5000, price: "$79.99" },
            ].map(({ stars, price }) => (
              <button
                key={stars}
                disabled={rechargeLoading}
                onClick={() => handleRecharge(stars)}
                className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-yellow-400/50 transition-all duration-300 group disabled:opacity-50"
              >
                <span className="text-2xl font-black text-yellow-400 group-hover:scale-110 transition-transform">⭐ {stars}</span>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">Stars</span>
                <span className="mt-3 text-xs font-black px-3 py-1 bg-white/10 rounded-lg group-hover:bg-yellow-400 group-hover:text-slate-900 transition-colors">{price}</span>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Or enter custom amount</div>
            <div className="flex gap-3">
              <Input
                type="number"
                placeholder="Enter stars e.g. 100"
                value={customAmount}
                disabled={rechargeLoading}
                onChange={e => setCustomAmount(e.target.value)}
                className="bg-white/5 border-white/10 rounded-2xl text-white font-bold h-12 text-sm focus:ring-yellow-400"
              />
              <Button
                disabled={rechargeLoading || !customAmount || parseInt(customAmount) <= 0}
                onClick={() => handleRecharge(parseInt(customAmount))}
                className="bg-yellow-400 text-slate-900 font-black text-xs uppercase tracking-widest hover:bg-yellow-300 rounded-2xl px-6 h-12"
              >
                {rechargeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Recharge"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
