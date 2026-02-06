/**
 * Table Detail Page - View table schema details
 */

import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Database, Table as TableIcon, Plus, Pencil, Trash2, MoreVertical, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiClient } from "@/api/client";
import { AddColumnDialog } from "@/components/AddColumnDialog";
import { EditColumnDialog } from "@/components/EditColumnDialog";
import { DeleteColumnDialog } from "@/components/DeleteColumnDialog";
import { RenameColumnDialog } from "@/components/RenameColumnDialog";
import type { FieldDefinition } from "@spinekit/shared";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function TableDetailPage() {
  const { tableName } = useParams<{ tableName: string }>();
  const queryClient = useQueryClient();

  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const [editColumnOpen, setEditColumnOpen] = useState(false);
  const [deleteColumnOpen, setDeleteColumnOpen] = useState(false);
  const [renameColumnOpen, setRenameColumnOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<FieldDefinition | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["table", tableName],
    queryFn: () => apiClient.getTable(tableName!),
    enabled: !!tableName,
  });

  const removeConstraintMutation = useMutation({
    mutationFn: ({ columnName, constraint }: { columnName: string; constraint: "required" | "unique" }) =>
      apiClient.removeConstraint(tableName!, columnName, constraint),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table", tableName] });
      toast.success("Constraint removed", {
        description: "The constraint has been successfully removed.",
      });
    },
    onError: (err: Error) => {
      toast.error("Failed to remove constraint", {
        description: err.message,
      });
    },
  });

  const handleEditColumn = (column: FieldDefinition) => {
    setSelectedColumn(column);
    setEditColumnOpen(true);
  };

  const handleRenameColumn = (column: FieldDefinition) => {
    setSelectedColumn(column);
    setRenameColumnOpen(true);
  };

  const handleDeleteColumn = (column: FieldDefinition) => {
    setSelectedColumn(column);
    setDeleteColumnOpen(true);
  };

  const handleRemoveConstraint = (column: FieldDefinition, constraint: "required" | "unique") => {
    removeConstraintMutation.mutate({ columnName: column.name, constraint });
  };

  const handleExportSchema = () => {
    if (!table) return;

    const schemaExport = {
      displayName: table.displayName,
      description: table.description || "",
      fields: table.fields.map((field) => ({
        name: field.name,
        displayName: field.displayName,
        type: field.type,
        required: field.required || false,
        unique: field.unique || false,
        defaultValue: field.defaultValue,
        description: field.description || "",
      })),
    };

    const blob = new Blob([JSON.stringify(schemaExport, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${table.name}-schema.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Schema exported", {
      description: `Schema saved as ${table.name}-schema.json`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading table details...</p>
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

  const getFieldTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      string: "bg-blue-100 text-blue-800",
      number: "bg-green-100 text-green-800",
      boolean: "bg-purple-100 text-purple-800",
      date: "bg-orange-100 text-orange-800",
      json: "bg-pink-100 text-pink-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  return (
    <div>
      <Link to="/tables">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tables
        </Button>
      </Link>

      <div className="space-y-6">
        {/* Table Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Database className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">{table.displayName}</h1>
              <p className="text-muted-foreground">{table.description || "No description"}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Badge variant="secondary">Table: {table.name}</Badge>
            <Badge variant="outline">{table.fields.length} fields</Badge>
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Manage your table data and view API documentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link to={`/tables/${table.name}/data`}>
                <Button size="lg">
                  <TableIcon className="h-4 w-4 mr-2" />
                  View & Manage Data
                </Button>
              </Link>
              <Button size="lg" variant="outline" onClick={handleExportSchema}>
                <Download className="h-4 w-4 mr-2" />
                Export Schema
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* API Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle>API Endpoints</CardTitle>
            <CardDescription>
              The following REST endpoints are automatically generated for this table
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex gap-2">
                <Badge className="bg-green-600">GET</Badge>
                <code>/api/{table.name}</code>
                <span className="text-muted-foreground">- List records</span>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-green-600">GET</Badge>
                <code>/api/{table.name}/:id</code>
                <span className="text-muted-foreground">- Get record</span>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-blue-600">POST</Badge>
                <code>/api/{table.name}</code>
                <span className="text-muted-foreground">- Create record</span>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-orange-600">PUT</Badge>
                <code>/api/{table.name}/:id</code>
                <span className="text-muted-foreground">- Update record</span>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-red-600">DELETE</Badge>
                <code>/api/{table.name}/:id</code>
                <span className="text-muted-foreground">- Delete record</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fields Schema */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Schema Definition</CardTitle>
                <CardDescription>
                  Field definitions and constraints for this table
                </CardDescription>
              </div>
              <Button onClick={() => setAddColumnOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Column
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field Name</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Constraints</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Auto-generated fields */}
                <TableRow className="bg-muted/50">
                  <TableCell className="font-mono font-semibold">id</TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>
                    <Badge variant="outline">UUID</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">Primary Key</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">Auto-generated</TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">System</span>
                  </TableCell>
                </TableRow>

                {/* User-defined fields */}
                {table.fields.map((field) => (
                  <TableRow key={field.id}>
                    <TableCell className="font-mono font-semibold">{field.name}</TableCell>
                    <TableCell>{field.displayName}</TableCell>
                    <TableCell>
                      <Badge className={getFieldTypeBadge(field.type)}>
                        {field.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {field.required && <Badge variant="outline">Required</Badge>}
                        {field.unique && <Badge variant="outline">Unique</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {field.description || "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditColumn(field)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Metadata
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRenameColumn(field)}>
                            Rename Column
                          </DropdownMenuItem>
                          {field.required && (
                            <DropdownMenuItem
                              onClick={() => handleRemoveConstraint(field, "required")}
                            >
                              Remove Required
                            </DropdownMenuItem>
                          )}
                          {field.unique && (
                            <DropdownMenuItem
                              onClick={() => handleRemoveConstraint(field, "unique")}
                            >
                              Remove Unique
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteColumn(field)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Column
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Timestamp fields */}
                <TableRow className="bg-muted/50">
                  <TableCell className="font-mono font-semibold">created_at</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>
                    <Badge variant="outline">Timestamp</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Required</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">Auto-generated</TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">System</span>
                  </TableCell>
                </TableRow>
                <TableRow className="bg-muted/50">
                  <TableCell className="font-mono font-semibold">updated_at</TableCell>
                  <TableCell>Updated At</TableCell>
                  <TableCell>
                    <Badge variant="outline">Timestamp</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Required</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">Auto-generated</TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">System</span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <AddColumnDialog
        open={addColumnOpen}
        onOpenChange={setAddColumnOpen}
        tableName={tableName!}
      />

      {selectedColumn && (
        <>
          <EditColumnDialog
            open={editColumnOpen}
            onOpenChange={setEditColumnOpen}
            tableName={tableName!}
            column={selectedColumn}
          />

          <RenameColumnDialog
            open={renameColumnOpen}
            onOpenChange={setRenameColumnOpen}
            tableName={tableName!}
            column={selectedColumn}
          />

          <DeleteColumnDialog
            open={deleteColumnOpen}
            onOpenChange={setDeleteColumnOpen}
            tableName={tableName!}
            column={selectedColumn}
          />
        </>
      )}
    </div>
  );
}
