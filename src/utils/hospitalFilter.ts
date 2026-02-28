/**
 * Hospital-based Data Filtering Utility
 * Ensures users only see data from their assigned hospital
 */

export type HospitalType = 'hope' | 'ayushman';

/**
 * Get hospital filter for database queries
 * @param userHospitalType - User's assigned hospital
 * @returns Object with hospital filter or null for super admin
 */
export const getHospitalFilter = (userRole: string, userHospitalType: string) => {
  // Super admin can see all hospitals
  if (userRole === 'super_admin' || userRole === 'superadmin') {
    return null; // No filter, see all
  }

  // All other users: filter by their hospital
  return {
    hospital_type: userHospitalType
  };
};

/**
 * Add hospital filter to Supabase query
 * @param query - Supabase query builder
 * @param userRole - User role
 * @param userHospitalType - User's hospital type
 * @returns Modified query with hospital filter
 */
export const applyHospitalFilter = <T>(
  query: any,
  userRole: string,
  userHospitalType: string
): any => {
  const filter = getHospitalFilter(userRole, userHospitalType);
  
  if (filter === null) {
    // Super admin: no filter
    return query;
  }

  // Apply hospital filter
  return query.eq('hospital_type', userHospitalType);
};

/**
 * Check if user can access data from a specific hospital
 * @param userRole - User role
 * @param userHospitalType - User's hospital
 * @param dataHospitalType - Hospital of the data being accessed
 * @returns true if user can access, false otherwise
 */
export const canAccessHospitalData = (
  userRole: string,
  userHospitalType: string,
  dataHospitalType: string
): boolean => {
  // Super admin can access all
  if (userRole === 'super_admin' || userRole === 'superadmin') {
    return true;
  }

  // User can only access their own hospital data
  return userHospitalType === dataHospitalType;
};

/**
 * Get hospital display name
 */
export const getHospitalDisplayName = (hospitalType: string): string => {
  const names: Record<string, string> = {
    'hope': 'Hope Hospital',
    'ayushman': 'Ayushman Hospital'
  };
  return names[hospitalType] || hospitalType;
};

/**
 * Validate hospital type
 */
export const isValidHospitalType = (hospitalType: string): boolean => {
  return ['hope', 'ayushman'].includes(hospitalType);
};
