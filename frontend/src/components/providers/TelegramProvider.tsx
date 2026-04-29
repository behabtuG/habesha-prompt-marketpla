// components/providers/TelegramProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";

declare global {
  interface Window {
    Telegram: {
      WebApp: any;
    };
  }
}

interface TelegramContextType {
  webApp: any;
  initData: string | null;
  user: any;
  isLoading: boolean;
}

const TelegramContext = createContext<TelegramContextType>({
  webApp: null,
  initData: null,
  user: null,
  isLoading: true,
});

export function useTelegram() {
  return useContext(TelegramContext);
}

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [webApp, setWebApp] = useState<any>(null);
  const [initData, setInitData] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;

      // Initialize Telegram Web App
      tg.ready();
      tg.expand();

      // Set theme colors
      if (tg.themeParams) {
        document.documentElement.style.setProperty(
          "--tg-theme-bg-color",
          tg.themeParams.bg_color || "#ffffff"
        );
        document.documentElement.style.setProperty(
          "--tg-theme-text-color",
          tg.themeParams.text_color || "#000000"
        );
      }

      // Store references
      setWebApp(tg);
      setInitData(tg.initData || null);
      setUser(tg.initDataUnsafe?.user || null);
      setIsLoading(false);

      console.log("Telegram Web App initialized:", {
        platform: tg.platform,
        initData: tg.initData,
        user: tg.initDataUnsafe?.user,
      });
    } else {
      console.warn("Telegram Web App not detected. Running in browser mode.");
      setIsLoading(false);
    }
  }, []);

  return (
    <TelegramContext.Provider value={{ webApp, initData, user, isLoading }}>
      {children}
    </TelegramContext.Provider>
  );
}
