"use client";

import { MessageSquare, Users, Globe, ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CommunityPage() {
  const sections = [
    {
      title: "Public Gallery",
      description: "Join the largest community of AI artists sharing their best prompts.",
      icon: Globe,
      color: "text-blue-500",
      bg: "bg-blue-50"
    },
    {
      title: "Creator Program",
      description: "Get verified and start earning Telegram Stars for your prompt creations.",
      icon: ShieldCheck,
      color: "text-purple-500",
      bg: "bg-purple-50"
    },
    {
      title: "Discussion Hub",
      description: "Ask questions, share tips, and learn how to master generative AI.",
      icon: MessageSquare,
      color: "text-emerald-500",
      bg: "bg-emerald-50"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-12">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-black tracking-tight">Community</h1>
          <p className="text-slate-400 font-medium">Connect, share, and grow with other AI enthusiasts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {sections.map((s) => (
          <div key={s.title} className="p-10 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-500 group">
            <div className={`w-16 h-16 rounded-2xl ${s.bg} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
              <s.icon className={`w-8 h-8 ${s.color}`} />
            </div>
            <h2 className="text-2xl font-black mb-4">{s.title}</h2>
            <p className="text-slate-400 font-medium leading-relaxed">{s.description}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-12 text-center text-white">
        <Users className="w-16 h-16 mx-auto mb-6 text-yellow-400" />
        <h2 className="text-3xl font-black mb-4">Join 2,400+ Creators</h2>
        <p className="text-slate-400 mb-8 max-w-lg mx-auto">
          Be part of the fastest-growing community for Habesha AI artists.
        </p>
        <Button className="rounded-full px-10 h-14 bg-white text-black font-black hover:bg-slate-100">Join Telegram Channel</Button>
      </div>
    </div>
  );
}
