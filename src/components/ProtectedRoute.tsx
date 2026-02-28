import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles = [] }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    toast({
      title: 'Access Denied',
      description: 'Please login to access this page',
      variant: 'destructive',
    });
    return <Navigate to="/" replace />;
  }

  // Check if user is active
  if (user.is_active === false) {
    toast({
      title: 'Account Disabled',
      description: 'Your account has been deactivated. Contact administrator.',
      variant: 'destructive',
    });
    return <Navigate to="/" replace />;
  }

  // Check role-based access
  if (allowedRoles.length > 0) {
    const userRole = user.role?.toLowerCase();
    const hasAccess = allowedRoles.some(role => 
      userRole === role.toLowerCase() || userRole === 'super_admin' || userRole === 'superadmin'
    );

    if (!hasAccess) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access this page',
        variant: 'destructive',
      });
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
