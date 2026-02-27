/**
 * Role-Based Access Control (RBAC) Utilities
 * Check user permissions for different modules and actions
 */

export type UserRole = 
  | 'super_admin'
  | 'admin'
  | 'reception'
  | 'lab'
  | 'radiology'
  | 'pharmacy'
  | 'doctor'
  | 'nurse'
  | 'accountant';

export type Module = 
  | 'dashboard'
  | 'patients'
  | 'visits'
  | 'opd'
  | 'ipd'
  | 'lab'
  | 'radiology'
  | 'pharmacy'
  | 'billing'
  | 'accounting'
  | 'ot'
  | 'reports'
  | 'users'
  | 'settings';

export type Action = 'create' | 'read' | 'update' | 'delete' | 'export';

/**
 * Permission Matrix
 * Define what each role can do for each module
 */
const PERMISSIONS: Record<UserRole, Record<Module, Record<Action, boolean>>> = {
  super_admin: {
    // Super admin has all permissions
    dashboard: { create: true, read: true, update: true, delete: true, export: true },
    patients: { create: true, read: true, update: true, delete: true, export: true },
    visits: { create: true, read: true, update: true, delete: true, export: true },
    opd: { create: true, read: true, update: true, delete: true, export: true },
    ipd: { create: true, read: true, update: true, delete: true, export: true },
    lab: { create: true, read: true, update: true, delete: true, export: true },
    radiology: { create: true, read: true, update: true, delete: true, export: true },
    pharmacy: { create: true, read: true, update: true, delete: true, export: true },
    billing: { create: true, read: true, update: true, delete: true, export: true },
    accounting: { create: true, read: true, update: true, delete: true, export: true },
    ot: { create: true, read: true, update: true, delete: true, export: true },
    reports: { create: true, read: true, update: true, delete: true, export: true },
    users: { create: true, read: true, update: true, delete: true, export: true },
    settings: { create: true, read: true, update: true, delete: true, export: true },
  },
  
  admin: {
    // Hospital admin - full access except user management
    dashboard: { create: false, read: true, update: false, delete: false, export: true },
    patients: { create: true, read: true, update: true, delete: false, export: true },
    visits: { create: true, read: true, update: true, delete: false, export: true },
    opd: { create: true, read: true, update: true, delete: false, export: true },
    ipd: { create: true, read: true, update: true, delete: false, export: true },
    lab: { create: true, read: true, update: true, delete: false, export: true },
    radiology: { create: true, read: true, update: true, delete: false, export: true },
    pharmacy: { create: true, read: true, update: true, delete: false, export: true },
    billing: { create: true, read: true, update: true, delete: false, export: true },
    accounting: { create: false, read: true, update: false, delete: false, export: true },
    ot: { create: true, read: true, update: true, delete: false, export: true },
    reports: { create: false, read: true, update: false, delete: false, export: true },
    users: { create: true, read: true, update: true, delete: true, export: false },
    settings: { create: false, read: true, update: true, delete: false, export: false },
  },
  
  reception: {
    // Reception - patient management + billing
    dashboard: { create: false, read: true, update: false, delete: false, export: false },
    patients: { create: true, read: true, update: true, delete: false, export: false },
    visits: { create: true, read: true, update: true, delete: false, export: false },
    opd: { create: true, read: true, update: true, delete: false, export: false },
    ipd: { create: true, read: true, update: true, delete: false, export: false },
    lab: { create: false, read: true, update: false, delete: false, export: false },
    radiology: { create: false, read: true, update: false, delete: false, export: false },
    pharmacy: { create: false, read: true, update: false, delete: false, export: false },
    billing: { create: true, read: true, update: true, delete: false, export: false },
    accounting: { create: false, read: false, update: false, delete: false, export: false },
    ot: { create: false, read: false, update: false, delete: false, export: false },
    reports: { create: false, read: true, update: false, delete: false, export: false },
    users: { create: false, read: false, update: false, delete: false, export: false },
    settings: { create: false, read: false, update: false, delete: false, export: false },
  },
  
  lab: {
    // Lab technician - lab module only
    dashboard: { create: false, read: true, update: false, delete: false, export: false },
    patients: { create: false, read: true, update: false, delete: false, export: false },
    visits: { create: false, read: true, update: false, delete: false, export: false },
    opd: { create: false, read: false, update: false, delete: false, export: false },
    ipd: { create: false, read: false, update: false, delete: false, export: false },
    lab: { create: false, read: true, update: true, delete: false, export: false },
    radiology: { create: false, read: false, update: false, delete: false, export: false },
    pharmacy: { create: false, read: false, update: false, delete: false, export: false },
    billing: { create: false, read: false, update: false, delete: false, export: false },
    accounting: { create: false, read: false, update: false, delete: false, export: false },
    ot: { create: false, read: false, update: false, delete: false, export: false },
    reports: { create: false, read: true, update: false, delete: false, export: false },
    users: { create: false, read: false, update: false, delete: false, export: false },
    settings: { create: false, read: false, update: false, delete: false, export: false },
  },
  
  radiology: {
    // Radiology technician - radiology module only
    dashboard: { create: false, read: true, update: false, delete: false, export: false },
    patients: { create: false, read: true, update: false, delete: false, export: false },
    visits: { create: false, read: true, update: false, delete: false, export: false },
    opd: { create: false, read: false, update: false, delete: false, export: false },
    ipd: { create: false, read: false, update: false, delete: false, export: false },
    lab: { create: false, read: false, update: false, delete: false, export: false },
    radiology: { create: false, read: true, update: true, delete: false, export: false },
    pharmacy: { create: false, read: false, update: false, delete: false, export: false },
    billing: { create: false, read: false, update: false, delete: false, export: false },
    accounting: { create: false, read: false, update: false, delete: false, export: false },
    ot: { create: false, read: false, update: false, delete: false, export: false },
    reports: { create: false, read: true, update: false, delete: false, export: false },
    users: { create: false, read: false, update: false, delete: false, export: false },
    settings: { create: false, read: false, update: false, delete: false, export: false },
  },
  
  pharmacy: {
    // Pharmacy - pharmacy module only
    dashboard: { create: false, read: true, update: false, delete: false, export: false },
    patients: { create: false, read: true, update: false, delete: false, export: false },
    visits: { create: false, read: true, update: false, delete: false, export: false },
    opd: { create: false, read: false, update: false, delete: false, export: false },
    ipd: { create: false, read: false, update: false, delete: false, export: false },
    lab: { create: false, read: false, update: false, delete: false, export: false },
    radiology: { create: false, read: false, update: false, delete: false, export: false },
    pharmacy: { create: true, read: true, update: true, delete: false, export: false },
    billing: { create: false, read: true, update: false, delete: false, export: false },
    accounting: { create: false, read: false, update: false, delete: false, export: false },
    ot: { create: false, read: false, update: false, delete: false, export: false },
    reports: { create: false, read: true, update: false, delete: false, export: false },
    users: { create: false, read: false, update: false, delete: false, export: false },
    settings: { create: false, read: false, update: false, delete: false, export: false },
  },
  
  doctor: {
    // Doctor - clinical access
    dashboard: { create: false, read: true, update: false, delete: false, export: false },
    patients: { create: false, read: true, update: true, delete: false, export: false },
    visits: { create: false, read: true, update: true, delete: false, export: false },
    opd: { create: true, read: true, update: true, delete: false, export: false },
    ipd: { create: true, read: true, update: true, delete: false, export: false },
    lab: { create: true, read: true, update: false, delete: false, export: false },
    radiology: { create: true, read: true, update: false, delete: false, export: false },
    pharmacy: { create: false, read: true, update: false, delete: false, export: false },
    billing: { create: false, read: true, update: false, delete: false, export: false },
    accounting: { create: false, read: false, update: false, delete: false, export: false },
    ot: { create: true, read: true, update: true, delete: false, export: false },
    reports: { create: false, read: true, update: false, delete: false, export: false },
    users: { create: false, read: false, update: false, delete: false, export: false },
    settings: { create: false, read: false, update: false, delete: false, export: false },
  },
  
  nurse: {
    // Nurse - patient care
    dashboard: { create: false, read: true, update: false, delete: false, export: false },
    patients: { create: false, read: true, update: true, delete: false, export: false },
    visits: { create: false, read: true, update: true, delete: false, export: false },
    opd: { create: false, read: true, update: false, delete: false, export: false },
    ipd: { create: false, read: true, update: true, delete: false, export: false },
    lab: { create: false, read: true, update: false, delete: false, export: false },
    radiology: { create: false, read: true, update: false, delete: false, export: false },
    pharmacy: { create: false, read: true, update: false, delete: false, export: false },
    billing: { create: false, read: false, update: false, delete: false, export: false },
    accounting: { create: false, read: false, update: false, delete: false, export: false },
    ot: { create: false, read: true, update: false, delete: false, export: false },
    reports: { create: false, read: false, update: false, delete: false, export: false },
    users: { create: false, read: false, update: false, delete: false, export: false },
    settings: { create: false, read: false, update: false, delete: false, export: false },
  },
  
  accountant: {
    // Accountant - accounting + billing
    dashboard: { create: false, read: true, update: false, delete: false, export: true },
    patients: { create: false, read: true, update: false, delete: false, export: false },
    visits: { create: false, read: true, update: false, delete: false, export: false },
    opd: { create: false, read: false, update: false, delete: false, export: false },
    ipd: { create: false, read: false, update: false, delete: false, export: false },
    lab: { create: false, read: false, update: false, delete: false, export: false },
    radiology: { create: false, read: false, update: false, delete: false, export: false },
    pharmacy: { create: false, read: false, update: false, delete: false, export: false },
    billing: { create: false, read: true, update: false, delete: false, export: true },
    accounting: { create: true, read: true, update: true, delete: false, export: true },
    ot: { create: false, read: false, update: false, delete: false, export: false },
    reports: { create: false, read: true, update: false, delete: false, export: true },
    users: { create: false, read: false, update: false, delete: false, export: false },
    settings: { create: false, read: false, update: false, delete: false, export: false },
  },
};

