
import { useMemo } from 'react';
import { menuItems } from './menuItems';
import { AppSidebarProps, MenuItem } from './types';
import { useAuth } from '@/contexts/AuthContext';
import { isFeatureEnabled } from '@/types/hospital';

export const useMenuItems = (props: AppSidebarProps): MenuItem[] => {
  const { hospitalType } = useAuth();
  const {
    diagnosesCount = 0,
    patientsCount = 0,
    usersCount = 0,
    complicationsCount = 0,
    cghsSurgeryCount = 0,
    labCount = 0,
    radiologyCount = 0,
    medicationCount = 0,
    refereesCount = 0,
    hopeSurgeonsCount = 0,
    hopeConsultantsCount = 0
  } = props;

  return useMemo(() => 
    menuItems
      .filter(item => {
        if (!hospitalType) return true; // Show all items if no hospital type
        
        // Filter menu items based on hospital features
        switch (item.title) {
          case "Pharmacy":
            return isFeatureEnabled(hospitalType, 'hasPharmacy');
          case "Lab":
            return isFeatureEnabled(hospitalType, 'hasLab');
          case "Radiology":
            return isFeatureEnabled(hospitalType, 'hasRadiology');
          case "Operation Theatre":
            return isFeatureEnabled(hospitalType, 'hasOperationTheatre');
          case "Accounting":
            return isFeatureEnabled(hospitalType, 'hasAccounting');
          case "Hope Surgeons":
            return isFeatureEnabled(hospitalType, 'hasHopeSurgeons');
          case "Hope Consultants":
            return isFeatureEnabled(hospitalType, 'hasHopeConsultants');
          case "CGHS Surgery":
            return isFeatureEnabled(hospitalType, 'hasCghsSurgery');
          default:
            return true; // Show other items by default
        }
      })
      .map(item => ({
        title: item.title,
        icon: item.icon,
        description: `View ${item.title.toLowerCase()} data`,
        route: item.url,
        count: item.title === "Patient Dashboard" ? patientsCount :
               item.title === "Diagnoses" ? diagnosesCount :
               item.title === "Patients" ? patientsCount :
               item.title === "Users" ? usersCount :
               item.title === "Complications" ? complicationsCount :
               item.title === "CGHS Surgery" ? cghsSurgeryCount :
               item.title === "Lab" ? labCount :
               item.title === "Radiology" ? radiologyCount :
               item.title === "Medications" ? medicationCount :
               item.title === "Referees" ? refereesCount :
               item.title === "Hope Surgeons" ? hopeSurgeonsCount :
               item.title === "Hope Consultants" ? hopeConsultantsCount : 0
      })), [
        hospitalType, diagnosesCount, patientsCount, usersCount, complicationsCount,
        cghsSurgeryCount, labCount, radiologyCount, medicationCount,
        refereesCount, hopeSurgeonsCount, hopeConsultantsCount
      ]
    );
};
