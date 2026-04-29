// app/(miniapp)/prompts/[id]/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import {
  Star,
  Zap,
  Wallet,
  ArrowLeft,
  Image as ImageIcon,
  CheckCircle,
  Eye,
} from "lucide-react";
import { getImageUrl } from "@/lib/image-utils";
import { useAuthStore } from "@/store/useAuthStore";

export default function PromptDetail({ params }: { params: { id: string } }) {
  const { user } = useAuthStore();
  const promptId = params.id;

  /* =====================
     PROMPT PREVIEW DATA
  ===================== */
  const { data: prompt, isLoading } = useQuery({
    queryKey: ["prompt", promptId],
    queryFn: () => api.get(`/prompts/${promptId}`).then((res) => res.data.data),
  });

  /* =====================
     ACCESS CHECK (AUTHORITATIVE)
  ===================== */
  const { data: access } = useQuery({
    queryKey: ["prompt-access", promptId, user?.id],
    queryFn: () =>
      api.get(`/payments/check-access/${promptId}`).then((res) => res.data),
    enabled: !!user,
  });

  if (isLoading) {
    return <p className="text-center py-10">Loading prompt...</p>;
  }

  if (!prompt) {
    return <p className="text-center py-10">Prompt not found</p>;
  }

  const imageSrc = getImageUrl(prompt.imageUrl);
  const hasAccess = access?.hasAccess === true;

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link href="/" scroll={false}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        {/* Image */}
        <div className="relative">
          {imageSrc ? (
            <div className="relative h-64 overflow-hidden">
              <img
                src={imageSrc}
                alt={prompt.imageAlt || prompt.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          ) : (
            <div className="h-48 bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white">
              <ImageIcon className="w-12 h-12 opacity-50" />
            </div>
          )}

          {/* Title Overlay */}
          <div className="absolute bottom-0 p-6 text-white">
            <h1 className="text-3xl font-bold">{prompt.title}</h1>
            <p className="opacity-90 mt-1">{prompt.description}</p>

            {hasAccess && (
              <div className="mt-3 inline-flex items-center gap-2 bg-green-500 px-3 py-1 rounded-full text-sm">
                <CheckCircle className="w-4 h-4" />
                Owned
              </div>
            )}
          </div>
        </div>

        <CardContent className="space-y-8 pt-6">
          {/* Preview */}
          <div>
            <h2 className="text-xl font-semibold mb-3">Preview</h2>
            <div className="bg-muted/30 border rounded-lg p-5 whitespace-pre-wrap">
              {prompt.previewContent}
            </div>
          </div>

          {/* =====================
             ACCESS-BASED UI
          ===================== */}
          {hasAccess ? (
            <div className="text-center">
              <Link href={`/prompts/${prompt.id}/full`}>
                <Button className="gap-2">
                  <Eye className="w-4 h-4" />
                  View Full Prompt
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold">Choose Payment Method</h2>

              <div className="grid gap-3">
                {/* Telegram Stars */}
                <Link href={`/purchase/${prompt.id}?method=TELEGRAM_STARS`}>
                  <Button className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Telegram Stars
                    </span>
                    <span>{prompt.priceStars} ⭐</span>
                  </Button>
                </Link>

                {/* TON */}
                {prompt.priceTon > 0 && (
                  <Link href={`/purchase/${prompt.id}?method=TON`}>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        TON Blockchain
                      </span>
                      <span>{prompt.priceTon} TON</span>
                    </Button>
                  </Link>
                )}

                {/* LOCAL BIRR */}
                {prompt.priceLocal > 0 && (
                  <Link href={`/purchase/${prompt.id}?method=LOCAL_BIRR`}>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        Ethiopian Birr
                      </span>
                      <span>{prompt.priceLocal} ETB</span>
                    </Button>
                  </Link>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
