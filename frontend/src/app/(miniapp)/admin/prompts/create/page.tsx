// app/(miniapp)/admin/prompts/create/page.tsx
"use client";

import { PromptFormDialog } from "@/components/admin/PromptFormDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Package } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreatePromptPage() {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(true);

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    router.push("/admin/prompts");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin/prompts")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Prompts
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Create New Prompt</h2>
          <p className="text-muted-foreground">
            Add a new prompt to the marketplace
          </p>
        </div>
      </div>

      {/* Form Card (for initial view) */}
      <Card className="p-6">
        <div className="text-center py-8">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Create New Prompt</h3>
          <p className="text-muted-foreground mb-6">
            Click the button below to open the prompt creation form
          </p>
          <Button onClick={() => setIsDialogOpen(true)} size="lg">
            Open Prompt Form
          </Button>
        </div>
      </Card>

      {/* Form Dialog */}
      <PromptFormDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        mode="create"
      />
    </div>
  );
}
