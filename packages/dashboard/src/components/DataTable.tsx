/**
 * Data Table Component - Display records from a table
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, RefreshCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/api/client";
import type { TableSchema } from "@spinekit/shared";
import { RecordDialog } from "./RecordDialog";
import { CreateRecordDialog } from "./CreateRecordDialog";
import { DeleteRecordDialog } from "./DeleteRecordDialog";
import { ResizableDataTable } from "./ResizableDataTable";
import { toast } from "sonner";

interface DataTableProps {
  table: TableSchema;
}

export function DataTable({ table }: DataTableProps) {
  const [page, setPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState<any>(null);
  const queryClient = useQueryClient();
  const limit = 10;

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["table-data", table.name, page],
    queryFn: () =>
      apiClient.listRecords(table.name, {
        page,
        limit,
        sortBy: "created_at",
        sortOrder: "desc",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteRecord(table.name, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table-data", table.name] });
      setDeleteRecord(null);
      toast.success("Record deleted", {
        description: "The record has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to delete record", {
        description: error.message,
      });
    },
  });

  const formatValue = (value: any, type: string): string => {
    if (value === null || value === undefined) return "-";

    switch (type) {
      case "boolean":
        return value ? "Yes" : "No";
      case "date":
        try {
          return new Date(value).toLocaleString();
        } catch {
          return String(value);
        }
      case "json":
        try {
          return typeof value === "string" ? value : JSON.stringify(value, null, 2);
        } catch {
          return String(value);
        }
      case "number":
        return typeof value === "number" ? value.toLocaleString() : String(value);
      default:
        return String(value);
    }
  };

  const getFieldType = (fieldName: string): string => {
    const field = table.fields.find((f) => f.name === fieldName);
    return field?.type || "string";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <p className="text-muted-foreground">Loading data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-destructive">Error loading data: {(error as Error).message}</p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const records = data?.data || [];
  const pagination = data?.pagination;

  // Get all columns (user-defined + auto-generated)
  const columns = [
    { name: "id", displayName: "ID", type: "string" },
    ...table.fields.map((f) => ({ name: f.name, displayName: f.displayName, type: f.type })),
    { name: "created_at", displayName: "Created At", type: "date" },
    { name: "updated_at", displayName: "Updated At", type: "date" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Data Records</CardTitle>
            <CardDescription>
              {pagination?.total || 0} total record{pagination?.total !== 1 ? "s" : ""}
              {records.length > 0 && " • Click any row to view full details"}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Record
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <div>
              <p className="text-muted-foreground mb-2">No records yet</p>
              <p className="text-sm text-muted-foreground">
                Get started by adding your first record
              </p>
            </div>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Record
            </Button>
          </div>
        ) : (
          <>
            <ResizableDataTable
              columns={columns}
              records={records}
              formatValue={formatValue}
              onRowClick={(record) => setSelectedRecord(record)}
            />

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      <RecordDialog
        open={!!selectedRecord}
        onOpenChange={(open) => !open && setSelectedRecord(null)}
        record={selectedRecord}
        table={table}
        onDelete={(record) => {
          setSelectedRecord(null);
          setDeleteRecord(record);
        }}
      />

      <CreateRecordDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        table={table}
      />

      {deleteRecord && (
        <DeleteRecordDialog
          open={!!deleteRecord}
          onOpenChange={(open) => !open && setDeleteRecord(null)}
          tableName={table.displayName}
          onConfirm={() => deleteMutation.mutate(deleteRecord.id)}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </Card>
  );
}
