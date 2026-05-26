"use client";

import { CheckCircle2, Package, ArrowRight, Sparkles, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useParams } from "next/navigation";

export default function UploadSuccessPage() {
  const params = useParams();
  const purchaseId = params?.id;

  return (
    <div className="max-w-3xl mx-auto py-20 px-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* ── Success Icon ── */}
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-[60px] w-48 h-48 mx-auto" />
        <div className="relative w-24 h-24 bg-white rounded-[2rem] shadow-2xl shadow-emerald-500/20 flex items-center justify-center mx-auto group">
           <CheckCircle2 className="w-12 h-12 text-emerald-500 group-hover:scale-110 transition-transform duration-500" />
        </div>
      </div>

      {/* ── Heading ── */}
      <div className="space-y-4 mb-12">
        <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Receipt Uploaded</h1>
        <p className="text-slate-500 font-medium max-w-sm mx-auto text-sm">
          Your transaction proof has been successfully submitted to our secure verification engine.
        </p>
      </div>

      {/* ── Status Card ── */}
      <Card className="border-none shadow-xl shadow-black/5 p-8 bg-white rounded-[3rem] text-left space-y-6 mb-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16" />
        
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
             <Package className="w-5 h-5" />
          </div>
          <div className="space-y-1">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Status</p>
             <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Pending Verification</p>
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        <div className="space-y-4">
           <p className="text-sm text-slate-500 font-medium leading-relaxed">
             Our administrators are now reviewing your payment. You will receive access to your prompt as soon as the bank reference is confirmed.
           </p>
           <div className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] bg-amber-500/5 px-4 py-2 rounded-full border border-amber-500/10 w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              Usually takes 1-12 hours
           </div>
        </div>
      </Card>

      {/* ── Actions ── */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link href="/my-prompts" className="w-full sm:w-auto">
          <Button className="h-14 px-10 bg-[#0f172a] text-white hover:bg-black rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-black/10 active:scale-95 flex items-center gap-3 w-full">
            <LayoutGrid className="w-4 h-4 text-yellow-400" />
            Track in My Prompts
          </Button>
        </Link>
        <Link href="/" className="w-full sm:w-auto">
          <Button variant="ghost" className="h-14 px-10 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all flex items-center gap-3 w-full group">
            Continue Shopping
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>

      {/* ── Footnote ── */}
      <p className="mt-12 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
        Secure Transaction ID: {purchaseId?.toString().slice(-8).toUpperCase() || 'EXTERNAL'}
      </p>

    </div>
  );
}
