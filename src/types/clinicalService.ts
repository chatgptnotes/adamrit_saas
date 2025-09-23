export interface ClinicalService {
  id: string;
  service_name: string;
  tpa_rate?: number | null;
  private_rate?: number | null;
  nabh_rate?: number | null;
  non_nabh_rate?: number | null;
  status: string;
  hospital_name: string;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface CreateClinicalServiceData {
  service_name: string;
  tpa_rate?: number;
  private_rate?: number;
  nabh_rate?: number;
  non_nabh_rate?: number;
  hospital_name: string;
}