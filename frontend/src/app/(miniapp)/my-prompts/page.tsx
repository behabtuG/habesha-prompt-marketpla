// app/(miniapp)/my-prompts/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PromptCard } from "@/components/PromptCard";
import {
  ArrowLeft,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function MyPrompts() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  const {
    data: purchases = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["my-purchases"],
    queryFn: () => api.get("/payments/purchases").then((res) => res.data.data),
    enabled: !!user,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    toast.success("Refreshed your prompts");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 max-w-6xl mx-auto">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your prompts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4 max-w-6xl mx-auto">
        <div className="text-center py-20">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load prompts</h3>
          <p className="text-muted-foreground mb-6">
            Please check your connection and try again
          </p>
          <Button onClick={handleRefresh} disabled={refreshing}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const purchasedPrompts = purchases.map((p: any) => {
    const transformed = {
      ...p.prompt,
      purchaseStatus: p.status,
      purchasedAt: p.unlockedAt || p.createdAt,
      purchaseId: p.id,
      hasAccess: p.status === "COMPLETED",
    };

    return transformed;
  });

  // Group by status
  const activePrompts = purchasedPrompts.filter(
    (p: any) => p.purchaseStatus === "COMPLETED"
  );
  const pendingPrompts = purchasedPrompts.filter(
    (p: any) => p.purchaseStatus === "PENDING_VERIFICATION"
  );
  const failedPrompts = purchasedPrompts.filter(
    (p: any) => p.purchaseStatus === "FAILED" || p.purchaseStatus === "REFUNDED"
  );

  return (
    <div className="min-h-screen p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                Refresh
              </Button>
            </div>
            <h1 className="text-3xl font-bold">My Prompts</h1>
            <p className="text-muted-foreground mt-1">
              All your purchased prompts in one place
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold">
                {purchasedPrompts.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Prompts</div>
            </div>
            {/* <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div> */}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl border">
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {activePrompts.length}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              Active Prompts
            </div>
          </div>
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 p-4 rounded-xl border">
            <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
              {pendingPrompts.length}
            </div>
            <div className="text-sm text-yellow-600 dark:text-yellow-400">
              Pending Verification
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-xl border">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {failedPrompts.length}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              Failed/Refunded
            </div>
          </div>
        </div>
      </div>

      {/* No prompts */}
      {purchasedPrompts.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-2xl bg-gradient-to-b from-muted/30 to-muted/10">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No prompts yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            You haven't purchased any prompts yet. Start exploring our
            marketplace to find amazing prompts!
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/">
              <Button>Browse Prompts</Button>
            </Link>
            <Link href="/categories">
              <Button variant="outline">View Categories</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Pending Prompts */}
          {pendingPrompts.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h2 className="text-xl font-bold">Pending Verification</h2>
                <Badge variant="secondary" className="ml-2">
                  {pendingPrompts.length}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                These prompts are waiting for admin verification. Usually takes
                1-24 hours.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingPrompts.map((prompt: any) => (
                  <PromptCard key={prompt.id} prompt={prompt} />
                ))}
              </div>
            </div>
          )}

          {/* Active Prompts */}
          {activePrompts.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-bold">Active Prompts</h2>
                <Badge variant="secondary" className="ml-2">
                  {activePrompts.length}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                You have full access to these prompts. Click to view the full
                content.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activePrompts.map((prompt: any) => (
                  <PromptCard key={prompt.id} prompt={prompt} />
                ))}
              </div>
            </div>
          )}

          {/* Failed Prompts */}
          {failedPrompts.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-bold">Failed/Refunded</h2>
                <Badge variant="secondary" className="ml-2">
                  {failedPrompts.length}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                These purchases were unsuccessful or refunded.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {failedPrompts.map((prompt: any) => (
                  <div key={prompt.id} className="opacity-50">
                    <PromptCard prompt={prompt} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
