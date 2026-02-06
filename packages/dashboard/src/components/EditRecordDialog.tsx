/**
 * Edit Record Dialog - Update existing records
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
import { apiClient } from "@/api/client";
import type { TableSchema } from "@spinekit/shared";
import { toast } from "sonner";
import { FieldInput } from "./form/FieldInput";

interface EditRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: TableSchema;
  record: any;
}

export function EditRecordDialog({
  open,
  onOpenChange,
  table,
  record,
}: EditRecordDialogProps) {
  const [error, setError] = useState<string>("");
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: table.fields.reduce((acc, field) => {
      acc[field.name] = "";
      return acc;
    }, {} as Record<string, any>),
  });

  // Reset form with record data when dialog opens
  useEffect(() => {
    if (record) {
      const formData: Record<string, any> = {};
      table.fields.forEach((field) => {
        const value = record[field.name];

        switch (field.type) {
          case "json":
            formData[field.name] =
              value !== null && value !== undefined
                ? typeof value === "string"
                  ? value
                  : JSON.stringify(value, null, 2)
                : "";
            break;
          case "date":
            if (value) {
              try {
                // Convert to datetime-local format
                const date = new Date(value);
                formData[field.name] = date.toISOString().slice(0, 16);
              } catch {
                formData[field.name] = "";
              }
            } else {
              formData[field.name] = "";
            }
            break;
          case "boolean":
            formData[field.name] = Boolean(value);
            break;
          default:
            formData[field.name] = value ?? "";
        }
      });
      form.reset(formData);
    }
  }, [record, table.fields, form]);

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiClient.updateRecord(table.name, record.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table-data", table.name] });
      onOpenChange(false);
      setError("");
      toast.success("Record updated", {
        description: "The record has been successfully updated.",
      });
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error("Failed to update record", {
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
          processedData[field.name] = null;
          return;
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

    updateMutation.mutate(processedData);
  });

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {table.displayName} Record</DialogTitle>
          <DialogDescription>
            Update the record in {table.displayName} table
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
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
