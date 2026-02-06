/**
 * Edit Column Dialog - Update column metadata (display name, description)
 */

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/api/client";
import { toast } from "sonner";
import type { FieldDefinition } from "@spinekit/shared";

interface EditColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: string;
  column: FieldDefinition;
}

export function EditColumnDialog({
  open,
  onOpenChange,
  tableName,
  column,
}: EditColumnDialogProps) {
  const [error, setError] = useState<string>("");
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      displayName: column.displayName,
      description: column.description || "",
    },
  });

  // Update form when column changes
  useEffect(() => {
    form.reset({
      displayName: column.displayName,
      description: column.description || "",
    });
  }, [column, form]);

  const updateMutation = useMutation({
    mutationFn: (data: { displayName?: string; description?: string }) =>
      apiClient.updateColumnMetadata(tableName, column.name, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table", tableName] });
      onOpenChange(false);
      setError("");
      toast.success("Column updated", {
        description: "The column metadata has been successfully updated.",
      });
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error("Failed to update column", {
        description: err.message,
      });
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    setError("");

    const updates: any = {};

    if (data.displayName.trim() !== column.displayName) {
      updates.displayName = data.displayName.trim();
    }

    if (data.description.trim() !== (column.description || "")) {
      updates.description = data.description.trim();
    }

    if (Object.keys(updates).length === 0) {
      toast.info("No changes", {
        description: "No changes were made to the column.",
      });
      onOpenChange(false);
      return;
    }

    updateMutation.mutate(updates);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Column: {column.name}</DialogTitle>
          <DialogDescription>
            Update display name and description for this column
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">
              Display Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="displayName"
              placeholder="User Email"
              className="w-full"
              {...form.register("displayName", { required: true })}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the purpose of this field"
              rows={3}
              className="w-full"
              {...form.register("description")}
            />
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
