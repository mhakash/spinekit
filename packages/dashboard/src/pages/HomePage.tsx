/**
 * Home Page - Landing page for SpineKit Dashboard
 */

import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Plus, BookOpen, Activity, Table2, ArrowRight } from "lucide-react";
import { apiClient } from "@/api/client";
import type { TableSchema } from "@spinekit/shared";

export function HomePage() {
  const [tables, setTables] = useState<TableSchema[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      const response = await apiClient.getTables();
      setTables(response.tables);
    } catch (error) {
      console.error("Failed to load tables:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8 sm:py-12">
        <div className="flex items-center justify-center mb-6">
          <Database className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
          Welcome to SpineKit
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
          A headless backend toolkit that dynamically generates REST APIs from your table schemas.
          Build your data models, get instant APIs.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/tables" className="block">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardTitle className="mt-4">Manage Tables</CardTitle>
              <CardDescription>
                View, edit, and manage your existing table schemas
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/tables" className="block">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Plus className="h-6 w-6 text-green-600" />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardTitle className="mt-4">Create Table</CardTitle>
              <CardDescription>
                Define a new data model with custom fields and types
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/api-docs" className="block">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardTitle className="mt-4">API Documentation</CardTitle>
              <CardDescription>
                Explore and test your auto-generated REST endpoints
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Recent Tables */}
      {!isLoading && tables.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Tables</CardTitle>
                <CardDescription>Your most recently created data models</CardDescription>
              </div>
              <Link to="/tables">
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tables.slice(0, 5).map((table) => (
                <Link
                  key={table.name}
                  to={`/tables/${table.name}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded">
                      <Table2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{table.displayName}</div>
                      <div className="text-xs text-muted-foreground">
                        {table.fields.length} fields • /api/{table.name}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && tables.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 bg-primary/10 rounded-full mb-4">
              <Database className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No tables yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Create your first table to start building your backend APIs
            </p>
            <Link to="/tables">
              <Button size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Create Your First Table
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
