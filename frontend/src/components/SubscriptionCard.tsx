"use client";

import { Check, Sparkles, Zap, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SubscriptionCardProps {
  name: string;
  price: number;
  period?: string;
  features: string[];
  credits: Record<string, number>;
  isPopular?: boolean;
  color: "starter" | "pro" | "ultimate";
  onSelect: () => void;
  isLoading?: boolean;
}

const colorStyles = {
  starter: {
    border: "border-teal-200",
    bg: "bg-teal-50/50",
    text: "text-teal-700",
    button: "bg-teal-600 hover:bg-teal-700",
    icon: <Zap className="h-5 w-5 text-teal-600" />,
    gradient: "from-teal-600 to-emerald-600",
  },
  pro: {
    border: "border-amber-200",
    bg: "bg-amber-50/50",
    text: "text-amber-700",
    button: "bg-amber-600 hover:bg-amber-700",
    icon: <Sparkles className="h-5 w-5 text-amber-600" />,
    gradient: "from-amber-600 to-orange-600",
  },
  ultimate: {
    border: "border-purple-200",
    bg: "bg-purple-50/50",
    text: "text-purple-700",
    button: "bg-purple-600 hover:bg-purple-700",
    icon: <Trophy className="h-5 w-5 text-purple-600" />,
    gradient: "from-purple-600 to-indigo-600",
  },
};

export function SubscriptionCard({
  name,
  price,
  period = "mo",
  features,
  credits,
  isPopular,
  color,
  onSelect,
  isLoading,
}: SubscriptionCardProps) {
  const styles = colorStyles[color];

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white/80 backdrop-blur-sm",
        styles.border,
        isPopular && "ring-2 ring-amber-400 ring-offset-2"
      )}
    >
      {isPopular && (
        <div className="absolute top-0 right-0">
          <div className="bg-amber-400 text-amber-950 text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider shadow-sm">
            Best Value
          </div>
        </div>
      )}

      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 mb-2">
          {styles.icon}
          <p className={cn("text-xs font-bold uppercase tracking-widest", styles.text)}>
            {name}
          </p>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold tracking-tight">{price} ETB</span>
          {price > 0 && price !== 10 && (
            <span className="text-muted-foreground text-sm">/{period}</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Credits Breakdown */}
        <div className={cn("p-3 rounded-xl border border-dashed", styles.border, styles.bg)}>
          <p className="text-[10px] font-bold uppercase mb-2 opacity-70">Monthly Credits</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(credits).map(([category, count]) => (
              <div key={category} className="flex items-center gap-1.5">
                <div className={cn("w-1.5 h-1.5 rounded-full", styles.button.split(' ')[0])} />
                <span className="text-xs font-semibold">
                  {count} {category}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Features List */}
        <div className="space-y-2.5">
          {features.map((feature, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="mt-1 bg-green-100 rounded-full p-0.5">
                <Check className="h-3 w-3 text-green-600" />
              </div>
              <span className="text-sm text-slate-600">{feature}</span>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={onSelect}
          disabled={isLoading}
          className={cn(
            "w-full h-11 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95",
            styles.button
          )}
        >
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span className="flex items-center gap-2 group">
              Choose {name} Plan
              <Zap className="h-4 w-4 fill-white animate-pulse" />
            </span>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
