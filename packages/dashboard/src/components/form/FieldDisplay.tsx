/**
 * FieldDisplay - Reusable component for displaying field data in view mode
 */

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface FieldDisplayProps {
  fieldName: string;
  displayName: string;
  value: any;
  type: string;
  isSystemField?: boolean;
  formatValue: (value: any, type: string) => React.ReactNode;
}

export function FieldDisplay({
  fieldName,
  displayName,
  value,
  type,
  isSystemField = false,
  formatValue,
}: FieldDisplayProps) {
  return (
    <Card
      className={`px-3 py-2.5 gap-3 ${isSystemField ? "bg-muted/30" : ""}`}
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
      <div className="text-sm mt-2">{formatValue(value, type)}</div>
    </Card>
  );
}
