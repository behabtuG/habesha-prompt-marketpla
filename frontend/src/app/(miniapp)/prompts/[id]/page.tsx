// app/(miniapp)/prompts/[id]/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import Link from "next/link";
import {
  Star,
  Zap,
  Wallet,
  ArrowLeft,
  Heart,
  Bookmark,
} from "lucide-react";
import { getImageUrl } from "@/lib/image-utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";

export default function PromptDetail() {
  const { id: promptId } = useParams() as { id: string };
  const { user } = useAuthStore();
  const router = useRouter();

  const { data: prompt, isLoading } = useQuery({
    queryKey: ["prompt", promptId],
    queryFn: () => api.get(`/prompts/${promptId}`).then((res) => res.data.data),
  });

  const { data: access } = useQuery({
    queryKey: ["prompt-access", promptId, user?.id],
    queryFn: () =>
      api.get(`/payments/check-access/${promptId}`).then((res) => res.data),
    enabled: !!user,
  });

  // Redirect to full page if user has access or it's free
  useEffect(() => {
    if (access?.hasAccess || prompt?.priceStars === 0) {
      router.replace(`/prompts/${promptId}/full`);
    }
  }, [access, prompt, promptId, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!prompt) {
    return <p className="text-center py-10">Prompt not found</p>;
  }

  const imageSrc = getImageUrl(prompt.imageUrl);
  const formattedDate = new Date(prompt.createdAt || Date.now()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Back Navigation */}
        <div className="mb-6 md:mb-10">
          <Link href="/">
            <button className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to gallery
            </button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-8 md:gap-12 lg:gap-16">
          {/* LEFT: Image */}
          <div className="w-full">
            <div className="relative w-full aspect-square md:aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl bg-slate-900">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={prompt.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                  <span className="text-slate-500 font-medium">No image available</span>
                </div>
              )}
            </div>
          </div>
          {/* RIGHT: Content */}
          <div className="flex flex-col pt-2 md:pt-4">
            {/* Header Info */}
            <div className="mb-8">
              <div className="inline-block bg-slate-900 text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5 shadow-md">
                PROMPT PREVIEW
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
                {prompt.title}
              </h1>
              <div className="text-slate-500 text-sm md:text-base font-medium space-y-1">
                <p>Shared by <span className="text-slate-600">@{prompt.creator?.username || 'creator'}</span></p>
                <p>Posted on {formattedDate}</p>
              </div>
            </div>
            {/* Prompt Preview & Purchase Card */}
            <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 mb-6 relative overflow-hidden">
              <h2 className="text-xs font-bold text-slate-400 tracking-[0.2em] uppercase mb-5">
                PREVIEW
              </h2>
              <p className="text-slate-700 leading-relaxed text-sm md:text-base mb-8 whitespace-pre-wrap font-medium">
                {prompt.previewContent || prompt.description}
                <br /><br />
                <span className="blur-sm select-none opacity-60">
                  This is a premium prompt. The full content includes detailed instructions, negative prompts, camera settings, and specific parameter values to achieve the exact result.
                </span>
              </p>
              <h3 className="text-sm font-bold text-slate-800 mb-4">Unlock Full Prompt</h3>
              <div className="flex flex-col gap-3">
                <Link href={`/purchase/${prompt.id}?method=TELEGRAM_STARS`}>
                  <button className="w-full flex items-center justify-between bg-slate-900 hover:bg-black text-white px-6 py-3.5 rounded-full text-sm font-bold transition-all active:scale-95 shadow-md">
                    <span className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      Telegram Stars
                    </span>
                    <span>{prompt.priceStars} ⭐</span>
                  </button>
                </Link>
                {prompt.priceTon > 0 && (
                  <Link href={`/purchase/${prompt.id}?method=TON`}>
                    <button className="w-full flex items-center justify-between bg-white border-2 border-slate-100 hover:border-slate-200 text-slate-800 px-6 py-3.5 rounded-full text-sm font-bold transition-all active:scale-95">
                      <span className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-500 fill-blue-500" />
                        TON Blockchain
                      </span>
                      <span>{prompt.priceTon} TON</span>
                    </button>
                  </Link>
                )}
                {prompt.priceLocal > 0 && (
                  <Link href={`/purchase/${prompt.id}?method=LOCAL_BIRR`}>
                    <button className="w-full flex items-center justify-between bg-white border-2 border-slate-100 hover:border-slate-200 text-slate-800 px-6 py-3.5 rounded-full text-sm font-bold transition-all active:scale-95">
                      <span className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-emerald-500" />
                        Ethiopian Birr
                      </span>
                      <span>{prompt.priceLocal} ETB</span>
                    </button>
                  </Link>
                )}
              </div>
            </div>
            {/* Social / Likes Card */}
            <div className="flex items-center justify-between bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100 mb-6">
              <div className="flex items-center gap-2 text-slate-500 font-medium">
                <Heart className="w-5 h-5 text-slate-400" />
                <span>{prompt.purchaseCount ? (prompt.purchaseCount >= 1000 ? (prompt.purchaseCount / 1000).toFixed(1) + 'k' : prompt.purchaseCount) : '1.7k'}</span>
              </div>
              <button className="text-slate-400 hover:text-slate-600 transition-colors">
                <Bookmark className="w-5 h-5" />
              </button>
            </div>
            {/* Tags / Model Card */}
            <div className="bg-white rounded-[1.5rem] p-6 md:p-8 shadow-sm border border-slate-100">
              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-400 tracking-[0.15em] uppercase mb-2">MODEL OR TOOL</h3>
                <p className="text-slate-800 font-semibold text-base">ChatGPT</p>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-400 tracking-[0.15em] uppercase mb-3">TAGS</h3>
                <div className="flex flex-wrap gap-2">
                  {prompt.category ? (
                    <span className="bg-slate-50 text-slate-600 px-4 py-1.5 rounded-full text-xs font-semibold border border-slate-200/60">
                      {prompt.category.replace("_", " ")}
                    </span>
                  ) : null}
                  <span className="bg-slate-50 text-slate-600 px-4 py-1.5 rounded-full text-xs font-semibold border border-slate-200/60">
                    Premium
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
