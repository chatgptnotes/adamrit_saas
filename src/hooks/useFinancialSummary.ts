import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FinancialSummaryData {
  // Total Amount Row
  totalAmount: {
    advancePayment: string;
    clinicalServices: string;
    laboratoryServices: string;
    radiology: string;
    pharmacy: string;
    implant: string;
    blood: string;
    surgery: string;
    mandatoryServices: string;
    physiotherapy: string;
    consultation: string;
    surgeryInternalReport: string;
    implantCost: string;
    private: string;
    accommodationCharges: string;
    total: string;
  };
  // Discount Row
  discount: {
    advancePayment: string;
    clinicalServices: string;
    laboratoryServices: string;
    radiology: string;
    pharmacy: string;
    implant: string;
    blood: string;
    surgery: string;
    mandatoryServices: string;
    physiotherapy: string;
    consultation: string;
    surgeryInternalReport: string;
    implantCost: string;
    private: string;
    accommodationCharges: string;
    total: string;
  };
  // Amount Paid Row
  amountPaid: {
    advancePayment: string;
    clinicalServices: string;
    laboratoryServices: string;
    radiology: string;
    pharmacy: string;
    implant: string;
    blood: string;
    surgery: string;
    mandatoryServices: string;
    physiotherapy: string;
    consultation: string;
    surgeryInternalReport: string;
    implantCost: string;
    private: string;
    accommodationCharges: string;
    total: string;
  };
  // Refunded Amount Row
  refundedAmount: {
    advancePayment: string;
    clinicalServices: string;
    laboratoryServices: string;
    radiology: string;
    pharmacy: string;
    implant: string;
    blood: string;
    surgery: string;
    mandatoryServices: string;
    physiotherapy: string;
    consultation: string;
    surgeryInternalReport: string;
    implantCost: string;
    private: string;
    accommodationCharges: string;
    total: string;
  };
  // Balance Row
  balance: {
    advancePayment: string;
    clinicalServices: string;
    laboratoryServices: string;
    radiology: string;
    pharmacy: string;
    implant: string;
    blood: string;
    surgery: string;
    mandatoryServices: string;
    physiotherapy: string;
    consultation: string;
    surgeryInternalReport: string;
    implantCost: string;
    private: string;
    accommodationCharges: string;
    total: string;
  };
}

export interface PackageDates {
  start_date: string;
  end_date: string;
  total_package_days: number;
  total_admission_days: number;
}

