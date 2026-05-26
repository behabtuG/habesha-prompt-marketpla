"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, ArrowLeft, Loader2, Sparkles, Copy, Calendar, Award } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/lib/image-utils";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function MyPromptsPage() {
  const [activeTab, setActiveTab] = useState<"created" | "purchased">("created");

  const { data: createdData, isLoading: isLoadingCreated } = useQuery({
    queryKey: ["my-prompts", "created"],
    queryFn: () => api.get("/prompts/created").then((res) => res.data),
  });

  const { data: purchasedData, isLoading: isLoadingPurchased } = useQuery({
    queryKey: ["my-prompts", "purchased"],
    queryFn: () => api.get("/prompts/purchased").then((res) => res.data),
  });

  const createdPrompts = createdData?.data || [];
  const purchasedPrompts = purchasedData?.data || [];

  const isLoading = isLoadingCreated || isLoadingPurchased;

  const handleCopyPrompt = (content: string, title: string) => {
    if (!content) {
      toast.error("Prompt content is empty.");
      return;
    }
    navigator.clipboard.writeText(content);
    toast.success(`Prompt content for "${title}" copied to clipboard! 📋`);
  };

  const getSalesStats = (purchases: any[] = []) => {
    let starsCount = 0;
    let starsRevenue = 0;
    let tonCount = 0;
    let tonRevenue = 0;
    let birrCount = 0;
    let birrRevenue = 0;

    purchases.forEach((p: any) => {
      const amount = p.amountPaid || 0;
      if (p.paymentMethod === "TELEGRAM_STARS") {
        starsCount++;
        starsRevenue += amount;
      } else if (p.paymentMethod === "TON") {
        tonCount++;
        tonRevenue += amount;
      } else if (p.paymentMethod === "LOCAL_BIRR") {
        birrCount++;
        birrRevenue += amount;
      }
    });

    return {
      starsCount,
      starsRevenue,
      tonCount,
      tonRevenue,
      birrCount,
      birrRevenue,
      total: purchases.length,
    };
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-10">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-black tracking-tight">My Prompts</h1>
          <p className="text-slate-400 font-medium">Manage and view your prompts</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl mb-8 max-w-md">
        <button
          onClick={() => setActiveTab("created")}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-200 ${
            activeTab === "created"
              ? "bg-white text-black shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          My Creations ({createdPrompts.length})
        </button>
        <button
          onClick={() => setActiveTab("purchased")}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-200 ${
            activeTab === "purchased"
              ? "bg-white text-black shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Purchases ({purchasedPrompts.length})
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-12 h-12 animate-spin text-slate-300" />
        </div>
      ) : activeTab === "created" ? (
        createdPrompts.length === 0 ? (
          <Card className="border-none shadow-sm p-20 text-center bg-white rounded-[3rem] border border-slate-100">
            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
              <Package className="w-12 h-12 text-slate-200" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-3">No Creations Yet</h3>
            <p className="text-slate-400 font-medium mb-10 max-w-sm mx-auto text-sm">
              You haven't submitted any prompts yet. Share your creations to start earning!
            </p>
            <Link href="/share">
              <Button className="h-14 px-10 bg-black text-white hover:bg-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-black/10 active:scale-95">
                Share a Prompt
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {createdPrompts.map((prompt: any) => {
              const stats = getSalesStats(prompt.purchases || []);
              return (
                <Card key={prompt.id} className="overflow-hidden border-none shadow-sm rounded-3xl group flex flex-col justify-between">
                  <div>
                    <div className="aspect-video w-full bg-slate-100 relative overflow-hidden">
                      {prompt.imageUrl ? (
                        <img 
                          src={getImageUrl(prompt.imageUrl)} 
                          alt={prompt.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-slate-300" />
                        </div>
                      )}
                      
                      <div className="absolute top-4 right-4 flex gap-2">
                        <Badge className={prompt.isActive ? "bg-emerald-500 hover:bg-emerald-600 border-none px-3 py-1 rounded-full text-xs font-bold text-white" : "bg-amber-500 hover:bg-amber-600 border-none px-3 py-1 rounded-full text-xs font-bold text-white"}>
                          {prompt.isActive ? "Active" : "Pending Review"}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xl font-black truncate">{prompt.title}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-2 font-medium text-slate-500">{prompt.description}</CardDescription>
                    </CardHeader>
                  </div>
                  
                  <div>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                          {prompt.category.replace("_", " ")}
                        </span>
                        <div className="flex items-center gap-1.5 font-bold text-slate-700 bg-yellow-50 px-3 py-1 rounded-full">
                          <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                          <span>{prompt.priceStars > 0 ? `${prompt.priceStars} Stars` : "Free"}</span>
                        </div>
                      </div>

                      {/* Sales Stats Box */}
                      <div className="pt-4 border-t border-slate-100 space-y-3">
                        <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-slate-400">
                          <span>Sales Performance</span>
                          <span className="text-black font-black text-sm">{stats.total} {stats.total === 1 ? 'Sale' : 'Sales'}</span>
                        </div>
                        
                        {stats.total > 0 ? (
                          <div className="grid grid-cols-3 gap-2">
                            {stats.starsCount > 0 && (
                              <div className="p-2 rounded-xl bg-amber-50/50 border border-amber-100 flex flex-col items-center justify-center">
                                <span className="text-xs font-black text-amber-600">⭐ {stats.starsCount}</span>
                                <span className="text-[9px] font-bold text-amber-500 uppercase mt-0.5">{stats.starsRevenue} Stars</span>
                              </div>
                            )}
                            {stats.tonCount > 0 && (
                              <div className="p-2 rounded-xl bg-blue-50/50 border border-blue-100 flex flex-col items-center justify-center">
                                <span className="text-xs font-black text-blue-600">💎 {stats.tonCount}</span>
                                <span className="text-[9px] font-bold text-blue-500 uppercase mt-0.5">{stats.tonRevenue.toFixed(2)} TON</span>
                              </div>
                            )}
                            {stats.birrCount > 0 && (
                              <div className="p-2 rounded-xl bg-emerald-50/50 border border-emerald-100 flex flex-col items-center justify-center">
                                <span className="text-xs font-black text-emerald-600">🇪🇹 {stats.birrCount}</span>
                                <span className="text-[9px] font-bold text-emerald-500 uppercase mt-0.5">{stats.birrRevenue} ETB</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-slate-400 text-xs italic text-center py-2">No sales yet. Keep sharing!</p>
                        )}
                      </div>
                    </CardContent>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : purchasedPrompts.length === 0 ? (
        <Card className="border-none shadow-sm p-20 text-center bg-white rounded-[3rem] border border-slate-100">
          <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Package className="w-12 h-12 text-slate-200" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-3">No Purchases Yet</h3>
          <p className="text-slate-400 font-medium mb-10 max-w-sm mx-auto text-sm">
            You haven't purchased any prompts yet. Browse the marketplace to find your favorite AI prompts.
          </p>
          <Link href="/">
            <Button className="h-14 px-10 bg-black text-white hover:bg-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-black/10 active:scale-95">
              Browse Marketplace
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {purchasedPrompts.map((prompt: any) => (
            <Card key={prompt.id} className="overflow-hidden border-none shadow-sm rounded-3xl group flex flex-col justify-between">
              <div>
                <div className="aspect-video w-full bg-slate-100 relative overflow-hidden">
                  {prompt.imageUrl ? (
                    <img 
                      src={getImageUrl(prompt.imageUrl)} 
                      alt={prompt.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-slate-300" />
                    </div>
                  )}
                  
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Badge className="bg-slate-950 hover:bg-slate-900 border-none px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1">
                      <Award className="w-3 h-3 text-yellow-500" /> Unlocked
                    </Badge>
                  </div>
                </div>
                
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl font-black truncate">{prompt.title}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-2 font-medium text-slate-500">{prompt.description}</CardDescription>
                </CardHeader>
              </div>

              <div>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      {prompt.category.replace("_", " ")}
                    </span>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-400 font-bold">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{prompt.purchasedAt ? new Date(prompt.purchasedAt).toLocaleDateString() : 'Recently'}</span>
                    </div>
                  </div>

                  {prompt.decryptedContent ? (
                    <Button 
                      onClick={() => handleCopyPrompt(prompt.decryptedContent, prompt.title)}
                      className="w-full h-12 bg-slate-900 text-white hover:bg-black rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Copy className="w-4 h-4" /> Copy Prompt Content
                    </Button>
                  ) : (
                    <div className="text-center p-3 bg-red-50 text-red-500 text-xs font-bold rounded-2xl">
                      Content not available.
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
