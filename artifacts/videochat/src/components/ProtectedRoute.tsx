import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

type ProtectedRouteProps = {
  component: React.ComponentType<any>;
  requireProfile?: boolean;
};

export function ProtectedRoute({ component: Component, requireProfile = true }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        setLocation("/login");
      } else if (requireProfile && !profile) {
        setLocation("/onboarding");
      }
    }
  }, [user, profile, loading, setLocation, requireProfile]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <div className="text-primary-foreground font-medium animate-pulse">Loading secure connection...</div>
        </div>
      </div>
    );
  }

  if (!user || (requireProfile && !profile)) {
    return null; // Will redirect in useEffect
  }

  return <Component />;
}
