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

export const useFinancialSummary = (billId?: string, visitId?: string) => {
  const [financialSummaryData, setFinancialSummaryData] = useState<FinancialSummaryData>({
    totalAmount: {
      advancePayment: '',
      clinicalServices: '11276',
      laboratoryServices: '6565',
      radiology: '28000',
      pharmacy: '',
      implant: '',
      blood: '',
      surgery: '',
      mandatoryServices: '6100',
      physiotherapy: '',
      consultation: '10000',
      surgeryInternalReport: '',
      implantCost: '',
      private: '16200',
      accommodationCharges: '',
      total: '78141'
    },
    discount: {
      advancePayment: '',
      clinicalServices: '2256',
      laboratoryServices: '1315',
      radiology: '200',
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
      total: '3771'
    },
    amountPaid: {
      advancePayment: '29000',
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
      total: '29000'
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
      clinicalServices: '9020',
      laboratoryServices: '5250',
      radiology: '27800',
      pharmacy: '',
      implant: '',
      blood: '',
      surgery: '',
      mandatoryServices: '6100',
      physiotherapy: '',
      consultation: '10000',
      surgeryInternalReport: '',
      implantCost: '',
      private: '16200',
      accommodationCharges: '',
      total: '45370'
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

  // Load data when billId changes
  useEffect(() => {
    if (billId) {
      loadFinancialSummary();
    }
  }, [billId]);

  return {
    financialSummaryData,
    setFinancialSummaryData,
    packageDates,
    setPackageDates,
    isLoading,
    isSaving,
    saveFinancialSummary,
    handleFinancialSummaryChange,
    loadFinancialSummary
  };
};
