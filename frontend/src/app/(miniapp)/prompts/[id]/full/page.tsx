// app/(miniapp)/prompts/[id]/full/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Lock, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function FullPromptPage() {
  const params = useParams();
  const router = useRouter();
  const promptId = params.id as string;

  const [prompt, setPrompt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<string | null>(null);

  useEffect(() => {
    checkAccess();
    loadPrompt();
  }, [promptId]);

  const checkAccess = async () => {
    try {
      const response = await api.get(`/payments/check-access/${promptId}`);
      const data = response.data;

      setHasAccess(data.hasAccess);
      setPurchaseStatus(data.purchaseStatus || null);

      if (!data.hasAccess && data.canPurchase) {
        router.push(`/prompts/${promptId}`);
      }
    } catch (error: any) {
      console.error("Access check error:", error);
      toast.error("Failed to check access");
      router.push(`/prompts/${promptId}`);
    }
  };

  const loadPrompt = async () => {
    try {
      const [previewRes, fullRes] = await Promise.all([
        api.get(`/prompts/${promptId}`),
        api.get(`/prompts/${promptId}/full`),
      ]);

      setPrompt({
        ...previewRes.data.data,
        fullContent: fullRes.data.data.content,
      });
    } catch (err) {
      toast.error("Failed to load full prompt");
      router.push(`/prompts/${promptId}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!prompt) return null;

  if (!hasAccess) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>

            <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>

            {purchaseStatus === "PENDING_VERIFICATION" ? (
              <>
                <div className="flex items-center gap-2 justify-center text-yellow-600 dark:text-yellow-400 mb-4">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">
                    Payment Pending Verification
                  </span>
                </div>
                <p className="text-muted-foreground mb-6">
                  Your payment is being verified by our team. This usually takes
                  1-24 hours. You'll get access automatically once verified.
                </p>
                <div className="space-y-3">
                  <Button onClick={() => router.push(`/prompts/${promptId}`)}>
                    View Prompt Details
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/my-prompts")}
                  >
                    Check My Purchases
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-muted-foreground mb-6">
                  You need to purchase this prompt to access the full content.
                </p>
                <div className="space-y-3">
                  <Button onClick={() => router.push(`/prompts/${promptId}`)}>
                    Purchase Prompt
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/")}>
                    Browse More Prompts
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link href={`/prompts/${promptId}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Preview
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Access Badge */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">{prompt.title}</h1>
              <p className="text-muted-foreground">{prompt.description}</p>
            </div>
            <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-2 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">You have access</span>
            </div>
          </div>

          {/* Full Content */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Full Prompt Content</h2>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border">
              <pre className="text-foreground whitespace-pre-wrap leading-relaxed font-sans">
                {prompt.fullContent}
              </pre>
            </div>
          </div>

          {/* Example Output if exists */}
          {prompt.exampleOutput && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Example Output</h2>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                <pre className="text-foreground whitespace-pre-wrap leading-relaxed font-sans">
                  {JSON.stringify(prompt.exampleOutput, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Tips for Use */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">How to Use This Prompt</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h3 className="font-medium mb-2">💡 Best Practices</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Copy the entire prompt</li>
                  <li>• Paste into your AI tool</li>
                  <li>• Adjust variables as needed</li>
                  <li>• Experiment with different inputs</li>
                </ul>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h3 className="font-medium mb-2">🚀 Pro Tips</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Save for future use</li>
                  <li>• Share with your team</li>
                  <li>• Modify for different use cases</li>
                  <li>• Combine with other prompts</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={() => {
                navigator.clipboard.writeText(prompt.fullContent);
                toast.success("Prompt copied to clipboard!");
              }}
              className="flex-1"
            >
              Copy
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/my-prompts")}
              className="flex-1"
            >
              My Prompts
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
