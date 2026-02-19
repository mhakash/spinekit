/**
 * Main Layout Component
 */

import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { Database, Home, Table2, BookOpen, LogOut, Menu, X } from "lucide-react";
import { useSession, authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await authClient.signOut();
    toast.success("Signed out successfully");
    navigate("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const navLinks = [
    { to: "/", label: "Home", icon: Home, match: (path: string) => path === "/" },
    { to: "/tables", label: "Tables", icon: Table2, match: (path: string) => path.startsWith("/tables") },
    { to: "/api-docs", label: "API Docs", icon: BookOpen, match: (path: string) => path.startsWith("/api-docs") },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-lg sm:text-xl font-bold hover:opacity-80 transition-opacity">
              <Database className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="hidden sm:inline">SpineKit</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = link.match(location.pathname);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-3 py-2 rounded-md transition-colors flex items-center gap-2 ${
                      isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>

              {/* User Avatar */}
              {session && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {getInitials(session.user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{session.user.name}</p>
                        <p className="text-xs text-muted-foreground">{session.user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <nav className="md:hidden pt-4 pb-2 flex flex-col gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = link.match(location.pathname);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 rounded-md transition-colors flex items-center gap-2 ${
                      isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 sm:py-6 mt-auto">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs sm:text-sm text-muted-foreground">
          SpineKit v0.1.0 - Dynamic API Generator
        </div>
      </footer>
    </div>
  );
}
