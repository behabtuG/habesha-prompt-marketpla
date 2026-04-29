// app/(miniapp)/layout.tsx
"use client";

import { useTelegramInit } from "@/lib/telegram";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { Link as LucideLink, ShieldCheck, Sparkles, WifiOff } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminBanner } from "@/components/admin/AdminBanner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export default function MiniAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { initData, isLoading: telegramLoading } = useTelegramInit();
  const { setAuth, isAuthenticated, user, logout } = useAuthStore();
  const [apiError, setApiError] = useState<string | null>(null);
  const [isCheckingApi, setIsCheckingApi] = useState(true);

  // Check API health on mount
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        setIsCheckingApi(true);
        await api.get("/health");
        setApiError(null);
      } catch (error: any) {
        console.error("API health check failed:", error);
        setApiError(
          error.message ||
            "Cannot connect to backend. Please check if the server is running."
        );
      } finally {
        setIsCheckingApi(false);
      }
    };

    checkApiHealth();
  }, []);

  // Auto-login using Telegram initData
  useEffect(() => {
    const authenticate = async () => {
      if (initData && !isAuthenticated) {
        try {
          console.log("🔐 Attempting Telegram authentication...");

          const response = await api.post(
            "/auth/telegram",
            {},
            {
              headers: {
                "x-telegram-init-data": initData,
              },
            }
          );

          const { access_token, user: userData } = response.data;

          // DEBUG: Log what the backend returns
          console.log("🔍 Backend returned user data:", userData);
          console.log("🔍 Is admin?", userData.isAdmin);

          setAuth(access_token, userData);

          console.log("✅ Authentication successful:", userData.username);
        } catch (error: any) {
          console.error("❌ Telegram authentication failed:", error);
          console.error("Error details:", error.response?.data);

          // For development, create a mock user WITH ADMIN FLAG
          if (process.env.NODE_ENV === "development") {
            console.warn("⚠️ Development mode: Creating mock user WITH ADMIN");
            const mockUser = {
              id: "dev-user-id",
              telegramId: "361650959", // Use your actual Telegram ID
              username: "begetm",
              firstName: "Behabtu",
              balanceStars: 1000,
              isAdmin: true, // IMPORTANT: Set this to true
              totalSpent: 0,
            };
            const mockToken = "dev-mock-token";
            setAuth(mockToken, mockUser);
          }
        }
      }
    };

    authenticate();
  }, [initData, isAuthenticated, setAuth]);

  // Show loading while checking API
  if (isCheckingApi || telegramLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {telegramLoading
              ? "Loading Telegram Mini App..."
              : "Checking connection..."}
          </p>
        </div>
      </div>
    );
  }

  // Show API error if cannot connect
  if (apiError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <WifiOff className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Connection Error</h1>
          <p className="text-muted-foreground mb-4">{apiError}</p>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Make sure your backend server is running:
            </p>
            <div className="bg-muted p-3 rounded text-sm font-mono text-left">
              <div>cd backend</div>
              <div>npm run dev</div>
            </div>
            <Button onClick={() => window.location.reload()} className="w-full">
              Retry Connection
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
          <div className="max-w-6xl mx-auto">
            {/* Top row with logo and user */}
            <div className="flex justify-between items-center mb-2">
              <Link
                href="/"
                className="hover:opacity-90 flex items-center gap-2"
              >
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="font-bold">⚡</span>
                </div>
                <h1 className="text-xl font-bold">Prompt Marketplace</h1>
              </Link>

              {user && (
                <div className="flex items-center gap-3">
                  {/* DEBUG: Always show admin status */}
                  <div className="flex items-center gap-3">
                    {user.isAdmin && (
                      <Link href="/admin">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 text-black rounded-lg font-semibold text-sm hover:bg-yellow-400 transition-colors cursor-pointer animate-pulse">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>ADMIN</span>
                        </div>
                      </Link>
                    )}

                    <div className="flex items-center gap-2">
                      {/* Subscription Status/Upgrade */}
                      <Link href="/subscriptions">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold mr-1 transition-colors cursor-pointer border border-white/20">
                          <Sparkles className="h-3 w-3" />
                          <span>UPGRADE</span>
                        </div>
                      </Link>

                      <div className="text-right hidden sm:block">
                        <div className="font-medium text-sm">
                          {user.firstName || user.username}
                        </div>
                        <div className="text-xs opacity-80 flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          {user.balanceStars} Stars
                        </div>
                      </div>
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="font-bold">
                          {user.firstName?.charAt(0) ||
                            user.username?.charAt(0) ||
                            "U"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom bar with admin info */}
            {/* {user && user.isAdmin && (
              <div className="mt-2 pt-2 border-t border-white/20 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <ShieldCheck className="h-3 w-3 text-yellow-300" />
                    <span className="font-semibold">
                      Administrator Access Active
                    </span>
                    <span className="opacity-80">
                      • Telegram ID: {user.telegramId}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/debug"
                      className="text-xs hover:underline opacity-80"
                    >
                      Debug
                    </Link>
                    <Link
                      href="/admin"
                      className="text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30"
                    >
                      Open Admin Panel →
                    </Link>
                  </div>
                </div>
              </div>
            )} */}
          </div>
        </div>
        <AdminBanner />
        {/* Main Content */}
        <main className="max-w-6xl mx-auto p-4">{children}</main>
        {/* Footer */}
        <footer className="border-t p-4 text-center text-sm text-muted-foreground">
          <p>
            Powered by Telegram Web Apps • Secure payments with Telegram Stars
          </p>
        </footer>
      </div>

      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}
