"use client";

import { useEffect, useState } from "react";

// Minimal typing for the parts of the Telegram WebApp SDK we use.
// Telegram injects the full object at window.Telegram.WebApp once the
// telegram-web-app.js script (loaded in app/layout.tsx) has run.
interface TelegramWebApp {
  initData: string;
  initDataUnsafe: { user?: { id: number; first_name: string } };
  ready: () => void;
  expand: () => void;
  colorScheme: "light" | "dark";
  themeParams: Record<string, string>;
  MainButton: {
    show: () => void;
    hide: () => void;
    setText: (text: string) => void;
    onClick: (cb: () => void) => void;
  };
}

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}

export function useTelegram() {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const app = window.Telegram?.WebApp;
    if (!app) {
      // Not running inside Telegram (e.g. local browser dev) — the UI
      // should still render using the demo/fallback data path.
      setReady(true);
      return;
    }

    app.ready();
    app.expand();
    setWebApp(app);
    setReady(true);
  }, []);

  return { webApp, ready, initData: webApp?.initData ?? null };
}
