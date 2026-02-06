/**
 * Main Layout Component
 */

import { Outlet, Link, useLocation } from "react-router-dom";
import { Database, Home, Table2 } from "lucide-react";

export function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="w-full max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold hover:opacity-80 transition-opacity">
              <Database className="h-6 w-6" />
              <span>SpineKit</span>
            </Link>
            <nav className="flex gap-2">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md transition-colors flex items-center gap-2 ${
                  location.pathname === "/"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <Home className="h-4 w-4" />
                Home
              </Link>
              <Link
                to="/tables"
                className={`px-3 py-2 rounded-md transition-colors flex items-center gap-2 ${
                  location.pathname.startsWith("/tables")
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <Table2 className="h-4 w-4" />
                Tables
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-auto">
        <div className="w-full max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          SpineKit v0.1.0 - Dynamic API Generator
        </div>
      </footer>
    </div>
  );
}
