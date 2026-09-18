import { Telegraf } from "telegraf";

let bot: Telegraf | null = null;

/**
 * Lazily-constructed singleton so the webhook route can import this
 * from a serverless function without re-registering handlers on every
 * cold start within the same instance.
 */
export function getBot() {
  if (bot) return bot;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set");
  }
  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set (needed for the Mini App button)");
  }

  bot = new Telegraf(token);

  bot.start((ctx) => {
    ctx.reply(
      "🎓 Maktab X ga xush kelibsiz!\n\nBilim. Musobaqa. Rivojlanish. Xavfsizlik.\n\nHammasi bir joyda.",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🚀 Maktab X'ni ochish", web_app: { url: appUrl } }],
          ],
        },
      }
    );
  });

  bot.catch((err, ctx) => {
    console.error(`Bot error for update ${ctx.update.update_id}:`, err);
  });

  return bot;
}
