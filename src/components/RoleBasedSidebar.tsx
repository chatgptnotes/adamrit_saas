/**
 * Role-Based Sidebar - Shows menu items based on user role
 */

import { useAuth } from '@/contexts/AuthContext';
import { canAccessModule, UserRole } from '@/utils/permissions';
import { 
  Home, Users, Calendar, Activity, TestTube, 
  Pill, DollarSign, Settings, FileText, Stethoscope,
  Building2, ClipboardList
} from 'lucide-react';

interface MenuItem {
  name: string;
  path: string;
  icon: any;
  module: string;
  roles?: UserRole[]; // If specified, only these roles see it
}

const ALL_MENU_ITEMS: MenuItem[] = [
  { name: 'Dashboard', path: '/', icon: Home, module: 'dashboard' },
  { name: 'Patients', path: '/patients', icon: Users, module: 'patients' },
  { name: 'OPD', path: '/opd', icon: Calendar, module: 'opd' },
  { name: 'IPD', path: '/ipd', icon: Activity, module: 'ipd' },
  { name: 'Laboratory', path: '/lab', icon: TestTube, module: 'lab' },
  { name: 'Radiology', path: '/radiology', icon: Stethoscope, module: 'radiology' },
  { name: 'Pharmacy', path: '/pharmacy', icon: Pill, module: 'pharmacy' },
  { name: 'Billing', path: '/billing', icon: DollarSign, module: 'billing' },
  { name: 'Accounting', path: '/accounting', icon: ClipboardList, module: 'accounting' },
  { name: 'OT', path: '/ot', icon: Building2, module: 'ot' },
  { name: 'Reports', path: '/reports', icon: FileText, module: 'reports' },
  { name: 'Settings', path: '/settings', icon: Settings, module: 'settings' },
];

/**
 * Get menu items filtered by user's role
 */
export function useRoleBasedMenu() {
  const { user } = useAuth();
  const role = user?.role as UserRole;

  if (!role) return [];

  // Filter menu items based on permissions
  return ALL_MENU_ITEMS.filter(item => {
    // Check if user has access to this module
    const hasModuleAccess = canAccessModule(role, item.module as any);
    
    // Check role-specific restrictions
    if (item.roles && !item.roles.includes(role)) {
      return false;
    }
    
    return hasModuleAccess;
  });
}

/**
 * Get role-specific menu configuration
 */
export function getRoleMenuConfig(role: UserRole): MenuItem[] {
  const menuConfigs: Record<UserRole, MenuItem[]> = {
    super_admin: ALL_MENU_ITEMS, // All menu items
    
    admin: ALL_MENU_ITEMS.filter(item => 
      item.module !== 'settings' || item.module === 'settings'
    ), // All items
    
    reception: [
      { name: 'Dashboard', path: '/', icon: Home, module: 'dashboard' },
      { name: 'Patients', path: '/patients', icon: Users, module: 'patients' },
      { name: 'OPD', path: '/opd', icon: Calendar, module: 'opd' },
      { name: 'IPD', path: '/ipd', icon: Activity, module: 'ipd' },
      { name: 'Billing', path: '/billing', icon: DollarSign, module: 'billing' },
    ],
    
    lab: [
      { name: 'Dashboard', path: '/', icon: Home, module: 'dashboard' },
      { name: 'Lab Orders', path: '/lab', icon: TestTube, module: 'lab' },
      { name: 'Patients', path: '/patients', icon: Users, module: 'patients' },
    ],
    
    radiology: [
      { name: 'Dashboard', path: '/', icon: Home, module: 'dashboard' },
      { name: 'Radiology', path: '/radiology', icon: Stethoscope, module: 'radiology' },
      { name: 'Patients', path: '/patients', icon: Users, module: 'patients' },
    ],
    
    pharmacy: [
      { name: 'Dashboard', path: '/', icon: Home, module: 'dashboard' },
      { name: 'Pharmacy', path: '/pharmacy', icon: Pill, module: 'pharmacy' },
      { name: 'Patients', path: '/patients', icon: Users, module: 'patients' },
    ],
    
    doctor: [
      { name: 'Dashboard', path: '/', icon: Home, module: 'dashboard' },
      { name: 'Patients', path: '/patients', icon: Users, module: 'patients' },
      { name: 'OPD', path: '/opd', icon: Calendar, module: 'opd' },
      { name: 'IPD', path: '/ipd', icon: Activity, module: 'ipd' },
      { name: 'Lab', path: '/lab', icon: TestTube, module: 'lab' },
      { name: 'Radiology', path: '/radiology', icon: Stethoscope, module: 'radiology' },
      { name: 'OT', path: '/ot', icon: Building2, module: 'ot' },
    ],
    
    nurse: [
      { name: 'Dashboard', path: '/', icon: Home, module: 'dashboard' },
      { name: 'Patients', path: '/patients', icon: Users, module: 'patients' },
      { name: 'IPD', path: '/ipd', icon: Activity, module: 'ipd' },
    ],
    
    accountant: [
      { name: 'Dashboard', path: '/', icon: Home, module: 'dashboard' },
      { name: 'Billing', path: '/billing', icon: DollarSign, module: 'billing' },
      { name: 'Accounting', path: '/accounting', icon: ClipboardList, module: 'accounting' },
      { name: 'Reports', path: '/reports', icon: FileText, module: 'reports' },
    ],
  };

  return menuConfigs[role] || [];
}

/**
 * Example: MenuItem component that uses these utilities
 */
export function RoleBasedMenuItem({ item }: { item: MenuItem }) {
  const Icon = item.icon;
  
  return (
    <a
      href={item.path}
      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <Icon className="h-5 w-5" />
      <span>{item.name}</span>
    </a>
  );
}
