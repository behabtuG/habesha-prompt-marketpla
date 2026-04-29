// app/(miniapp)/admin/users/page.tsx
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";

export default function UsersPage() {
  const queryClient = useQueryClient();

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.get("/admin/users").then((res) => res.data),
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) =>
      api
        .post(`/admin/users/${userId}/role`, { isAdmin })
        .then((res) => res.data),
    onSuccess: () => {
      toast.success("User role updated!");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update user role"
      );
    },
  });

  const handleToggleUserRole = (userId: string, currentIsAdmin: boolean) => {
    if (
      !confirm(
        `Are you sure you want to ${
          currentIsAdmin ? "demote" : "promote"
        } this user?`
      )
    ) {
      return;
    }
    updateUserRoleMutation.mutate({ userId, isAdmin: !currentIsAdmin });
  };

  const users = usersData?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Manage Users</h2>
        <p className="text-muted-foreground">
          View and manage all registered users
        </p>
      </div>

      {usersLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading users...</p>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Telegram ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((userItem: any) => (
                  <TableRow key={userItem.id}>
                    <TableCell>
                      <div className="font-medium">
                        {userItem.firstName || userItem.username || "Anonymous"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        @{userItem.username || "no-username"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs">{userItem.telegramId}</code>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          userItem.isAdmin
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {userItem.isAdmin ? "Admin" : "User"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-yellow-500" />
                        <span>{userItem.balanceStars}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(userItem.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleToggleUserRole(userItem.id, userItem.isAdmin)
                        }
                        disabled={updateUserRoleMutation.isPending}
                      >
                        {userItem.isAdmin ? "Demote" : "Promote"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
