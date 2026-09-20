import { notFound } from "next/navigation";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { School, Users, GraduationCap } from "lucide-react";

export const revalidate = 60; // classroom info rarely changes; cache briefly

interface Props {
  params: { id: string };
}

/**
 * Public "classroom QR" landing page — section 19 of the spec.
 * Intentionally shows aggregate info only (student COUNT, not names):
 * "O'quvchilarning shaxsiy ma'lumotlari QR orqali hammaga ochilmasin."
 * Meant to be linked from a printed QR code stuck up in the classroom.
 */
export default async function ClassroomPage({ params }: Props) {
  if (!isSupabaseConfigured()) {
    notFound();
  }

  const supabase = supabaseAdmin();

  const { data: klass } = await supabase
    .from("classes")
    .select("id, name, grade, school_id, homeroom_teacher_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!klass) notFound();

  const [{ data: school }, { count: studentCount }, { data: teacher }] =
    await Promise.all([
      supabase.from("schools").select("name, region, district").eq("id", klass.school_id).single(),
      supabase
        .from("student_profiles")
        .select("user_id", { count: "exact", head: true })
        .eq("class_id", klass.id),
      klass.homeroom_teacher_id
        ? supabase.from("users").select("first_name, last_name").eq("id", klass.homeroom_teacher_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  return (
    <main className="mx-auto min-h-screen max-w-md bg-background px-4 py-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-accent-50 text-3xl shadow-soft">
          🤖
        </div>
        <h1 className="font-display text-3xl font-extrabold text-primary-700">
          {klass.name}
        </h1>
        <p className="text-sm text-muted">{school?.name ?? "MAKTAB X"}</p>
      </div>

      <div className="mt-6 space-y-3">
        <Card className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50">
            <Users size={18} className="text-primary-600" />
          </div>
          <div>
            <p className="text-xs text-muted">O'quvchilar soni</p>
            <p className="font-display text-lg font-bold">{studentCount ?? 0} nafar</p>
          </div>
        </Card>

        {teacher && (
          <Card className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-50">
              <GraduationCap size={18} className="text-accent-500" />
            </div>
            <div>
              <p className="text-xs text-muted">Sinf rahbari</p>
              <p className="font-display text-lg font-bold">
                {teacher.first_name} {teacher.last_name ?? ""}
              </p>
            </div>
          </Card>
        )}

        {school?.district && (
          <Card className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary-50">
              <School size={18} className="text-secondary-500" />
            </div>
            <div>
              <p className="text-xs text-muted">Hudud</p>
              <p className="font-display text-lg font-bold">{school.district}</p>
            </div>
          </Card>
        )}

        <Card className="space-y-2 border-dashed">
          <div className="flex items-center justify-between">
            <p className="font-display text-sm font-bold">Yutuqlar va tadbirlar</p>
            <Badge tone="accent">tez orada</Badge>
          </div>
          <p className="text-xs text-muted">
            Sinf reytingi, yutuqlar va tadbirlar keyingi bosqichlarda shu yerda
            ko'rinadi.
          </p>
        </Card>
      </div>

      <p className="mt-8 text-center text-xs text-muted">
        Bu QR kod {klass.name} sinfxonasiga tegishli — MAKTAB X
      </p>
    </main>
  );
}
