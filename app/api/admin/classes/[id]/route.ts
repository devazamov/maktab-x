import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase";

/** DELETE /api/admin/classes/:id — only if it has no students in it. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = supabaseAdmin();

  const { count } = await supabase
    .from("student_profiles")
    .select("user_id", { count: "exact", head: true })
    .eq("class_id", params.id);

  if (count && count > 0) {
    return NextResponse.json(
      { error: `Bu sinfda ${count} ta o'quvchi bor — avval ularni boshqa sinfga o'tkazing` },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("classes").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
