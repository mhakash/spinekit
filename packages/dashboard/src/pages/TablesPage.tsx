/**
 * Tables Page - List and manage all tables
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { Plus, Trash2, Table as TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/api/client";
import { CreateTableDialog } from "@/components/CreateTableDialog";
import { DeleteTableDialog } from "@/components/DeleteTableDialog";
import { toast } from "sonner";

export function Component() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; table: any | null }>({
    open: false,
    table: null,
  });
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["tables"],
    queryFn: () => apiClient.getTables(),
  });

  const deleteMutation = useMutation({
    mutationFn: (tableName: string) => apiClient.deleteTable(tableName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      toast.success("Table deleted", {
        description: "The table has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to delete table", {
        description: error.message,
      });
    },
  });

  const handleDeleteClick = (table: any) => {
    setDeleteDialog({ open: true, table });
  };

  const handleDeleteConfirm = async () => {
    if (deleteDialog.table) {
      await deleteMutation.mutateAsync(deleteDialog.table.name);
      setDeleteDialog({ open: false, table: null });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading tables...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Error loading tables: {(error as Error).message}</p>
      </div>
    );
  }

  const tables = data?.tables || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tables</h1>
          <p className="text-muted-foreground mt-1">
            Manage your table schemas and definitions
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Table
        </Button>
      </div>

      {tables.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <TableIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tables yet</h3>
            <p className="text-muted-foreground mb-4">Get started by creating your first table</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Table
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tables.map((table) => (
            <Card key={table.id} className="hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link to={`/tables/${table.name}`}>
                      <CardTitle className="hover:text-primary transition-colors">
                        {table.displayName}
                      </CardTitle>
                    </Link>
                    <CardDescription className="mt-1">
                      {table.description || "No description"}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(table)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {table.fields.length} field{table.fields.length !== 1 ? "s" : ""}
                    </span>
                    <Badge variant="secondary">{table.name}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/tables/${table.name}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        View Schema
                      </Button>
                    </Link>
                    <Link to={`/tables/${table.name}/data`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        View Data
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateTableDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      {deleteDialog.table && (
        <DeleteTableDialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog({ open, table: deleteDialog.table })}
          tableName={deleteDialog.table.name}
          displayName={deleteDialog.table.displayName}
          onConfirm={handleDeleteConfirm}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
