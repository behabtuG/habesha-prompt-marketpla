// telegram-bot/payments.ts
import axios from "axios";

const API_BASE_URL = process.env.API_URL;

export const paymentHandlers = {
  // Handle Telegram Stars payment webhook
  async handleStarsPayment(update: any) {
    try {
      // Parse pre_checkout_query for Telegram Stars
      if (update.pre_checkout_query) {
        const { id, from, invoice_payload, total_amount } =
          update.pre_checkout_query;

        // Verify payment with your backend
        const response = await axios.post(
          `${API_BASE_URL}/payments/verify/stars`,
          {
            queryId: id,
            userId: from.id.toString(),
            payload: invoice_payload,
            amount: total_amount / 100, // Convert stars to whole number
          }
        );

        return response.data.success;
      }

      // Handle successful payment
      if (update.message?.successful_payment) {
        const { invoice_payload, total_amount } =
          update.message.successful_payment;

        // Update purchase status in your backend
        await axios.post(`${API_BASE_URL}/payments/complete`, {
          paymentId: invoice_payload,
          amount: total_amount / 100,
          status: "COMPLETED",
        });

        return true;
      }
    } catch (error) {
      console.error("Payment handling error:", error);
      return false;
    }
  },
};
