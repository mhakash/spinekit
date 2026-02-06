/**
 * FieldInput - Reusable input component for different field types
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import type { UseFormReturn } from "react-hook-form";

interface Field {
  name: string;
  displayName: string;
  type: string;
  required?: boolean;
  unique?: boolean;
  description?: string;
}

interface FieldInputProps {
  field: Field;
  form: UseFormReturn<any>;
}

export function FieldInput({ field, form }: FieldInputProps) {
  return (
    <div className="space-y-2">
      {/* Field Label */}
      <div className="flex items-center gap-2 flex-wrap">
        <Label htmlFor={field.name}>
          {field.displayName}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Badge variant="outline" className="text-xs">
          {field.type}
        </Badge>
        {field.unique && (
          <Badge variant="secondary" className="text-xs">
            Unique
          </Badge>
        )}
      </div>

      {/* Field Description */}
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}

      {/* Field Input */}
      <div className="w-full">
        {field.type === "boolean" ? (
          <div className="flex items-center justify-between py-2">
            <Label htmlFor={field.name} className="font-normal">
              {field.displayName}
            </Label>
            <Switch
              id={field.name}
              checked={form.watch(field.name)}
              onCheckedChange={(checked) => form.setValue(field.name, checked)}
            />
          </div>
        ) : field.type === "json" ? (
          <Textarea
            id={field.name}
            placeholder='{"key": "value"}'
            rows={4}
            className="font-mono text-xs w-full"
            {...form.register(field.name, { required: field.required })}
          />
        ) : field.type === "date" ? (
          <Input
            type="datetime-local"
            id={field.name}
            className="w-full"
            {...form.register(field.name, { required: field.required })}
          />
        ) : field.type === "number" ? (
          <Input
            type="number"
            id={field.name}
            step="any"
            className="w-full"
            {...form.register(field.name, { required: field.required })}
          />
        ) : (
          <Input
            type="text"
            id={field.name}
            placeholder={`Enter ${field.displayName.toLowerCase()}`}
            className="w-full"
            {...form.register(field.name, { required: field.required })}
          />
        )}
      </div>

      {/* Field Error */}
      {form.formState.errors[field.name] && (
        <p className="text-sm text-destructive">{field.displayName} is required</p>
      )}
    </div>
  );
}
