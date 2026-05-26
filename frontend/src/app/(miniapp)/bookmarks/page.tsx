"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { PromptCard } from "@/components/PromptCard";
import { 
  Bookmark, 
  ArrowLeft, 
  Sparkles, 
  Search,
  Filter
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function BookmarksPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Placeholder for future implementation
  const { data: prompts = [], isLoading } = useQuery({
    queryKey: ["bookmarks"],
    queryFn: async () => {
      // return api.get("/prompts/bookmarks");
      return []; 
    },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* ── Premium Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-4">
          <Link href="/profile" className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-indigo-500 transition-colors group">
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
            Back to Profile
          </Link>
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                <Bookmark className="w-7 h-7" />
             </div>
             <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Saved Hub</h1>
                <p className="text-slate-500 font-medium text-sm">Your curated collection of premium prompts</p>
             </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <Input
              placeholder="Search your vault..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 w-full md:w-64 bg-white border-slate-100 rounded-2xl text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
            />
          </div>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-slate-100 bg-white text-slate-400 hover:text-indigo-500 shadow-sm">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ── Content Area ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-[4/5] bg-white border border-slate-100 rounded-[2.5rem] animate-pulse" />
          ))}
        </div>
      ) : prompts.length === 0 ? (
        <div className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-[3rem]" />
          <div className="relative text-center py-32 px-6">
            <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-black/5">
              <Bookmark className="w-10 h-10 text-slate-200" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-3">Your Vault is Empty</h2>
            <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto">
              Start exploring the marketplace and save the prompts that inspire your next big project.
            </p>
            <Link href="/prompts">
              <Button className="h-14 px-10 bg-slate-900 text-white hover:bg-black rounded-2xl text-xs font-bold transition-all shadow-2xl shadow-black/10 active:scale-95 flex items-center gap-3 mx-auto">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                Explore Marketplace
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
          {prompts.map((prompt: any) => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
        </div>
      )}
    </div>
  );
}
