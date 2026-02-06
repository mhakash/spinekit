/**
 * Resizable Data Table - Table with resizable columns
 */

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Column {
  name: string;
  displayName: string;
  type: string;
}

interface ResizableDataTableProps {
  columns: Column[];
  records: any[];
  formatValue: (value: any, type: string) => string;
  onRowClick: (record: any) => void;
}

export function ResizableDataTable({
  columns,
  records,
  formatValue,
  onRowClick,
}: ResizableDataTableProps) {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const initialWidths: Record<string, number> = {};
    columns.forEach((col) => {
      initialWidths[col.name] = col.name === "id" ? 150 : 200;
    });
    return initialWidths;
  });

  const [resizing, setResizing] = useState<string | null>(null);
  const [startX, setStartX] = useState<number>(0);
  const [startWidth, setStartWidth] = useState<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing) return;

      const diff = e.clientX - startX;
      const newWidth = Math.max(100, Math.min(600, startWidth + diff));

      setColumnWidths((prev) => ({
        ...prev,
        [resizing]: newWidth,
      }));
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    if (resizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing, startX, startWidth]);

  const handleResizeStart = (colName: string, e: React.MouseEvent) => {
    e.preventDefault();
    setResizing(colName);
    setStartX(e.clientX);
    setStartWidth(columnWidths[colName]);
  };

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table style={{ width: 'max-content', minWidth: '100%' }}>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={col.name}
                className="relative whitespace-nowrap select-none border-r"
                style={{
                  width: `${columnWidths[col.name]}px`,
                  minWidth: `${columnWidths[col.name]}px`,
                  maxWidth: `${columnWidths[col.name]}px`
                }}
              >
                <div className="flex items-center pr-4 overflow-hidden">
                  <span className="truncate">{col.displayName}</span>
                  <div
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors"
                    onMouseDown={(e) => handleResizeStart(col.name, e)}
                  />
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record: any, idx: number) => (
            <TableRow
              key={record.id || idx}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onRowClick(record)}
            >
              {columns.map((col) => (
                <TableCell
                  key={col.name}
                  className="overflow-hidden border-r"
                  style={{
                    width: `${columnWidths[col.name]}px`,
                    minWidth: `${columnWidths[col.name]}px`,
                    maxWidth: `${columnWidths[col.name]}px`
                  }}
                >
                  {col.name === "id" ? (
                    <code className="text-xs px-2 py-1 rounded whitespace-nowrap overflow-hidden text-ellipsis block">
                      {String(record[col.name])}
                    </code>
                  ) : col.type === "boolean" ? (
                    <Badge variant={record[col.name] ? "default" : "secondary"}>
                      {formatValue(record[col.name], col.type)}
                    </Badge>
                  ) : col.type === "json" ? (
                    <pre className="text-xs bg-muted p-2 rounded max-h-20 overflow-auto whitespace-nowwrap text-ellipsis break-all">
                      {formatValue(record[col.name], col.type)}
                    </pre>
                  ) : (
                    <div className="whitespace-nowrap overflow-hidden text-ellipsis" title={formatValue(record[col.name], col.type)}>
                      {formatValue(record[col.name], col.type)}
                    </div>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
