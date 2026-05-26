// app/(miniapp)/admin/manual-payments/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  AlertCircle,
  DollarSign,
  Calendar,
  Clock,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function ManualPaymentsPage() {
  const queryClient = useQueryClient();
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch pending manual payments
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ["pending-manual-payments"],
    queryFn: () =>
      api.get("/payments/admin/pending-manual").then((res) => res.data),
  });

  const pendingPayments = paymentsData?.data || [];

  // Verify mutation
  const verifyMutation = useMutation({
    mutationFn: (data: { purchaseId: string; notes?: string }) =>
      api
        .put(`/payments/admin/verify-manual/${data.purchaseId}`, {
          notes: data.notes,
        })
        .then((res) => res.data),
    onSuccess: () => {
      toast.success("Payment verified successfully!");
      queryClient.invalidateQueries({ queryKey: ["pending-manual-payments"] });
      setVerifyDialogOpen(false);
      setVerificationNotes("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to verify payment");
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: (data: { purchaseId: string; reason: string }) =>
      api
        .put(`/payments/admin/reject-manual/${data.purchaseId}`, {
          reason: data.reason,
        })
        .then((res) => res.data),
    onSuccess: () => {
      toast.success("Payment rejected");
      queryClient.invalidateQueries({ queryKey: ["pending-manual-payments"] });
      setRejectDialogOpen(false);
      setVerificationNotes("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to reject payment");
    },
  });

  const handleVerify = (payment: any) => {
    setSelectedPayment(payment);
    setVerifyDialogOpen(true);
  };

  const handleReject = (payment: any) => {
    setSelectedPayment(payment);
    setRejectDialogOpen(true);
  };

  const handleViewReceipt = (payment: any) => {
    const receiptUrl = payment.manualPaymentData?.receiptUrl;
    if (receiptUrl) {
      let fullUrl = receiptUrl;
      if (receiptUrl.startsWith("/api/uploads")) {
        fullUrl = receiptUrl.replace("/api/uploads", "/uploads");
      } else if (receiptUrl.startsWith("/uploads")) {
        fullUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}${receiptUrl}`;
      }
      window.open(fullUrl, "_blank");
    } else {
      toast.error("Receipt not available");
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-5">
            <div className="w-10 h-10 rounded-[1.5rem] bg-amber-500 flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
              <DollarSign className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Verification Hub</h1>
              <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                Review and approve manual bank transfers
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <Input
              placeholder="Search Reference #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-14 w-full md:w-80 rounded-2xl border-none bg-white px-12 font-bold text-slate-700 shadow-sm shadow-black/5 focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["pending-manual-payments"] })}
            className="h-14 w-14 rounded-2xl bg-white shadow-sm shadow-black/5 hover:bg-slate-50 transition-all"
          >
            <RefreshCw className={`w-5 h-5 text-slate-400 ${isLoading ? 'animate-spin text-indigo-500' : ''}`} />
          </Button>
        </div>
      </div>

      {/* ── Stats Summary ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-2">
        <Card className="border-none shadow-sm p-8 bg-white rounded-[2.5rem] space-y-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Awaiting Review</p>
            <p className="text-2xl font-black text-slate-900 tabular-nums">
              {pendingPayments.length}
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest ml-1">In Pipeline</span>
            </p>
          </div>
        </Card>
        <Card className="border-none shadow-sm p-8 bg-white rounded-[2.5rem] space-y-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Action Required</p>
            <p className="text-2xl font-black text-slate-900 tabular-nums">
              {pendingPayments.filter((p: any) => p.status === 'PENDING_VERIFICATION').length}
              <span className="text-xs text-emerald-400 font-bold uppercase tracking-widest ml-1">Receipts</span>
            </p>
          </div>
        </Card>
        <Card className="border-none shadow-sm p-8 bg-white rounded-[2.5rem] space-y-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Waiting for User</p>
            <p className="text-2xl font-black text-slate-900 tabular-nums">
              {pendingPayments.filter((p: any) => p.status === 'WAITING_VERIFICATION').length}
              <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest ml-1">Pending</span>
            </p>
          </div>
        </Card>
      </div>

      {/* ── Payments Ledger ────────────────────────────────────────────────── */}
      <Card className="border-none shadow-xl shadow-black/5 bg-white rounded-[3rem] overflow-hidden">
        <div className="overflow-x-auto">
          {pendingPayments.length === 0 && !isLoading ? (
            <div className="text-center py-24">
              <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-bounce">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Everything is Clear!</h3>
              <p className="text-slate-400 font-medium text-sm mt-2 uppercase tracking-widest">No manual payments are currently awaiting verification.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-50 bg-slate-50/50 hover:bg-transparent">
                  <TableHead className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Originator</TableHead>
                  <TableHead className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Value (Fiat)</TableHead>
                  <TableHead className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Financial Institution</TableHead>
                  <TableHead className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Reference Details</TableHead>
                  <TableHead className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Verification</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayments.map((payment: any) => (
                  <TableRow key={payment.id} className="group hover:bg-slate-50/50 transition-all duration-300 border-b border-slate-50">
                    <TableCell className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500 group-hover:scale-110 transition-transform">
                          {payment.user?.firstName?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{payment.user?.firstName || "Unknown"}</p>
                          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">@{payment.user?.username || "unknown"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-6 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-sm font-black text-emerald-600 tabular-nums">{payment.amountPaid} {payment.currency}</span>
                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">Manual Transfer</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-700 uppercase">{payment.manualPaymentData?.bankName}</span>
                        <span className="text-[10px] font-bold text-slate-400 tracking-widest mt-1">ACC: {payment.manualPaymentData?.accountNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-6">
                      <div className="flex flex-col gap-1.5">
                        {payment.status === 'PENDING_VERIFICATION' ? (
                          <>
                            <code className="text-[11px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 w-fit">
                              {payment.manualPaymentData?.referenceNumber}
                            </code>
                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" /> {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(payment.updatedAt || payment.createdAt))}
                            </span>
                          </>
                        ) : (
                          <div className="px-3 py-1 bg-slate-50 text-slate-400 rounded-lg border border-slate-100 text-[10px] font-black uppercase tracking-widest w-fit">
                            Waiting for Receipt
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={payment.status === 'WAITING_VERIFICATION'}
                          onClick={() => handleViewReceipt(payment)}
                          className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all disabled:opacity-30"
                        >
                          <Eye className="w-3.5 h-3.5 mr-2" /> View
                        </Button>
                        <Button
                          size="sm"
                          disabled={payment.status === 'WAITING_VERIFICATION'}
                          onClick={() => handleVerify(payment)}
                          className="h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#0f172a] text-white hover:bg-emerald-500 shadow-xl shadow-black/10 active:scale-95 transition-all disabled:opacity-30"
                        >
                          Approve
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleReject(payment)}
                          className="h-10 w-10 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      {/* Verify Dialog (Standardized Styling) */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent className="rounded-[2.5rem] border-none p-10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight">Approve Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-8 py-6">
            {selectedPayment && (
              <>
                <div className="grid grid-cols-2 gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Buyer</span>
                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{selectedPayment.user.firstName}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</span>
                    <p className="text-sm font-black text-emerald-600 tracking-tight">{selectedPayment.amountPaid} {selectedPayment.currency}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank</span>
                    <p className="text-xs font-bold text-slate-700 uppercase">{selectedPayment.manualPaymentData?.bankName}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ref #</span>
                    <p className="text-xs font-black text-indigo-500 tracking-tight">{selectedPayment.manualPaymentData?.referenceNumber}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="verificationNotes" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Internal Verification Notes</Label>
                  <Textarea
                    id="verificationNotes"
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="E.g. Verified via CBE Birr statement..."
                    className="rounded-2xl border-slate-100 bg-slate-50 font-bold text-slate-700 focus:ring-indigo-500/10 placeholder:text-slate-300"
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter className="gap-3">
            <Button variant="ghost" onClick={() => setVerifyDialogOpen(false)} className="h-14 px-8 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400">Cancel</Button>
            <Button
              onClick={() => verifyMutation.mutate({ purchaseId: selectedPayment.id, notes: verificationNotes })}
              disabled={verifyMutation.isPending}
              className="h-14 px-10 bg-[#0f172a] text-white hover:bg-emerald-500 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-black/10 flex items-center gap-3"
            >
              {verifyMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />}
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog (Consistent with Above) */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="rounded-[2.5rem] border-none p-10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight">Reject Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="p-6 bg-rose-50 rounded-[2rem] border border-rose-100 flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-rose-500 shrink-0" />
              <div>
                <h4 className="text-sm font-black text-rose-900 uppercase tracking-tight">Critical Action</h4>
                <p className="text-xs font-medium text-rose-600 leading-relaxed mt-1">Rejecting will void the transaction. The user will be notified and will need to restart the process.</p>
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason for Rejection *</Label>
              <Textarea
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="E.g. Reference number not found in bank records..."
                className="rounded-2xl border-rose-100 bg-rose-50/30 font-bold text-slate-700 focus:ring-rose-500/10 placeholder:text-slate-300"
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="ghost" onClick={() => setRejectDialogOpen(false)} className="h-14 px-8 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400">Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => rejectMutation.mutate({ purchaseId: selectedPayment.id, reason: verificationNotes })}
              disabled={rejectMutation.isPending || !verificationNotes.trim()}
              className="h-14 px-10 bg-rose-600 text-white hover:bg-rose-700 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-rose-600/20 flex items-center gap-3"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
