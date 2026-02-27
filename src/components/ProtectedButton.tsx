/**
 * ProtectedButton - Disable/enable button based on permissions
 */

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission, Module, Action, UserRole } from '@/utils/permissions';
import { Button, ButtonProps } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProtectedButtonProps extends ButtonProps {
  module: Module;
  action: Action;
  children: ReactNode;
  showTooltip?: boolean;
}

/**
 * Button that automatically disables based on permissions
 * 
 * @example
 * <ProtectedButton module="patients" action="delete" onClick={handleDelete}>
 *   Delete Patient
 * </ProtectedButton>
 */
export function ProtectedButton({
  module,
  action,
  children,
  showTooltip = true,
  ...buttonProps
}: ProtectedButtonProps) {
  const { user } = useAuth();
  const role = user?.role as UserRole;

  const hasAccess = hasPermission(role, module, action);

  if (!hasAccess && showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button {...buttonProps} disabled>
                {children}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>You don't have permission to {action} {module}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button {...buttonProps} disabled={!hasAccess || buttonProps.disabled}>
      {children}
    </Button>
  );
}
