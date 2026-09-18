import { NextRequest, NextResponse } from "next/server";
import { getBot } from "@/services/bot";

/**
 * POST /api/bot/webhook — Telegram delivers updates here.
 *
 * Register this URL with BotFather / setWebhook once deployed:
 *   https://api.telegram.org/bot<TOKEN>/setWebhook?url=<APP_URL>/api/bot/webhook&secret_token=<WEBHOOK_SECRET>
 *
 * We check the `X-Telegram-Bot-Api-Secret-Token` header against
 * TELEGRAM_WEBHOOK_SECRET so random POSTs to this URL can't feed fake
 * updates into the bot.
 */
export async function POST(req: NextRequest) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const receivedSecret = req.headers.get("x-telegram-bot-api-secret-token");

  if (expectedSecret && receivedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const update = await req.json();
  const bot = getBot();

  await bot.handleUpdate(update);

  return NextResponse.json({ ok: true });
}
