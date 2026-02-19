/**
 * Table Data Page - View and manage table records
 */

import { useParams, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/api/client";
import { DataTable } from "@/components/DataTable";

export function Component() {
  const { tableName } = useParams<{ tableName: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["table", tableName],
    queryFn: () => apiClient.getTable(tableName!),
    enabled: !!tableName,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading table...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-destructive">Error loading table: {(error as Error).message}</p>
        <Link to="/tables">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tables
          </Button>
        </Link>
      </div>
    );
  }

  const table = data?.table;
  if (!table) return null;

  return (
    <div>
      <Link to={`/tables/${tableName}`}>
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Schema
        </Button>
      </Link>

      <div className="space-y-4">
        {/* Table Header */}
        <div>
          <h1 className="text-3xl font-bold">{table.displayName}</h1>
          <p className="text-muted-foreground mt-1">
            {table.description || "No description"}
          </p>
          <div className="flex gap-2 mt-3">
            <Badge variant="secondary">Table: {table.name}</Badge>
            <Badge variant="outline">{table.fields.length} fields</Badge>
          </div>
        </div>

        {/* Data Table */}
        <DataTable table={table} />
      </div>
    </div>
  );
}
