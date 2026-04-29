// app/(miniapp)/admin/layout.tsx
"use client";

import { ReactNode } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();

  // Check if user is admin
  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-muted-foreground mb-6">
              You need admin privileges to access this page.
            </p>
            <Button onClick={() => router.push("/")} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine title and subtitle based on route
  const getPageTitle = () => {
    if (pathname === "/admin/dashboard") return "Dashboard";
    if (pathname.startsWith("/admin/prompts")) {
      if (pathname === "/admin/prompts/create") return "Create Prompt";
      return "Manage Prompts";
    }
    if (pathname === "/admin/users") return "Manage Users";
    return "Admin Dashboard";
  };

  const getSubtitle = () => {
    if (pathname === "/admin/dashboard") return "Overview and system status";
    if (pathname.startsWith("/admin/prompts")) {
      if (pathname === "/admin/prompts/create")
        return "Add a new prompt to the marketplace";
      return "Create, edit and manage prompts";
    }
    if (pathname === "/admin/users") return "View and manage all users";
    return `Welcome back, ${user.firstName}`;
  };

  const showStats = pathname === "/admin";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header - Only show on child pages, not on /admin home */}
      {pathname !== "/admin" && (
        <AdminHeader
          title={getPageTitle()}
          subtitle={getSubtitle()}
          showStats={false}
        />
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6">{children}</main>
    </div>
  );
}
