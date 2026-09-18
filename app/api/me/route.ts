import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import type { StudentHomeData } from "@/types";

const DEMO_PAYLOAD: StudentHomeData = {
  user: { firstName: "Zarifjon", className: "11-A" },
  progress: { level: 12, xp: 320, xpToNextLevel: 500, streakDays: 7 },
  dailyQuests: [
    { id: "q1", title: "10 ta matematika savoli", xpReward: 50, completed: false },
    { id: "q2", title: "1 ta crossword", xpReward: 30, completed: false },
    { id: "q3", title: "1 ta yangi mavzu", xpReward: 40, completed: true },
    { id: "q4", title: "1 ta xavfsizlik darsi", xpReward: 50, completed: false },
  ],
  isDemo: true,
};

/**
 * GET /api/me — the Student Home screen's data source.
 *
 * Real path: read the session cookie set by /api/auth/telegram, then
 * pull the actual student_profiles row from Supabase.
 *
 * Falls back to the fixed demo payload (section 43 of the spec) only
 * when there's no session yet or Supabase isn't configured — i.e.
 * local development before real credentials exist. Both are honest
 * about which mode they're in via `isDemo`.
 */
export async function GET() {
  const session = await getSession();

  if (!session || !isSupabaseConfigured()) {
    return NextResponse.json(DEMO_PAYLOAD);
  }

  const supabase = supabaseAdmin();

  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("first_name, role")
    .eq("id", session.userId)
    .single();

  const { data: profile, error: profileErr } = await supabase
    .from("student_profiles")
    .select("level, xp, xp_to_next_level, streak_days, class_id")
    .eq("user_id", session.userId)
    .single();

  if (userErr || profileErr || !user || !profile) {
    return NextResponse.json(DEMO_PAYLOAD);
  }

  let className: string | null = null;
  if (profile.class_id) {
    const { data: klass } = await supabase
      .from("classes")
      .select("name")
      .eq("id", profile.class_id)
      .single();
    className = klass?.name ?? null;
  }

  const { data: quests } = await supabase
    .from("quests")
    .select("id, title, xp_reward, quest_completions!left(user_id)")
    .eq("active_on", new Date().toISOString().slice(0, 10));

  const payload: StudentHomeData = {
    user: { firstName: user.first_name, className },
    progress: {
      level: profile.level,
      xp: profile.xp,
      xpToNextLevel: profile.xp_to_next_level,
      streakDays: profile.streak_days,
    },
    dailyQuests: (quests ?? []).map((q: any) => ({
      id: q.id,
      title: q.title,
      xpReward: q.xp_reward,
      completed: Array.isArray(q.quest_completions) && q.quest_completions.length > 0,
    })),
    isDemo: false,
  };

  return NextResponse.json(payload);
}
