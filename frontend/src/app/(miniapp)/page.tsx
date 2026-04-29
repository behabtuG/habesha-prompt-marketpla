// app/(miniapp)/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Palette,
  Code,
  Sparkles,
  BookOpen,
  TrendingUp,
  ShieldCheck,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { PromptCard } from "@/components/PromptCard";
import { useAuthStore } from "@/store/useAuthStore";

const categories = [
  { name: "UI_UX", icon: Palette, color: "text-blue-500", label: "UI/UX" },
  { name: "Code", icon: Code, color: "text-purple-500", label: "Code" },
  { name: "Images", icon: Sparkles, color: "text-pink-500", label: "Images" },
  {
    name: "Writing",
    icon: BookOpen,
    color: "text-yellow-500",
    label: "Writing",
  },
  {
    name: "Business",
    icon: TrendingUp,
    color: "text-green-500",
    label: "Business",
  },
  {
    name: "Others",
    icon: MoreHorizontal,
    color: "text-gray-500",
    label: "Other",
  },
];

export default function HomePage() {
  const { user } = useAuthStore();

  // Fetch featured prompts
  const { data: prompts = [], isLoading: promptsLoading } = useQuery({
    queryKey: ["featured-prompts", user?.id],
    queryFn: () =>
      api
        .get("/prompts", {
          params: {
            limit: 6,
            includePurchased: false,
          },
        })
        .then((res) => res.data.data),
  });

  // Fetch user's purchases to check access
  const { data: purchases = [] } = useQuery({
    queryKey: ["my-purchases-home"],
    queryFn: () => api.get("/payments/purchases").then((res) => res.data.data),
    enabled: !!user, // Only fetch if user is logged in
  });

  const { data: cats = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get("/prompts/categories").then((res) => res.data.data),
  });

  const categoryMap: Record<string, number> = {};
  if (Array.isArray(cats)) {
    cats.forEach((cat: any) => {
      categoryMap[cat.name] = cat.count;
    });
  }

  // Helper function to check if user has purchased a prompt
  const checkPromptAccess = (promptId: string) => {
    if (!user) return { hasAccess: false, purchaseStatus: null };

    const purchase = purchases.find(
      (p: any) => p.promptId === promptId || p.prompt?.id === promptId
    );

    return {
      hasAccess: purchase?.status === "COMPLETED",
      purchaseStatus: purchase?.status,
    };
  };

  return (
    <div className="p-4 pb-20 space-y-8">
      {/* Hero Section */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Prompt Marketplace
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Discover premium AI prompts for code, design, writing, and more.
          Purchase with Telegram Stars and unlock instant access.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/prompts">
            <Button size="lg" className="gap-2">
              <Sparkles className="h-5 w-5" />
              Browse Prompts
            </Button>
          </Link>

          {user && (
            <>
              <Link href="/my-prompts">
                <Button variant="outline" size="lg">
                  My Purchases
                </Button>
              </Link>

              {user.isAdmin && (
                <Link href="/admin">
                  <Button variant="secondary" size="lg" className="gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    Admin Dashboard
                  </Button>
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Browse Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <Link key={cat.name} href={`/prompts?category=${cat.name}`}>
              <Card className="p-6 text-center hover:shadow-xl transition-shadow cursor-pointer hover:scale-105 duration-200">
                <cat.icon className={`w-12 h-12 mx-auto mb-3 ${cat.color}`} />
                <h3 className="text-lg font-semibold">{cat.label}</h3>
                <p className="text-sm text-muted-foreground">
                  {categoryMap[cat.name] || 0} prompts
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Prompts */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Featured Prompts</h2>
          <Link href="/prompts">
            <Button variant="ghost">View All</Button>
          </Link>
        </div>

        {promptsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-6 bg-muted rounded mb-4"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </Card>
            ))}
          </div>
        ) : prompts.length === 0 ? (
          <div className="text-center py-16 border rounded-lg bg-muted/20">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Prompts Available</h3>
            <p className="text-muted-foreground mb-6">
              Check back soon for amazing AI prompts!
            </p>
            {user?.isAdmin && (
              <Link href="/admin">
                <Button>Add First Prompt</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prompts.map((prompt: any) => {
              const { hasAccess, purchaseStatus } = checkPromptAccess(
                prompt.id
              );

              return (
                <PromptCard
                  key={prompt.id}
                  prompt={{
                    ...prompt,
                    hasAccess: hasAccess,
                    purchaseStatus: purchaseStatus,
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* How It Works */}
      <Card className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 border-0">
        <h2 className="text-2xl font-semibold mb-8 text-center">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              1
            </div>
            <h3 className="text-xl font-semibold mb-3">Browse</h3>
            <p className="text-muted-foreground">
              Explore our curated collection of premium AI prompts
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              2
            </div>
            <h3 className="text-xl font-semibold mb-3">Purchase</h3>
            <p className="text-muted-foreground">
              Buy instantly with Telegram Stars — secure and fast
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              3
            </div>
            <h3 className="text-xl font-semibold mb-3">Unlock & Use</h3>
            <p className="text-muted-foreground">
              Access your prompts immediately in "My Purchases"
            </p>
          </div>
        </div>
      </Card>

      {/* DEBUG PANEL - ONLY VISIBLE TO ADMINS */}
      {user?.isAdmin && (
        <div className="mt-8 border-2 border-dashed border-yellow-400 rounded-lg p-4 bg-yellow-50">
          <h3 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
            🔧 Admin Debug Panel
          </h3>

          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-white rounded border">
                <div className="font-medium text-xs text-gray-500">User ID</div>
                <div className="truncate font-mono text-xs">{user.id}</div>
              </div>
              <div className="p-2 bg-white rounded border">
                <div className="font-medium text-xs text-gray-500">
                  Telegram ID
                </div>
                <div className="truncate font-mono text-xs">
                  {user.telegramId}
                </div>
              </div>
            </div>

            <div className="p-2 bg-white rounded border">
              <div className="font-medium text-xs text-gray-500">
                Purchase Debug
              </div>
              <div className="space-y-1 mt-1">
                <div className="flex justify-between">
                  <span className="text-xs">Total Purchases:</span>
                  <span className="font-bold">{purchases.length}</span>
                </div>
                {prompts.map((p: any) => {
                  const access = checkPromptAccess(p.id);
                  return (
                    <div key={p.id} className="flex justify-between">
                      <span className="text-xs truncate">{p.title}:</span>
                      <span
                        className={`font-bold ${
                          access.hasAccess ? "text-green-600" : "text-gray-600"
                        }`}
                      >
                        {access.hasAccess ? "✓ Owned" : "Not owned"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  console.log("Purchases data:", purchases);
                  console.log("Featured prompts:", prompts);
                  alert("Check browser console for purchase data");
                }}
                className="text-xs"
              >
                📋 Log Purchases
              </Button>

              <Link href="/my-prompts">
                <Button size="sm" className="text-xs bg-green-600">
                  🛒 My Purchases Page
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
