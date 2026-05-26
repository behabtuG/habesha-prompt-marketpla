// app/auth/layout.tsx
// Clean layout for auth pages — no mini-app header/footer
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — Prompt Marketplace",
  description: "Sign in or create an account to access AI prompts.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
