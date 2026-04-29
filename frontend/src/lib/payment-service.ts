// // lib/payment-service.ts
// "use client";

// import api from "@/lib/api";

// export enum PaymentMethod {
//   TELEGRAM_STARS = "TELEGRAM_STARS",
//   TON = "TON",
//   LOCAL_BIRR = "LOCAL_BIRR",
// }

// export interface PaymentInitiationResponse {
//   success: boolean;
//   data: {
//     purchaseId: string;
//     prompt: {
//       id: string;
//       title: string;
//       description: string;
//       price: number;
//       currency: string;
//     };
//     paymentMethod: PaymentMethod;
//     nextStep: PaymentNextStep;
//   };
// }

// export interface PaymentNextStep {
//   type: string;
//   instructions?: string;
//   deepLink?: string;
//   walletAddress?: string;
//   paymentUrl?: string;
//   invoiceData?: any;
//   comment?: string;
//   amount?: number;
// }

// // Singleton pattern implementation
// class PaymentService {
//   private static instance: PaymentService;

//   // Static method to get instance
//   public static getInstance(): PaymentService {
//     if (!PaymentService.instance) {
//       PaymentService.instance = new PaymentService();
//     }
//     return PaymentService.instance;
//   }

//   // Private constructor to prevent direct instantiation
//   private constructor() {}

//   async initiatePurchase(
//     promptId: string,
//     method: PaymentMethod
//   ): Promise<PaymentInitiationResponse> {
//     try {
//       const response = await api.post("/payments/purchase", {
//         promptId,
//         paymentMethod: method,
//       });

//       return response.data;
//     } catch (error: any) {
//       console.error("Payment initiation failed:", error);
//       throw new Error(
//         error.response?.data?.message || "Failed to initiate payment"
//       );
//     }
//   }

//   async handleTelegramStarsPayment(
//     purchaseId: string,
//     prompt: any,
//     webApp: any
//   ): Promise<boolean> {
//     return new Promise((resolve, reject) => {
//       try {
//         // Telegram Stars invoice structure
//         const invoice = {
//           title: prompt.title.substring(0, 32),
//           description: prompt.description.substring(0, 128),
//           payload: `stars_${purchaseId}`,
//           provider_token: "", // Empty for Stars
//           currency: "XTR", // Telegram Stars currency code
//           prices: [
//             {
//               label: "Prompt Access",
//               amount: prompt.price * 100, // Stars in cents
//             },
//           ],
//         };

//         webApp.openInvoice(invoice, async (status: string) => {
//           if (status === "paid") {
//             try {
//               await this.verifyPayment(purchaseId, `stars_${purchaseId}`);
//               resolve(true);
//             } catch (error) {
//               reject(error);
//             }
//           } else if (status === "cancelled") {
//             reject(new Error("Payment cancelled by user"));
//           } else {
//             reject(new Error("Payment failed"));
//           }
//         });
//       } catch (error) {
//         reject(error);
//       }
//     });
//   }

//   async handleTonPayment(
//     purchaseId: string,
//     amount: number,
//     walletAddress: string,
//     comment: string
//   ): Promise<string> {
//     // Generate TON payment link
//     const tonAmount = amount * 1_000_000_000; // Convert to nanotons

//     // Using TonConnect or direct TON payment link
//     const paymentLink = `ton://transfer/${walletAddress}?amount=${tonAmount}&text=${encodeURIComponent(
//       comment
//     )}`;

//     return paymentLink;
//   }

//   async handleLocalBirrPayment(paymentUrl: string): Promise<void> {
//     // Open payment gateway in new window
//     window.open(paymentUrl, "_blank");
//   }

//   async verifyPayment(purchaseId: string, paymentId: string): Promise<any> {
//     const response = await api.post(`/payments/verify/${purchaseId}`, {
//       paymentId,
//     });
//     return response.data;
//   }

//   async checkPaymentStatus(purchaseId: string): Promise<string> {
//     const response = await api.get(`/payments/status/${purchaseId}`);
//     return response.data.data.status;
//   }

//   // Helper method to format currency
//   formatCurrency(amount: number, currency: string): string {
//     const formatter = new Intl.NumberFormat("en-US", {
//       style: "currency",
//       currency: currency === "ETB" ? "ETB" : currency,
//       minimumFractionDigits: currency === "TON" ? 4 : 0,
//     });

//     return formatter.format(amount);
//   }
// }

// // Export both the class and a default instance
// export const paymentService = PaymentService.getInstance();
// export default PaymentService;
