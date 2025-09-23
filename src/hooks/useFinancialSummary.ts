import { useState, useEffect, useCallback } from 'react';
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
      advancePayment: '0',
      clinicalServices: '0',
      laboratoryServices: '0',
      radiology: '0',
      pharmacy: '0',
      implant: '0',
      blood: '0',
      surgery: '0',
      mandatoryServices: '0',
      physiotherapy: '0',
      consultation: '0',
      surgeryInternalReport: '0',
      implantCost: '0',
      private: '0',
      accommodationCharges: '0',
      total: '0'
    },
    discount: {
      advancePayment: '0',
      clinicalServices: '0',
      laboratoryServices: '0',
      radiology: '0',
      pharmacy: '0',
      implant: '0',
      blood: '0',
      surgery: '0',
      mandatoryServices: '0',
      physiotherapy: '0',
      consultation: '0',
      surgeryInternalReport: '0',
      implantCost: '0',
      private: '0',
      accommodationCharges: '0',
      total: '0'
    },
    amountPaid: {
      advancePayment: '0',
      clinicalServices: '0',
      laboratoryServices: '0',
      radiology: '0',
      pharmacy: '0',
      implant: '0',
      blood: '0',
      surgery: '0',
      mandatoryServices: '0',
      physiotherapy: '0',
      consultation: '0',
      surgeryInternalReport: '0',
      implantCost: '0',
      private: '0',
      accommodationCharges: '0',
      total: '0'
    },
    refundedAmount: {
      advancePayment: '0',
      clinicalServices: '0',
      laboratoryServices: '0',
      radiology: '0',
      pharmacy: '0',
      implant: '0',
      blood: '0',
      surgery: '0',
      mandatoryServices: '0',
      physiotherapy: '0',
      consultation: '0',
      surgeryInternalReport: '0',
      implantCost: '0',
      private: '0',
      accommodationCharges: '0',
      total: '0'
    },
    balance: {
      advancePayment: '0',
      clinicalServices: '0',
      laboratoryServices: '0',
      radiology: '0',
      pharmacy: '0',
      implant: '0',
      blood: '0',
      surgery: '0',
      mandatoryServices: '0',
      physiotherapy: '0',
      consultation: '0',
      surgeryInternalReport: '0',
      implantCost: '0',
      private: '0',
      accommodationCharges: '0',
      total: '0'
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
  const loadFinancialSummary = useCallback(async () => {
    if (!billId) {
      console.log('❌ No billId provided to loadFinancialSummary');
      return;
    }

    console.log('🔄 Loading financial summary for billId:', billId);
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('financial_summary')
        .select('*')
        .eq('bill_id', billId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('❌ Error loading financial summary:', error);
        toast.error('Failed to load financial summary data');
        return;
      }

      if (data) {
        console.log('✅ Found financial summary data:', data);
        // Convert database format to component format
        const convertedData: FinancialSummaryData = {
          totalAmount: {
            advancePayment: data.total_amount_advance_payment?.toString() || '0',
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
            advancePayment: data.amount_paid_advance_payment?.toString() || '0',
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
            advancePayment: data.refunded_amount_advance_payment?.toString() || '0',
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
            advancePayment: data.balance_advance_payment?.toString() || '0',
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
      } else {
        console.log('⚠️ No financial summary data found in database for billId:', billId);
      }
    } catch (error) {
      console.error('Error loading financial summary:', error);
      toast.error('Failed to load financial summary data');
    } finally {
      setIsLoading(false);
    }
  }, [billId]);

  // Save financial summary data to database
  const saveFinancialSummary = async (dataToSave?: FinancialSummaryData) => {
    const dataForSaving = dataToSave || financialSummaryData;
    if (!billId) {
      console.log('❌ No billId provided to saveFinancialSummary');
      toast.error('Bill ID is required to save financial summary');
      return;
    }

    console.log('💾 Saving financial summary for billId:', billId);
    console.log('📊 Current financialSummaryData:', financialSummaryData);
    setIsSaving(true);
    try {
      // First, validate that the bill exists
      console.log('🔍 Validating bill exists in database...');
      const { data: billExists, error: billCheckError } = await supabase
        .from('bills')
        .select('id')
        .eq('id', billId)
        .single();

      if (billCheckError) {
        console.error('❌ Error checking bill existence:', billCheckError);
        if (billCheckError.code === 'PGRST116') {
          toast.error('Error: Bill not found. Please save the bill first before adding financial data.');
        } else {
          toast.error(`Error validating bill: ${billCheckError.message}`);
        }
        return;
      }

      console.log('✅ Bill validation successful:', billExists);
      // Convert component format to database format
      console.log('💾 About to save financial summary data:', dataForSaving);
      console.log('💰 Advance payment values:');
      console.log('  - totalAmount.advancePayment:', dataForSaving.totalAmount.advancePayment);
      console.log('  - amountPaid.advancePayment:', dataForSaving.amountPaid.advancePayment);
      console.log('  - refundedAmount.advancePayment:', dataForSaving.refundedAmount.advancePayment);

      const dbData = {
        bill_id: billId,
        visit_id: null, // Set to null for now since visitId is not in UUID format

        // Total Amount Row
        total_amount_advance_payment: parseFloat(dataForSaving.totalAmount.advancePayment) || 0,
        total_amount_clinical_services: parseFloat(dataForSaving.totalAmount.clinicalServices) || 0,
        total_amount_laboratory_services: parseFloat(dataForSaving.totalAmount.laboratoryServices) || 0,
        total_amount_radiology: parseFloat(dataForSaving.totalAmount.radiology) || 0,
        total_amount_pharmacy: parseFloat(dataForSaving.totalAmount.pharmacy) || 0,
        total_amount_implant: parseFloat(dataForSaving.totalAmount.implant) || 0,
        total_amount_blood: parseFloat(dataForSaving.totalAmount.blood) || 0,
        total_amount_surgery: parseFloat(dataForSaving.totalAmount.surgery) || 0,
        total_amount_mandatory_services: parseFloat(dataForSaving.totalAmount.mandatoryServices) || 0,
        total_amount_physiotherapy: parseFloat(dataForSaving.totalAmount.physiotherapy) || 0,
        total_amount_consultation: parseFloat(dataForSaving.totalAmount.consultation) || 0,
        total_amount_surgery_internal_report: parseFloat(dataForSaving.totalAmount.surgeryInternalReport) || 0,
        total_amount_implant_cost: parseFloat(dataForSaving.totalAmount.implantCost) || 0,
        total_amount_private: parseFloat(dataForSaving.totalAmount.private) || 0,
        total_amount_accommodation_charges: parseFloat(dataForSaving.totalAmount.accommodationCharges) || 0,
        total_amount_total: parseFloat(dataForSaving.totalAmount.total) || 0,
        
        // Discount Row
        discount_advance_payment: parseFloat(dataForSaving.discount.advancePayment) || 0,
        discount_clinical_services: parseFloat(dataForSaving.discount.clinicalServices) || 0,
        discount_laboratory_services: parseFloat(dataForSaving.discount.laboratoryServices) || 0,
        discount_radiology: parseFloat(dataForSaving.discount.radiology) || 0,
        discount_pharmacy: parseFloat(dataForSaving.discount.pharmacy) || 0,
        discount_implant: parseFloat(dataForSaving.discount.implant) || 0,
        discount_blood: parseFloat(dataForSaving.discount.blood) || 0,
        discount_surgery: parseFloat(dataForSaving.discount.surgery) || 0,
        discount_mandatory_services: parseFloat(dataForSaving.discount.mandatoryServices) || 0,
        discount_physiotherapy: parseFloat(dataForSaving.discount.physiotherapy) || 0,
        discount_consultation: parseFloat(dataForSaving.discount.consultation) || 0,
        discount_surgery_internal_report: parseFloat(dataForSaving.discount.surgeryInternalReport) || 0,
        discount_implant_cost: parseFloat(dataForSaving.discount.implantCost) || 0,
        discount_private: parseFloat(dataForSaving.discount.private) || 0,
        discount_accommodation_charges: parseFloat(dataForSaving.discount.accommodationCharges) || 0,
        discount_total: parseFloat(dataForSaving.discount.total) || 0,
        
        // Amount Paid Row
        amount_paid_advance_payment: parseFloat(dataForSaving.amountPaid.advancePayment) || 0,
        amount_paid_clinical_services: parseFloat(dataForSaving.amountPaid.clinicalServices) || 0,
        amount_paid_laboratory_services: parseFloat(dataForSaving.amountPaid.laboratoryServices) || 0,
        amount_paid_radiology: parseFloat(dataForSaving.amountPaid.radiology) || 0,
        amount_paid_pharmacy: parseFloat(dataForSaving.amountPaid.pharmacy) || 0,
        amount_paid_implant: parseFloat(dataForSaving.amountPaid.implant) || 0,
        amount_paid_blood: parseFloat(dataForSaving.amountPaid.blood) || 0,
        amount_paid_surgery: parseFloat(dataForSaving.amountPaid.surgery) || 0,
        amount_paid_mandatory_services: parseFloat(dataForSaving.amountPaid.mandatoryServices) || 0,
        amount_paid_physiotherapy: parseFloat(dataForSaving.amountPaid.physiotherapy) || 0,
        amount_paid_consultation: parseFloat(dataForSaving.amountPaid.consultation) || 0,
        amount_paid_surgery_internal_report: parseFloat(dataForSaving.amountPaid.surgeryInternalReport) || 0,
        amount_paid_implant_cost: parseFloat(dataForSaving.amountPaid.implantCost) || 0,
        amount_paid_private: parseFloat(dataForSaving.amountPaid.private) || 0,
        amount_paid_accommodation_charges: parseFloat(dataForSaving.amountPaid.accommodationCharges) || 0,
        amount_paid_total: parseFloat(dataForSaving.amountPaid.total) || 0,
        
        // Refunded Amount Row
        refunded_amount_advance_payment: parseFloat(dataForSaving.refundedAmount.advancePayment) || 0,
        refunded_amount_clinical_services: parseFloat(dataForSaving.refundedAmount.clinicalServices) || 0,
        refunded_amount_laboratory_services: parseFloat(dataForSaving.refundedAmount.laboratoryServices) || 0,
        refunded_amount_radiology: parseFloat(dataForSaving.refundedAmount.radiology) || 0,
        refunded_amount_pharmacy: parseFloat(dataForSaving.refundedAmount.pharmacy) || 0,
        refunded_amount_implant: parseFloat(dataForSaving.refundedAmount.implant) || 0,
        refunded_amount_blood: parseFloat(dataForSaving.refundedAmount.blood) || 0,
        refunded_amount_surgery: parseFloat(dataForSaving.refundedAmount.surgery) || 0,
        refunded_amount_mandatory_services: parseFloat(dataForSaving.refundedAmount.mandatoryServices) || 0,
        refunded_amount_physiotherapy: parseFloat(dataForSaving.refundedAmount.physiotherapy) || 0,
        refunded_amount_consultation: parseFloat(dataForSaving.refundedAmount.consultation) || 0,
        refunded_amount_surgery_internal_report: parseFloat(dataForSaving.refundedAmount.surgeryInternalReport) || 0,
        refunded_amount_implant_cost: parseFloat(dataForSaving.refundedAmount.implantCost) || 0,
        refunded_amount_private: parseFloat(dataForSaving.refundedAmount.private) || 0,
        refunded_amount_accommodation_charges: parseFloat(dataForSaving.refundedAmount.accommodationCharges) || 0,
        refunded_amount_total: parseFloat(dataForSaving.refundedAmount.total) || 0,
        
        // Balance Row
        balance_advance_payment: parseFloat(dataForSaving.balance.advancePayment) || 0,
        balance_clinical_services: parseFloat(dataForSaving.balance.clinicalServices) || 0,
        balance_laboratory_services: parseFloat(dataForSaving.balance.laboratoryServices) || 0,
        balance_radiology: parseFloat(dataForSaving.balance.radiology) || 0,
        balance_pharmacy: parseFloat(dataForSaving.balance.pharmacy) || 0,
        balance_implant: parseFloat(dataForSaving.balance.implant) || 0,
        balance_blood: parseFloat(dataForSaving.balance.blood) || 0,
        balance_surgery: parseFloat(dataForSaving.balance.surgery) || 0,
        balance_mandatory_services: parseFloat(dataForSaving.balance.mandatoryServices) || 0,
        balance_physiotherapy: parseFloat(dataForSaving.balance.physiotherapy) || 0,
        balance_consultation: parseFloat(dataForSaving.balance.consultation) || 0,
        balance_surgery_internal_report: parseFloat(dataForSaving.balance.surgeryInternalReport) || 0,
        balance_implant_cost: parseFloat(dataForSaving.balance.implantCost) || 0,
        balance_private: parseFloat(dataForSaving.balance.private) || 0,
        balance_accommodation_charges: parseFloat(dataForSaving.balance.accommodationCharges) || 0,
        balance_total: parseFloat(dataForSaving.balance.total) || 0,
        
        // Package dates
        package_start_date: packageDates.start_date || null,
        package_end_date: packageDates.end_date || null,
        total_package_days: packageDates.total_package_days || 7,
        total_admission_days: packageDates.total_admission_days || 0
      };

      // Check if financial summary already exists
      console.log('🔍 Checking if financial summary exists for billId:', billId);
      const { data: existingData, error: checkError } = await supabase
        .from('financial_summary')
        .select('id')
        .eq('bill_id', billId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking existing financial summary:', checkError);
        toast.error(`Database check failed: ${checkError.message}`);
        return;
      }

      console.log('📋 Data to save:', dbData);

      let result;
      if (existingData) {
        console.log('🔄 Updating existing financial summary record');
        result = await supabase
          .from('financial_summary')
          .update(dbData)
          .eq('bill_id', billId)
          .select();
      } else {
        console.log('➕ Inserting new financial summary record');
        result = await supabase
          .from('financial_summary')
          .insert(dbData)
          .select();
      }

      console.log('💾 Save result:', result);

      if (result.error) {
        console.error('❌ Supabase save error:', result.error);
        console.error('❌ Error details:', {
          code: result.error.code,
          message: result.error.message,
          details: result.error.details,
          hint: result.error.hint
        });

        // Provide specific error messages for common issues
        if (result.error.code === '23503') {
          toast.error('Error: Bill ID not found. Please save the bill first before adding financial data.');
        } else if (result.error.code === '42501') {
          toast.error('Error: Permission denied. Please check your access rights.');
        } else if (result.error.code === '22P02') {
          toast.error('Error: Invalid data format. Please contact support.');
        } else {
          toast.error(`Database error: ${result.error.message}`);
        }
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
  }, [billId, loadFinancialSummary]);

  // Test database connectivity and permissions
  const testDatabaseConnection = async () => {
    console.log('🧪 Testing database connectivity...');
    try {
      // Test basic read access
      const { data, error } = await supabase
        .from('financial_summary')
        .select('id')
        .limit(1);

      if (error) {
        console.error('❌ Database connectivity test failed:', error);
        toast.error(`Database connection failed: ${error.message}`);
        return false;
      }

      console.log('✅ Database connectivity test successful');
      return true;
    } catch (error) {
      console.error('❌ Database connectivity test error:', error);
      toast.error('Database connection error');
      return false;
    }
  };

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
    testDatabaseConnection
  };
};
