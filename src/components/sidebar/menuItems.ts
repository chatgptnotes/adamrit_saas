
import { BarChart3, Calendar, Users, UserPlus, Database, Activity, FileText, TestTube, Camera, Pill, MapPin, Stethoscope, UserCog, ScrollText, Calculator, Syringe, Shield, Building2, ClipboardList, ShieldCheck, Receipt, HeartHandshake } from 'lucide-react';

export const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: BarChart3,
  },
  {
    title: "Patient Dashboard",
    url: "/patient-dashboard",
    icon: Users,
  },
  {
    title: "Today's IPD",
    url: "/todays-ipd",
    icon: Calendar,
  },
  {
    title: "Today's OPD",
    url: "/todays-opd",
    icon: ClipboardList,
  },
  {
    title: "Currently Admitted",
    url: "/currently-admitted",
    icon: Building2,
  },

  {
    title: "Security Gate",
    url: "/security-verification",
    icon: Shield,
  },
  {
    title: "Mandatory Service",
    url: "/mandatory-service",
    icon: ShieldCheck,
  },
  {
    title: "Clinical Services",
    url: "/clinical-services",
    icon: HeartHandshake,
  },
  {
    title: "Diagnoses",
    url: "/diagnoses",
    icon: Activity,
  },
  {
    title: "Operation Theatre",
    url: "/operation-theatre",
    icon: Syringe,
  },
  {
    title: "Patients",
    url: "/patients",
    icon: UserPlus,
  },
  {
    title: "Users",
    url: "/users",
    icon: UserCog,
  },
  {
    title: "Complications", 
    url: "/complications",
    icon: Database,
  },
  {
    title: "CGHS Surgery",
    url: "/cghs-surgery",
    icon: FileText,
  },
  {
    title: "Lab",
    url: "/lab",
    icon: TestTube,
  },
  {
    title: "Radiology",
    url: "/radiology", 
    icon: Camera,
  },
  {
    title: "Medications",
    url: "/medications",
    icon: Pill,
  },
  {
    title: "Prescriptions",
    url: "/prescriptions",
    icon: ScrollText,
  },
  {
    title: "Referees",
    url: "/referees",
    icon: MapPin,
  },
  {
    title: "Hope Surgeons", 
    url: "/hope-surgeons",
    icon: Stethoscope,
  },
  {
    title: "Hope Consultants",
    url: "/hope-consultants", 
    icon: UserCog,
  },
  {
    title: "Accounting",
    url: "/accounting",
    icon: Calculator,
  },
  {
    title: "Bill Management",
    url: "/bill-management",
    icon: Receipt,
  },
  {
    title: "Corporate",
    url: "/corporate",
    icon: Building2,
  },
  {
    title: "Pharmacy",
    url: "/pharmacy",
    icon: Pill,
  },
];
