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
  const { session, loading, signOut } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [liveStatus, setLiveStatus] = useState<'active' | 'suspended' | 'locked' | 'deleted' | 'pending' | null>(null);

  // Security Heartbeat: Verify user status against database on every navigation
  useEffect(() => {
    if (session?.user?.id) {
      const verifyStatus = async () => {
        setIsVerifying(true);
        const status = await authService.checkUserStatus(session.user.id);
        setLiveStatus(status);
        
        // Instant Enforcement for Locked or Deleted accounts
        if (status === 'locked' || status === 'deleted') {
          await signOut();
        }
        setIsVerifying(false);
      };
      
      verifyStatus();
    }
  }, [location.pathname, session?.user?.id, signOut]);

  if (loading || isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-background">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-navy border-t-transparent mx-auto"></div>
          <p className="text-brand-muted font-medium">Verifying security credentials...</p>
        </div>
      </div>
    );
  }

  if (!session || liveStatus === 'locked' || liveStatus === 'deleted') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Handle Suspended Status (Live or Session)
  const currentStatus = liveStatus || session.user?.status;
  if (currentStatus === 'suspended' && location.pathname !== '/suspended') {
    return <Navigate to="/suspended" replace />;
  }

  // Prevent suspended users from accessing regular pages even if they bypass navigation
  if (currentStatus === 'suspended' && location.pathname === '/suspended') {
    return <>{children}</>;
  }

  const userRole = session.user?.role as UserRole;
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
