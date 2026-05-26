import {
  Clock,
  Heart,
  Copy,
  CheckCircle,
  Star,
  Eye,
  User,
} from "lucide-react";
import Link from "next/link";
import { getImageUrl } from "@/lib/image-utils";
import { toast } from "sonner";
import { useState } from "react";

interface PromptCardProps {
  prompt: {
    id: string;
    title: string;
    description: string;
    category: string;
    priceStars: number;
    priceTon: number;
    priceLocal: number;
    imageUrl?: string;
    imageAlt?: string;
    hasAccess: boolean;
    purchaseStatus?: string;
    decryptedContent?: string;
    rating?: number;
    purchaseCount?: number;
    isCreator?: boolean;
    creator?: {
      username: string;
      firstName?: string;
    };
  };
}

export function PromptCard({ prompt }: PromptCardProps) {
  const [isCopied, setIsCopied] = useState(false);
  const imageSrc = getImageUrl(prompt.imageUrl);

  const isFree = prompt.priceStars === 0;
  const isCreator = prompt.isCreator === true;
  const isPurchased = prompt.hasAccess === true && !isFree && !isCreator;
  const isPending = prompt.purchaseStatus === "PENDING_VERIFICATION";

  const handleCopy = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const textToCopy = prompt.decryptedContent || prompt.description;
    navigator.clipboard.writeText(textToCopy);

    setIsCopied(true);
    toast.success("Prompt copied to clipboard!");

    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <div className="group relative w-full aspect-square sm:aspect-[4/5] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-lg transition-transform hover:scale-[1.02] duration-300 bg-slate-900">
      <img
        src={imageSrc}
        alt={prompt.imageAlt || prompt.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        onError={(e) => {
          e.currentTarget.src = "/placeholder.svg";
        }}
      />

      {/* Full Card Clickable Link overlay */}
      <Link 
        href={isPurchased || isFree ? `/prompts/${prompt.id}/full` : `/prompts/${prompt.id}`} 
        className="absolute inset-0 z-10"
      >
        <span className="sr-only">View {prompt.title} details</span>
      </Link>

      {/* Cinematic Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/40 to-transparent opacity-90 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent opacity-70 pointer-events-none" />

      {/* Content wrapper */}
      <div className="absolute inset-0 p-4 md:p-5 flex flex-col justify-between pointer-events-none">
        
        {/* TOP ROW */}
        <div className="flex justify-between items-start gap-3">
          {/* Title Badge / Label */}
          <div className="bg-black/40 backdrop-blur-md text-white/90 text-[10px] font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full truncate max-w-[70%] border border-white/10">
            {prompt.title}
          </div>
          
          {/* Likes / Popularity */}
          <div className="flex items-center gap-1.5 text-white/90 text-[11px] font-medium tracking-wide">
            <Heart className="w-3.5 h-3.5 text-white/80" />
            {prompt.purchaseCount ? (
              <span>{prompt.purchaseCount >= 1000 ? (prompt.purchaseCount/1000).toFixed(1) + 'k' : prompt.purchaseCount}</span>
            ) : (
              <span>{(prompt.title.length * 15) + 120}</span> // Faux popular count if missing
            )}
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div className="flex flex-col gap-4">
          
          {/* Status Indicator for Pending */}
          {isPending && (
            <div className="flex items-center gap-2 text-yellow-400 text-[10px] uppercase tracking-wider font-bold bg-black/50 w-max px-3 py-1.5 rounded-full backdrop-blur-sm border border-yellow-500/30">
              <Clock className="w-3.5 h-3.5" />
              Pending
            </div>
          )}

          {/* Description / Prompt Preview */}
          <div className="text-white/90 text-xs sm:text-sm font-medium leading-relaxed line-clamp-3 md:line-clamp-4 relative z-20">
            {isFree && prompt.decryptedContent ? prompt.decryptedContent : prompt.description}
          </div>

          {/* Actions & Creator */}
          <div className="flex items-center justify-between mt-1 relative z-20 pointer-events-auto">
            
            {/* Action Button */}
            {isCreator ? (
              <Link href={`/prompts/${prompt.id}/full`} onClick={(e) => e.stopPropagation()}>
                <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-[11px] uppercase tracking-wider font-black transition-transform active:scale-95 shadow-lg border-0">
                  <User className="w-3.5 h-3.5 text-white" />
                  MY PROMPT
                </button>
              </Link>
            ) : isPurchased ? (
              <Link href={`/prompts/${prompt.id}/full`} onClick={(e) => e.stopPropagation()}>
                <button className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-[11px] uppercase tracking-wider font-black transition-transform active:scale-95 shadow-lg">
                  <Eye className="w-3.5 h-3.5" />
                  VIEW
                </button>
              </Link>
            ) : isFree ? (
              <button 
                onClick={handleCopy}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 shadow-lg"
              >
                {isCopied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {isCopied ? "COPIED" : "Copy"}
              </button>
            ) : (
              <Link href={`/prompts/${prompt.id}`} onClick={(e) => e.stopPropagation()}>
                <button className="flex items-center gap-1.5 bg-white text-black px-4 py-2 rounded-full text-[11px] uppercase tracking-wider font-black transition-transform active:scale-95 shadow-xl shadow-black/50">
                  <Star className="w-3.5 h-3.5 fill-black" />
                  PREMIUM
                </button>
              </Link>
            )}

            {/* Creator Text */}
            {prompt.creator?.username && (
              <div className="text-white/60 text-xs font-medium">
                by @{prompt.creator.username}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
