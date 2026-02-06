/**
 * Create Record Dialog - Add new records to a table
 */

import { useState } from "react";
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
import { apiClient } from "@/api/client";
import type { TableSchema } from "@spinekit/shared";
import { toast } from "sonner";
import { FieldInput } from "./form/FieldInput";

interface CreateRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: TableSchema;
}

export function CreateRecordDialog({
  open,
  onOpenChange,
  table,
}: CreateRecordDialogProps) {
  const [error, setError] = useState<string>("");
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: table.fields.reduce((acc, field) => {
      acc[field.name] = field.type === "boolean" ? false : "";
      return acc;
    }, {} as Record<string, any>),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiClient.createRecord(table.name, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table-data", table.name] });
      onOpenChange(false);
      form.reset();
      setError("");
      toast.success("Record created", {
        description: "The record has been successfully created.",
      });
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error("Failed to create record", {
        description: err.message,
      });
    },
  });

  const onSubmit = form.handleSubmit((data: any) => {
    setError("");

    // Process data based on field types
    const processedData: Record<string, any> = {};
    table.fields.forEach((field) => {
      const value = data[field.name];

      if (value === "" || value === null || value === undefined) {
        if (!field.required) {
          return; // Skip optional empty fields
        }
      }

      switch (field.type) {
        case "number":
          processedData[field.name] = value === "" ? null : Number(value);
          break;
        case "boolean":
          processedData[field.name] = Boolean(value);
          break;
        case "json":
          if (value && value.trim()) {
            try {
              // Validate JSON by parsing, but send as string
              JSON.parse(value);
              processedData[field.name] = value;
            } catch {
              setError(`Invalid JSON in field: ${field.displayName}`);
              return;
            }
          } else {
            processedData[field.name] = null;
          }
          break;
        case "date":
          processedData[field.name] = value ? new Date(value).toISOString() : null;
          break;
        default:
          processedData[field.name] = value;
      }
    });

    createMutation.mutate(processedData);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create {table.displayName} Record</DialogTitle>
          <DialogDescription>
            Add a new record to the {table.displayName} table
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {table.fields.map((field) => (
            <FieldInput key={field.name} field={field} form={form} />
          ))}

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
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
