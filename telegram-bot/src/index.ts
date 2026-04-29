// telegram-bot/src/index.ts - UPDATED WITH TYPE FIXES
import { Telegraf, Markup } from "telegraf";
import { BOT_CONFIG } from "./config";
import { UrlUtils } from "./utils/urlUtils";

// Initialize bot
const bot = new Telegraf(BOT_CONFIG.token);

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
  console.warn("⚠️ Could not set bot commands, continuing anyway:", error);
}

// Helper function to create Web App buttons safely
function createWebAppButton(
  text: string,
  path: string = "",
  params: Record<string, string> = {}
) {
  if (UrlUtils.canUseWebAppButtons()) {
    return Markup.button.webApp(text, UrlUtils.getWebAppUrl(path, params));
  } else {
    // Fallback to URL button or callback in development
    return Markup.button.url(text, UrlUtils.getWebAppUrl(path, params));
  }
}

// Start command
bot.start((ctx) => {
  const welcomeMessage = `🎉 Welcome to *Prompt Marketplace*!\n\nI'll help you discover and purchase amazing AI prompts.\n\nUse the menu below to get started:`;

  // Check if we can use Web App buttons
  if (!UrlUtils.canUseWebAppButtons()) {
    ctx.replyWithMarkdown(
      `🔧 *Development Notice*\n\nYour Web App URL uses HTTP or is missing: \`${BOT_CONFIG.webAppUrl}\`\n\n*For Web App buttons to work:*\n1. Use HTTPS URL in production\n2. For development: use ngrok\n\n💡 Run: \`ngrok http 3000\`\nThen update WEB_APP_URL in .env\n\nFor now, using regular URL buttons.`
    );
    return;
  }

  const keyboard = Markup.inlineKeyboard([
    [createWebAppButton("✨ Open Marketplace", "", { startapp: "true" })],
    [
      Markup.button.callback("Browse Prompts", "browse_prompts"),
      Markup.button.callback("My Prompts", "my_prompts"),
    ],
    [
      Markup.button.callback("💰 My Balance", "check_balance"),
      Markup.button.callback("ℹ️ Help", "show_help"),
    ],
  ]);

  ctx.replyWithMarkdown(welcomeMessage, keyboard);
});

// Help command
bot.help((ctx) => {
  const helpText = `
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

*💎 Payment Methods:*
• Telegram Stars (Recommended)
• TON Blockchain
• Local Payment (ETB)

*❓ Need support?*
Contact @your_support_username
  `;

  ctx.replyWithMarkdown(helpText);
});

// Prompts command
bot.command("prompts", async (ctx) => {
  await ctx.replyWithMarkdown(
    "*📚 Available Prompt Categories:*\n\n• UI/UX Design\n• Code Generation\n• Image Prompts\n• Writing Assistants\n• Business Tools\n\nClick below to open marketplace:",
    Markup.inlineKeyboard([
      [createWebAppButton("✨ Open Marketplace", "prompts")],
    ])
  );
});

// My prompts command
bot.command("myprompts", async (ctx) => {
  await ctx.reply(
    "Opening your purchased prompts...",
    Markup.inlineKeyboard([[createWebAppButton("📖 My Prompts", "my-prompts")]])
  );
});

// Balance command
bot.command("balance", async (ctx) => {
  await ctx.reply(
    "Loading your balance...\n\n(Connecting to your account...)",
    Markup.inlineKeyboard([[createWebAppButton("💰 Check Balance", "profile")]])
  );
});

// Handle web app data
bot.on("web_app_data", async (ctx) => {
  try {
    // Type-safe way to access web_app_data
    const webAppData = (ctx.update as any).web_app_data;

    if (webAppData?.data) {
      const parsedData = JSON.parse(webAppData.data);

      switch (parsedData.action) {
        case "purchase_success":
          await ctx.reply(
            `✅ Purchase successful!\n\nPrompt: ${parsedData.promptTitle}\nPrice: ${parsedData.amount} Stars\n\nYou can now access it in the web app.`
          );
          break;

        case "payment_failed":
          await ctx.reply(
            `❌ Payment failed: ${parsedData.reason}\n\nPlease try again or contact support.`
          );
          break;
      }
    }
  } catch (error) {
    console.error("Error parsing web app data:", error);
  }
});

// Handle callback queries (Inline Button Clicks)
bot.on("callback_query", async (ctx) => {
  // Type-safe way to access callback query data
  const callbackQuery = ctx.callbackQuery;

  // Always answer callback query first to prevent timeout
  try {
    await ctx.answerCbQuery();
  } catch (error) {
    // Ignore errors for already answered queries
  }

  // Check if it's a regular callback query (not game query)
  if (!callbackQuery || !("data" in callbackQuery)) {
    return;
  }

  const callbackData = callbackQuery.data;

  try {
    switch (callbackData) {
      case "browse_prompts":
        await ctx.replyWithMarkdown(
          "*📚 Available Prompt Categories:*\n\n• UI/UX Design\n• Code Generation\n• Image Prompts\n• Writing Assistants\n• Business Tools\n\nClick below to open marketplace:",
          Markup.inlineKeyboard([
            [createWebAppButton("✨ Open Marketplace", "prompts")],
          ])
        );
        break;

      case "my_prompts":
        await ctx.reply(
          "Opening your purchased prompts...",
          Markup.inlineKeyboard([
            [createWebAppButton("📖 My Prompts", "my-prompts")],
          ])
        );
        break;

      case "check_balance":
        await ctx.reply(
          "Loading your balance...\n\n(Connecting to your account...)",
          Markup.inlineKeyboard([
            [createWebAppButton("💰 Check Balance", "profile")],
          ])
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

// Error handling
bot.catch((err: any, ctx: any) => {
  console.error(`Error for ${ctx.updateType}:`, err);

  // Try to send error message
  try {
    ctx.reply("❌ An error occurred. Please try again later.");
  } catch (e) {
    // Ignore if we can't reply
  }
});

// Start bot
bot.launch().then(() => {
  console.log("🤖 Telegram Bot is running...");
  console.log(`🌐 Web App URL: ${BOT_CONFIG.webAppUrl}`);
  console.log(
    `🔒 HTTPS Required: ${
      UrlUtils.canUseWebAppButtons() ? "✅ Ready" : "❌ Not ready (use ngrok)"
    }`
  );
});

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

export default bot;
