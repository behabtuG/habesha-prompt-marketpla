// telegram-bot/src/index.ts
import { Telegraf, Markup } from "telegraf";
import { BOT_CONFIG } from "./config";
import { UrlUtils } from "./utils/urlUtils";

// Initialize bot
const bot = new Telegraf(BOT_CONFIG.token);

// Bot internal secret (must match backend BOT_INTERNAL_SECRET env var)
const BOT_SECRET = process.env.BOT_INTERNAL_SECRET || "";
const API_URL = process.env.BACKEND_API_URL;

// Set bot commands
try {
  bot.telegram.setMyCommands([
    { command: "start", description: "Start bot" },
    { command: "prompts", description: "Browse prompts" },
    { command: "myprompts", description: "View my purchased prompts" },
    { command: "balance", description: "Check my balance" },
    { command: "help", description: "Get help" },
  ]);
} catch (error) {
  console.warn("⚠️ Could not set bot commands:", error);
}

// ─── Helper: Web App button ────────────────────────────────────────────────
function createWebAppButton(
  text: string,
  path: string = "",
  params: Record<string, string> = {}
) {
  if (UrlUtils.canUseWebAppButtons()) {
    return Markup.button.webApp(text, UrlUtils.getWebAppUrl(path, params));
  }
  return Markup.button.url(text, UrlUtils.getWebAppUrl(path, params));
}

// ─── Helper: call backend link endpoint ───────────────────────────────────
async function notifyBackendLink(linkToken: string, telegramUser: any) {
  try {
    const response = await fetch(`${API_URL}/api/auth/link/bot-callback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bot-secret": BOT_SECRET,
      },
      body: JSON.stringify({ linkToken, telegramUser }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("❌ Backend link callback failed:", err);
      return false;
    }
    return true;
  } catch (error) {
    console.error("❌ fetch to backend failed:", error);
    return false;
  }
}

// ══════════════════════════════════════════════════════════════════════════
// /start — handles both normal start AND deep-link linking
// ══════════════════════════════════════════════════════════════════════════
bot.start(async (ctx) => {
  const startParam: string = (ctx as any).startPayload || "";

  // ── Account linking flow: /start link_<token> ──────────────────────────
  if (startParam.startsWith("link_")) {
    const linkToken = startParam.replace("link_", "");
    const tgUser = ctx.from;

    await ctx.reply("⏳ Linking your Telegram account to your web account...");

    const success = await notifyBackendLink(linkToken, {
      id: tgUser.id,
      first_name: tgUser.first_name,
      last_name: tgUser.last_name,
      username: tgUser.username,
      language_code: tgUser.language_code,
    });

    if (success) {
      await ctx.replyWithMarkdown(
        `✅ *Account linked successfully!*\n\n` +
        `Your Telegram account has been connected to your web account.\n` +
        `You can now use your balance and purchases across both platforms.`,
        Markup.inlineKeyboard([
          [createWebAppButton("🚀 Open Marketplace", "")],
        ])
      );
    } else {
      await ctx.replyWithMarkdown(
        `❌ *Linking failed.*\n\n` +
        `The link token may be invalid or already used.\n` +
        `Please generate a new link from your web profile settings.`
      );
    }
    return;
  }

  // ── Normal /start ──────────────────────────────────────────────────────
  if (!UrlUtils.canUseWebAppButtons()) {
    await ctx.replyWithMarkdown(
      `🔧 *Development Notice*\n\nWEB_APP_URL is HTTP or missing: \`${BOT_CONFIG.webAppUrl}\`\n\nUse ngrok for local testing: \`ngrok http 3000\``
    );
    return;
  }

  const welcomeMessage =
    `🎉 Welcome to *Prompt Marketplace*!\n\n` +
    `Discover and purchase amazing AI prompts.\n\n` +
    `Use the menu below to get started:`;

  const keyboard = Markup.inlineKeyboard([
    [createWebAppButton("✨ Open Marketplace", "", { startapp: "true" })],
    [
      Markup.button.callback("📚 Browse Prompts", "browse_prompts"),
      Markup.button.callback("📖 My Prompts", "my_prompts"),
    ],
    [
      Markup.button.callback("💰 My Balance", "check_balance"),
      Markup.button.callback("ℹ️ Help", "show_help"),
    ],
  ]);

  await ctx.replyWithMarkdown(welcomeMessage, keyboard);
});

