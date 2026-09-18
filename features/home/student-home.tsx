"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { useTelegram } from "@/hooks/use-telegram";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { QuickActions } from "./quick-actions";
import { DailyQuests } from "./daily-quests";
import type { StudentHomeData } from "@/types";

export function StudentHome() {
  const { initData, ready } = useTelegram();
  const [data, setData] = useState<StudentHomeData | null>(null);

  useEffect(() => {
    if (!ready) return;

    async function load() {
      // Authenticate first (no-op if initData is absent, e.g. local dev
      // outside Telegram — /api/me will just serve the demo payload).
      if (initData) {
        await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData }),
        }).catch(() => null);
      }

      const res = await fetch("/api/me");
      setData(await res.json());
    }

    load();
  }, [ready, initData]);

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-100 border-t-primary" />
      </div>
    );
  }

  const { user, progress, dailyQuests } = data;

  return (
    <div className="space-y-4 px-4 pb-28 pt-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold">
            Salom, {user.firstName}! 👋
          </h1>
          {user.className && (
            <p className="text-sm text-muted">{user.className} sinf</p>
          )}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-50 text-lg">
          🤖
        </div>
      </header>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge tone="primary">Level {progress.level}</Badge>
          <span className="flex items-center gap-1 text-sm font-semibold text-warning">
            <Flame size={16} className="fill-warning" />
            {progress.streakDays} kunlik streak
          </span>
        </div>
        <ProgressBar value={progress.xp} max={progress.xpToNextLevel} />
        <p className="text-right text-xs text-muted">
          {progress.xp} / {progress.xpToNextLevel} XP
        </p>
      </Card>

      <QuickActions />

      <DailyQuests quests={dailyQuests} />
    </div>
  );
}
