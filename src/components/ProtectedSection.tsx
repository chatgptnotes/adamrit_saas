/**
 * ProtectedSection - Show/hide content based on permissions
 */

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission, canAccessModule, Module, Action, UserRole } from '@/utils/permissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

interface ProtectedSectionProps {
  children: ReactNode;
  module: Module;
  action?: Action;
  fallback?: ReactNode;
  showMessage?: boolean;
}

/**
 * Wrap content that should be protected by permissions
 * 
 * @example
 * <ProtectedSection module="patients" action="delete">
 *   <Button onClick={handleDelete}>Delete Patient</Button>
 * </ProtectedSection>
 */
export function ProtectedSection({
  children,
  module,
  action = 'read',
  fallback,
  showMessage = false,
}: ProtectedSectionProps) {
  const { user } = useAuth();
  const role = user?.role as UserRole;

  // Check permission
  const hasAccess = hasPermission(role, module, action);

  if (!hasAccess) {
    // Show fallback if provided
    if (fallback) {
      return <>{fallback}</>;
    }

    // Show message if requested
    if (showMessage) {
      return (
        <Alert variant="destructive" className="my-4">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to {action} {module}.
            Contact your administrator for access.
          </AlertDescription>
        </Alert>
      );
    }

    // Otherwise, hide completely
    return null;
  }

  return <>{children}</>;
}

/**
 * Show content only if user has module access
 */
export function ProtectedModule({
  children,
  module,
  fallback,
}: {
  children: ReactNode;
  module: Module;
  fallback?: ReactNode;
}) {
  const { user } = useAuth();
  const role = user?.role as UserRole;

  if (!canAccessModule(role, module)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Show different content based on role
 */
export function RoleSwitch({
  roles,
  fallback,
}: {
  roles: Partial<Record<UserRole, ReactNode>>;
  fallback?: ReactNode;
}) {
  const { user } = useAuth();
  const role = user?.role as UserRole;

  if (role && roles[role]) {
    return <>{roles[role]}</>;
  }

  return <>{fallback}</>;
}
