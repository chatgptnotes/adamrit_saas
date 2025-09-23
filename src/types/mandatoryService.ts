export interface MandatoryService {
  id: string;
  service_name: string;
  tpa_rate?: number | null;
  private_rate?: number | null;
  cghs_rate?: number | null;
  non_cghs_rate?: number | null;
  status: string;
  hospital_name: string;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface CreateMandatoryServiceData {
  service_name: string;
  tpa_rate?: number;
  private_rate?: number;
  cghs_rate?: number;
  non_cghs_rate?: number;
  hospital_name: string;
}