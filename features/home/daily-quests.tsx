import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DailyQuest } from "@/types";

export function DailyQuests({ quests }: { quests: DailyQuest[] }) {
  return (
    <Card className="space-y-3">
      <h2 className="font-display text-base font-bold">Bugungi vazifalar</h2>
      <ul className="space-y-2">
        {quests.map((q) => (
          <li
            key={q.id}
            className="flex items-center justify-between rounded-2xl bg-background px-3 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border-2",
                  q.completed
                    ? "border-success bg-success text-white"
                    : "border-border"
                )}
              >
                {q.completed && <Check size={12} strokeWidth={3} />}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  q.completed && "text-muted line-through"
                )}
              >
                {q.title}
              </span>
            </div>
            <span className="text-xs font-semibold text-primary">
              +{q.xpReward} XP
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
