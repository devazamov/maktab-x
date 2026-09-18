/**
 * Development seed data — per spec section 42/43.
 * Run with: npm run seed
 * Requires SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL in .env
 *
 * This is dev-only fixture data (a demo school, classes, one demo
 * student). It is never used in production UI copy — the Student
 * Home screen only falls back to a demo payload when there is no
 * authenticated Supabase row yet, and that fallback is separate from
 * this seed script.
 */
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  const { data: school, error: schoolErr } = await supabase
    .from("schools")
    .upsert({ name: "Baxmal 1-maktab" }, { onConflict: "name" })
    .select()
    .single();
  if (schoolErr) throw schoolErr;

  const classNames = ["9-A", "9-B", "10-A", "10-B", "11-A", "11-B"];
  for (const name of classNames) {
    const grade = Number(name.split("-")[0]);
    await supabase
      .from("classes")
      .upsert(
        { school_id: school.id, name, grade },
        { onConflict: "school_id,name" }
      );
  }

  const { data: classA } = await supabase
    .from("classes")
    .select("id")
    .eq("school_id", school.id)
    .eq("name", "11-A")
    .single();

  const { data: demoUser, error: userErr } = await supabase
    .from("users")
    .upsert(
      {
        telegram_id: 900000001,
        first_name: "Zarifjon",
        role: "STUDENT",
        school_id: school.id,
      },
      { onConflict: "telegram_id" }
    )
    .select()
    .single();
  if (userErr) throw userErr;

  await supabase.from("student_profiles").upsert({
    user_id: demoUser.id,
    class_id: classA?.id,
    level: 12,
    xp: 320,
    xp_to_next_level: 500,
    streak_days: 7,
  });

  const subjects = [
    "Matematika",
    "Fizika",
    "Kimyo",
    "Biologiya",
    "Tarix",
    "Geografiya",
    "Informatika",
    "Ona tili",
    "Adabiyot",
    "Ingliz tili",
    "Nemis tili",
    "Rus tili",
  ];
  for (const name of subjects) {
    await supabase.from("subjects").upsert({ name }, { onConflict: "name" });
  }

  console.log("Seed complete: 1 school, 6 classes, 12 subjects, 1 demo student.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
