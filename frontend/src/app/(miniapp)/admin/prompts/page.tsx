// app/(miniapp)/admin/prompts/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Edit,
  Package,
  PlusCircle,
  RefreshCw,
  Sparkles,
  Trash2,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { PromptFormDialog } from "@/components/admin/PromptFormDialog";
import { getImageUrl } from "@/lib/image-utils";

export default function PromptsPage() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null);

  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [promptToApprove, setPromptToApprove] = useState<any>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<any>(null);

  // Fetch prompts
  const { data: promptsData, isLoading: promptsLoading } = useQuery({
    queryKey: ["admin-prompts"],
    queryFn: () => api.get("/admin/prompts").then((res) => res.data),
  });

  // Delete mutation
  const deletePromptMutation = useMutation({
    mutationFn: (promptId: string) =>
      api.delete(`/admin/prompts/${promptId}`).then((res) => res.data),
    onSuccess: () => {
      toast.success("Prompt deleted successfully!");
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-prompts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete prompt");
    },
  });

  // Approve mutation
  const approvePromptMutation = useMutation({
    mutationFn: (promptId: string) => {
      const formData = new FormData();
      formData.append("isActive", "true");
      return api.put(`/admin/prompts/${promptId}`, formData).then((res) => res.data);
    },
    onSuccess: () => {
      toast.success("Prompt approved and published successfully!");
      setIsApproveDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-prompts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to approve prompt");
    },
  });

  const handleEditPrompt = (prompt: any) => {
    setSelectedPrompt(prompt);
    setIsEditDialogOpen(true);
  };

  const handleDeletePrompt = (prompt: any) => {
    setPromptToDelete(prompt);
    setIsDeleteDialogOpen(true);
  };

  const handleApprovePrompt = (prompt: any) => {
    setPromptToApprove(prompt);
    setIsApproveDialogOpen(true);
  };

  const prompts = promptsData?.data || [];
  const meta = promptsData?.meta || {};

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-5">
            <div className="w-10 h-10 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
              <Package className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Asset Catalog</h1>
              <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                Manage and deploy premium AI prompt assets
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="h-14 px-8 bg-[#0f172a] text-white hover:bg-indigo-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-black/10 active:scale-95 flex items-center gap-3"
          >
            <PlusCircle className="w-5 h-5" />
            Deploy New Asset
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-prompts"] })}
            className="h-14 w-14 rounded-2xl bg-white shadow-sm shadow-black/5 hover:bg-slate-50 transition-all"
          >
            <RefreshCw className={`w-5 h-5 text-slate-400 ${promptsLoading ? 'animate-spin text-indigo-500' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Prompts Table */}
      {promptsLoading ? (
        <Card className="border-none shadow-sm p-24 flex flex-col items-center justify-center bg-white rounded-[3rem]">
          <RefreshCw className="w-12 h-12 animate-spin text-indigo-500 mb-6" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Catalog...</p>
        </Card>
      ) : prompts.length === 0 ? (
        <Card className="border-none shadow-sm p-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
          <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Package className="w-12 h-12 text-slate-200" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-3">Your Vault is Empty</h3>
          <p className="text-slate-400 font-medium mb-10 max-w-sm mx-auto text-sm">
            Start building your prompt empire by deploying your first premium AI asset today.
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="h-14 px-10 bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-95">
            Create First Prompt
          </Button>
        </Card>
      ) : (
        <Card className="border-none shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-6 py-5">Product Details</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-6 py-5">Classification</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-6 py-5 text-center">Preview</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-6 py-5">Price (Stars)</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-6 py-5 text-center">Status</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-6 py-5 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prompts.map((prompt: any) => (
                  <TableRow key={prompt.id} className="group hover:bg-slate-50/50 transition-colors border-slate-100">
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-slate-800 truncate">{prompt.title}</span>
                        <span className="text-[10px] font-medium text-slate-400 truncate max-w-[250px]">
                          {prompt.description}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-[9px] font-black uppercase tracking-widest">
                        {prompt.category.replace("_", "/")}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex justify-center">
                        {prompt.imageUrl ? (
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-md border border-white">
                            <img
                              src={getImageUrl(prompt.imageUrl)}
                              alt={prompt.imageAlt || prompt.title}
                              className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-500"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg";
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-700">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                        <span>{prompt.priceStars}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${prompt.isActive
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : "bg-rose-100 text-rose-700 border border-rose-200"
                          }`}
                      >
                        {prompt.isActive ? "Online" : "Draft"}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!prompt.isActive && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleApprovePrompt(prompt)}
                            disabled={approvePromptMutation.isPending}
                            className="h-8 w-8 rounded-xl text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition-all"
                            title="Approve Prompt"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditPrompt(prompt)}
                          className="h-8 w-8 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeletePrompt(prompt)}
                          disabled={deletePromptMutation.isPending}
                          className="h-8 w-8 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-8 py-6 bg-slate-50 border-t border-slate-100">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Showing {prompts.length} of {meta.total} prompts
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={meta.page <= 1} className="h-8 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest">
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page >= meta.totalPages}
                  className="h-8 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Create Prompt Dialog */}
      <PromptFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        mode="create"
      />

      {/* Edit Prompt Dialog */}
      <PromptFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        mode="edit"
        prompt={selectedPrompt}
      />

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Prompt</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve and publish "{promptToApprove?.title}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (promptToApprove) {
                  approvePromptMutation.mutate(promptToApprove.id);
                }
              }}
              disabled={approvePromptMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {approvePromptMutation.isPending ? "Approving..." : "Yes, Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Prompt</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{promptToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (promptToDelete) {
                  deletePromptMutation.mutate(promptToDelete.id);
                }
              }}
              disabled={deletePromptMutation.isPending}
              variant="destructive"
            >
              {deletePromptMutation.isPending ? "Deleting..." : "Yes, Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
