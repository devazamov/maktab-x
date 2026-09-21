"use client";

import { useEffect, useState } from "react";
import { useTelegram } from "@/hooks/use-telegram";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, QrCode, Copy } from "lucide-react";

interface ClassRow {
  id: string;
  name: string;
  grade: number;
  homeroom_teacher_id: string | null;
  studentCount: number;
}

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
  (typeof window !== "undefined" ? window.location.origin : "");

export default function AdminClassesPage() {
  const { initData, ready } = useTelegram();
  const [classes, setClasses] = useState<ClassRow[] | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/classes");
    if (res.status === 403) {
      setForbidden(true);
      return;
    }
    const data = await res.json();
    setClasses(data.classes ?? []);
  }

  useEffect(() => {
    if (!ready) return;
    // Mini App session cookie comes from /api/auth/telegram, which the
    // Student Home screen already calls on open — but an admin may
    // land here directly, so authenticate first if we have initData.
    async function init() {
      if (initData) {
        await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData }),
        }).catch(() => null);
      }
      await load();
    }
    init();
  }, [ready, initData]);

  async function addClass(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, grade: Number(grade) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Xatolik yuz berdi");
        return;
      }
      setName("");
      setGrade("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function removeClass(id: string) {
    setError(null);
    const res = await fetch(`/api/admin/classes/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Xatolik yuz berdi");
      return;
    }
    await load();
  }

  function copyLink(id: string) {
    const url = `${APP_URL}/classroom/${id}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }

  if (forbidden) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6 text-center">
        <p className="text-sm text-muted">
          Bu sahifa faqat administratorlar uchun.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-md space-y-4 bg-background px-4 pb-16 pt-8">
      <h1 className="font-display text-2xl font-extrabold">Sinflar</h1>

      <Card>
        <form onSubmit={addClass} className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-xs font-medium text-muted">Sinf nomi</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="masalan 5-A"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="w-20">
            <label className="text-xs font-medium text-muted">Bosqich</label>
            <input
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="5"
              type="number"
              min={1}
              max={11}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          <Button type="submit" size="md" disabled={busy}>
            <Plus size={18} />
          </Button>
        </form>
        {error && <p className="mt-2 text-xs font-medium text-danger">{error}</p>}
      </Card>

      {classes === null ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-100 border-t-primary" />
        </div>
      ) : classes.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          Hali sinf qo'shilmagan. Yuqoridan birinchi sinfni qo'shing.
        </p>
      ) : (
        <div className="space-y-2">
          {classes.map((c) => (
            <Card key={c.id} className="flex items-center justify-between gap-2">
              <div>
                <p className="font-display font-bold">{c.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge tone="primary">{c.studentCount} o'quvchi</Badge>
                  {!c.homeroom_teacher_id && (
                    <Badge tone="warning">rahbarsiz</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => copyLink(c.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600"
                  title="QR havolasini nusxalash"
                >
                  {copiedId === c.id ? <span className="text-xs">✓</span> : <QrCode size={16} />}
                </button>
                <button
                  onClick={() => removeClass(c.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-danger-50 text-danger"
                  title="O'chirish"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="pt-2 text-center text-xs text-muted">
        <Copy size={12} className="mr-1 inline" />
        QR belgisi bosilganda sinfning /classroom havolasi nusxalanadi — uni
        istalgan QR generator saytiga qo'yib, chop etib sinfxonaga ilib
        qo'yishingiz mumkin.
      </p>
    </main>
  );
}
