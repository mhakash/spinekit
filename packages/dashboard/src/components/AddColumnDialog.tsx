/**
 * Add Column Dialog - Add new column to existing table
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/api/client";
import { toast } from "sonner";

interface AddColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: string;
}

const FIELD_TYPES = [
  { value: "string", label: "String", description: "Text values" },
  { value: "number", label: "Number", description: "Numeric values" },
  { value: "boolean", label: "Boolean", description: "True/false values" },
  { value: "date", label: "Date", description: "Date and time values" },
  { value: "json", label: "JSON", description: "JSON objects" },
];

export function AddColumnDialog({ open, onOpenChange, tableName }: AddColumnDialogProps) {
  const [error, setError] = useState<string>("");
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      name: "",
      displayName: "",
      type: "string",
      required: false,
      unique: false,
      defaultValue: "",
      description: "",
    },
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => apiClient.addColumn(tableName, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table", tableName] });
      onOpenChange(false);
      form.reset();
      setError("");
      toast.success("Column added", {
        description: "The column has been successfully added to the table.",
      });
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error("Failed to add column", {
        description: err.message,
      });
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    setError("");

    const fieldDefinition: any = {
      name: data.name.trim(),
      displayName: data.displayName.trim(),
      type: data.type,
      required: data.required,
      unique: data.unique,
    };

    // Add default value if provided
    if (data.defaultValue.trim()) {
      fieldDefinition.defaultValue = data.defaultValue.trim();
    }

    // Add description if provided
    if (data.description.trim()) {
      fieldDefinition.description = data.description.trim();
    }

    addMutation.mutate(fieldDefinition);
  });

  const watchRequired = form.watch("required");
  const watchDefaultValue = form.watch("defaultValue");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Column to {tableName}</DialogTitle>
          <DialogDescription>
            Add a new field to the table. Required columns must have a default value.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Column Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Column Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="user_email"
              className="w-full font-mono"
              {...form.register("name", { required: true })}
            />
            <p className="text-xs text-muted-foreground">
              Database column name (lowercase, underscores, no spaces)
            </p>
          </div>

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

          {/* Field Type */}
          <div className="space-y-2">
            <Label htmlFor="type">
              Field Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.watch("type")}
              onValueChange={(value) => form.setValue("type", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select field type" />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{type.label}</span>
                      <span className="text-xs text-muted-foreground">
                        - {type.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Constraints */}
          <div className="space-y-3 p-3 border rounded-md">
            <h3 className="font-semibold text-sm">Constraints</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="required" className="font-normal">
                  Required
                </Label>
                <p className="text-xs text-muted-foreground">
                  Field must have a value (needs default value)
                </p>
              </div>
              <Switch
                id="required"
                checked={form.watch("required")}
                onCheckedChange={(checked) => form.setValue("required", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="unique" className="font-normal">
                  Unique
                </Label>
                <p className="text-xs text-muted-foreground">
                  Values must be unique across all records
                </p>
              </div>
              <Switch
                id="unique"
                checked={form.watch("unique")}
                onCheckedChange={(checked) => form.setValue("unique", checked)}
              />
            </div>
          </div>

          {/* Default Value */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="defaultValue">Default Value</Label>
              {watchRequired && !watchDefaultValue && (
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              )}
            </div>
            <Input
              id="defaultValue"
              placeholder={watchRequired ? "Must provide default value" : "Optional"}
              className="w-full"
              {...form.register("defaultValue")}
            />
            <p className="text-xs text-muted-foreground">
              Value for existing records. Required if field is marked as required.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the purpose of this field"
              rows={2}
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
              disabled={addMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addMutation.isPending}>
              {addMutation.isPending ? "Adding..." : "Add Column"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
