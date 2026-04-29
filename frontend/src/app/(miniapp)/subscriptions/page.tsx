"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

const PLANS = [
  {
    id: "STARTER",
    name: "Starter Pack",
    price: 10,
    color: "starter" as const,
    credits: {
      Images: 5,
      Writing: 2,
      Business: 1,
      Other: 1,
    },
    features: [
      "Basic priority support",
      "No watermarks on images",
      "Premium prompts included",
      "Monthly credits refresh",
    ],
  },
  {
    id: "PRO",
    name: "Professional",
    price: 50,
    isPopular: true,
    color: "pro" as const,
    credits: {
      Images: 10,
      "UI/UX": 5,
      Code: 3,
      Business: 3,
      Other: 2,
    },
    features: [
      "150 total credit equivalent",
      "17% savings per prompt",
      "Prioritized support",
      "No watermarks on video",
      "Monthly credits refresh",
    ],
  },
  {
    id: "ULTIMATE",
    name: "Ultimate",
    price: 100,
    color: "ultimate" as const,
    credits: {
      Images: 20,
      "UI/UX": 10,
      Code: 10,
      Business: 10,
      Writing: 10,
    },
    features: [
      "400+ prompt unlocks",
      "25% savings vs Starter",
      "VIP prioritized support",
      "Unlimited preview content",
      "Full premium access",
    ],
  },
];

export default function SubscriptionsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    try {
      setLoadingPlan(planId);
      
      // In a real app, this would redirect to a payment page or open a modal
      // For now, we'll simulate an initiation
      toast.info(`Initiating ${planId} plan selection...`);
      
      // Call the activate endpoint (simulated for now, usually would be a purchase flow)
      const response = await api.post("/subscriptions/activate", {
        tier: planId,
        days: 30
      });

      if (response.data.success) {
        toast.success(`${planId} plan activated successfully!`);
        // Refresh profile data or redirect
        setTimeout(() => {
          router.push("/");
          window.location.reload();
        }, 1500);
      }
    } catch (error: any) {
      console.error("Subscription failed:", error);
      toast.error(error.response?.data?.message || "Failed to activate subscription. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="text-center space-y-4 pt-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.back()}
          className="absolute left-4 top-24 sm:top-28 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
          <Sparkles className="h-3 w-3" />
          Flexible Pricing
        </div>
        
        <h1 className="text-4xl font-black tracking-tight text-slate-900">
          Unlock the Power of <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
            Premium Prompts
          </span>
        </h1>
        
        <p className="text-slate-500 max-w-lg mx-auto text-lg leading-relaxed">
          Choose a plan that fits your creative needs. Get more credits for 
          AI image generation, coding, and business writing.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-2">
        {PLANS.map((plan) => (
          <SubscriptionCard
            key={plan.id}
            name={plan.name}
            price={plan.price}
            color={plan.color}
            isPopular={plan.isPopular}
            credits={plan.credits as any}
            features={plan.features}
            onSelect={() => handleSelectPlan(plan.id)}
            isLoading={loadingPlan === plan.id}
          />
        ))}
      </div>

      {/* Trust Banner */}
      <div className="bg-slate-50 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-100">
            <ShieldCheck className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Secure Payments</h3>
            <p className="text-slate-500 text-sm">Processed locally with Ethiopian Birr (ETB)</p>
          </div>
        </div>
        
        <div className="flex gap-4 opacity-50 grayscale">
          <div className="font-black text-xl italic text-slate-400">CHAPA</div>
          <div className="font-black text-xl italic text-slate-400">TELEGRAM</div>
        </div>
      </div>
    </div>
  );
}
