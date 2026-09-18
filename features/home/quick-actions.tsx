"use client";

import {
  Brain,
  Swords,
  Puzzle,
  Bot,
  BookOpen,
  Trophy,
  School,
  Shield,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useState } from "react";

// Section 8 of the spec. Only Home ships in Phase 1 — every other
// destination is a real, labeled "coming soon" state rather than a
// button that looks live but does nothing when tapped.
const actions = [
  { key: "quiz", label: "Quiz", icon: Brain, live: false },
  { key: "battle", label: "1 vs 1", icon: Swords, live: false },
  { key: "crossword", label: "AI Crossword", icon: Puzzle, live: false },
  { key: "ai-teacher", label: "AI O'qituvchi", icon: Bot, live: false },
  { key: "subjects", label: "Fanlar", icon: BookOpen, live: false },
  { key: "league", label: "Liga", icon: Trophy, live: false },
  { key: "class", label: "Sinfim", icon: School, live: false },
  { key: "safety", label: "Xavfsizlik", icon: Shield, live: false },
] as const;

export function QuickActions() {
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="relative">
      <div className="grid grid-cols-4 gap-3">
        {actions.map(({ key, label, icon: Icon, live }) => (
          <button
            key={key}
            onClick={() => !live && setToast(`${label} — tez orada ✨`)}
            className="flex flex-col items-center gap-1.5"
          >
            <Card className="flex h-14 w-14 items-center justify-center p-0 shadow-none border-primary-50 bg-primary-50">
              <Icon size={24} className="text-primary-600" />
            </Card>
            <span className="text-center text-[11px] font-medium leading-tight text-muted">
              {label}
            </span>
          </button>
        ))}
      </div>

      {toast && (
        <div
          className="fixed inset-x-4 bottom-24 z-30 rounded-2xl bg-foreground px-4 py-3 text-center text-sm font-medium text-white shadow-soft animate-pop"
          onAnimationEnd={() => setTimeout(() => setToast(null), 1400)}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
