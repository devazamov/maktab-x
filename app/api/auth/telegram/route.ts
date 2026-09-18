import { NextRequest, NextResponse } from "next/server";
import { validateTelegramInitData } from "@/lib/telegram";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { createSession } from "@/lib/session";

/**
 * POST /api/auth/telegram
 * Body: { initData: string }
 *
 * Validates the Mini App's initData against the bot token, then
 * upserts the user in Supabase (first login = STUDENT role) and
 * issues a session cookie. This is the only place a Telegram user
 * becomes an authenticated MAKTAB X user.
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

  const { data: user, error } = await supabase
    .from("users")
    .upsert(
      {
        telegram_id: tgUser.id,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name ?? null,
        username: tgUser.username ?? null,
        language_code: tgUser.language_code ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "telegram_id", ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error || !user) {
    console.error("auth upsert failed", error);
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }

  // Ensure a student_profiles row exists for first-time STUDENT users.
  if (user.role === "STUDENT") {
    await supabase
      .from("student_profiles")
      .upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true });
  }

  await createSession({
    userId: user.id,
    telegramId: user.telegram_id,
    role: user.role,
  });

  return NextResponse.json({ ok: true, persisted: true });
}
