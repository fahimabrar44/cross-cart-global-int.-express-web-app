"use client";

import { useAuth } from "@/hooks/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import WorldLoader from "@/components/ui/world-loader";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: ("user" | "admin" | "moderator")[];
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRoles = [], 
  redirectTo = "/auth/signin" 
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Still loading, wait

    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    // Check role-based access
    if (requiredRoles.length > 0 && user) {
      if (!requiredRoles.includes(user.role)) {
        router.push("/dashboard/unauthorized");
        return;
      }
    }
  }, [user, loading, isAuthenticated, router, requiredRoles, redirectTo]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <WorldLoader />
      </div>
    );
  }

  // Show nothing if not authenticated (will redirect)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <WorldLoader label="Redirecting..." />
      </div>
    );
  }

  // Check role access
  if (requiredRoles.length > 0 && user) {
    if (!requiredRoles.includes(user.role)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-gray-600">You don{"'"}t have permission to access this page.</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}

export default ProtectedRoute;