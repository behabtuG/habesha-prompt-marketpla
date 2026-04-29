// app/(miniapp)/admin/prompts/page.tsx
"use client";

import { useState } from "react";
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
import {
  Edit,
  Package,
  PlusCircle,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PromptFormDialog } from "@/components/admin/PromptFormDialog";
import { getImageUrl } from "@/lib/image-utils";

export default function PromptsPage() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null);

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
      queryClient.invalidateQueries({ queryKey: ["admin-prompts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete prompt");
    },
  });

  const handleEditPrompt = (prompt: any) => {
    setSelectedPrompt(prompt);
    setIsEditDialogOpen(true);
  };

  const handleDeletePrompt = (prompt: any) => {
    if (confirm(`Are you sure you want to delete "${prompt.title}"?`)) {
      deletePromptMutation.mutate(prompt.id);
    }
  };

  const prompts = promptsData?.data || [];
  const meta = promptsData?.meta || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Manage Prompts</h2>
          <p className="text-muted-foreground">
            Create, edit, and manage prompts in the marketplace
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <PlusCircle className="w-4 h-4" />
          Add Prompt
        </Button>
      </div>

      {/* Prompts Table */}
      {promptsLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading prompts...</p>
        </div>
      ) : prompts.length === 0 ? (
        <Card className="text-center py-12">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Prompts Yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first prompt to get started
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            Create First Prompt
          </Button>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prompts.map((prompt: any) => (
                  <TableRow key={prompt.id}>
                    <TableCell>
                      <div className="font-medium">{prompt.title}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {prompt.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">
                        {prompt.category.replace("_", "/")}
                      </span>
                    </TableCell>
                    <TableCell>
                      {prompt.imageUrl ? (
                        <div className="relative w-12 h-12">
                          <img
                            src={getImageUrl(prompt.imageUrl)}
                            alt={prompt.imageAlt || prompt.title}
                            className="rounded object-cover w-full h-full"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg";
                            }}
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          No image
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-yellow-500" />
                        <span className="font-semibold">
                          {prompt.priceStars}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ⭐
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {prompt._count?.purchases || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          prompt.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {prompt.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(prompt.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditPrompt(prompt)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeletePrompt(prompt)}
                          disabled={deletePromptMutation.isPending}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
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
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {prompts.length} of {meta.total} prompts
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={meta.page <= 1}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page >= meta.totalPages}
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
    </div>
  );
}
