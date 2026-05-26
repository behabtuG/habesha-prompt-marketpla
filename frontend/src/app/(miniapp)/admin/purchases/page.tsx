"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  ShoppingBag,
  Search,
  ArrowLeft,
  ExternalLink,
  ChevronRight,
  Clock,
  ShieldCheck,
  Calendar,
  User as UserIcon,
  BadgeCheck,
  DollarSign,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AdminPurchasesPage() {
  const [page, setPage] = useState(1);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const router = useRouter();

  // ── Fetch Live Stats ──────────────────────────────────────────
  const { data: statsData } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const response = await api.get("/admin/stats");
      return response.data;
    },
  });

  // ── Fetch Purchases ──────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "purchases", page],
    queryFn: async () => {
      const response = await api.get(`/admin/purchases?page=${page}&limit=10`);
      return response.data;
    },
  });

  const getStatusBadge = (status: string) => {
    const s = status?.toUpperCase();
    if (s === "COMPLETED" || s === "SUCCESS") {
      return <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5"><BadgeCheck className="w-3.5 h-3.5" /> Approved</div>;
    }
    if (s === "WAITING_VERIFICATION" || s === "PENDING_VERIFICATION" || s === "PENDING") {
      return <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100 flex items-center gap-1.5 animate-pulse"><Clock className="w-3.5 h-3.5" /> Action Required</div>;
    }
    if (s === "PROCESSING") {
      return <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-100 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Verifying</div>;
    }
    return <div className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-200">{status}</div>;
  };

  const handleAction = (purchase: any) => {
    setSelectedPurchase(purchase);
    setDetailOpen(true);
  };

  const handleVerifyNow = () => {
    router.push("/admin/manual-payments");
    setDetailOpen(false);
  };

  const getReceiptUrl = (url: string | null | undefined) => {
    if (!url) return undefined;
    if (url.startsWith("http")) return url;
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
      "http://localhost:4060";
    return `${baseUrl}${url}`;
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <Link href="/admin" className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-indigo-500 transition-colors group mb-4">
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
            Admin Hub
          </Link>
          <div className="flex items-center gap-5">
            <div className="w-10 h-10 rounded-[1.5rem] bg-[#0f172a] flex items-center justify-center text-white shadow-xl shadow-black/20">
              <ShoppingBag className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Purchases Ledger</h1>
              <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                Audit and track every transaction on the platform
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <Input
              placeholder="Search Reference #..."
              className="h-14 w-full md:w-80 rounded-2xl border-none bg-white px-12 font-bold text-slate-700 shadow-sm shadow-black/5 focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300"
            />
          </div>
        </div>
      </div>

      {/* ── Stats Summary ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-2">
        <Card className="border-none shadow-sm p-8 bg-white rounded-[2.5rem] space-y-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Revenue</p>
            <p className="text-2xl font-black text-slate-900 tabular-nums">
              {statsData?.data?.totalRevenueStars || 0}
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest ml-1">Stars</span>
            </p>
          </div>
        </Card>
        <Card className="border-none shadow-sm p-8 bg-white rounded-[2.5rem] space-y-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Market Volume</p>
            <p className="text-2xl font-black text-slate-900 tabular-nums">
              {statsData?.data?.totalPrompts || 0}
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest ml-1">Assets</span>
            </p>
          </div>
        </Card>
        <Card className="border-none shadow-sm p-8 bg-white rounded-[2.5rem] space-y-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">User Base</p>
            <p className="text-2xl font-black text-slate-900 tabular-nums">
              {statsData?.data?.totalUsers || 0}
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest ml-1">Active</span>
            </p>
          </div>
        </Card>
      </div>

      {/* ── Ledger Table ───────────────────────────────────────────────────── */}
      <Card className="border-none shadow-xl shadow-black/5 bg-white rounded-[3rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/50">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Purchase Details</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Buyer Identity</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Economic Value</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Verification Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Ledger Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-6 h-20 bg-slate-50/20" />
                  </tr>
                ))
              ) : (
                data?.data?.map((purchase: any) => (
                  <tr key={purchase.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 max-w-xs">
                          <p className="text-sm font-black text-slate-800 uppercase tracking-tight truncate">{purchase.prompt?.title || "Unknown Asset"}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                              {new Intl.DateTimeFormat('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }).format(new Date(purchase.createdAt))}
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">
                          {purchase.user?.firstName?.charAt(0) || purchase.user?.username?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-700 uppercase">{purchase.user?.firstName || "Unknown"}</p>
                          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">@{purchase.user?.username || "unknown"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="text-sm font-black text-emerald-600 tabular-nums">
                          {purchase.amountPaid}
                          <span className="text-[10px] opacity-60 font-black uppercase tracking-widest ml-1.5">{purchase.currency || 'XTR'}</span>
                        </p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.1em]">Via {purchase.paymentMethod?.replace('_', ' ') || 'Telegram Stars'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {getStatusBadge(purchase.status)}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          onClick={() => handleAction(purchase)}
                          variant="ghost"
                          size="sm"
                          className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-2" /> Details
                        </Button>
                        <Button
                          onClick={() => handleAction(purchase)}
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl text-slate-300 hover:text-slate-900 hover:bg-white hover:shadow-sm"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ───────────────────────────────────────────────────── */}
        <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Total Records: {data?.meta?.total || 0}
          </p>
          <div className="flex items-center gap-2">
            <Button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="h-10 px-6 rounded-xl bg-white border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-sm disabled:opacity-50 active:scale-95 transition-all"
            >
              Previous
            </Button>
            <Button
              disabled={page >= (data?.meta?.totalPages || 1)}
              onClick={() => setPage(p => p + 1)}
              className="h-10 px-6 rounded-xl bg-white border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-sm disabled:opacity-50 active:scale-95 transition-all"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Purchase Detail Modal ─────────────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="rounded-[3rem] border-none p-0 overflow-hidden max-w-3xl shadow-2xl">
          <div className="bg-[#0f172a] p-10 text-white relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-20 h-20 rounded-[2rem] bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
                <ShoppingBag className="w-10 h-10 text-yellow-400" />
              </div>
              <div>
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em] mb-2">Audit Entry</p>
                <h2 className="text-3xl font-black uppercase tracking-tight">{selectedPurchase?.prompt?.title || "Transaction Details"}</h2>
              </div>
            </div>
          </div>

          <div className="p-10 bg-white grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-10">
              <section className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <UserIcon className="w-3.5 h-3.5" /> Buyer Identity
                </h4>
                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-sm font-black text-slate-600 uppercase">
                    {selectedPurchase?.user?.firstName?.charAt(0) || "U"}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{selectedPurchase?.user?.firstName || "Unknown User"}</p>
                    <p className="text-[10px] font-bold text-indigo-500 tracking-widest uppercase">@{selectedPurchase?.user?.username || "anonymous"}</p>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5" /> Financial Summary
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-emerald-50/50 rounded-[2rem] border border-emerald-100/50">
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Amount</span>
                    <p className="text-xl font-black text-emerald-700 tracking-tight mt-1">{selectedPurchase?.amountPaid} <span className="text-[10px] opacity-60">{selectedPurchase?.paymentMethod}</span></p>
                  </div>
                  <div className="p-6 bg-indigo-50/50 rounded-[2rem] border border-indigo-100/50">
                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Status</span>
                    <p className="text-xs font-black text-indigo-700 uppercase tracking-tight mt-1">{selectedPurchase?.status}</p>
                  </div>
                </div>
              </section>

              {selectedPurchase?.manualPaymentData?.referenceNumber && (
                <section className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verification Proof
                  </h4>
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Ref #</span>
                      <code className="text-xs font-black text-slate-900">{selectedPurchase.manualPaymentData.referenceNumber}</code>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Bank</span>
                      <span className="text-xs font-black text-slate-700 uppercase">{selectedPurchase.manualPaymentData.bankName}</span>
                    </div>
                  </div>
                </section>
              )}
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5" /> Documentation / Receipt
              </h4>
              {selectedPurchase?.manualPaymentData?.receiptUrl ? (
                <div className="group relative aspect-[3/4] rounded-[2.5rem] bg-slate-100 overflow-hidden border border-slate-100 shadow-inner">
                  <img
                    src={getReceiptUrl(selectedPurchase.manualPaymentData.receiptUrl)}
                    alt="Payment Receipt"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <Button
                      variant="secondary"
                      onClick={() => window.open(getReceiptUrl(selectedPurchase.manualPaymentData.receiptUrl), '_blank')}
                      className="rounded-full h-14 px-8 font-black uppercase text-[10px] tracking-widest shadow-2xl"
                    >
                      Open Original
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="aspect-[3/4] rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-8">
                  <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Digital Proof Uploaded</p>
                  <p className="text-[10px] text-slate-300 mt-2">Waiting for the user to provide a payment receipt.</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transaction ID: {selectedPurchase?.id}</p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setDetailOpen(false)} className="rounded-2xl h-14 px-8 text-xs font-black uppercase tracking-widest text-slate-400">Close Audit</Button>
              {(selectedPurchase?.status?.includes("VERIFICATION") || selectedPurchase?.status?.includes("PENDING")) && (
                <Button onClick={handleVerifyNow} className="rounded-2xl h-14 px-10 bg-indigo-600 text-white hover:bg-indigo-700 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-600/20">Go to Verification Hub</Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