export const useFinancialSummary = (billId?: string, visitId?: string, savedMedicationData?: any[]) => {
  const [financialSummaryData, setFinancialSummaryData] = useState<FinancialSummaryData>({
    totalAmount: {
      advancePayment: '',
      clinicalServices: '',
      laboratoryServices: '',
      radiology: '',
      pharmacy: '',
      implant: '',
      blood: '',
      surgery: '',
      mandatoryServices: '',
      physiotherapy: '',
      consultation: '',
      surgeryInternalReport: '',
      implantCost: '',
      private: '',
      accommodationCharges: '',
      total: ''
    },
    discount: {
      advancePayment: '',
      clinicalServices: '',
      laboratoryServices: '',
      radiology: '',
      pharmacy: '',
      implant: '',
      blood: '',
      surgery: '',
      mandatoryServices: '',
      physiotherapy: '',
      consultation: '',
      surgeryInternalReport: '',
      implantCost: '',
      private: '',
      accommodationCharges: '',
      total: ''
    },
    amountPaid: {
      advancePayment: '',
      clinicalServices: '',
      laboratoryServices: '',
      radiology: '',
      pharmacy: '',
      implant: '',
      blood: '',
      surgery: '',
      mandatoryServices: '',
      physiotherapy: '',
      consultation: '',
      surgeryInternalReport: '',
      implantCost: '',
      private: '',
      accommodationCharges: '',
      total: ''
    },
    refundedAmount: {
      advancePayment: '',
      clinicalServices: '',
      laboratoryServices: '',
      radiology: '',
      pharmacy: '',
      implant: '',
      blood: '',
      surgery: '',
      mandatoryServices: '',
      physiotherapy: '',
      consultation: '',
      surgeryInternalReport: '',
      implantCost: '',
      private: '',
      accommodationCharges: '',
      total: ''
    },
    balance: {
      advancePayment: '',
      clinicalServices: '',
      laboratoryServices: '',
      radiology: '',
      pharmacy: '',
      implant: '',
      blood: '',
      surgery: '',
      mandatoryServices: '',
      physiotherapy: '',
      consultation: '',
      surgeryInternalReport: '',
      implantCost: '',
      private: '',
      accommodationCharges: '',
      total: ''
    }
  });

  const [packageDates, setPackageDates] = useState<PackageDates>({
    start_date: '',
    end_date: '',
    total_package_days: 7,
    total_admission_days: 0
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-calculation functions for fetching real data
  const fetchLabTestsTotal = async (): Promise<number> => {
    if (!visitId) {
      console.log('🚫 No visitId provided for lab tests total');
      return 0;
    }

    console.log('🔍 Fetching lab tests total for visit:', visitId);

    try {
      // Get visit UUID first
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id, visit_id')
        .eq('visit_id', visitId)
        .single();

      console.log('📋 Visit lookup result:', { visitData, visitError });

      if (visitError || !visitData) {
        console.error('❌ Failed to find visit for lab tests:', visitError);
        return 0;
      }

      console.log('✅ Found visit UUID:', visitData.id, 'for visit_id:', visitId);

      // Get visit_labs data using the UUID
      const { data: visitLabsData, error: visitLabsError } = await supabase
        .from('visit_labs')
        .select('*')
        .eq('visit_id', visitData.id);

      console.log('📊 Visit labs query result:', { 
        visitLabsData, 
        visitLabsError, 
        count: visitLabsData?.length || 0 
      });

      if (visitLabsError) {
        console.error('❌ Visit labs query error:', visitLabsError);
        return 0;
      }

      if (!visitLabsData || visitLabsData.length === 0) {
        console.log('📝 No visit labs data found');
        return 0;
      }

      // Get lab details for cost information
      const labIds = visitLabsData.map((item: any) => item.lab_id);
      console.log('🔍 Fetching lab details for IDs:', labIds);

      const { data: labsData, error: labsError } = await supabase
        .from('lab')
        .select('id, name, private')
        .in('id', labIds);

      console.log('📊 Labs details query result:', { 
        labsData, 
        labsError, 
        count: labsData?.length || 0 
      });

      if (labsError) {
        console.error('❌ Labs details query error:', labsError);
        return 0;
      }

      if (!labsData || labsData.length === 0) {
        console.log('📝 No lab details found for cost calculation');
        return 0;
      }

      // Calculate total using quantity and cost columns (updated after migration)
      let total = 0;
      visitLabsData.forEach((visitLab: any, index) => {
        const labDetail = labsData.find((l: any) => l.id === visitLab.lab_id);

        // Use cost column if available, otherwise use quantity × private rate
        let itemTotal = 0;
        if (visitLab.cost && visitLab.cost > 0) {
          // Migration complete: use cost column directly
          itemTotal = parseFloat(visitLab.cost) || 0;
        } else {
          // Fallback: calculate from quantity × private rate
          const quantity = visitLab.quantity || 1;
          const unitRate = (labDetail?.private && labDetail.private > 0) ? labDetail.private : 100;
          itemTotal = quantity * unitRate;
        }

        total += itemTotal;

        console.log(`💰 Lab ${index + 1}:`, {
          labName: labDetail?.name || 'Unknown',
          labId: visitLab.lab_id,
          quantity: visitLab.quantity || 1,
          unitRate: labDetail?.private || 100,
          costColumn: visitLab.cost,
          itemTotal: itemTotal,
          usingCostColumn: !!(visitLab.cost && visitLab.cost > 0)
        });
      });

      console.log('✅ Lab tests total calculated:', total, 'from', visitLabsData.length, 'tests');
      return total;
    } catch (error) {
      console.error('❌ Error fetching lab tests total:', error);
      return 0;
    }
  };

  const fetchClinicalServicesTotal = async (): Promise<number> => {
    if (!visitId) return 0;

    try {
      // Get visit UUID first
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError || !visitData) return 0;

      // Fetch clinical services from junction table
      const { data: clinicalData, error: clinicalError } = await supabase
        .from('visit_clinical_services')
        .select('amount')
        .eq('visit_id', visitData.id);

      if (clinicalError || !clinicalData) return 0;

      // Calculate total
      const total = clinicalData.reduce((sum, service) => sum + (parseFloat(service.amount) || 0), 0);
      console.log('💰 Clinical services total calculated:', total);
      return total;
    } catch (error) {
      console.error('Error fetching clinical services total:', error);
      return 0;
    }
  };

  const fetchMandatoryServicesTotal = async (): Promise<number> => {
    if (!visitId) return 0;

    try {
      // Get visit UUID first
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError || !visitData) return 0;

      // Fetch mandatory services from junction table
      const { data: mandatoryData, error: mandatoryError } = await supabase
        .from('visit_mandatory_services')
        .select('amount')
        .eq('visit_id', visitData.id);

      if (mandatoryError || !mandatoryData) return 0;

      // Calculate total
      const total = mandatoryData.reduce((sum, service) => sum + (parseFloat(service.amount) || 0), 0);
      console.log('💰 Mandatory services total calculated:', total);
      return total;
    } catch (error) {
      console.error('Error fetching mandatory services total:', error);
      return 0;
    }
  };

  const fetchRadiologyTotal = async (): Promise<number> => {
    if (!visitId) return 0;

    try {
      // Get visit UUID first
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('id')
        .eq('visit_id', visitId)
        .single();

      if (visitError || !visitData) return 0;

      // Get visit_radiology data using the UUID
      const { data: visitRadiologyData, error: visitRadiologyError } = await supabase
        .from('visit_radiology')
        .select('*')
        .eq('visit_id', visitData.id);

      if (visitRadiologyError || !visitRadiologyData || visitRadiologyData.length === 0) {
        console.log('📝 No radiology data found for visit');
        return 0;
      }

      // Get radiology details for cost information
      const radiologyIds = visitRadiologyData.map((item: any) => item.radiology_id);
      
      const { data: radiologyDetails, error: radiologyDetailsError } = await supabase
        .from('radiology')
        .select('id, name, cost')
        .in('id', radiologyIds);

      if (radiologyDetailsError || !radiologyDetails) {
        console.log('📝 No radiology details found for cost calculation');
        return 0;
      }

      // Calculate total using quantity-based calculation from visit_radiology
      let total = 0;
      visitRadiologyData.forEach((visitRadiology: any) => {
        // Use quantity-based calculation from visit_radiology table
        const quantity = visitRadiology.quantity || 1;
        const unitRate = visitRadiology.unit_rate || 0;
        const totalCost = visitRadiology.cost || 0;

        // If we have proper quantity data, use the stored total cost
        if (totalCost > 0) {
          total += parseFloat(totalCost.toString()) || 0;
        } else if (unitRate > 0) {
          // Fallback: calculate from unit_rate * quantity
          total += (parseFloat(unitRate.toString()) || 0) * quantity;
        } else {
          // Legacy fallback: use radiology table cost
          const radiologyDetail = radiologyDetails.find((r: any) => r.id === visitRadiology.radiology_id);
          const legacyCost = parseFloat(radiologyDetail?.cost?.toString() || '0') || 0;
          total += legacyCost * quantity;
        }
      });
      
      console.log('💰 Radiology total calculated:', total);
      return total;
    } catch (error) {
      console.error('Error fetching radiology total:', error);
      return 0;
    }
  };

  const fetchPharmacyTotal = async (): Promise<number> => {
    console.log('🚀 fetchPharmacyTotal called - using existing savedMedicationData');
    
    // Use existing savedMedicationData instead of database query
    if (!savedMedicationData || savedMedicationData.length === 0) {
      console.log('📝 No savedMedicationData available');
      return 0;
    }

    // Use same calculation logic as display
    const total = savedMedicationData.reduce((sum, medication) => {
      const cost = parseFloat(medication.cost || '0') || 0;
      console.log(`💊 Medication: ${medication.medication_name}, Cost: ${cost}`);
      return sum + cost;
    }, 0);
    
    console.log('💰 Pharmacy total calculated from savedMedicationData:', total, 'from', savedMedicationData.length, 'medications');
    return total;
  };

  const fetchAdvancePaymentTotal = async (): Promise<number> => {
    if (!visitId) {
      console.log('🚫 No visitId provided for advance payment total');
      return 0;
    }

    console.log('🔍 Fetching advance payment total for visit:', visitId);

    try {
      // Query advance_payment table directly using visit_id (no need for UUID conversion)
      const { data: advancePaymentData, error: advancePaymentError } = await supabase
        .from('advance_payment')
        .select('advance_amount, status')
        .eq('visit_id', visitId)
        .eq('status', 'ACTIVE'); // Only include active payments

      console.log('📊 Advance payment query result:', { 
        advancePaymentData, 
        advancePaymentError, 
        count: advancePaymentData?.length || 0 
      });

      if (advancePaymentError) {
        console.error('❌ Advance payment query error:', advancePaymentError);
        return 0;
      }

      if (!advancePaymentData || advancePaymentData.length === 0) {
        console.log('📝 No advance payment data found for visit');
        return 0;
      }

      // Calculate total advance payment
      const total = advancePaymentData.reduce((sum, payment) => {
        const amount = parseFloat(payment.advance_amount?.toString() || '0') || 0;
        return sum + amount;
      }, 0);

      console.log('✅ Advance payment total calculated:', total, 'from', advancePaymentData.length, 'payments');
      return total;
    } catch (error) {
      console.error('❌ Error fetching advance payment total:', error);
      return 0;
    }
  };

  // Load financial summary data from database
  const loadFinancialSummary = async () => {
    if (!billId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('financial_summary')
        .select('*')
        .eq('bill_id', billId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error loading financial summary:', error);
        toast.error('Failed to load financial summary data');
        return;
      }

      if (data) {
        // Convert database format to component format
        const convertedData: FinancialSummaryData = {
          totalAmount: {
            advancePayment: data.total_amount_advance_payment?.toString() || '',
            clinicalServices: data.total_amount_clinical_services?.toString() || '',
            laboratoryServices: data.total_amount_laboratory_services?.toString() || '',
            radiology: data.total_amount_radiology?.toString() || '',
            pharmacy: data.total_amount_pharmacy?.toString() || '',
            implant: data.total_amount_implant?.toString() || '',
            blood: data.total_amount_blood?.toString() || '',
            surgery: data.total_amount_surgery?.toString() || '',
            mandatoryServices: data.total_amount_mandatory_services?.toString() || '',
            physiotherapy: data.total_amount_physiotherapy?.toString() || '',
            consultation: data.total_amount_consultation?.toString() || '',
            surgeryInternalReport: data.total_amount_surgery_internal_report?.toString() || '',
            implantCost: data.total_amount_implant_cost?.toString() || '',
            private: data.total_amount_private?.toString() || '',
            accommodationCharges: data.total_amount_accommodation_charges?.toString() || '',
            total: data.total_amount_total?.toString() || ''
          },
          discount: {
            advancePayment: data.discount_advance_payment?.toString() || '',
            clinicalServices: data.discount_clinical_services?.toString() || '',
            laboratoryServices: data.discount_laboratory_services?.toString() || '',
            radiology: data.discount_radiology?.toString() || '',
            pharmacy: data.discount_pharmacy?.toString() || '',
            implant: data.discount_implant?.toString() || '',
            blood: data.discount_blood?.toString() || '',
            surgery: data.discount_surgery?.toString() || '',
            mandatoryServices: data.discount_mandatory_services?.toString() || '',
            physiotherapy: data.discount_physiotherapy?.toString() || '',
            consultation: data.discount_consultation?.toString() || '',
            surgeryInternalReport: data.discount_surgery_internal_report?.toString() || '',
            implantCost: data.discount_implant_cost?.toString() || '',
            private: data.discount_private?.toString() || '',
            accommodationCharges: data.discount_accommodation_charges?.toString() || '',
            total: data.discount_total?.toString() || ''
          },
          amountPaid: {
            advancePayment: data.amount_paid_advance_payment?.toString() || '',
            clinicalServices: data.amount_paid_clinical_services?.toString() || '',
            laboratoryServices: data.amount_paid_laboratory_services?.toString() || '',
            radiology: data.amount_paid_radiology?.toString() || '',
            pharmacy: data.amount_paid_pharmacy?.toString() || '',
            implant: data.amount_paid_implant?.toString() || '',
            blood: data.amount_paid_blood?.toString() || '',
            surgery: data.amount_paid_surgery?.toString() || '',
            mandatoryServices: data.amount_paid_mandatory_services?.toString() || '',
            physiotherapy: data.amount_paid_physiotherapy?.toString() || '',
            consultation: data.amount_paid_consultation?.toString() || '',
            surgeryInternalReport: data.amount_paid_surgery_internal_report?.toString() || '',
            implantCost: data.amount_paid_implant_cost?.toString() || '',
            private: data.amount_paid_private?.toString() || '',
            accommodationCharges: data.amount_paid_accommodation_charges?.toString() || '',
            total: data.amount_paid_total?.toString() || ''
          },
          refundedAmount: {
            advancePayment: data.refunded_amount_advance_payment?.toString() || '',
            clinicalServices: data.refunded_amount_clinical_services?.toString() || '',
            laboratoryServices: data.refunded_amount_laboratory_services?.toString() || '',
            radiology: data.refunded_amount_radiology?.toString() || '',
            pharmacy: data.refunded_amount_pharmacy?.toString() || '',
            implant: data.refunded_amount_implant?.toString() || '',
            blood: data.refunded_amount_blood?.toString() || '',
            surgery: data.refunded_amount_surgery?.toString() || '',
            mandatoryServices: data.refunded_amount_mandatory_services?.toString() || '',
            physiotherapy: data.refunded_amount_physiotherapy?.toString() || '',
            consultation: data.refunded_amount_consultation?.toString() || '',
            surgeryInternalReport: data.refunded_amount_surgery_internal_report?.toString() || '',
            implantCost: data.refunded_amount_implant_cost?.toString() || '',
            private: data.refunded_amount_private?.toString() || '',
            accommodationCharges: data.refunded_amount_accommodation_charges?.toString() || '',
            total: data.refunded_amount_total?.toString() || ''
          },
          balance: {
            advancePayment: data.balance_advance_payment?.toString() || '',
            clinicalServices: data.balance_clinical_services?.toString() || '',
            laboratoryServices: data.balance_laboratory_services?.toString() || '',
            radiology: data.balance_radiology?.toString() || '',
            pharmacy: data.balance_pharmacy?.toString() || '',
            implant: data.balance_implant?.toString() || '',
            blood: data.balance_blood?.toString() || '',
            surgery: data.balance_surgery?.toString() || '',
            mandatoryServices: data.balance_mandatory_services?.toString() || '',
            physiotherapy: data.balance_physiotherapy?.toString() || '',
            consultation: data.balance_consultation?.toString() || '',
            surgeryInternalReport: data.balance_surgery_internal_report?.toString() || '',
            implantCost: data.balance_implant_cost?.toString() || '',
            private: data.balance_private?.toString() || '',
            accommodationCharges: data.balance_accommodation_charges?.toString() || '',
            total: data.balance_total?.toString() || ''
          }
        };

        setFinancialSummaryData(convertedData);

        // Load package dates
        if (data.package_start_date || data.package_end_date) {
          setPackageDates({
            start_date: data.package_start_date || '',
            end_date: data.package_end_date || '',
            total_package_days: data.total_package_days || 7,
            total_admission_days: data.total_admission_days || 0
          });
        }

        console.log('✅ Financial summary loaded from database');
      }
    } catch (error) {
      console.error('Error loading financial summary:', error);
      toast.error('Failed to load financial summary data');
    } finally {
      setIsLoading(false);
    }
  };

  // Save financial summary data to database
  const saveFinancialSummary = async () => {
    if (!billId) {
      toast.error('Bill ID is required to save financial summary');
      return;
    }

    setIsSaving(true);
    try {
      // Convert component format to database format
      const dbData = {
        bill_id: billId,
        visit_id: visitId,
        
        // Total Amount Row
        total_amount_advance_payment: parseFloat(financialSummaryData.totalAmount.advancePayment) || 0,
        total_amount_clinical_services: parseFloat(financialSummaryData.totalAmount.clinicalServices) || 0,
        total_amount_laboratory_services: parseFloat(financialSummaryData.totalAmount.laboratoryServices) || 0,
        total_amount_radiology: parseFloat(financialSummaryData.totalAmount.radiology) || 0,
        total_amount_pharmacy: parseFloat(financialSummaryData.totalAmount.pharmacy) || 0,
        total_amount_implant: parseFloat(financialSummaryData.totalAmount.implant) || 0,
        total_amount_blood: parseFloat(financialSummaryData.totalAmount.blood) || 0,
        total_amount_surgery: parseFloat(financialSummaryData.totalAmount.surgery) || 0,
        total_amount_mandatory_services: parseFloat(financialSummaryData.totalAmount.mandatoryServices) || 0,
        total_amount_physiotherapy: parseFloat(financialSummaryData.totalAmount.physiotherapy) || 0,
        total_amount_consultation: parseFloat(financialSummaryData.totalAmount.consultation) || 0,
        total_amount_surgery_internal_report: parseFloat(financialSummaryData.totalAmount.surgeryInternalReport) || 0,
        total_amount_implant_cost: parseFloat(financialSummaryData.totalAmount.implantCost) || 0,
        total_amount_private: parseFloat(financialSummaryData.totalAmount.private) || 0,
        total_amount_accommodation_charges: parseFloat(financialSummaryData.totalAmount.accommodationCharges) || 0,
        total_amount_total: parseFloat(financialSummaryData.totalAmount.total) || 0,
        
        // Discount Row
        discount_advance_payment: parseFloat(financialSummaryData.discount.advancePayment) || 0,
        discount_clinical_services: parseFloat(financialSummaryData.discount.clinicalServices) || 0,
        discount_laboratory_services: parseFloat(financialSummaryData.discount.laboratoryServices) || 0,
        discount_radiology: parseFloat(financialSummaryData.discount.radiology) || 0,
        discount_pharmacy: parseFloat(financialSummaryData.discount.pharmacy) || 0,
        discount_implant: parseFloat(financialSummaryData.discount.implant) || 0,
        discount_blood: parseFloat(financialSummaryData.discount.blood) || 0,
        discount_surgery: parseFloat(financialSummaryData.discount.surgery) || 0,
        discount_mandatory_services: parseFloat(financialSummaryData.discount.mandatoryServices) || 0,
        discount_physiotherapy: parseFloat(financialSummaryData.discount.physiotherapy) || 0,
        discount_consultation: parseFloat(financialSummaryData.discount.consultation) || 0,
        discount_surgery_internal_report: parseFloat(financialSummaryData.discount.surgeryInternalReport) || 0,
        discount_implant_cost: parseFloat(financialSummaryData.discount.implantCost) || 0,
        discount_private: parseFloat(financialSummaryData.discount.private) || 0,
        discount_accommodation_charges: parseFloat(financialSummaryData.discount.accommodationCharges) || 0,
        discount_total: parseFloat(financialSummaryData.discount.total) || 0,
        
        // Amount Paid Row
        amount_paid_advance_payment: parseFloat(financialSummaryData.amountPaid.advancePayment) || 0,
        amount_paid_clinical_services: parseFloat(financialSummaryData.amountPaid.clinicalServices) || 0,
        amount_paid_laboratory_services: parseFloat(financialSummaryData.amountPaid.laboratoryServices) || 0,
        amount_paid_radiology: parseFloat(financialSummaryData.amountPaid.radiology) || 0,
        amount_paid_pharmacy: parseFloat(financialSummaryData.amountPaid.pharmacy) || 0,
        amount_paid_implant: parseFloat(financialSummaryData.amountPaid.implant) || 0,
        amount_paid_blood: parseFloat(financialSummaryData.amountPaid.blood) || 0,
        amount_paid_surgery: parseFloat(financialSummaryData.amountPaid.surgery) || 0,
        amount_paid_mandatory_services: parseFloat(financialSummaryData.amountPaid.mandatoryServices) || 0,
        amount_paid_physiotherapy: parseFloat(financialSummaryData.amountPaid.physiotherapy) || 0,
        amount_paid_consultation: parseFloat(financialSummaryData.amountPaid.consultation) || 0,
        amount_paid_surgery_internal_report: parseFloat(financialSummaryData.amountPaid.surgeryInternalReport) || 0,
        amount_paid_implant_cost: parseFloat(financialSummaryData.amountPaid.implantCost) || 0,
        amount_paid_private: parseFloat(financialSummaryData.amountPaid.private) || 0,
        amount_paid_accommodation_charges: parseFloat(financialSummaryData.amountPaid.accommodationCharges) || 0,
        amount_paid_total: parseFloat(financialSummaryData.amountPaid.total) || 0,
        
        // Refunded Amount Row
        refunded_amount_advance_payment: parseFloat(financialSummaryData.refundedAmount.advancePayment) || 0,
        refunded_amount_clinical_services: parseFloat(financialSummaryData.refundedAmount.clinicalServices) || 0,
        refunded_amount_laboratory_services: parseFloat(financialSummaryData.refundedAmount.laboratoryServices) || 0,
        refunded_amount_radiology: parseFloat(financialSummaryData.refundedAmount.radiology) || 0,
        refunded_amount_pharmacy: parseFloat(financialSummaryData.refundedAmount.pharmacy) || 0,
        refunded_amount_implant: parseFloat(financialSummaryData.refundedAmount.implant) || 0,
        refunded_amount_blood: parseFloat(financialSummaryData.refundedAmount.blood) || 0,
        refunded_amount_surgery: parseFloat(financialSummaryData.refundedAmount.surgery) || 0,
        refunded_amount_mandatory_services: parseFloat(financialSummaryData.refundedAmount.mandatoryServices) || 0,
        refunded_amount_physiotherapy: parseFloat(financialSummaryData.refundedAmount.physiotherapy) || 0,
        refunded_amount_consultation: parseFloat(financialSummaryData.refundedAmount.consultation) || 0,
        refunded_amount_surgery_internal_report: parseFloat(financialSummaryData.refundedAmount.surgeryInternalReport) || 0,
        refunded_amount_implant_cost: parseFloat(financialSummaryData.refundedAmount.implantCost) || 0,
        refunded_amount_private: parseFloat(financialSummaryData.refundedAmount.private) || 0,
        refunded_amount_accommodation_charges: parseFloat(financialSummaryData.refundedAmount.accommodationCharges) || 0,
        refunded_amount_total: parseFloat(financialSummaryData.refundedAmount.total) || 0,
        
        // Balance Row
        balance_advance_payment: parseFloat(financialSummaryData.balance.advancePayment) || 0,
        balance_clinical_services: parseFloat(financialSummaryData.balance.clinicalServices) || 0,
        balance_laboratory_services: parseFloat(financialSummaryData.balance.laboratoryServices) || 0,
        balance_radiology: parseFloat(financialSummaryData.balance.radiology) || 0,
        balance_pharmacy: parseFloat(financialSummaryData.balance.pharmacy) || 0,
        balance_implant: parseFloat(financialSummaryData.balance.implant) || 0,
        balance_blood: parseFloat(financialSummaryData.balance.blood) || 0,
        balance_surgery: parseFloat(financialSummaryData.balance.surgery) || 0,
        balance_mandatory_services: parseFloat(financialSummaryData.balance.mandatoryServices) || 0,
        balance_physiotherapy: parseFloat(financialSummaryData.balance.physiotherapy) || 0,
        balance_consultation: parseFloat(financialSummaryData.balance.consultation) || 0,
        balance_surgery_internal_report: parseFloat(financialSummaryData.balance.surgeryInternalReport) || 0,
        balance_implant_cost: parseFloat(financialSummaryData.balance.implantCost) || 0,
        balance_private: parseFloat(financialSummaryData.balance.private) || 0,
        balance_accommodation_charges: parseFloat(financialSummaryData.balance.accommodationCharges) || 0,
        balance_total: parseFloat(financialSummaryData.balance.total) || 0,
        
        // Package dates
        package_start_date: packageDates.start_date || null,
        package_end_date: packageDates.end_date || null,
        total_package_days: packageDates.total_package_days || 7,
        total_admission_days: packageDates.total_admission_days || 0
      };

      // Check if financial summary already exists
      const { data: existingData } = await supabase
        .from('financial_summary')
        .select('id')
        .eq('bill_id', billId)
        .single();

      let result;
      if (existingData) {
        // Update existing record
        result = await supabase
          .from('financial_summary')
          .update(dbData)
          .eq('bill_id', billId)
          .select();
      } else {
        // Insert new record
        result = await supabase
          .from('financial_summary')
          .insert(dbData)
          .select();
      }

      if (result.error) {
        console.error('Error saving financial summary:', result.error);
        toast.error('Failed to save financial summary data');
        return;
      }

      toast.success('Financial summary saved successfully!');
      console.log('✅ Financial summary saved to database');
    } catch (error) {
      console.error('Error saving financial summary:', error);
      toast.error('Failed to save financial summary data');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle financial summary input change
  const handleFinancialSummaryChange = (row: string, column: string, value: string) => {
    setFinancialSummaryData(prev => ({
      ...prev,
      [row]: {
        ...prev[row as keyof typeof prev],
        [column]: value
      }
    }));
  };

  // Auto-populate financial data from database
  const autoPopulateFinancialData = async () => {
    if (!visitId) {
      console.log('🚫 No visitId provided for auto-population');
      return;
    }

    console.log('🔄 Auto-populating financial data for visit:', visitId);
    setIsLoading(true);

    try {
      // Fetch all totals in parallel
      const [
        labTotal,
        clinicalTotal,
        mandatoryTotal,
        radiologyTotal,
        pharmacyTotal,
        advancePaymentTotal
      ] = await Promise.all([
        fetchLabTestsTotal(),
        fetchClinicalServicesTotal(), 
        fetchMandatoryServicesTotal(),
        fetchRadiologyTotal(),
        fetchPharmacyTotal(),
        fetchAdvancePaymentTotal()
      ]);

      // Calculate grand total
      const grandTotal = labTotal + clinicalTotal + mandatoryTotal + radiologyTotal + pharmacyTotal;

      // Update financial summary data with calculated totals
      setFinancialSummaryData(prev => ({
        ...prev,
        totalAmount: {
          ...prev.totalAmount,
          advancePayment: advancePaymentTotal.toString(),
          clinicalServices: clinicalTotal.toString(),
          laboratoryServices: labTotal.toString(),
          radiology: radiologyTotal.toString(),
          pharmacy: pharmacyTotal.toString(),
          mandatoryServices: mandatoryTotal.toString(),
          total: grandTotal.toString()
        },
        // Auto-calculate balance (Total - Discount - Amount Paid + Refunded)
        balance: {
          ...prev.balance,
          advancePayment: (advancePaymentTotal - (parseFloat(prev.discount.advancePayment) || 0) - (parseFloat(prev.amountPaid.advancePayment) || 0) + (parseFloat(prev.refundedAmount.advancePayment) || 0)).toString(),
          clinicalServices: (clinicalTotal - (parseFloat(prev.discount.clinicalServices) || 0) - (parseFloat(prev.amountPaid.clinicalServices) || 0) + (parseFloat(prev.refundedAmount.clinicalServices) || 0)).toString(),
          laboratoryServices: (labTotal - (parseFloat(prev.discount.laboratoryServices) || 0) - (parseFloat(prev.amountPaid.laboratoryServices) || 0) + (parseFloat(prev.refundedAmount.laboratoryServices) || 0)).toString(),
          radiology: (radiologyTotal - (parseFloat(prev.discount.radiology) || 0) - (parseFloat(prev.amountPaid.radiology) || 0) + (parseFloat(prev.refundedAmount.radiology) || 0)).toString(),
          pharmacy: (pharmacyTotal - (parseFloat(prev.discount.pharmacy) || 0) - (parseFloat(prev.amountPaid.pharmacy) || 0) + (parseFloat(prev.refundedAmount.pharmacy) || 0)).toString(),
          mandatoryServices: (mandatoryTotal - (parseFloat(prev.discount.mandatoryServices) || 0) - (parseFloat(prev.amountPaid.mandatoryServices) || 0) + (parseFloat(prev.refundedAmount.mandatoryServices) || 0)).toString(),
          total: (grandTotal - (parseFloat(prev.discount.total) || 0) - (parseFloat(prev.amountPaid.total) || 0) + (parseFloat(prev.refundedAmount.total) || 0)).toString()
        }
      }));

      console.log('✅ Financial data auto-populated:', {
        advancePaymentTotal,
        labTotal,
        clinicalTotal,
        mandatoryTotal,
        radiologyTotal,
        pharmacyTotal,
        grandTotal
      });

    } catch (error) {
      console.error('❌ Error auto-populating financial data:', error);
      toast.error('Failed to load financial data from database');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when billId or visitId changes
  useEffect(() => {
    if (billId) {
      loadFinancialSummary();
    }
  }, [billId]);

  // Auto-populate when visitId changes
  useEffect(() => {
    if (visitId) {
      console.log('🔄 Auto-populate triggered by visitId change:', visitId);
      // Add small delay to ensure components are ready
      setTimeout(() => {
        autoPopulateFinancialData();
      }, 500);
    } else {
      console.log('🚫 No visitId available for auto-populate');
    }
  }, [visitId]);

  return {
    financialSummaryData,
    setFinancialSummaryData,
    packageDates,
    setPackageDates,
    isLoading,
    isSaving,
    saveFinancialSummary,
    handleFinancialSummaryChange,
    loadFinancialSummary,
    autoPopulateFinancialData
  };
};
