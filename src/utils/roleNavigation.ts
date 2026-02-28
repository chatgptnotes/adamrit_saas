/**
 * Role-based Navigation Utility
 * Maps user roles to their default landing pages
 */

type UserRole = 'super_admin' | 'superadmin' | 'admin' | 'reception' | 'lab' | 'radiology' | 'pharmacy' | 'doctor' | 'nurse' | 'accountant' | 'user' | 'marketing_manager';

/**
 * Get the default route for a given user role
 * @param role - User role
 * @returns Default route path for the role
 */
export const getRoleDefaultRoute = (role: string): string => {
  const roleNormalized = role.toLowerCase() as UserRole;

  const roleRouteMap: Record<UserRole, string> = {
    // Admin roles → Dashboard
    super_admin: '/dashboard',
    superadmin: '/dashboard',
    admin: '/dashboard',
    
    // Department-specific roles → Their respective pages
    lab: '/lab',
    radiology: '/radiology',
    pharmacy: '/pharmacy',
    
    // Clinical roles → Patient Dashboard
    doctor: '/patient-dashboard',
    nurse: '/patient-dashboard',
    
    // Front desk → IPD Dashboard
    reception: '/todays-ipd',
    
    // Finance → Accounting
    accountant: '/accounting',
    
    // Marketing → Marketing Dashboard
    marketing_manager: '/marketing',
    
    // Default user → Dashboard
    user: '/dashboard'
  };

  return roleRouteMap[roleNormalized] || '/dashboard';
};

/**
 * Get user-friendly description of where they'll land
 * @param role - User role
 * @returns Description text
 */
export const getRoleDefaultPageName = (role: string): string => {
  const roleNormalized = role.toLowerCase() as UserRole;

  const rolePageNameMap: Record<UserRole, string> = {
    super_admin: 'Dashboard',
    superadmin: 'Dashboard',
    admin: 'Dashboard',
    lab: 'Lab Management',
    radiology: 'Radiology',
    pharmacy: 'Pharmacy',
    doctor: 'Patient Dashboard',
    nurse: 'Patient Dashboard',
    reception: 'IPD Dashboard',
    accountant: 'Accounting',
    marketing_manager: 'Marketing',
    user: 'Dashboard'
  };

  return rolePageNameMap[roleNormalized] || 'Dashboard';
};
