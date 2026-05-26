// app/(miniapp)/prompts/[id]/full/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { ArrowLeft, Copy, Heart, Bookmark, CheckCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getImageUrl } from "@/lib/image-utils";

export default function FullPromptPage() {
  const params = useParams();
  const router = useRouter();
  const promptId = params.id as string;

  const [prompt, setPrompt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, [promptId]);

  const fetchData = async () => {
    try {
      // 1. Get basic info first
      const previewRes = await api.get(`/prompts/${promptId}`);
      const promptData = previewRes.data.data;

      let accessGranted = false;

      // 2. Check if it's free or user has purchased
      if (promptData.priceStars === 0) {
        accessGranted = true;
        setHasAccess(true);
      } else {
        try {
          const accessRes = await api.get(`/payments/check-access/${promptId}`);
          accessGranted = accessRes.data.hasAccess;
          setHasAccess(accessGranted);
          setPurchaseStatus(accessRes.data.purchaseStatus || null);
        } catch (err) {
          console.error("Access check error:", err);
        }
      }

      // 3. If no access, redirect to preview/purchase
      if (!accessGranted) {
        router.push(`/prompts/${promptId}`);
        return;
      }

      // 4. Try fetching full content
      let fullContent = promptData.decryptedContent || promptData.description;
      try {
        const fullRes = await api.get(`/prompts/${promptId}/full`);
        fullContent = fullRes.data?.data?.content || fullContent;
      } catch (err) {
        console.warn("Could not fetch full content from backend, using fallback");
      }

      setPrompt({
        ...promptData,
        fullContent,
      });

    } catch (error) {
      console.error("Error loading prompt:", error);
      toast.error("Failed to load prompt");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!prompt || !hasAccess) return null;

  const imageSrc = getImageUrl(prompt.imageUrl);
  const formattedDate = new Date(prompt.createdAt || Date.now()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.fullContent);
    setIsCopied(true);
    toast.success("Prompt copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

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
                PROMPT DETAIL
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
                {prompt.title}
              </h1>

              <div className="text-slate-500 text-sm md:text-base font-medium space-y-1">
                <p>Shared by <span className="text-slate-600">@{prompt.creator?.username || 'creator'}</span></p>
                <p>Posted on {formattedDate}</p>
              </div>
            </div>

            {/* Prompt Card */}
            <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 mb-6 relative overflow-hidden">
              <h2 className="text-xs font-bold text-slate-400 tracking-[0.2em] uppercase mb-5">
                PROMPT
              </h2>

              <p className="text-slate-700 leading-relaxed text-sm md:text-base mb-8 whitespace-pre-wrap font-medium">
                {prompt.fullContent}
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all active:scale-95 shadow-md"
                >
                  {isCopied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {isCopied ? "Copied" : "Copy"}
                </button>
                <Link href={`/prompts/${promptId}`}>
                  <button className="flex items-center justify-center gap-2 bg-white border-2 border-slate-100 hover:border-slate-200 text-slate-700 px-6 py-2.5 rounded-full text-sm font-bold transition-all active:scale-95">
                    Try this
                  </button>
                </Link>
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
                    Cinematic
                  </span>
                  <span className="bg-slate-50 text-slate-600 px-4 py-1.5 rounded-full text-xs font-semibold border border-slate-200/60">
                    Portrait
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
