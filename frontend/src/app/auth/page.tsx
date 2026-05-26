"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Eye, EyeOff, Mail, Lock, User as UserIcon,
  Loader2, ArrowRight, Bot, CheckCircle2,
  Sparkles, Star, Zap, Shield
} from "lucide-react";
import Link from "next/link";
import { Toaster } from "@/components/ui/sonner";

type Mode = "login" | "register" | "forgot";

// ── Feature highlights shown on the left panel ────────────────────────────
const FEATURES = [
  { icon: Sparkles, label: "Premium AI Prompts", desc: "Curated prompts for every use case" },
  { icon: Star, label: "Telegram Stars Payments", desc: "Instant checkout via Telegram" },
  { icon: Zap, label: "Instant Access", desc: "Download and use prompts immediately" },
  { icon: Shield, label: "Secure & Private", desc: "Your data stays yours" },
];

export default function AuthPage() {
  const { setAuth, isAuthenticated } = useAuthStore();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "" });
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
  const [googleInitialized, setGoogleInitialized] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = "/";
    }
  }, [isAuthenticated]);

  // Load Google GIS SDK only once on mount
  useEffect(() => {
    const existing = document.getElementById('google-gsi-script');
    if (existing) {
      console.log('[Google GIS] script already present');
      setGoogleScriptLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('[Google GIS] script loaded');
      setGoogleScriptLoaded(true);
    };
    script.onerror = () => console.error('[Google GIS] script failed to load');
    document.body.appendChild(script);
    return () => {
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Initialize Google Sign‑In after script is loaded
  useEffect(() => {
    if (!googleScriptLoaded) return;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('Google client ID not set in env');
      return;
    }
    const win = window as any;
    if (typeof window !== "undefined" && win.google && !win.__googleInitialized) {
      win.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: any; }) => {
          console.log('[Google Login] Received id token', response);
          setLoading(true);
          try {
            const { data } = await api.post('/auth/google', { idToken: response.credential });
            setAuth(data.access_token, data.user);
            toast.success(`Welcome back, ${data.user.firstName || data.user.email}! 👋`);
            setTimeout(() => { window.location.href = '/'; }, 800);
          } catch (err: any) {
            const msg = err.response?.data?.message || 'Google authentication failed. Please try again.';
            toast.error(Array.isArray(msg) ? msg[0] : msg);
          } finally {
            setLoading(false);
          }
        },
      });
      win.__googleInitialized = true;
      setGoogleInitialized(true);
    } else if (typeof window !== "undefined" && win.__googleInitialized) {
      setGoogleInitialized(true);
    }
  }, [googleScriptLoaded]);

  // Render the official Google Sign-In button once initialized and container is ready
  useEffect(() => {
    if (!googleInitialized || !googleScriptLoaded) return;
    const container = document.getElementById("google-signin-button");
    const win = window as any;
    if (container && typeof window !== "undefined" && win.google) {
      win.google.accounts.id.renderButton(container, {
        theme: "filled_blue",
        size: "large",
        width: 320,
        text: "continue_with",
        shape: "rectangular"
      });
    }
  }, [googleInitialized, googleScriptLoaded, mode, success]);

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const reset = () => setForm({ email: "", password: "", firstName: "", lastName: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { data } = await api.post("/auth/login", {
          email: form.email,
          password: form.password,
        });
        setAuth(data.access_token, data.user);
        toast.success(`Welcome back, ${data.user.firstName || data.user.email}! 👋`);
        setTimeout(() => { window.location.href = "/"; }, 800);

      } else if (mode === "register") {
        const { data } = await api.post("/auth/register", {
          email: form.email,
          password: form.password,
          firstName: form.firstName || undefined,
          lastName: form.lastName || undefined,
        });
        setAuth(data.access_token, data.user);
        toast.success("Account created! Welcome to Prompt Marketplace 🎉");
        setTimeout(() => { window.location.href = "/"; }, 800);

      } else {
        await api.post("/auth/forgot-password", { email: form.email });
        setSuccess(true);
        toast.success("Reset link sent! Check your inbox.");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Something went wrong. Please try again.";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m: Mode) => { setMode(m); setSuccess(false); reset(); };

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="min-h-screen flex">

        {/* ── Left panel: branding (hidden on mobile) ────────────────── */}
        <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative overflow-hidden flex-col items-center justify-center p-12"
          style={{ background: "linear-gradient(135deg, #1e0a3c 0%, #0d1b5e 50%, #0a2a4a 100%)" }}>

          {/* Decorative orbs */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-80 h-80 rounded-full opacity-30"
              style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full opacity-20"
              style={{ background: "radial-gradient(circle, #2563eb, transparent)" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10"
              style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
          </div>

          <div className="relative z-10 max-w-sm w-full">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl"
                style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}>
                <span className="text-3xl">⚡</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Prompt Marketplace</h1>
                <p className="text-xs text-purple-300">Powered by Telegram</p>
              </div>
            </div>

            {/* Headline */}
            <h2 className="text-4xl font-bold text-white mb-3 leading-tight">
              Premium AI Prompts for{" "}
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Every Creator
              </span>
            </h2>
            <p className="text-purple-200/80 mb-10 text-sm leading-relaxed">
              Access hundreds of handcrafted prompts for design, code, writing, and more.
              Pay with Telegram Stars and get instant access.
            </p>

            {/* Feature list */}
            <div className="space-y-4">
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(124,58,237,0.25)", border: "1px solid rgba(124,58,237,0.4)" }}>
                    <Icon className="h-4 w-4 text-purple-300" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-xs text-purple-300/70">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="mt-10 p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <p className="text-sm text-purple-100/90 italic">
                "The best prompt marketplace I've used. Instant delivery and the quality is outstanding."
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-xs font-bold text-white">A</div>
                <span className="text-xs text-purple-300">Abebe K. — UI Designer</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right panel: form ──────────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12"
          style={{ backgroundColor: "#0f0f1a" }}>

          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}>
                <span className="text-xl">⚡</span>
              </div>
              <span className="text-lg font-bold text-white">Prompt Marketplace</span>
            </div>

            {/* Tab switcher (login / register) */}
            {mode !== "forgot" && (
              <div className="flex p-1 rounded-xl mb-8"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {(["login", "register"] as Mode[]).map((m) => (
                  <button key={m} onClick={() => switchMode(m)}
                    className="flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200"
                    style={mode === m
                      ? { background: "linear-gradient(135deg, #7c3aed, #2563eb)", color: "white", boxShadow: "0 4px 15px rgba(124,58,237,0.3)" }
                      : { color: "rgba(255,255,255,0.45)" }
                    }>
                    {m === "login" ? "Sign In" : "Create Account"}
                  </button>
                ))}
              </div>
            )}

            {/* Heading */}
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-white">
                {mode === "login" && "Welcome back"}
                {mode === "register" && "Get started today"}
                {mode === "forgot" && "Reset your password"}
              </h2>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
                {mode === "login" && "Sign in to access your prompts and balance."}
                {mode === "register" && "Create your account in seconds."}
                {mode === "forgot" && "We'll send a reset link to your email."}
              </p>
            </div>

            {/* ── Success state for forgot password ── */}
            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)" }}>
                  <CheckCircle2 className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Check your inbox!</h3>
                <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
                  A password reset link has been sent to <span className="text-white font-medium">{form.email}</span>
                </p>
                <button onClick={() => switchMode("login")}
                  className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors">
                  ← Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Name row (register only) */}
                {mode === "register" && (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { field: "firstName" as const, label: "First Name", placeholder: "Abebe" },
                      { field: "lastName" as const, label: "Last Name", placeholder: "Kebede" },
                    ].map(({ field, label, placeholder }) => (
                      <div key={field}>
                        <label className="block text-xs font-medium mb-1.5"
                          style={{ color: "rgba(255,255,255,0.5)" }}>{label}</label>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                            style={{ color: "rgba(255,255,255,0.3)" }} />
                          <input type="text" placeholder={placeholder}
                            value={form[field]} onChange={set(field)}
                            className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all"
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                            onFocus={e => e.currentTarget.style.borderColor = "rgba(124,58,237,0.7)"}
                            onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium mb-1.5"
                    style={{ color: "rgba(255,255,255,0.5)" }}>Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                      style={{ color: "rgba(255,255,255,0.3)" }} />
                    <input type="email" placeholder="you@example.com"
                      value={form.email} onChange={set("email")} required
                      className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                      onFocus={e => e.currentTarget.style.borderColor = "rgba(124,58,237,0.7)"}
                      onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
                    />
                  </div>
                </div>

                {/* Password */}
                {mode !== "forgot" && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium"
                        style={{ color: "rgba(255,255,255,0.5)" }}>Password</label>
                      {mode === "login" && (
                        <button type="button" onClick={() => switchMode("forgot")}
                          className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                        style={{ color: "rgba(255,255,255,0.3)" }} />
                      <input type={showPass ? "text" : "password"}
                        placeholder={mode === "register" ? "Min. 8 characters" : "Enter your password"}
                        value={form.password} onChange={set("password")} required
                        minLength={mode === "register" ? 8 : 1}
                        className="w-full pl-9 pr-12 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                        onFocus={e => e.currentTarget.style.borderColor = "rgba(124,58,237,0.7)"}
                        onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
                      />
                      <button type="button" onClick={() => setShowPass(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 active:text-white/90 transition-colors z-10">
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {mode === "register" && (
                      <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                        Use at least 8 characters with a mix of letters and numbers
                      </p>
                    )}
                  </div>
                )}

                {/* Submit */}
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: loading ? "rgba(124,58,237,0.5)" : "linear-gradient(135deg, #7c3aed, #2563eb)",
                    boxShadow: loading ? "none" : "0 4px 20px rgba(124,58,237,0.4)"
                  }}
                  onMouseEnter={e => !loading && (e.currentTarget.style.transform = "translateY(-1px)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
                  {loading
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <>
                        {mode === "login" && "Sign In"}
                        {mode === "register" && "Create Free Account"}
                        {mode === "forgot" && "Send Reset Link"}
                        <ArrowRight className="h-4 w-4" />
                      </>
                  }
                </button>
              </form>
            )}

            {/* Divider */}
            {!success && (
              <>
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>OR</span>
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
                </div>

                {/* Telegram callout */}
                <div className="flex items-start gap-3 p-4 rounded-xl cursor-pointer group transition-all"
                  style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)" }}
                  onClick={() => {
                    const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || "habeshaPromptBot";
                    window.open(`https://t.me/${botUsername}`, "_blank");
                  }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(37,99,235,0.25)" }}>
                    <Bot className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">Continue with Telegram</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                      Open the bot and launch the Mini App for instant sign-in
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-blue-400 group-hover:translate-x-1 transition-transform self-center" />
                </div>
                {/* Google Sign-In button */}
                <div className="relative group mt-4 overflow-hidden rounded-xl">
                  {/* Custom Styled Google Button (Visual Only, styled to match Telegram button style) */}
                  <div className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all"
                    style={{ background: "rgba(66,133,244,0.1)", border: "1px solid rgba(66,133,244,0.2)" }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(66,133,244,0.25)" }}>
                      {/* Simple Google "G" logo using SVG */}
                      <svg className="h-4 w-4" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#4285F4" d="M533.5 278.4c0-17.4-1.5-34.1-4.3-50.2H272v95.1h146.9c-6.3 34-25.8 62.8-55.2 82v68h89.2c52.2-48.1 82.6-119 82.6-194.9"/>
                        <path fill="#34A853" d="M272 544.3c73.5 0 135-24.3 180-66.1l-89.2-68c-24.6 16.5-56.4 26.2-90.8 26.2-69.8 0-128.9-47.2-150.1-110.5h-91.4v69.3c45.5 89.6 139.1 149.1 241.5 149.1"/>
                        <path fill="#FBBC05" d="M121.9 335.9c-10.2-30.5-10.2-63.4 0-93.9V172.7h-91.5c-31.2 61.9-31.2 134.4 0 196.3l91.5-33.1"/>
                        <path fill="#EA4335" d="M272 107.4c39.9-.6 78.3 13.9 107.4 40.6l80.5-80.5C420.6 24.5 347.8-1.5 272 0c-102.4 0-195.9 59.5-241.5 149.1l91.5 33.1C143.1 154.6 202.2 107.4 272 107.4"/>
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-white">Continue with Google</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                        Use your Google account for quick sign‑in
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-blue-400 group-hover:translate-x-1 transition-transform self-center" />
                  </div>

                  {/* Hidden Interactive Overlay (Google Sign-In Iframe) */}
                  <div className="absolute inset-0 opacity-0 z-10 cursor-pointer overflow-hidden flex items-center justify-center">
                    <div id="google-signin-button" className="w-full h-full scale-[2.5] origin-center opacity-0 cursor-pointer flex items-center justify-center"></div>
                  </div>
                </div>
              </>
            )}

            {/* Terms */}
            {mode === "register" && !success && (
              <p className="text-center text-xs mt-5" style={{ color: "rgba(255,255,255,0.3)" }}>
                By creating an account you agree to our{" "}
                <span className="text-purple-400 cursor-pointer hover:underline">Terms of Service</span>
                {" "}and{" "}
                <span className="text-purple-400 cursor-pointer hover:underline">Privacy Policy</span>.
              </p>
            )}

            {/* Back to sign in (forgot mode) */}
            {mode === "forgot" && !success && (
              <button onClick={() => switchMode("login")}
                className="block text-center w-full mt-4 text-sm text-purple-400 hover:text-purple-300 transition-colors">
                ← Back to sign in
              </button>
            )}

            {/* Footer link to marketplace */}
            <div className="mt-8 text-center">
              <Link href="/" className="text-xs transition-colors hover:text-purple-400"
                style={{ color: "rgba(255,255,255,0.3)" }}>
                ← Browse marketplace without signing in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
