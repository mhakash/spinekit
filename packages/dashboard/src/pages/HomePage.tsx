/**
 * Home Page - Landing page for SpineKit Dashboard
 */

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Table2, Zap, Code2, ArrowRight } from "lucide-react";

export function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-12">
        <div className="flex items-center justify-center mb-6">
          <Database className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-5xl font-bold tracking-tight">
          Welcome to SpineKit
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          A headless backend toolkit that dynamically generates REST APIs from your table schemas.
          Build your data models, get instant APIs.
        </p>
        <div className="pt-4">
          <Link to="/tables">
            <Button size="lg" className="text-lg px-8">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Table2 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Dynamic Tables</CardTitle>
            </div>
            <CardDescription>
              Create and manage table schemas with an intuitive interface. Add, edit, and delete columns on the fly.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Instant APIs</CardTitle>
            </div>
            <CardDescription>
              REST endpoints are automatically generated for every table. Full CRUD operations with pagination, filtering, and sorting.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Code2 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Type Safe</CardTitle>
            </div>
            <CardDescription>
              Built with TypeScript from the ground up. Shared types between frontend and backend ensure consistency.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Jump right into managing your data models and APIs
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Link to="/tables" className="block">
            <Button variant="outline" size="lg" className="w-full justify-start">
              <Database className="mr-3 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">View Tables</div>
                <div className="text-xs text-muted-foreground">
                  Browse and manage your table schemas
                </div>
              </div>
            </Button>
          </Link>

          <Link to="/tables" className="block">
            <Button variant="outline" size="lg" className="w-full justify-start">
              <Table2 className="mr-3 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Create Table</div>
                <div className="text-xs text-muted-foreground">
                  Define a new data model with custom fields
                </div>
              </div>
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Features List */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Field Types Supported</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <span className="font-medium">String</span> - Text values
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <span className="font-medium">Number</span> - Numeric values (integer, decimal)
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                <span className="font-medium">Boolean</span> - True/false values
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                <span className="font-medium">Date</span> - Date and timestamp values
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                <span className="font-medium">JSON</span> - Complex JSON objects
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Auto-Generated Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm font-mono">
              <li className="flex items-center gap-2">
                <span className="text-green-600 font-semibold">GET</span>
                <span className="text-muted-foreground">/api/:table</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600 font-semibold">GET</span>
                <span className="text-muted-foreground">/api/:table/:id</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-600 font-semibold">POST</span>
                <span className="text-muted-foreground">/api/:table</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-orange-600 font-semibold">PUT</span>
                <span className="text-muted-foreground">/api/:table/:id</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-600 font-semibold">DELETE</span>
                <span className="text-muted-foreground">/api/:table/:id</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
