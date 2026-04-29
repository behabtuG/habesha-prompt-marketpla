// app/(miniapp)/purchase/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { useTelegramInit } from "@/lib/telegram";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Star,
  CheckCircle,
  ArrowLeft,
  ExternalLink,
  Copy,
  Zap,
  Wallet,
  AlertCircle,
  Shield,
  Clock,
  Lock,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { getImageUrl } from "@/lib/image-utils";

// Define payment methods
const PAYMENT_METHODS = {
  TELEGRAM_STARS: "TELEGRAM_STARS",
  TON: "TON",
  LOCAL_BIRR: "LOCAL_BIRR",
} as const;

type PaymentMethod = keyof typeof PAYMENT_METHODS;

export default function PurchasePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const method =
    (searchParams.get("method") as PaymentMethod) || "TELEGRAM_STARS";
  const promptId = params.id as string;

  const { webApp, user: telegramUser } = useTelegramInit();

  const [prompt, setPrompt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<
    "init" | "processing" | "redirect"
  >("init");
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [statusPolling, setStatusPolling] = useState<NodeJS.Timeout | null>(
    null
  );

  useEffect(() => {
    loadPrompt();

    // Clean up polling on unmount
    return () => {
      if (statusPolling) {
        clearInterval(statusPolling);
      }
    };
  }, [promptId]);

  const loadPrompt = async () => {
    try {
      const res = await api.get(`/prompts/${promptId}`);
      setPrompt(res.data.data);
    } catch (err: any) {
      toast.error("Failed to load prompt");
      router.push("/prompts");
    } finally {
      setLoading(false);
    }
  };

  const startStatusPolling = (purchaseId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/payments/status/${purchaseId}`);
        const status = response.data.data.status;

        if (status === "COMPLETED") {
          clearInterval(interval);
          setStatusPolling(null);
          toast.success("Payment confirmed!");
          router.push(`/prompts/${promptId}/full`);
        } else if (status === "FAILED" || status === "REFUNDED") {
          clearInterval(interval);
          setStatusPolling(null);
          toast.error("Payment failed");
          setPurchasing(false);
          setPaymentStep("init");
        }
        // If still PENDING, continue polling
      } catch (error) {
        console.error("Status polling error:", error);
      }
    }, 5000); // Poll every 5 seconds

    setStatusPolling(interval);
  };

  const handlePurchase = async () => {
    if (!method) {
      toast.error("Please select a payment method");
      return;
    }

    setPurchasing(true);
    setPaymentStep("processing");

    try {
      // 1. Initiate purchase with backend
      const initiation = await api.post("/payments/purchase", {
        promptId,
        paymentMethod: method,
      });

      const purchaseData = initiation.data.data;
      setPaymentInfo(purchaseData);

      // 2. Handle different payment methods
      switch (method) {
        case "TELEGRAM_STARS":
          if (!webApp) {
            throw new Error("Telegram WebApp not available");
          }

          const invoice = {
            title: prompt.title.substring(0, 32),
            description: prompt.description.substring(0, 128),
            payload: `stars_${purchaseData.purchaseId}`,
            provider_token: "", // Empty for Stars
            currency: "XTR",
            prices: [
              {
                label: "Prompt Access",
                amount: purchaseData.amount * 100, // Stars in cents
              },
            ],
          };

          webApp.openInvoice(invoice, async (status: string) => {
            if (status === "paid") {
              try {
                await api.post(`/payments/verify/${purchaseData.purchaseId}`, {
                  paymentId: `stars_${purchaseData.purchaseId}`,
                });
                toast.success("Payment successful!");
                router.push(`/prompts/${promptId}/full`);
              } catch (error: any) {
                toast.error("Verification failed: " + error.message);
              }
            } else if (status === "cancelled") {
              toast.info("Payment cancelled");
            } else {
              toast.error("Payment failed");
            }
            setPurchasing(false);
            setPaymentStep("init");
          });
          break;

        // case "TON":
        //   setPaymentStep("redirect");
        //   toast.info("Please complete payment in your TON wallet");

        //   // Start polling for payment confirmation
        //   startStatusPolling(purchaseData.purchaseId);
        //   break;
        // app/(miniapp)/purchase/[id]/page.tsx
        // Update the TON payment handling

        case "TON":
          setPaymentStep("redirect");
          toast.info("Please complete payment in your TON wallet");

          // Store payment info for later reference
          localStorage.setItem(
            `ton_payment_${purchaseData.purchaseId}`,
            JSON.stringify({
              purchaseId: purchaseData.purchaseId,
              walletAddress: purchaseData.walletAddress,
              amount: purchaseData.amount,
              comment: purchaseData.comment,
            })
          );

          // Start polling for payment confirmation
          const pollInterval = setInterval(async () => {
            try {
              const statusRes = await api.get(
                `/payments/ton/status/${purchaseData.purchaseId}`
              );

              if (statusRes.data.data.status === "COMPLETED") {
                clearInterval(pollInterval);
                toast.success("TON payment confirmed!");
                router.push(`/prompts/${promptId}/full`);
              }
            } catch (error) {
              console.error("TON status check error:", error);
            }
          }, 10000); // Check every 10 seconds

          // Auto-stop polling after 30 minutes
          setTimeout(() => {
            clearInterval(pollInterval);
            if (paymentStep === "redirect") {
              toast.info(
                "TON payment check timeout. You can check status in 'My Purchases'."
              );
              setPaymentStep("init");
              setPurchasing(false);
            }
          }, 30 * 60 * 1000); // 30 minutes

          setStatusPolling(pollInterval);
          break;

        // Replace the LOCAL_BIRR case in handlePurchase function:
        case "LOCAL_BIRR":
          setPaymentStep("redirect");
          toast.info("Setting up manual payment...");

          try {
            // 1. Initiate manual payment with backend
            const initiation = await api.post("/payments/local/initiate", {
              promptId,
            });

            const manualPaymentData = initiation.data.data;

            // 2. Store the purchase ID for the manual payment page
            localStorage.setItem(
              `manual_payment_${promptId}`,
              JSON.stringify({
                purchaseId: manualPaymentData.purchaseId,
                amount: manualPaymentData.amount,
                bankAccounts: manualPaymentData.bankAccounts,
                instructions: manualPaymentData.instructions,
              })
            );

            // 3. Redirect to manual payment page
            router.push(`/purchase/${promptId}/manual`);
          } catch (error: any) {
            toast.error(
              error.response?.data?.message || "Failed to setup manual payment"
            );
            setPurchasing(false);
            setPaymentStep("init");
          }
          break;
        default:
          throw new Error("Unsupported payment method");
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
      toast.error(
        error.response?.data?.message || error.message || "Purchase failed"
      );
      setPurchasing(false);
      setPaymentStep("init");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const getPriceDisplay = () => {
    if (!prompt) return null;

    switch (method) {
      case "TELEGRAM_STARS":
        return {
          value: prompt.priceStars,
          currency: "Stars",
          icon: Star,
          color: "text-yellow-600 dark:text-yellow-400",
          bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
        };
      case "TON":
        return {
          value: prompt.priceTon || 0,
          currency: "TON",
          icon: Zap,
          color: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-100 dark:bg-blue-900/30",
        };
      case "LOCAL_BIRR":
        return {
          value: prompt.priceLocal || 0,
          currency: "ETB",
          icon: Wallet,
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-100 dark:bg-green-900/30",
        };
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!prompt) return null;

  const priceDisplay = getPriceDisplay();
  const IconComponent = priceDisplay?.icon || Star;
  const imageSrc = getImageUrl(prompt.imageUrl);

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link href={`/prompts/${promptId}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Prompt
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Prompt Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl flex items-center gap-2">
                <div
                  className={`w-10 h-10 ${priceDisplay?.bgColor} rounded-lg flex items-center justify-center`}
                >
                  <IconComponent className={`w-5 h-5 ${priceDisplay?.color}`} />
                </div>
                Complete Purchase
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Prompt Card with Image */}
              <div className="flex flex-col md:flex-row gap-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                {imageSrc ? (
                  <div className="w-full md:w-40 h-40 flex-shrink-0 rounded-lg overflow-hidden">
                    <img
                      src={imageSrc}
                      alt={prompt.imageAlt || prompt.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full md:w-40 h-40 flex-shrink-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-white/70" />
                  </div>
                )}

                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{prompt.title}</h3>
                  <p className="text-muted-foreground mb-4">
                    {prompt.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                      {prompt.category.replace("_", "/")}
                    </span>
                    <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                      ⭐ {prompt.rating || "New"}
                    </span>
                    <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm">
                      {prompt.purchaseCount || 0} purchases
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className={`w-10 h-10 ${priceDisplay?.bgColor} rounded-lg flex items-center justify-center`}
                    >
                      <IconComponent
                        className={`w-5 h-5 ${priceDisplay?.color}`}
                      />
                    </div>
                    <div>
                      <div className="text-3xl font-bold">
                        {priceDisplay?.value}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {priceDisplay?.currency}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Instructions for TON */}
              {paymentStep === "redirect" &&
                method === "TON" &&
                paymentInfo && (
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-blue-500" />
                      <h4 className="font-semibold">
                        TON Payment Instructions
                      </h4>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Send <strong>{paymentInfo.amount} TON</strong> to the
                      address below:
                    </p>

                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">
                          Wallet Address:
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            copyToClipboard(paymentInfo.walletAddress)
                          }
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <code className="text-xs break-all font-mono">
                        {paymentInfo.walletAddress}
                      </code>

                      <div className="mt-3 pt-3 border-t">
                        <div className="text-sm font-medium mb-1">
                          Payment Details:
                        </div>
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between">
                            <span>Comment/Memo:</span>
                            <span className="font-mono">
                              {paymentInfo.comment}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Required Amount:</span>
                            <span className="font-semibold">
                              {paymentInfo.amount} TON
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          window.open(
                            `ton://transfer/${paymentInfo.walletAddress}`,
                            "_blank"
                          )
                        }
                        className="flex-1"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open TON Wallet
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(paymentInfo.walletAddress)
                        }
                        className="flex-1"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Address
                      </Button>
                    </div>
                  </div>
                )}

              {/* Main Action Button */}
              <Button
                size="lg"
                className="w-full h-14 text-lg"
                onClick={handlePurchase}
                disabled={purchasing || paymentStep === "redirect"}
              >
                {purchasing ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : paymentStep === "redirect" ? (
                  <>
                    <CheckCircle className="mr-3 h-5 w-5" />
                    Awaiting Payment Confirmation...
                  </>
                ) : method === "TELEGRAM_STARS" ? (
                  <>
                    <Star className="mr-3 h-5 w-5" />
                    Pay {priceDisplay?.value} Telegram Stars
                  </>
                ) : method === "TON" ? (
                  <>
                    <Zap className="mr-3 h-5 w-5" />
                    Pay {priceDisplay?.value} TON
                  </>
                ) : (
                  <>
                    <Wallet className="mr-3 h-5 w-5" />
                    Pay {priceDisplay?.value} ETB
                  </>
                )}
              </Button>

              {/* Alternative Methods */}
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Other payment methods:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Link href={`/purchase/${promptId}?method=TELEGRAM_STARS`}>
                    <Button
                      variant={
                        method === "TELEGRAM_STARS" ? "default" : "outline"
                      }
                      className="w-full justify-start"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      <div className="text-left">
                        <div className="font-medium">Telegram Stars</div>
                        <div className="text-xs text-muted-foreground">
                          {prompt.priceStars} Stars
                        </div>
                      </div>
                    </Button>
                  </Link>

                  {prompt.priceTon && prompt.priceTon > 0 && (
                    <Link href={`/purchase/${promptId}?method=TON`}>
                      <Button
                        variant={method === "TON" ? "default" : "outline"}
                        className="w-full justify-start"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        <div className="text-left">
                          <div className="font-medium">TON</div>
                          <div className="text-xs text-muted-foreground">
                            {prompt.priceTon} TON
                          </div>
                        </div>
                      </Button>
                    </Link>
                  )}

                  {prompt.priceLocal && prompt.priceLocal > 0 && (
                    <Link href={`/purchase/${promptId}?method=LOCAL_BIRR`}>
                      <Button
                        variant={
                          method === "LOCAL_BIRR" ? "default" : "outline"
                        }
                        className="w-full justify-start"
                      >
                        <Wallet className="w-4 h-4 mr-2" />
                        <div className="text-left">
                          <div className="font-medium">Local Birr</div>
                          <div className="text-xs text-muted-foreground">
                            {prompt.priceLocal} ETB
                          </div>
                        </div>
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Features & Info */}
        <div className="space-y-6">
          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Why Choose Us</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium">Secure Payments</h4>
                  <p className="text-sm text-muted-foreground">
                    Encrypted transactions with bank-level security
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium">Instant Access</h4>
                  <p className="text-sm text-muted-foreground">
                    Get prompt immediately after payment
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-medium">Lifetime Access</h4>
                  <p className="text-sm text-muted-foreground">
                    Keep the prompt forever in your library
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`p-3 rounded-lg ${priceDisplay?.bgColor} flex items-center gap-3`}
              >
                <IconComponent className={`w-6 h-6 ${priceDisplay?.color}`} />
                <div>
                  <div className="font-medium">
                    {method === "TELEGRAM_STARS" && "Telegram Stars"}
                    {method === "TON" && "TON Blockchain"}
                    {method === "LOCAL_BIRR" && "Local Birr (ETB)"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {method === "TELEGRAM_STARS" &&
                      "Built-in Telegram payment system"}
                    {method === "TON" && "Fast crypto transactions"}
                    {method === "LOCAL_BIRR" && "Secure local payment gateway"}
                  </div>
                </div>
              </div>

              <div className="mt-4 text-sm text-muted-foreground space-y-2">
                {method === "TON" && (
                  <>
                    <p>• TON payments may take 1-2 minutes to confirm</p>
                    <p>• Ensure you send exact amount with correct memo</p>
                  </>
                )}
                {method === "LOCAL_BIRR" && (
                  <>
                    <p>• Payments processed through Chapa secure gateway</p>
                    <p>• May require additional verification steps</p>
                  </>
                )}
                {method === "TELEGRAM_STARS" && (
                  <>
                    <p>• Instant payment processing within Telegram</p>
                    <p>• No additional fees or verification needed</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Security Guarantee */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-bold text-green-700 dark:text-green-300 mb-2">
                100% Secure Purchase
              </h3>
              <p className="text-sm text-green-600 dark:text-green-400">
                Your payment is encrypted and protected. If you encounter any
                issues, contact our support team for immediate assistance.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
