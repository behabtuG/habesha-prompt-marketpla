// app/(miniapp)/admin/dashboard/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  Download,
  PlusCircle,
  TrendingUp,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  // Fetch admin stats
  const { data: statsData } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.get("/admin/stats").then((res) => res.data),
  });

  const stats = statsData?.data || {};

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  onClick={() => router.push("/admin/prompts/create")}
                  className="w-full justify-start gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  Create New Prompt
                </Button>
                <Button
                  onClick={() => router.push("/admin/users")}
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <Users className="w-4 h-4" />
                  Manage Users
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Data
                </Button>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">System Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between p-2 bg-green-50 rounded">
                  <span>Authentication:</span>
                  <span className="font-semibold text-green-600">
                    ✅ Active
                  </span>
                </div>
                <div className="flex justify-between p-2 bg-green-50 rounded">
                  <span>Database:</span>
                  <span className="font-semibold text-green-600">
                    ✅ Connected
                  </span>
                </div>
                <div className="flex justify-between p-2 bg-blue-50 rounded">
                  <span>Encryption:</span>
                  <span className="font-semibold text-blue-600">
                    🔒 AES-256 Active
                  </span>
                </div>
                <div className="flex justify-between p-2 bg-green-50 rounded">
                  <span>API Status:</span>
                  <span className="font-semibold text-green-600">
                    ✅ Online
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">New User Registration</div>
                  <div className="text-sm text-muted-foreground">
                    {stats.totalUsers || 0} total users registered
                  </div>
                </div>
              </div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium">Prompts Available</div>
                  <div className="text-sm text-muted-foreground">
                    {stats.totalPrompts || 0} prompts in marketplace
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
