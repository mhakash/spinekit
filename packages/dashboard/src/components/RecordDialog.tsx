/**
 * Record Dialog - View and Edit records with smooth transitions
 */

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, X, Save } from "lucide-react";
import type { TableSchema } from "@spinekit/shared";
import { apiClient } from "@/api/client";
import { toast } from "sonner";
import { FieldInput } from "./form/FieldInput";
import { FieldDisplay } from "./form/FieldDisplay";

interface RecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: any;
  table: TableSchema;
  onDelete?: (record: any) => void;
}

export function RecordDialog({
  open,
  onOpenChange,
  record,
  table,
  onDelete,
}: RecordDialogProps) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [error, setError] = useState<string>("");
  const [currentRecord, setCurrentRecord] = useState<any>(record);
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: table.fields.reduce((acc, field) => {
      acc[field.name] = "";
      return acc;
    }, {} as Record<string, any>),
  });

  // Update local record when prop changes
  useEffect(() => {
    if (record) {
      setCurrentRecord(record);
    }
  }, [record]);

  // Reset to view mode when dialog opens/closes
  useEffect(() => {
    if (open) {
      setMode("view");
      setError("");
    }
  }, [open]);

  // Load record data into form when switching to edit mode
  useEffect(() => {
    if (currentRecord && mode === "edit") {
      const formData: Record<string, any> = {};
      table.fields.forEach((field) => {
        const value = currentRecord[field.name];

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
  }, [currentRecord, mode, table.fields, form]);

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiClient.updateRecord(table.name, currentRecord.id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["table-data", table.name] });
      // Update local record with new data
      setCurrentRecord(response.data);
      setError("");
      setMode("view");
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

  if (!currentRecord) return null;

  const formatValue = (value: any, type: string): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-sm text-muted-foreground italic">null</span>;
    }

    switch (type) {
      case "boolean":
        return (
          <Badge variant={value ? "default" : "secondary"} className="font-normal">
            {value ? "True" : "False"}
          </Badge>
        );
      case "date":
        try {
          return <span className="text-sm">{new Date(value).toLocaleString()}</span>;
        } catch {
          return <span className="text-sm">{String(value)}</span>;
        }
      case "json":
        try {
          const jsonString = typeof value === "string" ? value : JSON.stringify(value, null, 2);
          return (
            <pre className="text-xs font-mono bg-muted/50 p-3 rounded-md overflow-auto max-h-60 border mt-2">
              {jsonString}
            </pre>
          );
        } catch {
          return <span className="text-sm">{String(value)}</span>;
        }
      case "number":
        return (
          <span className="text-sm font-medium">
            {typeof value === "number" ? value.toLocaleString() : String(value)}
          </span>
        );
      default:
        return <span className="text-sm break-words">{String(value)}</span>;
    }
  };

  const getFieldType = (fieldName: string): string => {
    if (fieldName === "id") return "string";
    if (fieldName === "created_at" || fieldName === "updated_at") return "date";
    const field = table.fields.find((f) => f.name === fieldName);
    return field?.type || "string";
  };

  const getFieldDisplayName = (fieldName: string): string => {
    if (fieldName === "id") return "ID";
    if (fieldName === "created_at") return "Created At";
    if (fieldName === "updated_at") return "Updated At";
    const field = table.fields.find((f) => f.name === fieldName);
    return field?.displayName || fieldName;
  };

  const fields = Object.keys(currentRecord);
  const systemFields = ["id", "created_at", "updated_at"];
  const userFields = fields.filter((f) => !systemFields.includes(f));
  const orderedFields = ["id", ...userFields, "created_at", "updated_at"].filter((f) =>
    fields.includes(f)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "view" ? "Record Details" : `Edit ${table.displayName} Record`}
          </DialogTitle>
          <DialogDescription>
            {mode === "view"
              ? `Full record data from ${table.displayName}`
              : `Update the record in ${table.displayName} table`}
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <AnimatePresence mode="wait" initial={false}>
            {mode === "view" ? (
              <motion.div
                key="view"
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -10, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              >
              <div className="space-y-2 mt-4">
                {orderedFields.map((fieldName) => {
                  const type = getFieldType(fieldName);
                  const displayName = getFieldDisplayName(fieldName);
                  const value = currentRecord[fieldName];
                  const isSystemField = systemFields.includes(fieldName);

                  return (
                    <FieldDisplay
                      key={fieldName}
                      fieldName={fieldName}
                      displayName={displayName}
                      value={value}
                      type={type}
                      isSystemField={isSystemField}
                      formatValue={formatValue}
                    />
                  );
                })}
              </div>

              <DialogFooter className="mt-6">
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => setMode("edit")}
                    className="flex-1 sm:flex-none"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  {onDelete && (
                    <Button
                      variant="destructive"
                      onClick={() => onDelete(currentRecord)}
                      className="flex-1 sm:flex-none"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </motion.div>
          ) : (
            <motion.div
              key="edit"
              initial={{ x: 10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 10, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
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
                    onClick={() => setMode("view")}
                    disabled={updateMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
