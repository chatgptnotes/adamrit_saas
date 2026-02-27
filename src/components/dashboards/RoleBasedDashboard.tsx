/**
 * Role-Based Dashboard Selector
 * Shows appropriate dashboard based on user role
 */

import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/utils/permissions';

// Import different role dashboards
import AdminDashboard from './AdminDashboard';
import ReceptionDashboard from './ReceptionDashboard';
import LabDashboard from './LabDashboard';
import RadiologyDashboard from './RadiologyDashboard';
import PharmacyDashboard from './PharmacyDashboard';
import DoctorDashboard from './DoctorDashboard';
import NurseDashboard from './NurseDashboard';

export default function RoleBasedDashboard() {
  const { user } = useAuth();
  const role = user?.role as UserRole;

  // Show appropriate dashboard based on role
  switch (role) {
    case 'super_admin':
    case 'admin':
      return <AdminDashboard />;
    
    case 'reception':
      return <ReceptionDashboard />;
    
    case 'lab':
      return <LabDashboard />;
    
    case 'radiology':
      return <RadiologyDashboard />;
    
    case 'pharmacy':
      return <PharmacyDashboard />;
    
    case 'doctor':
      return <DoctorDashboard />;
    
    case 'nurse':
      return <NurseDashboard />;
    
    case 'accountant':
      return <AdminDashboard />; // Accountant uses admin dashboard with limited access
    
    default:
      return <AdminDashboard />; // Fallback to admin dashboard
  }
}
