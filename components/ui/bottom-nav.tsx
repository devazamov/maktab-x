"use client";

import { Home, BookOpen, Swords, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const items = [
  { key: "home", label: "Home", icon: Home },
  { key: "subjects", label: "Fanlar", icon: BookOpen },
  { key: "battle", label: "Battle", icon: Swords },
  { key: "league", label: "Liga", icon: Trophy },
  { key: "profile", label: "Profil", icon: User },
] as const;

export function BottomNav() {
  const [active, setActive] = useState<(typeof items)[number]["key"]>("home");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-2">
        {items.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted"
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
