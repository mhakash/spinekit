/**
 * Row Detail Dialog - View full details of a single record
 */

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
import { Card } from "@/components/ui/card";
import { Pencil, Trash2 } from "lucide-react";
import type { TableSchema } from "@spinekit/shared";

interface RowDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: any;
  table: TableSchema;
  onEdit?: (record: any) => void;
  onDelete?: (record: any) => void;
}

export function RowDetailDialog({
  open,
  onOpenChange,
  record,
  table,
  onEdit,
  onDelete,
}: RowDetailDialogProps) {
  if (!record) return null;

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
          return (
            <span className="text-sm">
              {new Date(value).toLocaleString()}
            </span>
          );
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

  const fields = Object.keys(record);

  // Separate system fields from user fields for ordering
  const systemFields = ["id", "created_at", "updated_at"];
  const userFields = fields.filter((f) => !systemFields.includes(f));
  const orderedFields = [
    "id",
    ...userFields,
    "created_at",
    "updated_at",
  ].filter((f) => fields.includes(f));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Details</DialogTitle>
          <DialogDescription>
            Full record data from {table.displayName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-4">
          {orderedFields.map((fieldName) => {
            const type = getFieldType(fieldName);
            const displayName = getFieldDisplayName(fieldName);
            const value = record[fieldName];
            const isSystemField = systemFields.includes(fieldName);

            return (
              <Card
                key={fieldName}
                className={`px-3 py-2.5 gap-3 ${
                  isSystemField ? "bg-muted/30" : ""
                }`}
              >
                {/* Metadata line */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm">{displayName}</h3>
                  <span className="flex-1" />
                  <code className="text-xs font-mono text-muted-foreground">
                    {fieldName}
                  </code>
                  <Badge variant="outline" className="text-xs font-normal">
                    {type}
                  </Badge>
                  {fieldName === "id" && (
                    <Badge variant="default" className="text-xs font-normal">
                      PK
                    </Badge>
                  )}
                </div>

                {/* Data line */}
                <div className="text-sm">
                  {formatValue(value, type)}
                </div>
              </Card>
            );
          })}
        </div>

        {(onEdit || onDelete) && (
          <DialogFooter className="mt-6">
            <div className="flex gap-2 w-full sm:w-auto">
              {onEdit && (
                <Button
                  variant="outline"
                  onClick={() => onEdit(record)}
                  className="flex-1 sm:flex-none"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="destructive"
                  onClick={() => onDelete(record)}
                  className="flex-1 sm:flex-none"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
