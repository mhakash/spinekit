/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */

import { Navigate, Outlet } from "react-router";
import { useSession } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

export function ProtectedRoute() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
