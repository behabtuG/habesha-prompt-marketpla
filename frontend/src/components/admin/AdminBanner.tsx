// components/admin/AdminBanner.tsx
"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";

export function AdminBanner() {
  const { user } = useAuthStore();

  if (!user?.isAdmin) return null;

  return (
    <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black p-3 shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <ShieldCheck className="h-6 w-6 flex-shrink-0" />
          <div className="min-w-0">
            <div className="font-bold text-sm sm:text-base truncate">
              Administrator Mode Active
            </div>
            <div className="text-xs sm:text-sm opacity-90 truncate">
              Logged in as {user.firstName || user.username} (@
              {user.username})
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="px-3 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm whitespace-nowrap flex-shrink-0"
          >
            Admin Panel
          </Link>
        </div>
      </div>
    </div>
  );
}
