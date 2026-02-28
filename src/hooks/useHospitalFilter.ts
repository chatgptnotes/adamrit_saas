import { useAuth } from '@/contexts/AuthContext';
import { applyHospitalFilter, getHospitalFilter } from '@/utils/hospitalFilter';

/**
 * Hook to apply hospital-based filtering to database queries
 * Automatically filters data based on user's assigned hospital
 */
export const useHospitalFilter = () => {
  const { user } = useAuth();

  /**
   * Apply hospital filter to a Supabase query
   * @param query - Supabase query builder
   * @returns Query with hospital filter applied
   */
  const applyFilter = <T>(query: any): any => {
    if (!user) {
      return query;
    }

    const userRole = user.role;
    const userHospitalType = user.hospital_type || user.hospitalType || 'hope';

    return applyHospitalFilter(query, userRole, userHospitalType);
  };

  /**
   * Get hospital filter object for manual queries
   * Returns null for super admin (no filter)
   * Returns { hospital_type: 'hope' } for Hope users
   */
  const getFilter = () => {
    if (!user) {
      return null;
    }

    const userRole = user.role;
    const userHospitalType = user.hospital_type || user.hospitalType || 'hope';

    return getHospitalFilter(userRole, userHospitalType);
  };

  /**
   * Get current user's hospital type
   */
  const getUserHospital = (): string => {
    return user?.hospital_type || user?.hospitalType || 'hope';
  };

  /**
   * Check if current user is super admin (can see all hospitals)
   */
  const isSuperAdmin = (): boolean => {
    return user?.role === 'super_admin' || user?.role === 'superadmin';
  };

  return {
    applyFilter,
    getFilter,
    getUserHospital,
    isSuperAdmin
  };
};
