// app/(miniapp)/prompts/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { PromptCard } from "@/components/PromptCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, ArrowLeft } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";

const categories = [
  { value: "ALL", label: "All Categories" },
  { value: "UI_UX", label: "🎨 UI/UX Design" },
  { value: "Code", label: "💻 Code Generation" },
  { value: "Images", label: "🖼️ Image Prompts" },
  { value: "Writing", label: "✍️ Writing Assistants" },
  { value: "Business", label: "💼 Business Tools" },
  { value: "Marketing", label: "📈 Marketing" },
  { value: "Productivity", label: "⚡ Productivity" },
  { value: "Education", label: "🎓 Education" },
  { value: "Others", label: "📦 Other" },
];

export default function PromptsPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data: response, isLoading } = useQuery({
    queryKey: ["prompts", { search, category, page, limit, userId: user?.id }],
    queryFn: () =>
      api
        .get("/prompts", {
          params: {
            search: search || undefined,
            category: category !== "ALL" ? category : undefined,
            page,
            limit,
            includePurchased: false,
          },
        })
        .then((res) => res.data),
  });

  const prompts = response?.data || [];
  const meta = response?.meta || {
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
  };
  return (
    <div className="p-4 space-y-6">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-3xl font-bold mb-2">Prompt Marketplace</h1>
        <p className="text-muted-foreground">
          Discover premium AI prompts for code, design, writing, and more
        </p>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search prompts by title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <div className="w-full sm:w-64">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
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

        {/* Results Count */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {meta.total} prompt{meta.total !== 1 ? "s" : ""} found
          </p>
          <div className="text-sm text-muted-foreground">
            Page {meta.page} of {meta.totalPages}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="border rounded-lg p-4 animate-pulse">
              <div className="h-48 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : prompts.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-muted/20">
          <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No Prompts Found</h3>
          <p className="text-muted-foreground mb-6">
            {search || category !== "ALL"
              ? "Try adjusting your search or filter"
              : "No prompts available yet"}
          </p>
          {(search || category !== "ALL") && (
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setCategory("ALL");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Prompts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prompts.map((prompt: any) => {
              const isCreator = user && (prompt.creator?.id === user.id || prompt.creatorId === user.id);
              return (
                <PromptCard
                  key={prompt.id}
                  prompt={{
                    ...prompt,
                    hasAccess: prompt.hasAccess || isCreator || false,
                    isCreator: !!isCreator,
                  }}
                />
              );
            })}
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {page} of {meta.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Call to Action */}
      <div className="mt-12 text-center">
        <h2 className="text-2xl font-semibold mb-4">
          Can't find what you're looking for?
        </h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Suggest a prompt or category you'd like to see in our marketplace.
        </p>
        <Link href="/contact">
          <Button variant="outline">Request a Prompt</Button>
        </Link>
      </div>
    </div>
  );
}
