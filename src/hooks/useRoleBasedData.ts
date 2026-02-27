/**
 * Role-Based Data Filtering Hook
 * Filters data based on user's role and permissions
 */

import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/utils/permissions';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Get data filtered by user's role and access level
 */
export function useRoleBasedData<T>(
  tableName: string,
  queryKey: string,
  options?: {
    filters?: Record<string, any>;
    select?: string;
    orderBy?: { column: string; ascending?: boolean };
  }
) {
  const { user } = useAuth();
  const role = user?.role as UserRole;

  return useQuery({
    queryKey: [queryKey, role, user?.id, options?.filters],
    queryFn: async () => {
      let query = supabase.from(tableName).select(options?.select || '*');

      // Apply role-based filters
      query = applyRoleFilters(query, tableName, role, user);

      // Apply custom filters
      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      // Apply ordering
      if (options?.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? false,
        });
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as T[];
    },
    enabled: !!user && !!role,
  });
}

/**
 * Apply role-specific filters to queries
 */
function applyRoleFilters(
  query: any,
  tableName: string,
  role: UserRole,
  user: any
) {
  // Super admin sees everything
  if (role === 'super_admin') {
    return query;
  }

  // Admin sees all data for their hospital
  if (role === 'admin') {
    return query.eq('hospital_name', user.hospitalType);
  }

  // Role-specific filters
  switch (role) {
    case 'pharmacy':
      // Pharmacy: Only see pharmacy-related data
      if (tableName === 'patients') {
        // Only patients with pharmacy orders
        return query
          .eq('hospital_name', user.hospitalType)
          .not('pharmacy_orders', 'is', null);
      }
      if (tableName === 'pharmacy_sales') {
        // Only their own sales
        return query
          .eq('hospital_name', user.hospitalType)
          .eq('created_by', user.id);
      }
      if (tableName === 'medications' || tableName === 'medicine_master') {
        // All medicines from their hospital
        return query.eq('hospital_name', user.hospitalType);
      }
      break;

    case 'lab':
      // Lab: Only see lab-related data
      if (tableName === 'patients') {
        // Only patients with lab orders
        return query
          .eq('hospital_name', user.hospitalType)
          .not('lab_orders', 'is', null);
      }
      if (tableName === 'lab_tests' || tableName === 'lab_results') {
        return query.eq('hospital_name', user.hospitalType);
      }
      break;

    case 'radiology':
      // Radiology: Only radiology orders
      if (tableName === 'patients') {
        return query
          .eq('hospital_name', user.hospitalType)
          .not('radiology_orders', 'is', null);
      }
      if (tableName === 'radiology_orders') {
        return query.eq('hospital_name', user.hospitalType);
      }
      break;

    case 'reception':
      // Reception: All patients but limited data
      if (tableName === 'patients' || tableName === 'visits') {
        return query.eq('hospital_name', user.hospitalType);
      }
      // Can see billing data
      if (tableName === 'billing' || tableName === 'invoices') {
        return query.eq('hospital_name', user.hospitalType);
      }
      break;

    case 'doctor':
      // Doctor: All clinical data
      if (
        tableName === 'patients' ||
        tableName === 'visits' ||
        tableName === 'lab_tests' ||
        tableName === 'radiology_orders'
      ) {
        return query.eq('hospital_name', user.hospitalType);
      }
      break;

    case 'nurse':
      // Nurse: Assigned patients only (if applicable)
      if (tableName === 'patients' || tableName === 'visits') {
        return query.eq('hospital_name', user.hospitalType);
      }
      break;

    default:
      // Default: Only their hospital's data
      return query.eq('hospital_name', user.hospitalType);
  }

  return query;
}

/**
 * Check if user can access specific data
 */
export function canAccessData(
  role: UserRole,
  dataType: string,
  dataOwnerId?: string,
  currentUserId?: string
): boolean {
  // Super admin can access everything
  if (role === 'super_admin') return true;

  // Admin can access all hospital data
  if (role === 'admin') return true;

  // Check role-specific access
  switch (role) {
    case 'pharmacy':
      return ['pharmacy_sales', 'medications', 'medicine_master', 'pharmacy_stock'].includes(
        dataType
      );

    case 'lab':
      return ['lab_tests', 'lab_results', 'lab_orders'].includes(dataType);

    case 'radiology':
      return ['radiology_orders', 'radiology_results'].includes(dataType);

    case 'reception':
      return ['patients', 'visits', 'billing', 'invoices'].includes(dataType);

    case 'doctor':
      return [
        'patients',
        'visits',
        'lab_tests',
        'radiology_orders',
        'prescriptions',
      ].includes(dataType);

    case 'nurse':
      return ['patients', 'visits', 'nursing_notes'].includes(dataType);

    default:
      return false;
  }
}

/**
 * Get allowed tables for a role
 */
export function getAllowedTables(role: UserRole): string[] {
  const tableMap: Record<UserRole, string[]> = {
    super_admin: ['*'], // All tables
    admin: ['*'], // All tables for their hospital
    
    reception: [
      'patients',
      'visits',
      'billing',
      'invoices',
      'appointments',
      'final_payments',
    ],
    
    lab: [
      'lab_tests',
      'lab_results',
      'lab_orders',
      'lab_test_config',
      'patients', // Read-only
    ],
    
    radiology: [
      'radiology_orders',
      'radiology_results',
      'radiology_tests',
      'patients', // Read-only
    ],
    
    pharmacy: [
      'pharmacy_sales',
      'medications',
      'medicine_master',
      'medicine_batch_inventory',
      'pharmacy_stock',
      'patients', // Read-only for prescriptions
    ],
    
    doctor: [
      'patients',
      'visits',
      'lab_orders',
      'radiology_orders',
      'prescriptions',
      'ot_notes',
    ],
    
    nurse: [
      'patients',
      'visits',
      'nursing_notes',
      'vitals',
      'medications_given',
    ],
    
    accountant: [
      'billing',
      'invoices',
      'final_payments',
      'ledgers',
      'vouchers',
      'financial_summary',
    ],
  };

  return tableMap[role] || [];
}

/**
 * Filter route access based on role
 */
export function canAccessRoute(role: UserRole, routePath: string): boolean {
  const routeAccess: Record<UserRole, string[]> = {
    super_admin: ['*'],
    admin: ['*'],
    
    reception: [
      '/',
      '/patients',
      '/opd',
      '/ipd',
      '/billing',
      '/appointments',
      '/patient/*',
    ],
    
    lab: [
      '/',
      '/lab',
      '/lab/*',
      '/patients', // View only
    ],
    
    radiology: [
      '/',
      '/radiology',
      '/radiology/*',
      '/patients', // View only
    ],
    
    pharmacy: [
      '/',
      '/pharmacy',
      '/pharmacy/*',
      '/patients', // View for prescriptions
    ],
    
    doctor: [
      '/',
      '/patients',
      '/patients/*',
      '/opd',
      '/ipd',
      '/lab',
      '/radiology',
      '/ot',
    ],
    
    nurse: [
      '/',
      '/patients',
      '/patients/*',
      '/ipd',
      '/nursing-notes',
    ],
    
    accountant: [
      '/',
      '/billing',
      '/accounting',
      '/ledger',
      '/reports',
    ],
  };

  const allowedRoutes = routeAccess[role] || [];
  
  // Check if route matches
  if (allowedRoutes.includes('*')) return true;
  
  return allowedRoutes.some(allowedRoute => {
    if (allowedRoute.endsWith('/*')) {
      const baseRoute = allowedRoute.slice(0, -2);
      return routePath.startsWith(baseRoute);
    }
    return routePath === allowedRoute;
  });
}