// ─── /help ─────────────────────────────────────────────────────────────────
bot.help((ctx) => {
  ctx.replyWithMarkdown(`
*🤖 Bot Commands:*
/start - Start bot
/prompts - Browse available prompts
/myprompts - View your purchased prompts
/balance - Check your Stars balance
/help - Show this help message

*💡 How to use:*
1. Use /start to open the main menu
2. Click "Open Marketplace" to launch the web app
3. Browse prompts and purchase with Telegram Stars
4. Access purchased prompts anytime in "My Prompts"

*🔗 Connect your web account:*
Go to your web profile → Settings → Connect Telegram
Then click the link and come back here.

*❓ Need support?*
Contact @your_support_username
  `);
});

// ─── /prompts ──────────────────────────────────────────────────────────────
bot.command("prompts", async (ctx) => {
  await ctx.replyWithMarkdown(
    "*📚 Available Prompt Categories:*\n\n• UI/UX Design\n• Code Generation\n• Image Prompts\n• Writing Assistants\n• Business Tools\n\nClick below to open marketplace:",
    Markup.inlineKeyboard([[createWebAppButton("✨ Open Marketplace", "prompts")]])
  );
});

// ─── /myprompts ────────────────────────────────────────────────────────────
bot.command("myprompts", async (ctx) => {
  await ctx.reply(
    "Opening your purchased prompts...",
    Markup.inlineKeyboard([[createWebAppButton("📖 My Prompts", "my-prompts")]])
  );
});

// ─── /balance ──────────────────────────────────────────────────────────────
bot.command("balance", async (ctx) => {
  await ctx.reply(
    "Loading your balance...",
    Markup.inlineKeyboard([[createWebAppButton("💰 Check Balance", "profile")]])
  );
});

// ─── web_app_data ──────────────────────────────────────────────────────────
bot.on("web_app_data", async (ctx) => {
  try {
    const webAppData = (ctx.update as any).web_app_data;
    if (webAppData?.data) {
      const parsedData = JSON.parse(webAppData.data);
      switch (parsedData.action) {
        case "purchase_success":
          await ctx.reply(
            `✅ Purchase successful!\n\nPrompt: ${parsedData.promptTitle}\nPrice: ${parsedData.amount} Stars\n\nAccess it anytime in "My Prompts".`
          );
          break;
        case "payment_failed":
          await ctx.reply(`❌ Payment failed: ${parsedData.reason}\n\nPlease try again or contact support.`);
          break;
      }
    }
  } catch (error) {
    console.error("Error parsing web app data:", error);
  }
});

// ─── Callback queries ──────────────────────────────────────────────────────
bot.on("callback_query", async (ctx) => {
  const callbackQuery = ctx.callbackQuery;
  try { await ctx.answerCbQuery(); } catch (_) {}

  if (!callbackQuery || !("data" in callbackQuery)) return;

  try {
    switch (callbackQuery.data) {
      case "browse_prompts":
        await ctx.replyWithMarkdown(
          "*📚 Available Prompt Categories:*\n\n• UI/UX Design\n• Code Generation\n• Image Prompts\n• Writing Assistants\n• Business Tools",
          Markup.inlineKeyboard([[createWebAppButton("✨ Open Marketplace", "prompts")]])
        );
        break;
      case "my_prompts":
        await ctx.reply(
          "Opening your purchased prompts...",
          Markup.inlineKeyboard([[createWebAppButton("📖 My Prompts", "my-prompts")]])
        );
        break;
      case "check_balance":
        await ctx.reply(
          "Loading your balance...",
          Markup.inlineKeyboard([[createWebAppButton("💰 Check Balance", "profile")]])
        );
        break;
      case "show_help":
        await ctx.replyWithMarkdown(
          `*Need help?*\n\nContact our support team: @your_support_username\n\nOr visit our FAQ in the web app.`,
          Markup.inlineKeyboard([[createWebAppButton("📖 Open Help", "help")]])
        );
        break;
    }
  } catch (error) {
    console.error("Callback handler error:", error);
  }
});

// ─── Error handling ────────────────────────────────────────────────────────
bot.catch((err: any, ctx: any) => {
  console.error(`Error for ${ctx.updateType}:`, err);
  try { ctx.reply("❌ An error occurred. Please try again later."); } catch (_) {}
});

// ─── Launch ────────────────────────────────────────────────────────────────
bot.launch().then(() => {
  console.log("🤖 Telegram Bot is running...");
  console.log(`🌐 Web App URL: ${BOT_CONFIG.webAppUrl}`);
  console.log(`🔗 Backend API: ${API_URL}`);
  console.log(`🔒 HTTPS Ready: ${UrlUtils.canUseWebAppButtons() ? "✅" : "❌ Use ngrok"}`);
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

export default bot;
