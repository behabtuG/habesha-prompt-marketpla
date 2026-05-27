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
  MoreHorizontal,
  ChevronRight,
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

  // Helper function to check if user has purchased or created a prompt
  const checkPromptAccess = (prompt: any) => {
    if (!user) return { hasAccess: false, purchaseStatus: null };

    if (prompt.creator?.id === user.id || prompt.creatorId === user.id) {
      return {
        hasAccess: true,
        purchaseStatus: "COMPLETED",
      };
    }

    const purchase = purchases.find(
      (p: any) => p.promptId === prompt.id || p.prompt?.id === prompt.id
    );

    return {
      hasAccess: purchase?.status === "COMPLETED" || prompt.hasAccess,
      purchaseStatus: purchase?.status || (prompt.hasAccess ? "COMPLETED" : null),
    };
  };

  return (
    <div className="pb-20">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] mb-4 mx-2">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{
            backgroundImage: `url('/hero-bg.png')`,
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
          }}
        />
        {/* <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/60 via-black/40 to-transparent" /> */}

        {/* Hero Content */}
        {/* <div className="relative z-20 px-6 py-16 md:py-24 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6 animate-fadeIn">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-semibold text-purple-100 uppercase tracking-wider">
              Powered by Advanced AI
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-white leading-tight">
            Elevate Your Workflow with <br />
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Premium AI Prompts
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Discover a curated marketplace of professional prompts for Midjourney, ChatGPT, and more. 
            Unlock your creative potential instantly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/prompts">
              <Button size="lg" className="h-14 px-8 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 border-0 text-lg font-bold shadow-xl shadow-purple-500/20 transition-all hover:scale-105 active:scale-95">
                Explore Marketplace
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>

            {user ? (
              <Link href="/my-prompts">
                <Button variant="outline" size="lg" className="h-14 px-8 rounded-2xl border-white/20 bg-white/5 backdrop-blur-md text-white hover:bg-white/10 text-lg font-bold transition-all">
                  My Collection
                </Button>
              </Link>
            ) : (
              <Link href="/auth">
                <Button variant="outline" size="lg" className="h-14 px-8 rounded-2xl border-white/20 bg-white/5 backdrop-blur-md text-white hover:bg-white/10 text-lg font-bold transition-all">
                  Join for Free
                </Button>
              </Link>
            )}
          </div>

          {/* Trust badges *
        <div className="mt-12 flex flex-wrap justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="flex items-center gap-2 text-white font-medium">
            <ShieldCheck className="h-5 w-5" />
            <span>Verified Prompts</span>
          </div>
          <div className="flex items-center gap-2 text-white font-medium">
            <Star className="h-5 w-5" />
            <span>Top Rated</span>
          </div>
          <div className="flex items-center gap-2 text-white font-medium">
            <TrendingUp className="h-5 w-5" />
            <span>Fastest Delivery</span>
          </div>
        </div>
      </div>
         */}
      </div>

      {/* Modern Categories Section */}
      <div className="px-4 mb-4">
        <div className="flex justify-between items-end mb-2">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Explore Categories</h2>
            <p className="text-muted-foreground mt-1">Find the perfect prompt for your specific needs</p>
          </div>
          <Link href="/prompts" className="text-purple-500 font-semibold hover:underline flex items-center gap-1">
            Browse all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link key={cat.name} href={`/prompts?category=${cat.name}`}>
              <div className="group relative p-6 rounded-3xl bg-card border border-border hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 cursor-pointer overflow-hidden text-center">
                {/* Background Glow */}
                <div className={`absolute -bottom-4 -right-4 w-12 h-12 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity ${cat.color.replace('text-', 'bg-')}`} />

                <div className={`w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <cat.icon className={`w-8 h-8 ${cat.color}`} />
                </div>

                <h3 className="text-sm font-bold text-foreground mb-1">{cat.label}</h3>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                  {categoryMap[cat.name] || 0} prompts
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Prompts */}
      <div className="mb-24 px-4">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-black tracking-tight">Featured Prompts</h2>
          <Link href="/prompts">
            <Button variant="ghost" className="font-bold text-slate-400 hover:text-slate-900">View All</Button>
          </Link>
        </div>

        {promptsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="aspect-[4/5] rounded-[2rem] animate-pulse bg-slate-50" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {prompts.map((prompt: any) => {
              const { hasAccess, purchaseStatus } = checkPromptAccess(prompt);
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

      {/* How It Works Section */}
      <div className="mb-2 py-2 bg-slate-50/50 rounded-[3rem] border border-slate-100/50">
        <div className="text-center mb-4">
          <h2 className="text-4xl font-black tracking-tight mb-4 text-slate-900">How It Works</h2>
          <div className="w-20 h-1.5 bg-yellow-400 mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 px-8">
          <div className="flex flex-col items-center text-center group">
            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center text-2xl font-black text-blue-500 mb-8 group-hover:scale-110 transition-transform duration-500 shadow-sm border border-blue-100/50">
              1
            </div>
            <h3 className="text-xl font-black mb-4 text-slate-900">Browse</h3>
            <p className="text-slate-400 font-medium leading-relaxed max-w-[240px]">
              Explore our curated collection of premium AI prompts
            </p>
          </div>

          <div className="flex flex-col items-center text-center group">
            <div className="w-20 h-20 rounded-full bg-purple-50 flex items-center justify-center text-2xl font-black text-purple-500 mb-8 group-hover:scale-110 transition-transform duration-500 shadow-sm border border-purple-100/50">
              2
            </div>
            <h3 className="text-xl font-black mb-4 text-slate-900">Purchase</h3>
            <p className="text-slate-400 font-medium leading-relaxed max-w-[240px]">
              Buy instantly with Telegram Stars — secure and fast
            </p>
          </div>

          <div className="flex flex-col items-center text-center group">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center text-2xl font-black text-emerald-500 mb-8 group-hover:scale-110 transition-transform duration-500 shadow-sm border border-emerald-100/50">
              3
            </div>
            <h3 className="text-xl font-black mb-4 text-slate-900">Unlock & Use</h3>
            <p className="text-slate-400 font-medium leading-relaxed max-w-[240px]">
              Access your prompts immediately in "My Purchases"
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 border-0">
        <h2 className="text-2xl font-semibold mb-4 text-center">
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
      {/*{
        user?.isAdmin && (
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
                    const access = checkPromptAccess(p);
                    return (
                      <div key={p.id} className="flex justify-between">
                        <span className="text-xs truncate">{p.title}:</span>
                        <span
                          className={`font-bold ${access.hasAccess ? "text-green-600" : "text-gray-600"
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
        )
      } */}
    </div >
  );
}
