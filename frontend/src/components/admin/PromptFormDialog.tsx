// components/admin/PromptFormDialog.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, EyeOff, RefreshCw, Upload, X, Lock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { getImageUrl } from "@/lib/image-utils";
import { Badge } from "@/components/ui/badge";

const categories = [
  { value: "UI_UX", label: "🎨 UI/UX Design" },
  { value: "Code", label: "💻 Code Generation" },
  { value: "Images", label: "🖼️ Image Prompts" },
  { value: "Writing", label: "✍️ Writing Assistants" },
  { value: "Business", label: "💼 Business Tools" },
  { value: "Marketing", label: "📈 Marketing" },
  { value: "Productivity", label: "⚡ Productivity" },
  { value: "Education", label: "🎓 Education" },
];

// Define types for better TypeScript support
interface PromptFormData {
  title: string;
  description: string;
  category: string;
  priceStars: number;
  priceTon: number;
  priceLocal: number;
  previewContent: string;
  fullContent: string;
  imageFile: File | null;
  imageAlt: string;
}

interface DecryptedPrompt {
  id: string;
  title: string;
  description: string;
  category: string;
  priceStars: number;
  priceTon: number;
  priceLocal: number;
  previewContent: string;
  fullContent: string;
  imageUrl?: string;
  imageAlt?: string;
}

interface PromptFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  prompt?: any;
}

