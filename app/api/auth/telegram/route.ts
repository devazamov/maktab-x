import { NextRequest, NextResponse } from "next/server";
import { validateTelegramInitData } from "@/lib/telegram";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { createSession } from "@/lib/session";
import { upsertTelegramUser } from "@/lib/users";

/**
 * POST /api/auth/telegram
 * Body: { initData: string }
 *
 * Validates the Mini App's initData against the bot token, then
 * upserts the user in Supabase (first login = STUDENT role, unless
 * ADMIN_TELEGRAM_IDS bootstraps them to SUPER_ADMIN) and issues a
 * session cookie. Role + class assignment itself happens in the
 * bot's /start registration flow (services/bot.ts), not here.
 */
export async function POST(req: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json(
      { error: "Server misconfigured: TELEGRAM_BOT_TOKEN not set" },
      { status: 500 }
    );
  }

  const { initData } = await req.json().catch(() => ({ initData: null }));
  if (typeof initData !== "string") {
    return NextResponse.json({ error: "Missing initData" }, { status: 400 });
  }

  const validated = validateTelegramInitData(initData, botToken);
  if (!validated) {
    return NextResponse.json({ error: "Invalid initData" }, { status: 401 });
  }

  const { user: tgUser } = validated;

  if (!isSupabaseConfigured()) {
    // Dev mode without a Supabase project wired up yet: still issue a
    // session so the rest of the Mini App is exercisable, but callers
    // should treat this as unpersisted.
    await createSession({
      userId: `demo-${tgUser.id}`,
      telegramId: tgUser.id,
      role: "STUDENT",
    });
    return NextResponse.json({ ok: true, persisted: false });
  }

  const supabase = supabaseAdmin();

  let user;
  try {
    user = await upsertTelegramUser(supabase, tgUser);
  } catch (error) {
    console.error("auth upsert failed", error);
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }

  await createSession({
    userId: user.id,
    telegramId: user.telegram_id,
    role: user.role,
  });

  return NextResponse.json({ ok: true, persisted: true });
}
