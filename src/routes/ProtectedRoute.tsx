import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../auth/authTypes';
import { authService } from '../services/auth/authService';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const { session, loading, isLocked, isSuspended } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-background">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-navy border-t-transparent mx-auto"></div>
          <p className="text-brand-muted font-medium">Loading NMIS Security Gateway...</p>
        </div>
      </div>
    );
  }

  // Instant Enforcement for Locked or Deleted accounts
  if (!session || isLocked) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Handle Suspended Status
  if (isSuspended && location.pathname !== '/suspended') {
    return <Navigate to="/suspended" replace />;
  }

  // Prevent suspended users from accessing regular pages even if they bypass navigation
  if (isSuspended && location.pathname === '/suspended') {
    return <>{children}</>;
  }

  const userRole = session.user?.role as UserRole;
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
