import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getRoleDefaultRoute } from '@/utils/roleNavigation';

/**
 * Component to handle role-based redirects
 * Redirects users to their default page based on role when they land on root path
 */
export const RoleBasedRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Only redirect if:
    // 1. User is authenticated
    // 2. Currently on root path or dashboard
    // 3. User object exists
    if (isAuthenticated && user && (location.pathname === '/' || location.pathname === '/dashboard')) {
      const defaultRoute = getRoleDefaultRoute(user.role);
      
      // Only navigate if the default route is different from current
      if (defaultRoute !== location.pathname) {
        console.log('🎯 Auto-redirecting', user.role, 'to', defaultRoute);
        navigate(defaultRoute, { replace: true });
      }
    }
  }, [user, isAuthenticated, location.pathname, navigate]);

  return null; // This component doesn't render anything
};
