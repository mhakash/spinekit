/**
 * Delete Column Dialog - Confirmation dialog for column deletion
 */

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { apiClient } from "@/api/client";
import { toast } from "sonner";
import type { FieldDefinition } from "@spinekit/shared";

interface DeleteColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: string;
  column: FieldDefinition;
}

export function DeleteColumnDialog({
  open,
  onOpenChange,
  tableName,
  column,
}: DeleteColumnDialogProps) {
  const [error, setError] = useState<string>("");
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.deleteColumn(tableName, column.name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table", tableName] });
      onOpenChange(false);
      setError("");
      toast.success("Column deleted", {
        description: `Column '${column.displayName}' has been permanently removed.`,
      });
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error("Failed to delete column", {
        description: err.message,
      });
    },
  });

  const handleDelete = () => {
    setError("");
    deleteMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Column
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. All data in this column will be permanently deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 border border-destructive/50 bg-destructive/5 rounded-md space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Column:</span>
              <code className="font-mono bg-muted px-2 py-0.5 rounded text-sm">
                {column.name}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Display Name:</span>
              <span>{column.displayName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Type:</span>
              <Badge variant="outline">{column.type}</Badge>
            </div>
            {column.description && (
              <div className="flex items-start gap-2">
                <span className="font-semibold">Description:</span>
                <span className="text-sm text-muted-foreground">{column.description}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-destructive">Warning:</p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>All data in this column will be permanently deleted</li>
              <li>This action cannot be undone</li>
              <li>Make sure you have a backup if needed</li>
            </ul>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete Column"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
