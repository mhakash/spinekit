/**
 * Create Table Dialog Component
 */

import { useState, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Upload } from "lucide-react";
import { tableSchemaSchema, type TableSchemaInput, type FieldType } from "@spinekit/shared";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/api/client";

interface CreateTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fieldTypes: { value: FieldType; label: string }[] = [
  { value: "string", label: "String (Text)" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "json", label: "JSON" },
];

export function CreateTableDialog({ open, onOpenChange }: CreateTableDialogProps) {
  const [error, setError] = useState<string>("");
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    resolver: zodResolver(tableSchemaSchema),
    defaultValues: {
      name: "",
      displayName: "",
      description: "",
      fields: [
        {
          name: "name",
          displayName: "Name",
          type: "string" as FieldType,
          required: true,
          unique: false,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "fields",
  });

  const createMutation = useMutation({
    mutationFn: (data: TableSchemaInput) => apiClient.createTable(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      onOpenChange(false);
      form.reset();
      setError("");
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const onSubmit = form.handleSubmit((data: any) => {
    setError("");
    createMutation.mutate(data as TableSchemaInput);
  });

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedSchema = JSON.parse(text);

      // Validate the imported schema structure
      if (!importedSchema.fields || !Array.isArray(importedSchema.fields)) {
        throw new Error("Invalid schema format: fields array is required");
      }

      // Reset form with imported data
      form.reset({
        name: "",
        displayName: importedSchema.displayName || "",
        description: importedSchema.description || "",
        fields: importedSchema.fields.map((field: any) => ({
          name: field.name || "",
          displayName: field.displayName || "",
          type: field.type || "string",
          required: field.required || false,
          unique: field.unique || false,
          description: field.description || "",
        })),
      });

      toast.success("Schema imported", {
        description: `Loaded ${importedSchema.fields.length} fields from ${file.name}`,
      });
      setError("");
    } catch (err: any) {
      toast.error("Import failed", {
        description: err.message || "Failed to parse schema file",
      });
      setError("Failed to import schema: " + err.message);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="pr-8">
            <DialogTitle>Create New Table</DialogTitle>
            <DialogDescription>
              Define your table schema with fields. Each table automatically gets id, created_at, and updated_at fields.
            </DialogDescription>
          </div>
          <div className="flex justify-end mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleImportClick}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Schema
            </Button>
          </div>
        </DialogHeader>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileImport}
          className="hidden"
        />

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Table Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Table Name *</Label>
                <Input
                  id="name"
                  placeholder="users"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Lowercase letters, numbers, and underscores only
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
                  placeholder="Users"
                  {...form.register("displayName")}
                />
                {form.formState.errors.displayName && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.displayName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="User accounts and profiles"
                rows={3}
                {...form.register("description")}
              />
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Fields *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    name: "",
                    displayName: "",
                    type: "string",
                    required: false,
                    unique: false,
                  })
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Field {index + 1}</span>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`fields.${index}.name`}>Field Name *</Label>
                    <Input
                      id={`fields.${index}.name`}
                      placeholder="email"
                      {...form.register(`fields.${index}.name`)}
                    />
                    {form.formState.errors.fields?.[index]?.name && (
                      <p className="text-xs text-destructive mt-1">
                        {form.formState.errors.fields[index]?.name?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`fields.${index}.displayName`}>Display Name *</Label>
                    <Input
                      id={`fields.${index}.displayName`}
                      placeholder="Email Address"
                      {...form.register(`fields.${index}.displayName`)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`fields.${index}.type`}>Type *</Label>
                    <Select
                      value={form.watch(`fields.${index}.type`)}
                      onValueChange={(value) =>
                        form.setValue(`fields.${index}.type`, value as FieldType)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end gap-6 pb-1">
                    <label htmlFor={`fields.${index}.required`} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        id={`fields.${index}.required`}
                        {...form.register(`fields.${index}.required`)}
                        className="rounded border-input cursor-pointer"
                      />
                      <span className="text-sm font-medium leading-none">Required</span>
                    </label>
                    <label htmlFor={`fields.${index}.unique`} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        id={`fields.${index}.unique`}
                        {...form.register(`fields.${index}.unique`)}
                        className="rounded border-input cursor-pointer"
                      />
                      <span className="text-sm font-medium leading-none">Unique</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`fields.${index}.description`}>Description</Label>
                  <Input
                    id={`fields.${index}.description`}
                    placeholder="User's email address"
                    {...form.register(`fields.${index}.description`)}
                  />
                </div>
              </div>
            ))}
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
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Table"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
