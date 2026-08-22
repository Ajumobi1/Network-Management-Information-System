import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../auth/authTypes';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-background">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-primary border-t-transparent mx-auto"></div>
          <p className="text-brand-muted font-medium">Loading Network Management Information System (NMIS)...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Handle Suspended Status
  if (session.user?.status === 'suspended' && location.pathname !== '/suspended') {
    return <Navigate to="/suspended" replace />;
  }

  // Prevent suspended users from accessing regular pages even if they bypass navigation
  if (session.user?.status === 'suspended' && location.pathname === '/suspended') {
    return <>{children}</>;
  }

  const userRole = session.user?.role as UserRole;
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
