// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TelegramProvider } from "@/components/providers/TelegramProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Prompt Marketplace",
  description: "Premium AI prompts marketplace with Telegram integration",

  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },

  openGraph: {
    title: "Prompt Marketplace",
    description: "Premium AI prompts marketplace with Telegram integration",
    images: ["/icon.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Telegram Web App SDK */}
        <script src="https://telegram.org/js/telegram-web-app.js" async />
      </head>
      <body className={inter.className}>
        <TelegramProvider>{children}</TelegramProvider>
      </body>
    </html>
  );
}