/**
 * Check if user has permission for a specific action on a module
 */
export function hasPermission(
  role: UserRole | undefined,
  module: Module,
  action: Action
): boolean {
  if (!role) return false;
  
  // Super admin always has permission
  if (role === 'super_admin') return true;
  
  try {
    return PERMISSIONS[role][module][action];
  } catch (error) {
    console.error(`Permission check failed for ${role}.${module}.${action}`, error);
    return false;
  }
}

/**
 * Check if user can access a module (any read permission)
 */
export function canAccessModule(role: UserRole | undefined, module: Module): boolean {
  return hasPermission(role, module, 'read');
}

/**
 * Get all modules accessible by a role
 */
export function getAccessibleModules(role: UserRole | undefined): Module[] {
  if (!role) return [];
  
  if (role === 'super_admin') {
    return Object.keys(PERMISSIONS.super_admin) as Module[];
  }
  
  const modules: Module[] = [];
  const rolePermissions = PERMISSIONS[role];
  
  for (const [module, actions] of Object.entries(rolePermissions)) {
    if (actions.read) {
      modules.push(module as Module);
    }
  }
  
  return modules;
}

/**
 * Check multiple permissions at once
 */
export function hasAnyPermission(
  role: UserRole | undefined,
  checks: Array<{ module: Module; action: Action }>
): boolean {
  return checks.some(({ module, action }) => hasPermission(role, module, action));
}

/**
 * Check all permissions
 */
export function hasAllPermissions(
  role: UserRole | undefined,
  checks: Array<{ module: Module; action: Action }>
): boolean {
  return checks.every(({ module, action }) => hasPermission(role, module, action));
}

/**
 * Get user role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    super_admin: 'Super Administrator',
    admin: 'Hospital Administrator',
    reception: 'Reception Staff',
    lab: 'Lab Technician',
    radiology: 'Radiology Technician',
    pharmacy: 'Pharmacy Staff',
    doctor: 'Doctor',
    nurse: 'Nurse',
    accountant: 'Accountant',
  };
  
  return displayNames[role] || role;
}

/**
 * Get role badge color
 */
export function getRoleBadgeColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    super_admin: 'bg-red-500',
    admin: 'bg-green-500',
    reception: 'bg-blue-500',
    lab: 'bg-yellow-500',
    radiology: 'bg-purple-500',
    pharmacy: 'bg-orange-500',
    doctor: 'bg-indigo-500',
    nurse: 'bg-pink-500',
    accountant: 'bg-teal-500',
  };
  
  return colors[role] || 'bg-gray-500';
}