export function PromptFormDialog({
  open,
  onOpenChange,
  mode,
  prompt,
}: PromptFormDialogProps) {
  const queryClient = useQueryClient();
  const [showFullContent, setShowFullContent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isDecrypting, setIsDecrypting] = useState(false);

  const [formData, setFormData] = useState<PromptFormData>({
    title: "",
    description: "",
    category: "Code",
    priceStars: 100,
    priceTon: 0,
    priceLocal: 0,
    previewContent: "",
    fullContent: "",
    imageFile: null,
    imageAlt: "",
  });

  // Fetch decrypted content when in edit mode
  const { data: decryptedPromptData, isLoading: isLoadingDecrypted } = useQuery(
    {
      queryKey: ["prompt-for-edit", prompt?.id],
      queryFn: () =>
        api
          .get(`/admin/prompts/${prompt?.id}/edit`)
          .then((res) => res.data.data as DecryptedPrompt),
      enabled: mode === "edit" && open && !!prompt?.id,
      staleTime: 0, // Always fetch fresh data
      gcTime: 0,
    }
  );

  // Initialize form
  useEffect(() => {
    if (mode === "edit" && prompt) {
      console.log("🔍 Edit mode prompt data:", {
        id: prompt.id,
        hasFullContent: !!prompt.fullContent,
        fullContentLength: prompt.fullContent?.length,
        fullContentPreview: prompt.fullContent?.substring(0, 50) + "...",
        isEncrypted: prompt.fullContent?.includes("U2FsdGVkX"), // Common CryptoJS prefix
      });

      // Try to manually decrypt if we have encrypted content
      const initializeWithDecryption = async () => {
        if (prompt.fullContent && prompt.fullContent.length > 100) {
          // Likely encrypted content (long base64 string)
          setIsDecrypting(true);
          try {
            console.log(
              "🔄 Content appears encrypted, fetching decrypted version..."
            );

            // For now, show a placeholder
            setFormData({
              title: prompt.title,
              description: prompt.description,
              category: prompt.category,
              priceStars: prompt.priceStars,
              priceTon: prompt.priceTon || 0,
              priceLocal: prompt.priceLocal || 0,
              previewContent: prompt.previewContent,
              fullContent: "[ENCRYPTED - Loading decrypted version...]",
              imageFile: null,
              imageAlt: prompt.imageAlt || "",
            });
          } catch (error) {
            console.error("Failed to handle encrypted content:", error);
            setFormData({
              title: prompt.title,
              description: prompt.description,
              category: prompt.category,
              priceStars: prompt.priceStars,
              priceTon: prompt.priceTon || 0,
              priceLocal: prompt.priceLocal || 0,
              previewContent: prompt.previewContent,
              fullContent: prompt.fullContent || "", // Show as-is
              imageFile: null,
              imageAlt: prompt.imageAlt || "",
            });
          } finally {
            setIsDecrypting(false);
          }
        } else {
          // Not encrypted or already decrypted
          setFormData({
            title: prompt.title,
            description: prompt.description,
            category: prompt.category,
            priceStars: prompt.priceStars,
            priceTon: prompt.priceTon || 0,
            priceLocal: prompt.priceLocal || 0,
            previewContent: prompt.previewContent,
            fullContent: prompt.fullContent || "",
            imageFile: null,
            imageAlt: prompt.imageAlt || "",
          });
        }

        if (prompt.imageUrl) {
          setImagePreview(getImageUrl(prompt.imageUrl));
        }
      };

      initializeWithDecryption();
    } else {
      // Create mode
      setFormData({
        title: "",
        description: "",
        category: "Code",
        priceStars: 100,
        priceTon: 0,
        priceLocal: 0,
        previewContent: "",
        fullContent: "",
        imageFile: null,
        imageAlt: "",
      });
      setImagePreview("");
    }
  }, [mode, prompt, open]);

  // Update form when decrypted data arrives
  useEffect(() => {
    if (decryptedPromptData && mode === "edit") {
      console.log("✅ Decrypted prompt received:", {
        id: decryptedPromptData.id,
        fullContentLength: decryptedPromptData.fullContent?.length,
        preview: decryptedPromptData.fullContent?.substring(0, 50) + "...",
      });

      setFormData((prev) => ({
        ...prev,
        fullContent: decryptedPromptData.fullContent || "",
      }));
    }
  }, [decryptedPromptData, mode]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simple validation
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setFormData({
      ...formData,
      imageFile: file,
      imageAlt: formData.imageAlt || formData.title,
    });
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setFormData({
      ...formData,
      imageFile: null,
      imageAlt: "",
    });
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Create mutation
  const createPromptMutation = useMutation({
    mutationFn: async (data: PromptFormData) => {
      const formDataToSend = new FormData();

      // Add all form fields
      Object.keys(data).forEach((key) => {
        const value = data[key as keyof PromptFormData];
        if (key !== "imageFile" && value !== undefined && value !== null) {
          formDataToSend.append(key, String(value));
        }
      });

      // Add image if exists
      if (data.imageFile) {
        formDataToSend.append("image", data.imageFile);
      }

      const response = await api.post("/admin/prompts", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Prompt created successfully!");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["admin-prompts"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create prompt");
    },
  });

  // Update mutation
  const updatePromptMutation = useMutation({
    mutationFn: async (data: PromptFormData) => {
      const formDataToSend = new FormData();

      Object.keys(data).forEach((key) => {
        const value = data[key as keyof PromptFormData];
        if (key !== "imageFile" && value !== undefined && value !== null) {
          formDataToSend.append(key, String(value));
        }
      });

      if (data.imageFile) {
        formDataToSend.append("image", data.imageFile);
      }

      const response = await api.put(
        `/admin/prompts/${prompt.id}`,
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Prompt updated successfully!");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["admin-prompts"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update prompt");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.fullContent) {
      toast.error("Title, description, and content are required");
      return;
    }

    // Check if content still shows as encrypted placeholder
    if (formData.fullContent.includes("[ENCRYPTED - Loading")) {
      toast.error("Please wait for content to be decrypted before saving");
      return;
    }

    const submitData = {
      ...formData,
      priceStars: Number(formData.priceStars),
      priceTon: formData.priceTon ? Number(formData.priceTon) : 0,
      priceLocal: formData.priceLocal ? Number(formData.priceLocal) : 0,
      imageFile: formData.imageFile,
    };

    if (mode === "create") {
      createPromptMutation.mutate(submitData);
    } else {
      updatePromptMutation.mutate(submitData);
    }
  };

  const isLoading =
    mode === "create"
      ? createPromptMutation.isPending
      : updatePromptMutation.isPending || isLoadingDecrypted || isDecrypting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Prompt" : "Edit Prompt"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Basic Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Modern React Dashboard"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="What this prompt creates"
                rows={2}
                required
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between pb-2">
              <Label className="text-base font-bold text-slate-700">Pricing</Label>
              <Button
                type="button"
                variant={formData.priceStars === 0 ? "secondary" : "outline"}
                size="sm"
                onClick={() => {
                  if (formData.priceStars > 0) {
                    setFormData({
                      ...formData,
                      priceStars: 0,
                      priceTon: 0,
                      priceLocal: 0,
                    });
                  } else {
                    setFormData({ ...formData, priceStars: 100 });
                  }
                }}
                className={
                  formData.priceStars === 0
                    ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200 font-bold"
                    : "text-slate-500 hover:text-slate-700 font-medium"
                }
              >
                {formData.priceStars === 0 ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                    Free Registration
                  </>
                ) : (
                  "Switch to Free"
                )}
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Stars *</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.priceStars}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priceStars: Number(e.target.value),
                    })
                  }
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label>TON Price</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.priceTon}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priceTon: Number(e.target.value),
                    })
                  }
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label>Local Price</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.priceLocal}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priceLocal: Number(e.target.value),
                    })
                  }
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Example Image (Optional)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                  disabled={isLoading}
                />

                {imagePreview ? (
                  <div className="space-y-3">
                    <div className="relative h-48 rounded overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded"
                        disabled={isLoading}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        value={formData.imageAlt}
                        onChange={(e) =>
                          setFormData({ ...formData, imageAlt: e.target.value })
                        }
                        placeholder="Image description"
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                      >
                        Change Image
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-8 flex flex-col items-center justify-center text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    disabled={isLoading}
                  >
                    <Upload className="w-8 h-8 mb-2" />
                    <span>Click to upload example image</span>
                    <span className="text-sm">PNG, JPG, WebP up to 5MB</span>
                  </button>
                )}
              </div>
            </div>

            {/* Full Content */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Label>Full Content *</Label>
                  {mode === "edit" && isDecrypting && (
                    <span className="flex items-center gap-1 text-xs text-yellow-600">
                      <Lock className="w-3 h-3" />
                      Decrypting...
                    </span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFullContent(!showFullContent)}
                  disabled={isLoading}
                >
                  {showFullContent ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  {showFullContent ? "Hide" : "Show"}
                </Button>
              </div>
              <Textarea
                value={formData.fullContent}
                onChange={(e) =>
                  setFormData({ ...formData, fullContent: e.target.value })
                }
                rows={showFullContent ? 10 : 4}
                required
                className={!showFullContent ? "blur-sm" : ""}
                placeholder="Complete prompt content users will receive"
                disabled={isLoading}
              />
              {mode === "edit" &&
                formData.fullContent?.includes("U2FsdGVkX") && (
                  <div className="text-xs text-amber-600 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Content appears encrypted. Save will re-encrypt it.
                  </div>
                )}
            </div>

            {/* Preview Content */}
            <div className="space-y-2">
              <Label>Preview Content</Label>
              <Textarea
                value={formData.previewContent}
                onChange={(e) =>
                  setFormData({ ...formData, previewContent: e.target.value })
                }
                rows={2}
                placeholder="Short preview shown to users"
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {mode === "create"
                    ? "Creating..."
                    : isDecrypting
                      ? "Decrypting..."
                      : "Updating..."}
                </>
              ) : mode === "create" ? (
                "Create Prompt"
              ) : (
                "Update Prompt"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
