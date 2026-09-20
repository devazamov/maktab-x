import type { SupabaseClient } from "@supabase/supabase-js";
import type { TelegramUser } from "./telegram";

/**
 * Shared by the auth API route (Mini App login) and the bot (/start
 * registration flow) so first-login admin bootstrap only lives in one
 * place. Upserts the base user row; never touches `role` on an
 * existing user (see comment below) so a manual promotion or the
 * onboarding flow's own role choice is never clobbered.
 */
export async function upsertTelegramUser(
  supabase: SupabaseClient,
  tgUser: TelegramUser
) {
  const { data: existing } = await supabase
    .from("users")
    .select("id, role")
    .eq("telegram_id", tgUser.id)
    .maybeSingle();

  const adminIds = (process.env.ADMIN_TELEGRAM_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const isBootstrapAdmin = !existing && adminIds.includes(String(tgUser.id));

  const { data: user, error } = await supabase
    .from("users")
    .upsert(
      {
        telegram_id: tgUser.id,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name ?? null,
        username: tgUser.username ?? null,
        language_code: tgUser.language_code ?? null,
        ...(isBootstrapAdmin ? { role: "SUPER_ADMIN" } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "telegram_id", ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error || !user) {
    throw error ?? new Error("upsertTelegramUser: no user returned");
  }

  if (user.role === "STUDENT") {
    await supabase
      .from("student_profiles")
      .upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true });
  }

  return user;
}

/**
 * Resolves "the" school for single-school deployments (which is what
 * MAKTAB X is today). Priority: SCHOOL_ID env var, else the only row
 * in `schools`, else null (caller must handle — e.g. tell an admin to
 * add a school first).
 */
export async function resolveDefaultSchool(supabase: SupabaseClient) {
  const envId = process.env.SCHOOL_ID;
  if (envId) {
    const { data } = await supabase
      .from("schools")
      .select("id, name")
      .eq("id", envId)
      .maybeSingle();
    if (data) return data;
  }

  const { data: schools } = await supabase.from("schools").select("id, name").limit(2);
  if (schools && schools.length === 1) return schools[0];
  return null; // none, or ambiguous (>1 without SCHOOL_ID set)
}

/** A student's completed registration means they have a class assigned. */
export async function isRegistered(
  supabase: SupabaseClient,
  userId: string,
  role: string
) {
  if (role === "TEACHER") {
    const { count } = await supabase
      .from("classes")
      .select("id", { count: "exact", head: true })
      .eq("homeroom_teacher_id", userId);
    return Boolean(count && count > 0);
  }
  // STUDENT (and any other role defaults to the student_profiles check)
  const { data } = await supabase
    .from("student_profiles")
    .select("class_id")
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data?.class_id);
}
