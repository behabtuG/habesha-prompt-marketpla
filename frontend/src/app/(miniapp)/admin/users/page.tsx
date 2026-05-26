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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {usersLoading ? (
        <Card className="border-none shadow-sm p-20 flex flex-col items-center justify-center">
          <RefreshCw className="w-10 h-10 animate-spin text-yellow-500 mb-4" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Records...</p>
        </Card>
      ) : (
        <Card className="border-none shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-6 py-5">Administrator / User</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-6 py-5">Account ID</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-6 py-5">Privileges</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-6 py-5">Wallet (Stars)</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-6 py-5">Registration Date</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-6 py-5 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((userItem: any) => (
                  <TableRow key={userItem.id} className="group hover:bg-slate-50/50 transition-colors border-slate-100">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-200">
                           {userItem.firstName?.slice(0, 2).toUpperCase() || "UN"}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800">
                            {userItem.firstName || userItem.username || "Anonymous"}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400">
                            @{userItem.username || "no-username"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <code className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded text-slate-500 uppercase tracking-tight">{userItem.telegramId}</code>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          userItem.isAdmin
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {userItem.isAdmin ? "Admin" : "Standard"}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-700">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                        <span>{userItem.balanceStars}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-[11px] font-bold text-slate-500">
                      {new Date(userItem.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleToggleUserRole(userItem.id, userItem.isAdmin)
                        }
                        className={`h-8 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                           userItem.isAdmin 
                             ? "text-rose-500 hover:bg-rose-50" 
                             : "text-indigo-500 hover:bg-indigo-50"
                        }`}
                        disabled={updateUserRoleMutation.isPending}
                      >
                        {userItem.isAdmin ? "Revoke" : "Authorize"}
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
