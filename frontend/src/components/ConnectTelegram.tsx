"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Bot, Link2, CheckCircle2, Loader2,
  ExternalLink, Copy, RefreshCw
} from "lucide-react";

export function ConnectTelegram() {
  const { user, token, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [linkData, setLinkData] = useState<{ linkToken: string; botUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // If already connected, show connected state
  if (user?.hasTelegram || user?.telegramId) {
    return (
      <div className="flex items-center gap-4 p-5 rounded-[2rem]"
        style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-500 shadow-md">
          <CheckCircle2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Telegram Connected</p>
          <p className="text-[11px] font-bold text-slate-400 mt-0.5">
            {user.username ? `@${user.username}` : `ID: ${user.telegramId}`}
          </p>
        </div>
      </div>
    );
  }

  const generateLink = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { data } = await api.post(
        "/auth/link/generate-token",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLinkData(data);
      toast.success("Connection token generated!");
    } catch {
      toast.error("Could not generate link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!linkData?.botUrl) return;
    await navigator.clipboard.writeText(linkData.botUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied!");
  };

  const openBot = () => {
    if (linkData?.botUrl) window.open(linkData.botUrl, "_blank");
  };

  return (
    <div className="p-6 rounded-[2rem] space-y-4"
      style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)" }}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-indigo-500 text-white shadow-md shadow-indigo-500/20">
          <Bot className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Connect Telegram Account</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 leading-relaxed">
            Link your Telegram to see Stars payments and sync purchases across platforms.
          </p>
        </div>
      </div>

      {!linkData ? (
        <button onClick={generateLink} disabled={loading}
          className="w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:opacity-90 hover:scale-[1.01] active:scale-95 shadow-md shadow-indigo-500/10"
          style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
          {loading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <><Link2 className="h-4 w-4" /> Generate Link</>
          }
        </button>
      ) : (
        <div className="space-y-3">
          {/* Bot URL display */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-100/80 border border-slate-200">
            <p className="text-xs text-slate-600 flex-1 truncate font-mono">{linkData.botUrl}</p>
            <button onClick={copyLink}
              className="flex-shrink-0 p-1.5 rounded-lg transition-colors hover:bg-slate-200"
              title="Copy link">
              {copied
                ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                : <Copy className="h-3.5 w-3.5 text-slate-400" />
              }
            </button>
          </div>

          <div className="flex gap-2">
            <button onClick={openBot}
              className="flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all hover:opacity-95 shadow-md shadow-indigo-500/15"
              style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
              <ExternalLink className="h-3.5 w-3.5" /> Open in Telegram
            </button>
            <button onClick={generateLink} disabled={loading}
              className="p-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
              title="Generate new link">
              <RefreshCw className={`h-4 w-4 text-slate-400 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest">
            Click link → open bot → click start to connect
          </p>
        </div>
      )}
    </div>
  );
}
