// telegram-bot/set-webhook.ts
import axios from "axios";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

if (!BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN is required");
}

if (!WEBHOOK_URL) {
  throw new Error("WEBHOOK_URL is required");
}

async function setWebhook() {
  try {
    console.log("🔧 Setting up Telegram webhook...");
    console.log(`📝 Bot Token: ${BOT_TOKEN?.slice(0, 10)}...`);
    console.log(`🌐 Webhook URL: ${WEBHOOK_URL}/webhooks/telegram/bot`);

    const response = await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
      {
        url: `${WEBHOOK_URL}/webhooks/telegram/bot`,
        allowed_updates: [
          "message",
          "callback_query",
          "pre_checkout_query",
          "web_app_data",
        ],
        drop_pending_updates: true,
      }
    );

    console.log("✅ Webhook set successfully:", response.data);
    console.log("📊 Webhook info:", response.data.result);
  } catch (error: any) {
    console.error(
      "❌ Failed to set webhook:",
      error.response?.data || error.message
    );
  }
}

setWebhook();
