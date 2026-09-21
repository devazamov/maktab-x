import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase";
import { resolveDefaultSchool } from "@/lib/users";

/**
 * GET  /api/admin/classes — list classes (+ live student count) for
 *      the resolved school.
 * POST /api/admin/classes — create a class. Body: { name, grade }
 *
 * Both require an authenticated SUPER_ADMIN/SCHOOL_ADMIN session.
 */
export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = supabaseAdmin();
  const school = await resolveDefaultSchool(supabase);
  if (!school) return NextResponse.json({ school: null, classes: [] });

  const { data: classes, error } = await supabase
    .from("classes")
    .select("id, name, grade, homeroom_teacher_id")
    .eq("school_id", school.id)
    .order("grade")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Attach a live student count per class (small N — fine to do per-row).
  const withCounts = await Promise.all(
    (classes ?? []).map(async (c) => {
      const { count } = await supabase
        .from("student_profiles")
        .select("user_id", { count: "exact", head: true })
        .eq("class_id", c.id);
      return { ...c, studentCount: count ?? 0 };
    })
  );

  return NextResponse.json({ school, classes: withCounts });
}

export async function POST(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const grade = Number(body?.grade);

  if (!name || !Number.isInteger(grade) || grade < 1 || grade > 11) {
    return NextResponse.json(
      { error: "name (matn) va grade (1-11 oralig'idagi son) kerak" },
      { status: 400 }
    );
  }

  const supabase = supabaseAdmin();
  const school = await resolveDefaultSchool(supabase);
  if (!school) {
    return NextResponse.json({ error: "Maktab topilmadi" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("classes")
    .insert({ school_id: school.id, name, grade })
    .select("id, name, grade")
    .single();

  if (error) {
    // unique(school_id, name) violation is the most likely case here
    const message = error.code === "23505" ? "Bu nomli sinf allaqachon mavjud" : error.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ class: data }, { status: 201 });
}
