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
      toast.success("Payment verified!");
      queryClient.invalidateQueries({ queryKey: ["pending-manual-payments"] });
      setVerifyDialogOpen(false);
      setVerificationNotes("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to verify payment");
    },
  });

  // Filter payments based on search term
  // const filteredPayments = pendingPayments.filter((payment: any) => {
  //   if (!searchTerm) return true;

  //   const searchLower = searchTerm.toLowerCase();
  //   return (
  //     payment.id.toLowerCase().includes(searchLower) ||
  //     (payment.user?.username || "").toLowerCase().includes(searchLower) ||
  //     (payment.user?.firstName || "").toLowerCase().includes(searchLower) ||
  //     (payment.manualPaymentData?.bankName || "")
  //       .toLowerCase()
  //       .includes(searchLower) ||
  //     (payment.manualPaymentData?.referenceNumber || "")
  //       .toLowerCase()
  //       .includes(searchLower)
  //   );
  // });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: (data: { purchaseId: string; reason: string }) =>
      api
        .put(`/payments/admin/reject-manual/${data.purchaseId}`, {
          reason: data.reason,
        })
        .then((res) => res.data),
    onSuccess: () => {
      toast.success("Payment rejected!");
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
      // Check if URL already has the correct format
      let fullUrl = receiptUrl;

      // If it starts with /api/uploads, remove /api
      if (receiptUrl.startsWith("/api/uploads")) {
        fullUrl = receiptUrl.replace("/api/uploads", "/uploads");
      }
      // If it's just a path starting with /uploads, add the base URL
      else if (receiptUrl.startsWith("/uploads")) {
        fullUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace(
          "/api",
          ""
        )}${receiptUrl}`;
      }

      window.open(fullUrl, "_blank");
    } else {
      toast.error("Receipt not available");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Manual Payment Verification</h2>
        <p className="text-muted-foreground">
          Review and verify bank transfer payments
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Pending Verification</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {pendingPayments.length} payments awaiting review
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by ID, user, or bank..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["pending-manual-payments"],
                  })
                }
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto" />
            </div>
          ) : pendingPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending payments for verification
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Purchase ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Prompt</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Bank Details</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPayments.map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <code className="text-xs">
                          {payment.id.substring(0, 8)}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {payment.user.firstName || payment.user.username}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            @{payment.user.username}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate">
                          {payment.prompt.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold">
                          {payment.amountPaid} {payment.currency}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{payment.manualPaymentData?.bankName}</div>
                          <div className="text-muted-foreground">
                            {payment.manualPaymentData?.accountNumber}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">
                          {payment.manualPaymentData?.referenceNumber}
                        </code>
                      </TableCell>
                      <TableCell>
                        {new Date(
                          payment.manualPaymentData?.uploadedAt
                        ).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewReceipt(payment)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Receipt
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleVerify(payment)}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(payment)}
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verify Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPayment && (
              <>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">User:</span>
                      <p>
                        {selectedPayment.user.firstName ||
                          selectedPayment.user.username}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Amount:</span>
                      <p>
                        {selectedPayment.amountPaid} {selectedPayment.currency}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Bank:</span>
                      <p>{selectedPayment.manualPaymentData?.bankName}</p>
                    </div>
                    <div>
                      <span className="font-medium">Reference:</span>
                      <p>
                        {selectedPayment.manualPaymentData?.referenceNumber}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verificationNotes">Verification Notes</Label>
                  <Textarea
                    id="verificationNotes"
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Add notes about verification..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>
                    Make sure to check bank statement before verifying
                  </span>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVerifyDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                verifyMutation.mutate({
                  purchaseId: selectedPayment.id,
                  notes: verificationNotes,
                })
              }
              disabled={verifyMutation.isPending}
            >
              {verifyMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Verification
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPayment && (
              <>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">Warning</span>
                  </div>
                  <p className="text-sm">
                    Rejecting this payment will mark it as failed. The user will
                    need to initiate a new purchase.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rejectReason">Rejection Reason *</Label>
                  <Textarea
                    id="rejectReason"
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Explain why the payment is being rejected..."
                    rows={3}
                    required
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                rejectMutation.mutate({
                  purchaseId: selectedPayment.id,
                  reason: verificationNotes,
                })
              }
              disabled={rejectMutation.isPending || !verificationNotes.trim()}
            >
              {rejectMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Confirm Rejection
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
