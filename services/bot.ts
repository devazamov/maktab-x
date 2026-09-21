import { Telegraf } from "telegraf";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { upsertTelegramUser, resolveDefaultSchool, isRegistered } from "@/lib/users";
import type { TelegramUser } from "@/lib/telegram";

let bot: Telegraf | null = null;

function mainMenuKeyboard(appUrl: string, isAdmin = false) {
  const rows = [
    [{ text: "🚀 Maktab X'ni ochish", web_app: { url: appUrl } }],
    [{ text: "📷 QR skanerlash", web_app: { url: `${appUrl}/scan` } }],
  ];
  if (isAdmin) {
    rows.push([{ text: "⚙️ Sinflarni boshqarish", web_app: { url: `${appUrl}/admin/classes` } }]);
  }
  return { inline_keyboard: rows };
}

/**
 * Lazily-constructed singleton so the webhook route can import this
 * from a serverless function without re-registering handlers on every
 * cold start within the same instance.
 */
export function getBot() {
  if (bot) return bot;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  if (!appUrl) throw new Error("NEXT_PUBLIC_APP_URL is not set (needed for the Mini App button)");

  bot = new Telegraf(token);

  bot.start(async (ctx) => {
    const from = ctx.from;
    const tgUser: TelegramUser = {
      id: from.id,
      first_name: from.first_name,
      last_name: from.last_name,
      username: from.username,
      language_code: from.language_code,
    };

    if (!isSupabaseConfigured()) {
      await ctx.reply(
        "🎓 Maktab X ga xush kelibsiz!\n\nBilim. Musobaqa. Rivojlanish. Xavfsizlik.\n\nHammasi bir joyda.",
        { reply_markup: mainMenuKeyboard(appUrl) }
      );
      return;
    }

    const supabase = supabaseAdmin();
    const user = await upsertTelegramUser(supabase, tgUser);
    const registered = await isRegistered(supabase, user.id, user.role);

    if (registered || user.role === "SUPER_ADMIN" || user.role === "SCHOOL_ADMIN") {
      const isAdmin = user.role === "SUPER_ADMIN" || user.role === "SCHOOL_ADMIN";
      await ctx.reply(
        `🎓 Xush kelibsiz, ${tgUser.first_name}!\n\nBilim. Musobaqa. Rivojlanish. Xavfsizlik.\n\nHammasi bir joyda.`,
        { reply_markup: mainMenuKeyboard(appUrl, isAdmin) }
      );
      return;
    }

    await ctx.reply(
      `🎓 Assalomu alaykum, ${tgUser.first_name}!\n\nMaktab X'ga xush kelibsiz. Boshlashdan oldin, siz bizning maktabimizning kimisiz?`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🎓 O'quvchiman", callback_data: "role:STUDENT" }],
            [{ text: "👨‍🏫 O'qituvchiman", callback_data: "role:TEACHER" }],
          ],
        },
      }
    );
  });

  bot.action(/^role:(STUDENT|TEACHER)$/, async (ctx) => {
    const role = ctx.match[1] as "STUDENT" | "TEACHER";
    await ctx.answerCbQuery();

    if (!isSupabaseConfigured()) {
      await ctx.reply("Hozircha ma'lumotlar bazasi ulanmagan. Birozdan so'ng urinib ko'ring.");
      return;
    }

    const supabase = supabaseAdmin();
    const school = await resolveDefaultSchool(supabase);
    if (!school) {
      await ctx.reply(
        "Maktabingiz hali tizimga qo'shilmagan. Iltimos, administrator bilan bog'laning."
      );
      return;
    }

    const { data: classes } = await supabase
      .from("classes")
      .select("id, name, grade")
      .eq("school_id", school.id)
      .order("grade")
      .order("name");

    if (!classes || classes.length === 0) {
      await ctx.reply(
        "Sinflar hali qo'shilmagan. Iltimos, administrator bilan bog'laning."
      );
      return;
    }

    // Telegram allows up to 8 buttons per row comfortably at this
    // width; group class buttons 3-per-row for a compact grid.
    const rows = [];
    for (let i = 0; i < classes.length; i += 3) {
      rows.push(
        classes.slice(i, i + 3).map((c) => ({
          text: c.name,
          callback_data: `class:${role}:${c.id}`,
        }))
      );
    }

    await ctx.reply(
      role === "STUDENT"
        ? "Qaysi sinf o'quvchisisiz?"
        : "Qaysi sinfning rahbarisiz (yoki asosiy dars beradigan sinfingizni tanlang)?",
      { reply_markup: { inline_keyboard: rows } }
    );
  });

  bot.action(/^class:(STUDENT|TEACHER):(.+)$/, async (ctx) => {
    const role = ctx.match[1] as "STUDENT" | "TEACHER";
    const classId = ctx.match[2];
    await ctx.answerCbQuery();

    if (!isSupabaseConfigured()) return;

    const supabase = supabaseAdmin();
    const from = ctx.from;

    const { data: user } = await supabase
      .from("users")
      .select("id, first_name")
      .eq("telegram_id", from.id)
      .maybeSingle();

    if (!user) {
      await ctx.reply("Xatolik yuz berdi. /start ni qayta bosing.");
      return;
    }

    const { data: klass } = await supabase
      .from("classes")
      .select("id, name, school_id")
      .eq("id", classId)
      .maybeSingle();

    if (!klass) {
      await ctx.reply("Bu sinf topilmadi. /start ni qayta bosing.");
      return;
    }

    if (role === "STUDENT") {
      await supabase
        .from("users")
        .update({ role: "STUDENT", school_id: klass.school_id })
        .eq("id", user.id);
      await supabase
        .from("student_profiles")
        .upsert(
          { user_id: user.id, class_id: klass.id },
          { onConflict: "user_id" }
        );
    } else {
      await supabase
        .from("users")
        .update({ role: "TEACHER", school_id: klass.school_id })
        .eq("id", user.id);
      await supabase.from("teacher_profiles").upsert(
        { user_id: user.id },
        { onConflict: "user_id", ignoreDuplicates: true }
      );
      // First teacher claims homeroom if the class doesn't have one yet.
      await supabase
        .from("classes")
        .update({ homeroom_teacher_id: user.id })
        .eq("id", klass.id)
        .is("homeroom_teacher_id", null);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
    await ctx.reply(
      `✅ Ro'yxatdan o'tdingiz: ${klass.name} sinf ${
        role === "STUDENT" ? "o'quvchisi" : "o'qituvchisi"
      }.\n\nEndi Maktab X'ni ochishingiz mumkin!`,
      { reply_markup: mainMenuKeyboard(appUrl) }
    );
  });

  bot.catch((err, ctx) => {
    console.error(`Bot error for update ${ctx.update.update_id}:`, err);
  });

  return bot;
}
