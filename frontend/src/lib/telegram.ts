// lib/telegram.ts
"use client";

import { useEffect, useState } from "react";

export const useTelegramInit = () => {
  const [webApp, setWebApp] = useState<any>(null);
  const [initData, setInitData] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if Telegram Web App is available
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;

        // Initialize
        tg.ready();
        tg.expand();

        // Enable closing confirmation
        tg.enableClosingConfirmation();

        // Set header color
        tg.setHeaderColor("#6d28d9");

        // Store data
        setWebApp(tg);
        setInitData(tg.initData || "");
        setUser(tg.initDataUnsafe?.user || null);
        setIsLoading(false);

        console.log("📱 Telegram Web App initialized:", {
          platform: tg.platform,
          user: tg.initDataUnsafe?.user,
          initData: tg.initData,
        });
      } else {
        console.log("🌐 Running in browser mode (no Telegram Web App)");
        setIsLoading(false);
      }
    }
  }, []);

  return {
    webApp,
    initData,
    user,
    isLoading,
  };
};
