// telegram-bot/src/config.ts
import dotenv from "dotenv";

// Load environment variables FIRST
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = process.env.WEB_APP_URL;
const botUsername = process.env.TELEGRAM_BOT_USERNAME;

// Validation
if (!token) {
  console.error("❌ TELEGRAM_BOT_TOKEN is required");
  process.exit(1);
}

export const BOT_CONFIG = {
  token,
  webAppUrl,
  botUsername: botUsername || "your_bot_username",
};

// Optional: Log config for debugging
console.log("🤖 Bot Config Loaded:");
console.log(` Token: ${token?.slice(0, 10)}...`);
console.log(` Web App URL: ${BOT_CONFIG.webAppUrl}`);
console.log(` Username: ${botUsername || "Not set"}`);
