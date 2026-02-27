/**
 * Route Guard - Protects routes based on user role
 * Redirects unauthorized users
 */

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessRoute } from '@/hooks/useRoleBasedData';
import { canAccessModule, UserRole, Module } from '@/utils/permissions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RouteGuardProps {
  children: ReactNode;
  requiredModule?: Module;
  requiredRole?: UserRole[];
  fallbackPath?: string;
}

/**
 * Guard component that checks if user can access a route
 * 
 * @example
 * <RouteGuard requiredModule="pharmacy">
 *   <PharmacyPage />
 * </RouteGuard>
 */
export function RouteGuard({
  children,
  requiredModule,
  requiredRole,
  fallbackPath = '/',
}: RouteGuardProps) {
  const { user, isAuthenticated } = useAuth();
  const role = user?.role as UserRole;

  // Check authentication
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role requirement
  if (requiredRole && !requiredRole.includes(role)) {
    return <UnauthorizedAccess />;
  }

  // Check module access
  if (requiredModule && !canAccessModule(role, requiredModule)) {
    return <UnauthorizedAccess />;
  }

  return <>{children}</>;
}

/**
 * Unauthorized access message
 */
function UnauthorizedAccess() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Alert variant="destructive">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold mb-2">
            Access Denied
          </AlertTitle>
          <AlertDescription className="space-y-4">
            <p>
              You don't have permission to access this page.
              This area is restricted to authorized users only.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => (window.location.href = '/')}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Go to Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={() => window.history.back()}
              >
                Go Back
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}

/**
 * Route guard for specific paths
 */
export function PathGuard({ 
  children,
  path 
}: { 
  children: ReactNode;
  path: string;
}) {
  const { user } = useAuth();
  const role = user?.role as UserRole;

  if (!canAccessRoute(role, path)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
