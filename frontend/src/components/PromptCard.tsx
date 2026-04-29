import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle,
  Sparkles,
  Zap,
  Wallet,
  Copy,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { getImageUrl } from "@/lib/image-utils";
import { Badge } from "@/components/ui/badge";
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
  const isPurchased =
    prompt.hasAccess === true && prompt.purchaseStatus === "COMPLETED" && !isFree;
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
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full bg-white/80 backdrop-blur-sm border-slate-200/60">
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 shrink-0">
        <img
          src={imageSrc}
          alt={prompt.imageAlt || prompt.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.currentTarget.src = "/placeholder.svg";
          }}
        />
        <div className="absolute top-3 left-3">
          <Badge
            variant="outline"
            className="bg-background/80 backdrop-blur-sm border-white/20 shadow-sm"
          >
            {prompt.category.replace("_", "/")}
          </Badge>
        </div>

        {/* Status badge */}
        {(isPurchased || isFree) && (
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-emerald-600 text-white shadow-md border-emerald-400/30">
              <CheckCircle className="w-3 h-3 mr-1" />
              {isFree ? "Free" : "Owned"}
            </Badge>
          </div>
        )}
        {isPending && (
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-yellow-500 text-white shadow-sm">
              <Clock className="w-3 h-3 mr-1" />
              Pending
            </Badge>
          </div>
        )}

        {/* Free prompt image hover overlay */}
        {isFree && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="flex items-center justify-between gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleCopy}
                className="h-8 bg-white/20 hover:bg-white/30 backdrop-blur-md border-white/20 text-white rounded-full px-3 text-xs font-bold gap-1.5 pointer-events-auto"
              >
                {isCopied ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </Button>
              {prompt.creator?.username && (
                <span className="text-[10px] text-white/90 font-medium truncate italic">
                  by @{prompt.creator.username}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <CardContent className="p-4 flex-grow space-y-2">
        <h3 className="font-bold text-slate-800 text-lg line-clamp-1 group-hover:text-primary transition-colors">
          {prompt.title}
        </h3>
        <div className="relative">
          {prompt.hasAccess && prompt.decryptedContent ? (
            <div className="text-sm p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-600 line-clamp-3 italic font-medium leading-relaxed">
              "{prompt.decryptedContent}"
            </div>
          ) : (
            <p className={`text-sm text-slate-500 leading-relaxed ${isFree ? 'line-clamp-4' : 'line-clamp-2'}`}>
              {prompt.description}
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        {isPurchased ? (
          <Link href={`/prompts/${prompt.id}/full`} className="w-full">
            <Button className="w-full bg-slate-900 hover:bg-black text-white rounded-xl h-11 font-bold shadow-lg shadow-slate-200 transition-all active:scale-95 gap-2">
              <Eye className="w-4 h-4" />
              View Full Prompt
            </Button>
          </Link>
        ) : isFree ? (
          <div className="w-full space-y-4">
            {/* Free prompt — fill the space the price grid occupies on paid cards */}
            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-100/60">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-black text-emerald-700 leading-none">Free Access</p>
                <p className="text-[10px] text-emerald-600/70 font-medium mt-0.5">No purchase needed · Copy anytime</p>
              </div>
            </div>

            <div className="w-full flex items-center justify-between gap-3">
              <Button
                onClick={handleCopy}
                className="flex-1 h-11 bg-slate-900 hover:bg-black text-white rounded-xl font-bold shadow-md transition-all active:scale-95 gap-2 text-sm"
              >
                {isCopied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
              {prompt.creator?.username && (
                <span className="text-xs text-slate-400 italic truncate max-w-[35%] text-right">
                  by @{prompt.creator.username}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full space-y-4">
            {/* Price tags in a grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center p-2.5 bg-amber-50 rounded-xl border border-amber-100/50">
                <div className="flex items-center gap-1 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-black text-amber-700">{prompt.priceStars}</span>
                </div>
                <span className="text-[10px] uppercase tracking-tighter font-bold text-amber-600/70">Stars ⭐</span>
              </div>

              {prompt.priceTon > 0 && (
                <div className="flex flex-col items-center p-2.5 bg-blue-50 rounded-xl border border-blue-100/50">
                  <div className="flex items-center gap-1 mb-1">
                    <Zap className="w-3.5 h-3.5 text-blue-500" />
                    <span className="font-black text-blue-700">{prompt.priceTon}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-tighter font-bold text-blue-600/70">TON ⚡</span>
                </div>
              )}

              {prompt.priceLocal > 0 && (
                <div className="flex flex-col items-center p-2.5 bg-emerald-50 rounded-xl border border-emerald-100/50">
                  <div className="flex items-center gap-1 mb-1">
                    <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="font-black text-emerald-700">{prompt.priceLocal}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-tighter font-bold text-emerald-600/70">ETB 🇪🇹</span>
                </div>
              )}
            </div>

            {/* Purchase button */}
            <Link href={`/prompts/${prompt.id}`} className="w-full">
              <Button className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-xl shadow-xl shadow-primary/20 transition-all active:scale-95 group/btn">
                Purchase
                <Zap className="w-4 h-4 ml-2 fill-current group-hover/btn:animate-pulse" />
              </Button>
            </Link>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
