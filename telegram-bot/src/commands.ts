// telegram-bot/commands.ts
import { Markup } from "telegraf";
import { BOT_CONFIG } from "./config";

export const botCommands = {
  // Prompts command
  async prompts(ctx: any) {
    const categories = [
      { name: "UI/UX", emoji: "🎨" },
      { name: "Code", emoji: "💻" },
      { name: "Images", emoji: "🖼️" },
      { name: "Writing", emoji: "✍️" },
      { name: "Business", emoji: "💼" },
    ];

    const keyboard = categories.map((cat) => [
      Markup.button.webApp(
        `${cat.emoji} ${cat.name}`,
        `${BOT_CONFIG.webAppUrl}/prompts?category=${cat.name}`
      ),
    ]);

    keyboard.push([
      Markup.button.webApp("✨ Browse All", `${BOT_CONFIG.webAppUrl}/prompts`),
    ]);

    await ctx.replyWithMarkdown(
      "*📚 Prompt Categories*\n\nSelect a category to browse prompts:",
      Markup.inlineKeyboard(keyboard)
    );
  },

  // My prompts command
  async myPrompts(ctx: any) {
    await ctx.reply(
      "Opening your purchased prompts...",
      Markup.inlineKeyboard([
        [
          Markup.button.webApp(
            "📖 My Prompts",
            `${BOT_CONFIG.webAppUrl}/my-prompts`
          ),
        ],
      ])
    );
  },

  // Balance command
  async balance(ctx: any) {
    await ctx.reply(
      "Checking your balance...",
      Markup.inlineKeyboard([
        [
          Markup.button.webApp(
            "💰 Check Balance",
            `${BOT_CONFIG.webAppUrl}/profile`
          ),
        ],
      ])
    );
  },
};
