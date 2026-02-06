/**
 * Rename Column Dialog - Rename a column while preserving data
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
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { apiClient } from "@/api/client";
import { toast } from "sonner";
import type { FieldDefinition } from "@spinekit/shared";

interface RenameColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: string;
  column: FieldDefinition;
}

export function RenameColumnDialog({
  open,
  onOpenChange,
  tableName,
  column,
}: RenameColumnDialogProps) {
  const [error, setError] = useState<string>("");
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      newName: column.name,
    },
  });

  // Update form when column changes
  useEffect(() => {
    form.reset({
      newName: column.name,
    });
  }, [column, form]);

  const renameMutation = useMutation({
    mutationFn: (newName: string) =>
      apiClient.renameColumn(tableName, column.name, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table", tableName] });
      onOpenChange(false);
      setError("");
      toast.success("Column renamed", {
        description: "The column has been successfully renamed.",
      });
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error("Failed to rename column", {
        description: err.message,
      });
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    setError("");

    const newName = data.newName.trim();

    if (!newName) {
      setError("Column name cannot be empty");
      return;
    }

    if (newName === column.name) {
      toast.info("No changes", {
        description: "The column name is already the same.",
      });
      onOpenChange(false);
      return;
    }

    renameMutation.mutate(newName);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Rename Column</DialogTitle>
          <DialogDescription>
            Change the column name. All data will be preserved.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Current Column Info */}
          <div className="p-3 border rounded-md bg-muted/50 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Current Name:</span>
              <code className="font-mono bg-background px-2 py-0.5 rounded text-sm">
                {column.name}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Type:</span>
              <Badge variant="outline">{column.type}</Badge>
              {column.required && <Badge variant="outline">Required</Badge>}
              {column.unique && <Badge variant="outline">Unique</Badge>}
            </div>
          </div>

          {/* New Name Input */}
          <div className="space-y-2">
            <Label htmlFor="newName">
              New Column Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="newName"
              placeholder="new_column_name"
              className="w-full font-mono"
              {...form.register("newName", { required: true })}
            />
            <p className="text-xs text-muted-foreground">
              Use lowercase letters, numbers, and underscores only (e.g., user_email)
            </p>
          </div>

          {/* Warning */}
          <div className="flex gap-2 p-3 border border-yellow-500/50 bg-yellow-500/5 rounded-md">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold">Important:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• All existing data will be preserved</li>
                <li>• Any API clients using the old name will need to be updated</li>
                <li>• This action cannot be undone easily</li>
              </ul>
            </div>
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
              disabled={renameMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={renameMutation.isPending}>
              {renameMutation.isPending ? "Renaming..." : "Rename Column"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
