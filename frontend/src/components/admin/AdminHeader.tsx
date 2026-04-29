// components/admin/AdminHeader.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Home,
  RefreshCw,
  ShieldCheck,
  Users,
  DollarSign,
  Package,
  CheckCircle,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
  showStats?: boolean;
}

export function AdminHeader({
  title = "Admin Dashboard",
  subtitle,
  showStats = true,
}: AdminHeaderProps) {
  const router = useRouter();
  const { user } = useAuthStore();

  // Fetch admin stats
  const { data: statsData } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.get("/admin/stats").then((res) => res.data),
    enabled: !!user?.isAdmin,
  });

  const stats = statsData?.data || {};

  return (
    <>
      {/* Main Header */}
      <div className="bg-gradient-to-r from-purple-700 to-blue-700 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 rounded-lg flex items-center justify-center">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="leading-tight">
                <h1 className="text-lg font-bold">{title}</h1>
                <p className="text-white/80 text-sm">
                  {subtitle || `Welcome back, ${user?.firstName}`}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => router.push("/")}
                className="bg-white/20 text-white hover:bg-white/30"
              >
                <Home className="w-4 h-4 mr-2" />
                View Store
              </Button>

              <Button
                onClick={() => window.location.reload()}
                className="bg-white/20 text-white hover:bg-white/30"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Quick Stats - Only show if enabled */}
          {showStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {stats.totalUsers || 0}
                    </div>
                    <div className="text-sm opacity-80">Total Users</div>
                  </div>
                  <Users className="w-8 h-8 opacity-70" />
                </div>
              </div>
              <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {stats.totalPrompts || 0}
                    </div>
                    <div className="text-sm opacity-80">Total Prompts</div>
                  </div>
                  <Package className="w-8 h-8 opacity-70" />
                </div>
              </div>
              <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {stats.totalRevenueStars || 0}
                    </div>
                    <div className="text-sm opacity-80">Revenue (Stars)</div>
                  </div>
                  <DollarSign className="w-8 h-8 opacity-70" />
                </div>
              </div>
              <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {stats.activePrompts || 0}
                    </div>
                    <div className="text-sm opacity-80">Active Prompts</div>
                  </div>
                  <CheckCircle className="w-8 h-8 opacity-70" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-6 px-4 py-3">
            <Link
              href="/admin/dashboard"
              className="text-sm font-medium text-gray-700 hover:text-purple-700 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/prompts"
              className="text-sm font-medium text-gray-700 hover:text-purple-700 transition-colors"
            >
              Prompts
            </Link>
            <Link
              href="/admin/users"
              className="text-sm font-medium text-gray-700 hover:text-purple-700 transition-colors"
            >
              Users
            </Link>
            <Link
              href="/admin"
              className="text-sm font-medium text-gray-700 hover:text-purple-700 transition-colors ml-auto"
            >
              Admin Home
            </Link>
            <Link
              href="/admin/manual-payments"
              className="text-sm font-medium text-gray-700 hover:text-purple-700 transition-colors"
            >
              Manual Payments
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
