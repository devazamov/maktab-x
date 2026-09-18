// Core domain types for Phase 1 (auth + student home).
// Wider models (Quiz, Battle, Crossword, SafetyReport, ...) are laid
// out in database/schema.sql ahead of the phases that need them, but
// their TS types will be added feature-by-feature as those phases land
// — keeping this file honest about what Phase 1 actually reads/writes.

export type UserRole =
  | "STUDENT"
  | "TEACHER"
  | "PARENT"
  | "PSYCHOLOGIST"
  | "SAFETY_OFFICER"
  | "SCHOOL_ADMIN"
  | "SUPER_ADMIN";

export interface AppUser {
  id: string; // uuid, our own PK
  telegramId: number;
  firstName: string;
  lastName: string | null;
  username: string | null;
  languageCode: string | null;
  role: UserRole;
  createdAt: string;
}

export interface StudentProfile {
  userId: string;
  schoolId: string | null;
  classId: string | null;
  level: number;
  xp: number;
  xpToNextLevel: number;
  streakDays: number;
  lastActivityAt: string | null;
}

export interface DailyQuest {
  id: string;
  title: string;
  xpReward: number;
  completed: boolean;
}

export interface StudentHomeData {
  user: {
    firstName: string;
    className: string | null;
  };
  progress: {
    level: number;
    xp: number;
    xpToNextLevel: number;
    streakDays: number;
  };
  dailyQuests: DailyQuest[];
  /** true when this is the fallback demo payload (no Supabase row yet) */
  isDemo: boolean;
}
