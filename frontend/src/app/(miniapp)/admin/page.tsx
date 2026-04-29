// app/(miniapp)/admin/page.tsx -
"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ShieldCheck, Package, Users, DollarSign } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Redirect if not admin
  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    if (!user.isAdmin) {
      toast.error("Admin access required");
      router.push("/");
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with stats */}
      <AdminHeader showStats={true} />

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Dashboard Card */}
          <Link href="/admin/dashboard">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full hover:scale-[1.02] duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Dashboard</h3>
                    <p className="text-sm text-muted-foreground">
                      Overview and system status
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Prompts Card */}
          <Link href="/admin/prompts">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full hover:scale-[1.02] duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Manage Prompts</h3>
                    <p className="text-sm text-muted-foreground">
                      Create, edit and manage prompts
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Users Card */}
          <Link href="/admin/users">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full hover:scale-[1.02] duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Manage Users</h3>
                    <p className="text-sm text-muted-foreground">
                      View and manage all users
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          {/* Manual Payments Card */}
          <Link href="/admin/manual-payments">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full hover:scale-[1.02] duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Manual Payments</h3>
                    <p className="text-sm text-muted-foreground">
                      Verify bank transfer payments
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
