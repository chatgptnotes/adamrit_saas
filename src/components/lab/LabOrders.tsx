// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { CalendarIcon, Filter, RotateCcw, Plus, Search, Trash2, Edit, Eye, FileText, User, Phone, Clock, Activity } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PatientSearchWithVisit from './PatientSearchWithVisit';
import { safeArrayAccess } from '@/utils/arrayHelpers';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface LabTest {
  id: string;
  name: string;
  test_code: string;
  category: string;
  sample_type: string;
  price: number;
  turnaround_time: number;
  preparation_instructions?: string;
}

interface LabOrder {
  id: string;
  order_number: string;
  patient_name: string;
  patient_phone?: string;
  patient_age?: number;
  patient_gender?: string;
  order_date: string;
  order_status: string;
  priority: string;
  ordering_doctor: string;
  total_amount: number;
  payment_status: string;
  collection_date?: string;
  collection_time?: string;
  clinical_history?: string;
  provisional_diagnosis?: string;
  special_instructions?: string;
  patient_id?: string;
}

interface LabTestRow {
  id: string;
  order_id: string;
  test_id: string;
  patient_name: string;
  patient_phone?: string;
  patient_age?: number;
  patient_gender?: string;
  order_number: string;
  test_name: string;
  test_category: string;
  test_method?: string;
  order_date: string;
  order_status: string;
  ordering_doctor: string;
  clinical_history?: string;
  sample_status: 'not_taken' | 'taken' | 'saved';
}

interface PatientWithVisit {
  id: string;
  name: string;
  patients_id: string;
  visitId: string;
  visitDate: string;
  visitType: string;
  status: string;
  appointmentWith: string;
  reasonForVisit: string;
  admissionDate?: string;
  dischargeDate?: string;
  age?: number;
  gender?: string;
  phone?: string;
  address?: string;
  primaryDiagnosis?: string;
  consultant?: string;
  corporate?: string;
  insurancePersonNo?: string;
}

const LabOrders = () => {
  const { hospitalConfig } = useAuth();
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // 🏥 EXPLICIT HOSPITAL FILTERING - If-Else Condition
  const getHospitalFilter = useCallback(() => {
    let hospitalFilter = '';
    if (hospitalConfig.name === 'hope') {
      hospitalFilter = 'hope';
      console.log('🏥 HOPE Hospital login detected - filtering lab orders');
    } else if (hospitalConfig.name === 'ayushman') {
      hospitalFilter = 'ayushman';
      console.log('🏥 AYUSHMAN Hospital login detected - filtering lab orders');
    } else {
      hospitalFilter = 'hope'; // default fallback
      console.log('🏥 Unknown hospital type, defaulting to hope lab orders');
      console.log('🚨 DEBUG: hospitalConfig.name was:', hospitalConfig.name);
    }
    return hospitalFilter;
  }, [hospitalConfig.name]);
  
  // Sample taken and included states (now for individual tests)
  const [sampleTakenTests, setSampleTakenTests] = useState<string[]>([]);
  const [includedTests, setIncludedTests] = useState<string[]>([]);
  const [isEntryModeOpen, setIsEntryModeOpen] = useState(false);
  const [selectedTestsForEntry, setSelectedTestsForEntry] = useState<LabTestRow[]>([]);
  const [testSubTests, setTestSubTests] = useState<Record<string, any[]>>({});

  // DEBUG: Function to check if data is actually in lab_results table
  const checkLabResultsData = async () => {
    console.log('🔍 Checking lab_results table data...');
    try {
      // First check table schema by attempting to select all columns
      const { data, error } = await supabase
        .from('lab_results')
        .select('*')
        .limit(10);

      if (error) {
        console.error('❌ Error querying lab_results:', error);
        console.error('❌ Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
      } else {
        console.log('✅ lab_results table data (first 10 rows):', data);
        console.log('📊 Total rows found:', data.length);

        // If we have data, show the column structure
        if (data && data.length > 0) {
          console.log('📋 Available columns:', Object.keys(data[0]));
        }
      }

      // Also try to get the total count
      const { count, error: countError } = await supabase
        .from('lab_results')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('❌ Error getting count:', countError);
      } else {
        console.log('📈 Total rows in table:', count);
      }

    } catch (err) {
      console.error('❌ Exception while checking lab_results:', err);
    }
  };

  // DEBUG: Function to test minimal insert
  const testMinimalInsert = async () => {
    console.log('🧪 Testing minimal insert...');
    try {
      const testData = {
        main_test_name: 'DEBUG_TEST',
        test_name: 'DEBUG_SUBTEST',
        patient_name: 'DEBUG_PATIENT',
        result_value: 'DEBUG_RESULT'
      };

      console.log('🧪 Attempting to insert:', testData);

      const { data, error } = await supabase
        .from('lab_results')
        .insert(testData)
        .select();

      if (error) {
        console.error('❌ Minimal insert failed:', error);
      } else {
        console.log('✅ Minimal insert succeeded:', data);
      }
    } catch (err) {
      console.error('❌ Exception during minimal insert:', err);
    }
  };

  // DEBUG: Function to add missing columns to lab_results table
  const addMissingColumns = async () => {
    console.log('🔧 Adding missing columns to lab_results table...');
    try {
      // First, let's check if the columns exist by trying to select them
      const { data, error: selectError } = await supabase
        .from('lab_results')
        .select('main_test_name, patient_name, patient_age')
        .limit(1);

      if (selectError) {
        console.log('🔧 Columns missing, attempting to add via SQL...');

        // Use RPC function to execute SQL (if available)
        const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', {
          sql_query: `
            ALTER TABLE lab_results
            ADD COLUMN IF NOT EXISTS main_test_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS patient_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS patient_age INTEGER,
            ADD COLUMN IF NOT EXISTS patient_gender VARCHAR(10);
          `
        });

        if (rpcError) {
          console.error('❌ RPC failed:', rpcError);
          console.log('💡 You may need to run the SQL script manually in Supabase dashboard');
        } else {
          console.log('✅ Columns added successfully');
        }
      } else {
        console.log('✅ Required columns already exist');
      }
    } catch (err) {
      console.error('❌ Exception while adding columns:', err);
    }
  };
  
  // Track test sample status
  const [testSampleStatus, setTestSampleStatus] = useState<Record<string, 'not_taken' | 'taken' | 'saved'>>({});

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Lab Results Entry Form States
  const [labResultsForm, setLabResultsForm] = useState<Record<string, {
    result_value: string;
    result_unit: string;
    reference_range: string;
    comments: string;
    is_abnormal: boolean;
    result_status: 'Preliminary' | 'Final';
  }>>({});
  
  // NEW: State for saved results (for print preview)
  const [savedLabResults, setSavedLabResults] = useState<Record<string, {
    result_value: string;
    result_unit: string;
    reference_range: string;
    comments: string;
    is_abnormal: boolean;
    result_status: 'Preliminary' | 'Final';
    saved_at: string;
    patient_info: any;
    authenticated: boolean;
  }>>({});
  
  // NEW: Track if current form has been saved
  const [isFormSaved, setIsFormSaved] = useState(false);
  
  const [authenticatedResult, setAuthenticatedResult] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date()
  });
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [isViewOrderOpen, setIsViewOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  
  // Form states for new order
  const [selectedPatient, setSelectedPatient] = useState<PatientWithVisit | null>(null);
  const [orderForm, setOrderForm] = useState({
    priority: 'Normal',
    orderingDoctor: '',
    clinicalHistory: '',
    provisionalDiagnosis: '',
    specialInstructions: '',
    collectionDate: new Date(),
    collectionTime: '09:00'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // NEW: Function to calculate reference range from lab table attributes
  const calculateReferenceRange = useCallback(async (testName: string, patientAge: number, patientGender: string) => {
    try {
      console.log('🔍 Calculating reference range for:', { testName, patientAge, patientGender });
      
      // Fetch lab test config data
      const { data: labConfigData, error: labError } = await supabase
        .from('lab_test_config')
        .select('*')
        .eq('test_name', testName);

      if (labError || !labConfigData || labConfigData.length === 0) {
        console.log('⚠️ Lab test config not found:', testName);
        return getDefaultReferenceRange(testName, patientAge, patientGender);
      }

      // Process lab test config data to create reference ranges
      console.log('📊 Lab config data found:', labConfigData);

      // For now, return a simple range with the unit from the database
      const firstConfig = labConfigData[0];
      if (firstConfig.unit) {
        return `Consult reference values (${firstConfig.unit})`;
      }

      // Process multiple test configs if available
      let allSubTests = [];
      for (const config of labConfigData) {
        allSubTests.push({
          name: config.sub_test_name,
          unit: config.unit
        });
      }

      if (allSubTests.length > 1) {
        // Multiple sub-tests found - this means we should show main test + sub-tests structure
        return `${allSubTests.length} sub-tests available`;
      }

      // Fallback to default ranges
      return getDefaultReferenceRange(testName, patientAge, patientGender);
    } catch (error) {
      console.error('Error calculating reference range:', error);
      return getDefaultReferenceRange(testName, patientAge, patientGender);
    }
  }, []);

  // NEW: Fallback function for common test reference ranges
  const getDefaultReferenceRange = useCallback((testName: string, patientAge: number, patientGender: string) => {
    const testNameLower = testName.toLowerCase();
    const isMale = patientGender.toLowerCase() === 'male';
    
    // Common lab test reference ranges
    const commonRanges: Record<string, string | ((age: number, isMale: boolean) => string)> = {
      'complete blood count': 'See individual parameters',
      'cbc': 'See individual parameters',
      'hemoglobin': (age: number, isMale: boolean) => {
        if (isMale) return '13.5-17.5 g/dL';
        return '12.0-15.5 g/dL';
      },
      'hematocrit': (age: number, isMale: boolean) => {
        if (isMale) return '41-50 %';
        return '36-44 %';
      },
      'wbc': '4,000-11,000 /μL',
      'white blood cell': '4,000-11,000 /μL',
      'platelet': '150,000-450,000 /μL',
      'blood sugar (f)': '70-100 mg/dL',
      'blood sugar (pp)': '< 140 mg/dL',
      'blood sugar (r)': '70-140 mg/dL',
      'glucose': '70-100 mg/dL',
      'creatinine': (age: number, isMale: boolean) => {
        if (isMale) return '0.7-1.3 mg/dL';
        return '0.6-1.1 mg/dL';
      },
      'urea': '15-40 mg/dL',
      'bun': '7-20 mg/dL',
      'cholesterol': '< 200 mg/dL',
      'triglycerides': '< 150 mg/dL',
      'hdl': (age: number, isMale: boolean) => {
        if (isMale) return '> 40 mg/dL';
        return '> 50 mg/dL';
      },
      'ldl': '< 100 mg/dL',
      'alt': '7-56 U/L',
      'ast': '10-40 U/L',
      'alkaline phosphatase': '44-147 U/L',
      'bilirubin': '0.2-1.2 mg/dL',
      'total protein': '6.0-8.3 g/dL',
      'albumin': '3.5-5.0 g/dL',
      'calcium': '8.5-10.5 mg/dL',
      'phosphorus': '2.5-4.5 mg/dL',
      'magnesium': '1.7-2.2 mg/dL',
      'sodium': '136-145 mEq/L',
      'potassium': '3.5-5.0 mEq/L',
      'chloride': '98-107 mEq/L',
      'tsh': '0.4-4.0 mIU/L',
      'thyroid stimulating hormone': '0.4-4.0 mIU/L',
      'vitamin d': '30-100 ng/mL',
      'vitamin b12': '200-900 pg/mL',
      'iron': (age: number, isMale: boolean) => {
        if (isMale) return '65-175 μg/dL';
        return '50-170 μg/dL';
      },
      'ferritin': (age: number, isMale: boolean) => {
        if (isMale) return '12-300 ng/mL';
        return '12-150 ng/mL';
      },
      // Additional common tests
      'hba1c': '< 5.7 %',
      'esr': (age: number, isMale: boolean) => {
        if (isMale) return '0-15 mm/hr';
        return '0-20 mm/hr';
      },
      'c-reactive protein': '< 3.0 mg/L',
      'crp': '< 3.0 mg/L',
      'uric acid': (age: number, isMale: boolean) => {
        if (isMale) return '3.4-7.0 mg/dL';
        return '2.4-6.0 mg/dL';
      },
      'troponin': '< 0.04 ng/mL',
      'ck-mb': '0-6.3 ng/mL',
      'ldh': '140-280 U/L',
      'amylase': '30-110 U/L',
      'lipase': '10-140 U/L'
    };

    // Try to find matching test name
    for (const [key, range] of Object.entries(commonRanges)) {
      if (testNameLower.includes(key)) {
        if (typeof range === 'function') {
          return range(patientAge, isMale);
        }
        return range;
      }
    }

    // Default fallback
    return 'Consult reference values';
  }, []);

  // NEW: State to store calculated reference ranges
  const [calculatedRanges, setCalculatedRanges] = useState<Record<string, string>>({});

  // NEW: Function to fetch sub-tests for a given test with patient-specific ranges
  const fetchSubTestsForTest = useCallback(async (testName: string, patientAge?: number, patientGender?: string) => {
    try {
      console.log('🔍 Fetching sub-tests for:', testName, 'Patient:', { age: patientAge, gender: patientGender });

      const { data: subTestsData, error } = await supabase
        .from('lab_test_config')
        .select('*')
        .eq('test_name', testName);

      if (error) {
        console.error('Error fetching sub-tests:', error);
        return [];
      }

      console.log('📊 Raw sub-tests found for', testName, ':', subTestsData);
      console.log('👤 Patient info:', { age: patientAge, gender: patientGender });

      // Group by sub_test_name to handle multiple ranges per sub-test
      const groupedSubTests = subTestsData?.reduce((acc, subTest) => {
        if (!acc[subTest.sub_test_name]) {
          acc[subTest.sub_test_name] = [];
        }
        acc[subTest.sub_test_name].push(subTest);
        return acc;
      }, {} as Record<string, any[]>) || {};

      // Process each sub-test and find the best matching range
      const processedSubTests = Object.keys(groupedSubTests).map(subTestName => {
        const ranges = groupedSubTests[subTestName];

        // Find the best matching range based on age and gender
        const bestMatch = findBestMatchingRange(ranges, patientAge || 30, patientGender || 'Both');

        return {
          id: bestMatch.id,
          name: subTestName,
          unit: bestMatch.normal_unit,
          range: `${bestMatch.min_value} - ${bestMatch.max_value} ${bestMatch.normal_unit}`,
          minValue: bestMatch.min_value,
          maxValue: bestMatch.max_value,
          gender: bestMatch.gender,
          minAge: bestMatch.min_age,
          maxAge: bestMatch.max_age,
          allRanges: ranges // Keep all ranges for debugging
        };
      });

      console.log('📊 Processed sub-tests with patient-specific ranges:', processedSubTests);
      return processedSubTests;
    } catch (error) {
      console.error('Error in fetchSubTestsForTest:', error);
      return [];
    }
  }, []);

  // Helper function to find the best matching range for a patient
  const findBestMatchingRange = (ranges: any[], patientAge: number, patientGender: string) => {
    console.log('🎯 Finding best range for:', { age: patientAge, gender: patientGender, availableRanges: ranges });

    // Normalize patient gender for comparison
    const normalizedPatientGender = patientGender?.toLowerCase() === 'male' ? 'Male' :
                                   patientGender?.toLowerCase() === 'female' ? 'Female' : 'Both';

    // First, try to find exact age and gender match
    let bestMatch = ranges.find(range =>
      patientAge >= range.min_age &&
      patientAge <= range.max_age &&
      (range.gender === normalizedPatientGender || range.gender === 'Both')
    );

    // If no exact match, try gender-specific ranges regardless of age
    if (!bestMatch) {
      bestMatch = ranges.find(range =>
        range.gender === normalizedPatientGender || range.gender === 'Both'
      );
    }

    // If still no match, take the first available range
    if (!bestMatch) {
      bestMatch = ranges[0];
    }

    console.log('✅ Selected range:', bestMatch);
    return bestMatch;
  };

  // NEW: Effect to calculate reference ranges when tests are selected for entry
  useEffect(() => {
    if (selectedTestsForEntry.length > 0) {
      const calculateRangesAndFetchSubTests = async () => {
        const ranges: Record<string, string> = {};
        const subTestsMap: Record<string, any[]> = {};
        const processedTestNames = new Set<string>();

        for (const testRow of selectedTestsForEntry) {
          // Calculate reference range
          const range = await calculateReferenceRange(
            testRow.test_name,
            testRow.patient_age || 30, // Default age if not available
            testRow.patient_gender || 'Male' // Default gender if not available
          );
          ranges[testRow.id] = range;

          // Only fetch sub-tests once per unique test name
          if (!processedTestNames.has(testRow.test_name)) {
            processedTestNames.add(testRow.test_name);

            // Fetch sub-tests for this test with patient-specific ranges
            const subTests = await fetchSubTestsForTest(
              testRow.test_name,
              testRow.patient_age,
              testRow.patient_gender
            );
            if (subTests.length > 0) {
              subTestsMap[testRow.test_name] = subTests;

              // Calculate ranges for each sub-test
              for (const subTest of subTests) {
                const subTestRange = subTest.range || `${subTest.minValue || 'N/A'} - ${subTest.maxValue || 'N/A'} ${subTest.unit || ''}`;
                ranges[`${testRow.id}_subtest_${subTest.id}`] = subTestRange;
              }
            }
          }
        }

        setCalculatedRanges(ranges);
        setTestSubTests(subTestsMap);
      };

      calculateRangesAndFetchSubTests();
    }
  }, [selectedTestsForEntry, calculateReferenceRange, fetchSubTestsForTest]);

  // Sample save mutation
  const saveSamplesMutation = useMutation({
    mutationFn: async (testIds: string[]) => {
      // Mark all selected tests as saved
      const updatedStatus: Record<string, 'saved'> = {};
      testIds.forEach(testId => {
        updatedStatus[testId] = 'saved';
      });
      
      setTestSampleStatus(prev => ({ ...prev, ...updatedStatus }));
      
      return testIds;
    },
    onSuccess: (testIds) => {
      // Clear sample taken tests and reset included tests
      setSampleTakenTests([]);
      setIncludedTests([]);
      
      toast({
        title: "Samples Saved Successfully",
        description: `${testIds.length} test sample(s) status updated. Now you can select Incl. checkbox for entry mode.`,
      });
    },
    onError: (error) => {
      console.error('Save samples error:', error);
      toast({
        title: "Error",
        description: "Failed to save samples. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Lab Results Save Mutation - Store in visit_labs table
  const saveLabResultsMutation = useMutation({
    mutationFn: async (resultsData: any[]) => {
      console.log('🔍 Starting lab results save process...', resultsData);
      const results = [];
      
      for (const result of resultsData) {
        console.log('📝 Processing result:', result);
        
        try {
          // Use the original test row data from selectedTestsForEntry to get visit and patient info
          const originalTestRow = selectedTestsForEntry.find(t =>
            t.id === result.order_id ||
            t.order_id === result.order_id
          );

          if (!originalTestRow) {
            console.error('❌ Could not find original test row for ID:', result.order_id);
            throw new Error(`Could not find original test row for ID: ${result.order_id}`);
          }

          console.log('1️⃣ Found original test row:', originalTestRow);

          // Get visit ID and patient ID from the original data
          let visitId = originalTestRow.visit_id;
          let patientId = originalTestRow.patient_id;

          console.log('2️⃣ Initial visitId:', visitId, 'patientId:', patientId);

          // If we don't have direct visit_id, try to get it from visit_id field
          if (!visitId && originalTestRow.visit_id_text) {
            // Look up visit by visit_id text
            console.log('3️⃣ Looking up visit by visit_id_text:', originalTestRow.visit_id_text);
            const { data: visitData, error: visitError } = await supabase
              .from('visits')
              .select('id, patient_id')
              .eq('visit_id', originalTestRow.visit_id_text)
              .maybeSingle();

            if (visitData) {
              visitId = visitData.id;
              patientId = visitData.patient_id;
              console.log('✅ Found visit via text lookup:', { visitId, patientId });
            } else {
              console.log('⚠️ Could not find visit via text lookup');
            }
          }

          // If we still don't have visit/patient info, we can still save with just the test name
          if (!visitId || !patientId) {
            console.log('⚠️ Missing visit/patient info - will save with available data');
          }

          // Simplify: Just create a simple record to store the observed value
          console.log('4️⃣ Creating simple lab result record');

          // Skip complex lab entry lookup for now - just save the data directly
          console.log('5️⃣ Preparing to save directly to lab_results table');

          // Create and save to lab_results table
          console.log('6️⃣ Preparing to save in lab_results table');


          // Skip table creation - try direct insert to lab_results table

          // Use the exact schema columns - main_test_name should be the parent test, test_name should be the sub-test

          // Match the actual lab_results table schema with all fields
          const labResultsData = {
            // Main test identification
            main_test_name: originalTestRow.test_name || 'Unknown Test',
            test_name: result.test_name || 'Unknown Sub-Test',

            // Test details
            test_category: result.test_category || 'GENERAL',
            result_value: result.result_value || '',
            result_unit: result.result_unit || '',
            reference_range: result.reference_range || '',
            comments: result.comments || '',
            is_abnormal: result.is_abnormal || false,
            result_status: authenticatedResult ? 'Final' : 'Preliminary',

            // Staff information
            technician_name: result.technician_name || '',
            pathologist_name: result.pathologist_name || '',
            authenticated_result: authenticatedResult || false,

            // Patient information
            patient_name: originalTestRow.patient_name || 'Unknown Patient',
            patient_age: originalTestRow.patient_age || null,
            patient_gender: originalTestRow.patient_gender || 'Unknown',

            // Skip foreign keys for now to avoid schema issues
            // visit_id: visitId || null,
            // lab_id: labId || null
          };

          // Remove any undefined values to prevent schema errors
          Object.keys(labResultsData).forEach(key => {
            if (labResultsData[key] === undefined) {
              delete labResultsData[key];
            }
          });

          console.log('🔍 DEBUG: Original test row:', originalTestRow);
          console.log('🔍 DEBUG: Result object:', result);
          console.log('🔍 DEBUG: Data to insert into lab_results:', labResultsData);
          console.log('🔍 DEBUG: Authentication status:', authenticatedResult);
          console.log('🔍 DEBUG: Visit ID:', visitId);

          // Try saving with error handling to see what's missing
          const { data: finalResult, error: labResultsError } = await supabase
            .from('lab_results')
            .insert(labResultsData)
            .select()
            .single();

          // If it fails, try with minimal data
          if (labResultsError) {
            console.log('First attempt failed, trying minimal data...');
            console.error('Primary error details:', labResultsError);
            const minimalData = {
              main_test_name: originalTestRow.test_name || 'Test',
              test_name: result.test_name || 'Test Result',
              test_category: result.test_category || 'GENERAL',
              result_value: result.result_value || 'No Value',
              result_unit: result.result_unit || '',
              reference_range: result.reference_range || '',
              comments: result.comments || '',
              is_abnormal: false,
              result_status: 'Preliminary',
              technician_name: '',
              pathologist_name: '',
              authenticated_result: false,
              patient_name: originalTestRow.patient_name || 'Unknown Patient',
              patient_age: originalTestRow.patient_age || null,
              patient_gender: originalTestRow.patient_gender || 'Unknown',
              // Skip foreign keys for now
              // visit_id: visitId || null,
              // lab_id: labId || null
            };

            const { data: minimalResult, error: minimalError } = await supabase
              .from('lab_results')
              .insert(minimalData)
              .select()
              .single();

            if (minimalError) {
              console.error('Even minimal insert failed:', minimalError);
            } else {
              console.log('Minimal insert succeeded');
              return minimalResult;
            }
          }

          if (labResultsError) {
            console.error('Error saving to lab_results:', labResultsError);
            throw new Error(`Failed to save to lab_results table: ${labResultsError.message || labResultsError.code}`);
          }

          console.log('✅ Lab results saved successfully to lab_results table!');
          console.log('📊 Saved data:', finalResult);

          // Add patient and visit info to result for print usage
          // Get complete patient data from the fetched patient info
          let currentPatientData = null;
          let currentVisitData = null;

          if (patientId) {
            console.log('🔍 Fetching enhanced patient data for patient_id:', patientId);
            const { data: patientData, error: currentPatientError } = await supabase
              .from('patients')
              .select('id, patients_id, name, age, gender, phone')
              .eq('id', patientId)
              .single();

            if (currentPatientError) {
              console.error('❌ Error fetching patient data:', currentPatientError);
            } else {
              console.log('✅ Enhanced patient data:', patientData);
              currentPatientData = patientData;
            }
          }

          // Get visit data for additional info
          if (visitId) {
            console.log('🔍 Fetching enhanced visit data for visit_id:', visitId);
            const { data: visitData, error: currentVisitError } = await supabase
              .from('visits')
              .select('id, visit_id, appointment_with, reason_for_visit')
              .eq('id', visitId)
              .single();

            if (currentVisitError) {
              console.error('❌ Error fetching visit data:', currentVisitError);
            } else {
              console.log('✅ Enhanced visit data:', visitData);
              currentVisitData = visitData;
            }
          }

          const resultWithPatientInfo = {
            ...finalResult,
            patient_uid: currentPatientData?.patients_id || 'N/A',
            visit_id: currentVisitData?.visit_id || visitId || 'N/A',
            patient_age: currentPatientData?.age || 'N/A',
            patient_gender: currentPatientData?.gender || 'N/A',
            patient_name: currentPatientData?.name || 'N/A',
            patient_phone: currentPatientData?.phone || 'N/A',
            ref_by: currentVisitData?.appointment_with || 'Not specified',
            consultant_name: currentVisitData?.appointment_with || 'Not specified',
            clinical_history: currentVisitData?.reason_for_visit || 'Not specified'
          };

          console.log('📋 Final result with patient info:', resultWithPatientInfo);
          
          results.push(resultWithPatientInfo);
          console.log('🎉 Result processed successfully!');
          
        } catch (error) {
          console.error('💥 Error processing result:', error);
          throw error; // Re-throw to trigger onError
        }
      }
      
      console.log('🚀 All results processed successfully:', results);
      return results;
    },
    onSuccess: (results) => {
      // NEW: Store saved results for print preview with enhanced patient data
      const savedResults: typeof savedLabResults = {};
      const patientInfo = selectedTestsForEntry[0];
      
      // Save both main test data and sub-test data
      selectedTestsForEntry.forEach(testRow => {
        // Save main test data
        const mainFormData = labResultsForm[testRow.id];
        if (mainFormData) {
          savedResults[testRow.id] = {
            ...mainFormData,
            result_status: authenticatedResult ? 'Final' : 'Preliminary',
            saved_at: new Date().toISOString(),
            patient_info: {
              ...patientInfo,
              actual_patient_uid: results[0]?.patient_uid || 'N/A',
              actual_visit_id: results[0]?.visit_id || 'N/A',
              actual_age: results[0]?.patient_age || patientInfo?.patient_age,
              actual_gender: results[0]?.patient_gender || patientInfo?.patient_gender,
              actual_patient_name: results[0]?.patient_name || patientInfo?.patient_name,
              actual_phone: results[0]?.patient_phone || patientInfo?.patient_phone,
              actual_ref_by: results[0]?.ref_by || patientInfo?.ordering_doctor,
              actual_consultant: results[0]?.consultant_name || patientInfo?.ordering_doctor,
              actual_clinical_history: results[0]?.clinical_history || patientInfo?.clinical_history
            },
            authenticated: authenticatedResult
          };
        }

        // Save sub-test data
        const subTests = testSubTests[testRow.test_name] || [];
        subTests.forEach(subTest => {
          const subTestKey = `${testRow.id}_subtest_${subTest.id}`;
          const subTestFormData = labResultsForm[subTestKey];
          if (subTestFormData) {
            savedResults[subTestKey] = {
              ...subTestFormData,
              result_status: authenticatedResult ? 'Final' : 'Preliminary',
              saved_at: new Date().toISOString(),
              authenticated: authenticatedResult
            };
          }
        });
      });
      
      setSavedLabResults(savedResults);
      setIsFormSaved(true);
      
      toast({
        title: "Lab Results Saved Successfully",
        description: `${results.length} test result(s) have been saved. You can now print the report.`,
      });
      
      // DON'T reset form immediately - keep it visible with saved data
      // setLabResultsForm({});
      // setAuthenticatedResult(false);
      // setUploadedFiles([]);
      // setIsEntryModeOpen(false);
      
      // Refresh the lab orders data
      queryClient.invalidateQueries({ queryKey: ['lab-test-rows'] });
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] });
    },
    onError: (error) => {
      console.error('Save lab results error:', error);
      toast({
        title: "Error",
        description: "Failed to save lab results. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Fetch lab tests
  const { data: labTests = [], isLoading: testsLoading } = useQuery({
    queryKey: ['lab-tests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab')
        .select('*')
        .order('name');

      // 🏥 Lab tests are shared across hospitals

      if (error) {
        console.error('Error fetching lab tests:', error);
        throw error;
      }

      return data?.map(test => ({
        id: test.id,
        name: test.name,
        test_code: test.interface_code || '',
        category: test.category || 'General',
        sample_type: 'Blood', // Default since this field doesn't exist in lab table
        price: test["NABH_rates_in_rupee"] || test["Non-NABH_rates_in_rupee"] || 0,
        turnaround_time: 24, // Default
        preparation_instructions: test.description || ''
      })) || [];
    }
  });

  // Fetch lab test rows from visit_labs table (JOIN with visits and lab tables)
  const { data: labTestRows = [], isLoading: testRowsLoading } = useQuery({
    queryKey: ['visit-lab-orders', getHospitalFilter()],
    queryFn: async () => {
      console.log('🔍 Fetching lab test data from visit_labs...');

      const hospitalFilter = getHospitalFilter();
      // Fetch from visit_labs table with JOINs
      const { data, error } = await supabase
        .from('visit_labs')
        .select(`
          id,
          visit_id,
          lab_id,
          status,
          ordered_date,
          collected_date,
          completed_date,
          result_value,
          normal_range,
          notes,
          created_at,
          updated_at,
          visits!inner(
            id,
            visit_id,
            patient_id,
            visit_date,
            appointment_with,
            reason_for_visit,
            patients!inner(
              id,
              patients_id,
              name,
              age,
              gender,
              phone
            )
          ),
          lab!inner(
            id,
            name,
            category,
            sample_type,
            test_method
          )
        `)
        .eq('visits.patients.hospital_name', hospitalFilter)
        .order('ordered_date', { ascending: false });

      // 🏥 Only filter by patient hospital, lab tests are shared

      if (error) {
        console.error('❌ Error fetching visit labs:', error);
        throw error;
      }

      console.log('✅ Fetched', data?.length || 0, 'lab entries from visit_labs');

             // Transform data to match LabTestRow interface
       const testRows: LabTestRow[] = data?.map((entry) => ({
         id: entry.id,
         order_id: entry.visit_id,
         test_id: entry.lab_id,
         patient_name: entry.visits?.patients?.name || 'Unknown Patient',
         patient_phone: entry.visits?.patients?.phone,
         patient_age: entry.visits?.patients?.age,
         patient_gender: entry.visits?.patients?.gender,
         order_number: entry.visit_id, // Using visit_id as order number
         test_name: entry.lab?.name || 'Unknown Test',
         test_category: entry.lab?.category || 'LAB',
         test_method: entry.lab?.test_method || 'Standard Method',
         order_date: entry.ordered_date || entry.created_at,
         order_status: entry.status || 'ordered',
         ordering_doctor: entry.visits?.appointment_with || 'Dr. Unknown',
         clinical_history: entry.visits?.reason_for_visit,
         sample_status: entry.collected_date ? 'taken' : 'not_taken' as const
       })) || [];

      return testRows;
    }
  });

  // Group tests by patient for hierarchical display
  const groupedTests = labTestRows.reduce((groups, test) => {
    const patientKey = `${test.patient_name}_${test.order_number}`;
    if (!groups[patientKey]) {
      groups[patientKey] = {
        patient: {
          name: test.patient_name,
          order_number: test.order_number,
          patient_age: test.patient_age,
          patient_gender: test.patient_gender,
          order_date: test.order_date
        },
        tests: []
      };
    }
    groups[patientKey].tests.push(test);
    return groups;
  }, {} as Record<string, { patient: any, tests: LabTestRow[] }>);

  // Since we're now using visit_labs, we can derive orders from test data
  // This is just for backward compatibility with existing code
  const labOrders = labTestRows.reduce((orders, testRow) => {
    const orderKey = testRow.order_number;
    if (!orders.find(o => o.order_number === orderKey)) {
      orders.push({
        id: testRow.order_id,
        order_number: testRow.order_number,
        patient_name: testRow.patient_name,
        patient_phone: testRow.patient_phone,
        patient_age: testRow.patient_age,
        patient_gender: testRow.patient_gender,
        order_date: testRow.order_date,
        order_status: testRow.order_status,
        priority: 'Normal', // Default priority
        ordering_doctor: testRow.ordering_doctor,
        total_amount: 0, // Will calculate separately
        payment_status: 'Pending',
        collection_date: testRow.collected_date,
        collection_time: null,
        clinical_history: testRow.clinical_history,
        provisional_diagnosis: '',
        special_instructions: '',
        patient_id: testRow.order_id
      });
    }
    return orders;
  }, [] as LabOrder[]);
  
  const ordersLoading = testRowsLoading;

  // Check which orders already have samples collected
  const orderHasSample = (orderId: string) => {
    const order = labOrders.find(o => o.id === orderId);
    return order?.order_status === 'Sample_Collected' || 
           order?.order_status === 'In_Progress' || 
           order?.order_status === 'Results_Ready' ||
           order?.order_status === 'Completed';
  };

  // Create order mutation - creates proper lab_order first, then visit_labs entries
  const createOrderMutation = useMutation({
    mutationFn: async (visitLabEntries: any[]) => {
      console.log('🔄 Creating lab order with visit_labs entries:', visitLabEntries);

      const hospitalFilter = getHospitalFilter();

      // First, create a proper lab_order entry
      const labOrderData = {
        order_number: `LAB-${Date.now()}`,
        patient_name: selectedPatient?.name || '',
        patient_id: selectedPatient?.id || '',
        ordering_doctor: orderForm.orderingDoctor,
        order_date: new Date().toISOString(),
        order_status: 'Created',
        priority: orderForm.priority,
        clinical_history: orderForm.clinicalHistory,
        provisional_diagnosis: orderForm.provisionalDiagnosis,
        special_instructions: orderForm.specialInstructions,
        internal_notes: selectedPatient?.visitId ? `Visit ID: ${selectedPatient.visitId}` : ''
        // 🏥 No hospital_name needed - will be determined by patient_id
      };

      console.log('🔄 Creating lab_order:', labOrderData);

      const { data: labOrderResult, error: labOrderError } = await supabase
        .from('lab_orders')
        .insert(labOrderData)
        .select()
        .single();

      if (labOrderError) {
        console.error('❌ Error creating lab_order:', labOrderError);
        throw labOrderError;
      }

      console.log('✅ Created lab_order:', labOrderResult);

      // Add lab_order_id to each visit_labs entry
      const visitLabsWithOrderId = visitLabEntries.map(entry => ({
        ...entry,
        lab_order_id: labOrderResult.id
      }));

      // Now create the visit_labs entries
      const { data, error } = await supabase
        .from('visit_labs')
        .insert(visitLabsWithOrderId)
        .select();

      if (error) {
        console.error('❌ Error creating visit_labs entries:', error);
        throw error;
      }

      console.log('✅ Created', data?.length || 0, 'visit_labs entries');
      return { labOrder: labOrderResult, visitLabs: data };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['visit-lab-orders', getHospitalFilter()] });
      queryClient.invalidateQueries({ queryKey: ['lab-orders', getHospitalFilter()] });
      toast({
        title: "Success",
        description: `Lab order created successfully with ${data?.visitLabs?.length || 0} tests`,
      });
      setIsCreateOrderOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Create order error:', error);
      toast({
        title: "Error",
        description: "Failed to create lab order",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setSelectedPatient(null);
    setSelectedTests([]);
    setOrderForm({
      priority: 'Normal',
      orderingDoctor: '',
      clinicalHistory: '',
      provisionalDiagnosis: '',
      specialInstructions: '',
      collectionDate: new Date(),
      collectionTime: '09:00'
    });
  };

  const handleCreateOrder = async () => {
    if (!selectedPatient) {
      toast({
        title: "Error",
        description: "Please select a patient",
        variant: "destructive"
      });
      return;
    }

    if (selectedTests.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one test",
        variant: "destructive"
      });
      return;
    }

    const selectedTestsData = labTests.filter(test => selectedTests.includes(test.id));

    // Create individual visit_labs entries for each selected test
    const visitLabEntries = selectedTestsData.map(test => ({
      visit_id: selectedPatient.visitId,
      lab_id: test.id,
      status: 'ordered',
      ordered_date: new Date().toISOString(),
      notes: `Ordered by ${orderForm.orderingDoctor}. Clinical History: ${orderForm.clinicalHistory}`
    }));

    await createOrderMutation.mutateAsync(visitLabEntries);
  };

  const handlePatientSelect = (patient: PatientWithVisit) => {
    setSelectedPatient(patient);
    // Auto-fill form data from patient
    setOrderForm(prev => ({
      ...prev,
      orderingDoctor: patient.appointmentWith || '',
      clinicalHistory: patient.reasonForVisit || '',
      provisionalDiagnosis: safeArrayAccess(patient, 'primary_diagnosis') || ''
    }));
    
    // Store patient data for later use in print
    console.log('Selected patient data:', {
      name: patient.name,
      patients_id: patient.patients_id,
      visitId: patient.visitId,
      age: patient.age,
      gender: patient.gender
    });
  };

  const filteredOrders = labOrders.filter(order => {
    const matchesSearch = order.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.order_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || order.order_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredTests = labTests.filter(test =>
    test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.test_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter test rows for hierarchical display
  const filteredTestRows = labTestRows.filter(testRow => {
    const matchesSearch = testRow.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         testRow.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         testRow.test_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || testRow.order_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Group filtered tests by patient
  const filteredGroupedTests = filteredTestRows.reduce((groups, test) => {
    const patientKey = `${test.patient_name}_${test.order_number}`;
    if (!groups[patientKey]) {
      groups[patientKey] = {
        patient: {
          name: test.patient_name,
          order_number: test.order_number,
          patient_age: test.patient_age,
          patient_gender: test.patient_gender,
          order_date: test.order_date
        },
        tests: []
      };
    }
    groups[patientKey].tests.push(test);
    return groups;
  }, {} as Record<string, { patient: any, tests: LabTestRow[] }>);

  // Pagination logic
  const patientGroups = Object.entries(filteredGroupedTests);
  const totalPatients = patientGroups.length;
  const totalPages = Math.ceil(totalPatients / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedPatientGroups = patientGroups.slice(startIndex, endIndex);

  // Calculate total tests for display
  const totalTests = filteredTestRows.length;

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(Number(newPageSize));
    setCurrentPage(1);
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const goToNextPage = () => setCurrentPage(Math.min(totalPages, currentPage + 1));

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const handleTestSelect = (testId: string) => {
    setSelectedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const handleSelectAllTests = () => {
    if (selectedTests.length === filteredTests.length) {
      setSelectedTests([]);
    } else {
      setSelectedTests(filteredTests.map(test => test.id));
    }
  };

  const getTotalAmount = () => {
    return labTests
      .filter(test => selectedTests.includes(test.id))
      .reduce((sum, test) => sum + test.price, 0);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      return format(new Date(`2000-01-01T${timeString}`), 'HH:mm');
    } catch {
      return timeString;
    }
  };

  // Lab Results Form Handlers
  const handleLabResultChange = (testId: string, field: string, value: string | boolean) => {
    setLabResultsForm(prev => ({
      ...prev,
      [testId]: {
        result_value: '',
        result_unit: '',
        reference_range: '',
        comments: '',
        is_abnormal: false,
        result_status: 'Preliminary' as 'Preliminary' | 'Final',
        ...prev[testId],
        [field]: value
      }
    }));
  };

  const handleSaveLabResults = async () => {
    if (selectedTestsForEntry.length === 0) {
      toast({
        title: "No Tests Selected",
        description: "Please select tests to save results for.",
        variant: "destructive"
      });
      return;
    }

    // Prepare results data for saving - collect both main tests and sub-tests
    const resultsData: any[] = [];

    selectedTestsForEntry.forEach(testRow => {
      // Check if this test has sub-tests
      const subTests = testSubTests[testRow.test_name] || [];
      const hasSubTests = subTests.length > 0;

      if (hasSubTests) {
        // For tests with sub-tests, save each sub-test as a separate result
        subTests.forEach(subTest => {
          const subTestKey = `${testRow.id}_subtest_${subTest.id}`;
          const subTestFormData = labResultsForm[subTestKey] || {
            result_value: '',
            result_unit: '',
            reference_range: '',
            comments: '',
            is_abnormal: false,
            result_status: 'Preliminary' as 'Preliminary' | 'Final'
          };

          // Use calculated reference range if available
          const referenceRange = calculatedRanges[subTestKey] || subTestFormData.reference_range || '';

          resultsData.push({
            order_id: testRow.order_id,
            test_id: testRow.test_id,
            test_name: subTest.name, // Use sub-test name
            test_category: testRow.test_category,
            result_value: subTestFormData.result_value || '',
            result_unit: subTestFormData.result_unit || subTest.unit || '',
            reference_range: referenceRange,
            comments: subTestFormData.comments || '',
            is_abnormal: subTestFormData.is_abnormal || false,
            result_status: authenticatedResult ? 'Final' : 'Preliminary'
          });
        });

        // Also save the main test result if it has any data
        const mainTestFormData = labResultsForm[testRow.id] || {
          result_value: '',
          result_unit: '',
          reference_range: '',
          comments: '',
          is_abnormal: false,
          result_status: 'Preliminary' as 'Preliminary' | 'Final'
        };

        if (mainTestFormData.result_value.trim() || mainTestFormData.comments.trim()) {
          const referenceRange = calculatedRanges[testRow.id] || mainTestFormData.reference_range || '';

          resultsData.push({
            order_id: testRow.order_id,
            test_id: testRow.test_id,
            test_name: testRow.test_name,
            test_category: testRow.test_category,
            result_value: mainTestFormData.result_value || '',
            result_unit: mainTestFormData.result_unit || '',
            reference_range: referenceRange,
            comments: mainTestFormData.comments || '',
            is_abnormal: mainTestFormData.is_abnormal || false,
            result_status: authenticatedResult ? 'Final' : 'Preliminary'
          });
        }
      } else {
        // For tests without sub-tests, save normally
        const formData = labResultsForm[testRow.id] || {
          result_value: '',
          result_unit: '',
          reference_range: '',
          comments: '',
          is_abnormal: false,
          result_status: 'Preliminary' as 'Preliminary' | 'Final'
        };

        const referenceRange = calculatedRanges[testRow.id] || formData.reference_range || '';

        resultsData.push({
          order_id: testRow.order_id,
          test_id: testRow.test_id,
          test_name: testRow.test_name,
          test_category: testRow.test_category,
          result_value: formData.result_value || '',
          result_unit: formData.result_unit || '',
          reference_range: referenceRange,
          comments: formData.comments || '',
          is_abnormal: formData.is_abnormal || false,
          result_status: authenticatedResult ? 'Final' : 'Preliminary'
        });
      }
    });

    // Filter out empty results (only check result_value since other fields might be empty)
    const validResults = resultsData.filter(result =>
      result.result_value.trim() !== '' || result.comments.trim() !== ''
    );

    if (validResults.length === 0) {
      toast({
        title: "No Results to Save",
        description: "Please enter at least one test result or comment.",
        variant: "destructive"
      });
      return;
    }

    await saveLabResultsMutation.mutateAsync(validResults);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setUploadedFiles(Array.from(files));
    }
  };

  // Preview & Print Handler
  const handlePreviewAndPrint = async () => {
    if (selectedTestsForEntry.length === 0) {
      toast({
        title: "No Tests Selected",
        description: "Please select tests to preview and print.",
        variant: "destructive"
      });
      return;
    }

    // Allow preview with current form data even if not saved
    console.log('🖨️ Preview & Print clicked, isFormSaved:', isFormSaved);

    try {
      // Get the correct patient ID - try multiple fields
      const patientInfo = selectedTestsForEntry[0];
      const patientId = patientInfo.patient_id || patientInfo.id || patientInfo.patient?.id;

      if (!patientId) {
        toast({
          title: "Missing Patient ID",
          description: "Cannot fetch results without patient ID.",
          variant: "destructive"
        });
        return;
      }

      // Fetch lab results for this patient
      const { data: fetchedLabResults, error: fetchError } = await supabase
        .from('lab_results')
        .select('*')
        .eq('patient_id', patientId)
        .eq('main_test_name', patientInfo.test_name);

      // Try alternative query by patient name if no results found
      let resultsToUse = fetchedLabResults;
      if (!fetchedLabResults || fetchedLabResults.length === 0) {
        const { data: altResults, error: altError } = await supabase
          .from('lab_results')
          .select('*')
          .eq('patient_name', patientInfo.patient_name);
        resultsToUse = altResults || [];
      }

      if (!resultsToUse || resultsToUse.length === 0) {
        toast({
          title: "No Saved Results Found",
          description: "No lab results found in database for this patient.",
          variant: "destructive"
        });
        return;
      }

      // Create print content with fetched data or current form data
      const printContent = generatePrintContent(resultsToUse);
      console.log('📄 Generated print content length:', printContent.length);

      // Open print preview
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 1000);

        toast({
          title: "Print Started",
          description: "Report is being prepared for printing.",
        });
      } else {
        toast({
          title: "Print Error",
          description: "Unable to open print window. Please check your browser settings.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Error in preview and print:', error);
      toast({
        title: "Error Fetching Results",
        description: "Failed to fetch lab results from database.",
        variant: "destructive"
      });
    }
  };

  // Generate Print Content
  const generatePrintContent = (fetchedLabResults = []) => {
    console.log('🖨️ Generating print content...');
    console.log('📋 Selected tests:', selectedTestsForEntry);
    console.log('📝 Current form data:', labResultsForm);
    console.log('🧪 Test sub-tests:', testSubTests);
    console.log('🗂️ Saved lab results:', savedLabResults);

    if (selectedTestsForEntry.length === 0) return '';

    const patientInfo = selectedTestsForEntry[0];
    const reportDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
    const reportTime = new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Laboratory Report</title>
        <style>
          @page {
            margin: 20mm;
            size: A4;
          }
          
          body {
            font-family: 'Times New Roman', serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            margin: 0;
            padding: 0;
          }
          
          .report-header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          
          .hospital-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .hospital-details {
            font-size: 10px;
            margin-bottom: 10px;
          }
          
          .patient-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
            font-size: 11px;
            border: 2px solid #000;
            padding: 15px;
            border-radius: 5px;
          }
          
          .patient-info div {
            margin-bottom: 3px;
          }
          
          .patient-info strong {
            display: inline-block;
            width: 120px;
            font-weight: bold;
          }
          
          .report-title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin: 20px 0;
            text-decoration: underline;
          }
          
          .test-section {
            margin-bottom: 30px;
          }
          
          .test-header {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            text-decoration: underline;
          }
          
          .results-content {
            margin-bottom: 20px;
          }

          .header-row {
            display: grid;
            grid-template-columns: 40% 25% 35%;
            border-bottom: 2px solid #000;
            padding: 8px 0;
            margin-bottom: 15px;
            font-weight: bold;
            font-size: 12px;
          }

          .header-col-1, .header-col-2, .header-col-3 {
            padding: 0 8px;
          }

          .header-col-2, .header-col-3 {
            text-align: center;
          }

          .main-test-section {
            margin-bottom: 20px;
          }

          .main-test-header {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 5px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 4px;
          }

          .test-row {
            display: grid;
            grid-template-columns: 40% 25% 35%;
            padding: 4px 0;
            font-size: 13px;
          }

          .test-name {
            padding-left: 40px;
          }

          .test-value, .test-range {
            text-align: center;
            font-weight: 500;
          }
          
          .abnormal {
            color: #d32f2f;
            font-weight: bold;
          }
          
          .method-section {
            margin: 20px 0;
            font-size: 11px;
          }
          
          .interpretation-section {
            margin: 20px 0;
            font-size: 11px;
          }
          
          .interpretation-title {
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 10px;
          }
          
          .signature-section {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
          }
          
          .signature-box {
            text-align: center;
            border-top: 1px solid #000;
            padding-top: 5px;
            width: 200px;
          }
          
          
          @media print {
            body { print-color-adjust: exact; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>

        <div class="report-header">
          <div class="hospital-name">ESIC HOSPITAL</div>
          <div class="hospital-details">Laboratory Report</div>
        </div>

        <div class="patient-info">
          <div>
            <div><strong>Patient Name :</strong> ${patientInfo?.patient_name || 'N/A'}</div>
            <div><strong>Patient ID :</strong> ${(() => {
              // Try to get actual patient UID from saved results
              const firstTestId = selectedTestsForEntry[0]?.id;
              const savedResult = savedLabResults[firstTestId];
              return savedResult?.patient_info?.actual_patient_uid || patientInfo?.order_number?.split('-')[0] || 'Not Available';
            })()}</div>
            <div><strong>Ref By :</strong> ${(() => {
              const firstTestId = selectedTestsForEntry[0]?.id;
              const savedResult = savedLabResults[firstTestId];
              return savedResult?.patient_info?.actual_ref_by || patientInfo?.ordering_doctor || 'Not specified';
            })()}</div>
            <div><strong>Sample Received :</strong> ${reportDate} ${reportTime}</div>
            <div><strong>Request No. :</strong> ${patientInfo?.order_number?.split('-').pop() || 'N/A'}</div>
          </div>
          <div>
            <div><strong>Age/Sex :</strong> ${(() => {
              // Try to get actual age/gender from saved results
              const firstTestId = selectedTestsForEntry[0]?.id;
              const savedResult = savedLabResults[firstTestId];
              const age = savedResult?.patient_info?.actual_age || patientInfo?.patient_age || 'N/A';
              const gender = savedResult?.patient_info?.actual_gender || patientInfo?.patient_gender || 'N/A';
              return `${age}Y ${gender}`;
            })()}</div>
            <div><strong>MRN NO :</strong> ${(() => {
              // Try to get actual visit ID from saved results
              const firstTestId = selectedTestsForEntry[0]?.id;
              const savedResult = savedLabResults[firstTestId];
              return savedResult?.patient_info?.actual_visit_id || patientInfo?.order_number || 'Not Available';
            })()}</div>
            <div><strong>Report Date :</strong> ${reportDate} ${reportTime}</div>
            <div><strong>Consultant Name :</strong> ${(() => {
              const firstTestId = selectedTestsForEntry[0]?.id;
              const savedResult = savedLabResults[firstTestId];
              return savedResult?.patient_info?.actual_consultant || patientInfo?.ordering_doctor || 'Not specified';
            })()}</div>
            <div><strong>Provisional Diagnosis :</strong> ${(() => {
              const firstTestId = selectedTestsForEntry[0]?.id;
              const savedResult = savedLabResults[firstTestId];
              return savedResult?.patient_info?.actual_clinical_history || patientInfo?.clinical_history || 'Not Specified';
            })()}</div>
          </div>
        </div>
        
        <div class="report-title">Report on ${selectedTestsForEntry.map(test => test.test_name).join(', ').toUpperCase()}</div>
        
        <div class="results-content">
          <div class="header-row">
            <div class="header-col-1">INVESTIGATION</div>
            <div class="header-col-2">OBSERVED VALUE</div>
            <div class="header-col-3">NORMAL RANGE</div>
          </div>

          ${false ? // Force fallback to form data for debugging
            // Parse test results from patient_name JSON field
            fetchedLabResults.map(result => {
              try {
                // Extract JSON data from patient_name field
                const patientNameParts = result.patient_name.split(' - Test Results: ');
                if (patientNameParts.length > 1) {
                  const testData = JSON.parse(patientNameParts[1]);

                  const displayValue = testData.result_value ?
                    `${testData.result_value} ${testData.result_unit || ''}`.trim() :
                    '';

                  const referenceRange = testData.reference_range || '';

                  return `
                    <div class="main-test-section">
                      <div class="main-test-header">${testData.main_test.toUpperCase()}</div>
                      <div class="test-row">
                        <div class="test-name">${testData.test_name}</div>
                        <div class="test-value ${testData.is_abnormal ? 'abnormal' : ''}">${displayValue}</div>
                        <div class="test-range">${referenceRange}</div>
                      </div>
                    </div>
                  `;
                }
              } catch (e) {
                console.log('Error parsing test results data:', e);
              }
              return '';
            }).join('')
          :
            // Fallback to form data with sub-tests
            selectedTestsForEntry.map(testRow => {
              console.log('🔄 Processing test row for print:', testRow.test_name);
              const subTests = testSubTests[testRow.test_name] || [];
              console.log('📊 Sub-tests for', testRow.test_name, ':', subTests);

              // Also check for ANY form data keys that might contain data for this test
              const allFormKeys = Object.keys(labResultsForm);
              console.log('🔍 All available form keys:', allFormKeys);
              const relevantKeys = allFormKeys.filter(key => key.includes(testRow.id.toString()));
              console.log('📋 Relevant keys for test', testRow.test_name, ':', relevantKeys);

              // Try both sub-tests approach and direct key approach
              let hasSubTestData = subTests.length > 0;
              let hasDirectData = relevantKeys.length > 0;

              console.log('📊 Has sub-test data:', hasSubTestData, 'Has direct data:', hasDirectData);

              if (hasSubTestData) {
                // Display test with sub-tests
                const subTestRows = subTests.map(subTest => {
                  const subTestKey = `${testRow.id}_subtest_${subTest.id}`;
                  console.log('🔑 Looking for sub-test data with key:', subTestKey);
                  const subTestFormData = savedLabResults[subTestKey] || labResultsForm[subTestKey] || {
                    result_value: '',
                    result_unit: '',
                    reference_range: '',
                    comments: '',
                    is_abnormal: false,
                    result_status: 'Preliminary'
                  };
                  console.log('📝 Sub-test form data found:', subTestFormData);

                  const displayValue = subTestFormData.result_value ?
                    `${subTestFormData.result_value} ${subTest.unit || ''}`.trim() :
                    'Not Available';

                  const referenceRange = subTest.range || calculatedRanges[subTestKey] || 'Not Specified';

                  return `
                    <div class="test-row">
                      <div class="test-name">${subTest.name}</div>
                      <div class="test-value ${subTestFormData.is_abnormal ? 'abnormal' : ''}">${displayValue}</div>
                      <div class="test-range">${referenceRange}</div>
                    </div>
                  `;
                }).join('');

                return `
                  <div class="main-test-section">
                    <div class="main-test-header">${testRow.test_name.toUpperCase()}</div>
                    ${subTestRows}
                  </div>
                `;
              } else if (hasDirectData) {
                // Display data from any relevant form keys found
                const directDataRows = relevantKeys.map(key => {
                  const formData = labResultsForm[key] || savedLabResults[key];
                  if (formData && formData.result_value) {
                    console.log('📊 Found direct data in key:', key, formData);
                    return `
                      <div class="test-row">
                        <div class="test-name">${testRow.test_name} (from ${key})</div>
                        <div class="test-value">${formData.result_value} ${formData.result_unit || ''}</div>
                        <div class="test-range">${formData.reference_range || 'Consult reference values'}</div>
                      </div>
                    `;
                  }
                  return '';
                }).filter(row => row !== '').join('');

                if (directDataRows) {
                  return `
                    <div class="main-test-section">
                      <div class="main-test-header">${testRow.test_name.toUpperCase()}</div>
                      ${directDataRows}
                    </div>
                  `;
                }

                // Fallback to main test data
                const mainFormData = labResultsForm[testRow.id] || savedLabResults[testRow.id];
                if (mainFormData && mainFormData.result_value) {
                  return `
                    <div class="main-test-section">
                      <div class="main-test-header">${testRow.test_name.toUpperCase()}</div>
                      <div class="test-row">
                        <div class="test-name">${testRow.test_name}</div>
                        <div class="test-value">${mainFormData.result_value} ${mainFormData.result_unit || ''}</div>
                        <div class="test-range">${mainFormData.reference_range || 'Consult reference values'}</div>
                      </div>
                    </div>
                  `;
                }
              } else {
                // Display single test without sub-tests
                const formData = savedLabResults[testRow.id] || labResultsForm[testRow.id] || {
                  result_value: '',
                  result_unit: '',
                  reference_range: '',
                  comments: '',
                  is_abnormal: false,
                  result_status: 'Preliminary'
                };

                const displayValue = formData.result_value ?
                  `${formData.result_value} ${formData.result_unit || ''}`.trim() :
                  'Not Available';

                const referenceRange = calculatedRanges[testRow.id] || formData.reference_range || 'Not Specified';

                return `
                  <div class="main-test-section">
                    <div class="main-test-header">${testRow.test_name.toUpperCase()}</div>
                    <div class="test-row">
                      <div class="test-name">${testRow.test_name}</div>
                      <div class="test-value ${formData.is_abnormal ? 'abnormal' : ''}">${displayValue}</div>
                      <div class="test-range">${referenceRange}</div>
                    </div>
                  </div>
                `;
              }
            }).join('')
          }
        </div>
        
        <div class="method-section">
          <strong>Method :</strong> Competitive Chemi Luminescent Immuno Assay
        </div>
        
        <div class="interpretation-section">
          <div class="interpretation-title">INTERPRETATION :</div>
          <div>
            ${selectedTestsForEntry.map(testRow => {
              let commentsHtml = '';

              // Check main test comments
              const mainFormData = savedLabResults[testRow.id] || labResultsForm[testRow.id];
              if (mainFormData?.comments) {
                commentsHtml += `<p><strong>${testRow.test_name}:</strong> ${mainFormData.comments}</p>`;
              }

              // Check sub-test comments
              const subTests = testSubTests[testRow.test_name] || [];
              subTests.forEach(subTest => {
                const subTestKey = `${testRow.id}_subtest_${subTest.id}`;
                const subTestFormData = savedLabResults[subTestKey] || labResultsForm[subTestKey];
                if (subTestFormData?.comments) {
                  commentsHtml += `<p><strong>${subTest.name}:</strong> ${subTestFormData.comments}</p>`;
                }
              });

              return commentsHtml;
            }).join('')}
            
            <p>
              1) Results should be correlated with clinical findings and other diagnostic investigations.
            </p>
            <p>
              2) Any significant changes in values require clinical correlation or repeat testing with fresh sample.
            </p>
            <p>
              3) Critical values have been immediately communicated to the requesting physician.
            </p>
            <p>
              4) Reference ranges may vary based on methodology, age, and clinical conditions.
            </p>
          </div>
        </div>
        
        <div class="signature-section">
          <div class="signature-box">
            <div>Lab Technician</div>
            <div style="font-size: 10px; margin-top: 20px;">
              Date: ${reportDate}<br>
              Time: ${reportTime}
            </div>
          </div>
          <div class="signature-box">
            <div>Consultant Pathologist</div>
            <div style="font-size: 10px; margin-top: 20px;">
              Dr. ${patientInfo?.ordering_doctor || 'N/A'}<br>
              MD (Pathology)
            </div>
          </div>
        </div>
        
      </body>
      </html>
    `;
  };

  // Download Files Handler
  const handleDownloadFiles = () => {
    if (selectedTestsForEntry.length === 0) {
      toast({
        title: "No Tests Selected",
        description: "Please select tests to download report.",
        variant: "destructive"
      });
      return;
    }

    if (!isFormSaved) {
      toast({
        title: "Please Save First",
        description: "You must save the lab results before downloading.",
        variant: "destructive"
      });
      return;
    }

    // Generate report content
    const reportContent = generatePrintContent([]);
    
    // Create blob and download HTML
    const blob = new Blob([reportContent], { type: 'text/html;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const patientInfo = selectedTestsForEntry[0];
    const dateStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    const fileName = `Lab_Report_${patientInfo?.patient_name?.replace(/\s+/g, '_') || 'Patient'}_${dateStr}_${timeStr}.html`;
    
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    // Also create a print version for PDF
    setTimeout(() => {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(reportContent);
        printWindow.document.close();
        
        toast({
          title: "Files Ready for Download",
          description: `HTML report downloaded. Print window opened for PDF save.`,
        });
      }
    }, 500);

    // Also download uploaded files if any
    if (uploadedFiles.length > 0) {
      uploadedFiles.forEach((file, index) => {
        setTimeout(() => {
          const fileUrl = URL.createObjectURL(file);
          const fileLink = document.createElement('a');
          fileLink.href = fileUrl;
          fileLink.download = file.name;
          document.body.appendChild(fileLink);
          fileLink.click();
          document.body.removeChild(fileLink);
          URL.revokeObjectURL(fileUrl);
        }, (index + 1) * 200); // Stagger downloads
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lab Orders Management</h1>
          <p className="text-gray-600">Manage laboratory test orders and results</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateOrderOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Lab Order
          </Button>
          <Button onClick={checkLabResultsData} variant="outline">
            Check Lab Results Data
          </Button>
          <Button onClick={testMinimalInsert} variant="outline">
            Test Insert
          </Button>
          <Button onClick={addMissingColumns} variant="outline">
            Add Missing Columns
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label>Status Filter</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Created">Created</SelectItem>
                  <SelectItem value="Collected">Collected</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
              }}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lab Tests Table (Grouped by Patient) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Lab Tests ({totalTests} tests, {totalPatients} patients)
              {(testRowsLoading || ordersLoading) && (
                <span className="ml-2 text-sm text-gray-500">Loading...</span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Show:</Label>
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">patients per page</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Patient Name</TableHead>
                <TableHead>Test ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Test Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sample Taken</TableHead>
                <TableHead>Incl.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(testRowsLoading || ordersLoading) ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Loading patient lab data...
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedPatientGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No lab orders found. Create a new lab order to get started.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPatientGroups.map(([patientKey, patientGroup], patientIndex) => (
                <React.Fragment key={patientKey}>
                  {/* Patient Header Row */}
                  <TableRow className="bg-blue-50 hover:bg-blue-100">
                    <TableCell className="font-bold">{startIndex + patientIndex + 1}</TableCell>
                    <TableCell colSpan={8} className="font-bold text-blue-900">
                      {patientGroup.patient.name} ({patientGroup.patient.order_number})
                    </TableCell>
                  </TableRow>
                  
                  {/* Individual Test Rows for this Patient */}
                  {patientGroup.tests.map((testRow, testIndex) => (
                    <TableRow key={testRow.id} className="hover:bg-gray-50">
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell className="font-medium">{testRow.order_number}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{testRow.test_category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="font-medium">{testRow.test_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(testRow.order_date)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(testRow.order_status)}>
                          {testRow.order_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={sampleTakenTests.includes(testRow.id) || testSampleStatus[testRow.id] === 'saved'}
                            disabled={testSampleStatus[testRow.id] === 'saved'}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSampleTakenTests(prev => [...prev, testRow.id]);
                                setTestSampleStatus(prev => ({ ...prev, [testRow.id]: 'taken' }));
                              } else {
                                setSampleTakenTests(prev => prev.filter(id => id !== testRow.id));
                                setTestSampleStatus(prev => ({ ...prev, [testRow.id]: 'not_taken' }));
                                setIncludedTests(prev => prev.filter(id => id !== testRow.id));
                              }
                            }}
                          />
                          {testSampleStatus[testRow.id] === 'saved' && (
                            <span className="text-xs text-green-600 font-medium">✓ Saved</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={includedTests.includes(testRow.id)}
                          disabled={testSampleStatus[testRow.id] !== 'saved'}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setIncludedTests(prev => [...prev, testRow.id]);
                            } else {
                              setIncludedTests(prev => prev.filter(id => id !== testRow.id));
                            }
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>
                Showing {startIndex + 1} to {Math.min(endIndex, totalPatients)} of {totalPatients} patients
              </span>
              <span className="text-gray-400">|</span>
              <span>
                Page {currentPage} of {totalPages}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              {/* First Page */}
              <Button
                variant="outline"
                size="sm"
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className="px-2"
              >
                ««
              </Button>
              
              {/* Previous Page */}
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="px-2"
              >
                ‹
              </Button>
              
              {/* Page Numbers */}
              {getPageNumbers().map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="px-3"
                >
                  {pageNum}
                </Button>
              ))}
              
              {/* Next Page */}
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="px-2"
              >
                ›
              </Button>
              
              {/* Last Page */}
              <Button
                variant="outline"
                size="sm"
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className="px-2"
              >
                »»
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Sample Management Actions */}
      {(sampleTakenTests.length > 0 || includedTests.length > 0) && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {sampleTakenTests.length > 0 && (
                  <span className="text-sm font-medium">
                    Samples to Save: {sampleTakenTests.length} test(s)
                  </span>
                )}
                {includedTests.length > 0 && (
                  <span className="text-sm text-green-600 font-medium">
                    ✓ Ready for Entry: {includedTests.length} test(s) included
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {sampleTakenTests.length > 0 && (
                  <Button 
                    variant="outline"
                    disabled={saveSamplesMutation.isPending}
                    onClick={() => {
                      saveSamplesMutation.mutate(sampleTakenTests);
                    }}
                  >
                    {saveSamplesMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                )}
                <Button 
                  disabled={includedTests.length === 0}
                  onClick={() => {
                    if (includedTests.length > 0) {
                      const selectedTests = labTestRows.filter(testRow => includedTests.includes(testRow.id));
                      setSelectedTestsForEntry(selectedTests);
                      setIsEntryModeOpen(true);
                    }
                  }}
                >
                  Entry Mode
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Order Dialog */}
      <Dialog open={isCreateOrderOpen} onOpenChange={setIsCreateOrderOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Lab Order</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Patient Selection */}
            <div className="space-y-2">
              <Label>Select Patient</Label>
              <PatientSearchWithVisit
                value={selectedPatient ? `${selectedPatient.name} (${selectedPatient.visitId})` : ''}
                onChange={(value, patient) => {
                  if (patient) {
                    handlePatientSelect(patient);
                  }
                }}
                placeholder="Search and select patient with visit"
              />
            </div>

            {selectedPatient && (
              <Card className="bg-blue-50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Patient:</strong> {selectedPatient.name}</div>
                    <div><strong>Visit ID:</strong> {selectedPatient.visitId}</div>
                    <div><strong>Age/Gender:</strong> {selectedPatient.age}y, {selectedPatient.gender}</div>
                    <div><strong>Phone:</strong> {selectedPatient.phone}</div>
                    <div><strong>Consultant:</strong> {selectedPatient.appointmentWith}</div>
                    <div><strong>Visit Date:</strong> {formatDate(selectedPatient.visitDate)}</div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select value={orderForm.priority} onValueChange={(value) => 
                  setOrderForm(prev => ({ ...prev, priority: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Ordering Doctor</Label>
                <Input
                  value={orderForm.orderingDoctor}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, orderingDoctor: e.target.value }))}
                  placeholder="Enter doctor name"
                />
              </div>
            </div>

            {/* Clinical Information */}
            <div className="space-y-4">
              <div>
                <Label>Clinical History</Label>
                <Textarea
                  value={orderForm.clinicalHistory}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, clinicalHistory: e.target.value }))}
                  placeholder="Enter clinical history"
                  rows={3}
                />
              </div>

              <div>
                <Label>Provisional Diagnosis</Label>
                <Textarea
                  value={orderForm.provisionalDiagnosis}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, provisionalDiagnosis: e.target.value }))}
                  placeholder="Enter provisional diagnosis"
                  rows={2}
                />
              </div>

              <div>
                <Label>Special Instructions</Label>
                <Textarea
                  value={orderForm.specialInstructions}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, specialInstructions: e.target.value }))}
                  placeholder="Enter special instructions"
                  rows={2}
                />
              </div>
            </div>

            {/* Collection Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Collection Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !orderForm.collectionDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {orderForm.collectionDate ? format(orderForm.collectionDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={orderForm.collectionDate}
                      onSelect={(date) => date && setOrderForm(prev => ({ ...prev, collectionDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Collection Time</Label>
                <Input
                  type="time"
                  value={orderForm.collectionTime}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, collectionTime: e.target.value }))}
                />
              </div>
            </div>

            {/* Test Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Select Tests</Label>
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={selectedTests.length === filteredTests.length}
                    onCheckedChange={handleSelectAllTests}
                  />
                  <span className="text-sm">Select All ({filteredTests.length})</span>
                </div>
              </div>

              <div className="border rounded-lg max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Select</TableHead>
                      <TableHead>Test Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Sample Type</TableHead>
                      <TableHead>Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTests.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedTests.includes(test.id)}
                            onCheckedChange={() => handleTestSelect(test.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{test.name}</TableCell>
                        <TableCell>{test.test_code}</TableCell>
                        <TableCell>{test.sample_type}</TableCell>
                        <TableCell>₹{test.price}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {selectedTests.length > 0 && (
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium">Selected Tests: {selectedTests.length}</span>
                  <span className="font-bold text-lg">Total Amount: ₹{getTotalAmount()}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateOrderOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateOrder} disabled={createOrderMutation.isPending}>
                {createOrderMutation.isPending ? 'Creating...' : 'Create Order'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog open={isViewOrderOpen} onOpenChange={setIsViewOrderOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><strong>Order Number:</strong> {selectedOrder.order_number}</div>
                <div><strong>Patient:</strong> {selectedOrder.patient_name}</div>
                <div><strong>Order Date:</strong> {formatDate(selectedOrder.order_date)}</div>
                <div><strong>Status:</strong> 
                  <Badge className={`ml-2 ${getStatusColor(selectedOrder.order_status)}`}>
                    {selectedOrder.order_status}
                  </Badge>
                </div>
                <div><strong>Priority:</strong>
                  <Badge className={`ml-2 ${getPriorityColor(selectedOrder.priority)}`}>
                    {selectedOrder.priority}
                  </Badge>
                </div>
                <div><strong>Doctor:</strong> {selectedOrder.ordering_doctor}</div>
                <div><strong>Total Amount:</strong> ₹{selectedOrder.total_amount}</div>
                <div><strong>Payment Status:</strong>
                  <Badge className={`ml-2 ${selectedOrder.payment_status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {selectedOrder.payment_status}
                  </Badge>
                </div>
              </div>

              {selectedOrder.clinical_history && (
                <div>
                  <strong>Clinical History:</strong>
                  <p className="mt-1 text-sm text-gray-600">{selectedOrder.clinical_history}</p>
                </div>
              )}

              {selectedOrder.provisional_diagnosis && (
                <div>
                  <strong>Provisional Diagnosis:</strong>
                  <p className="mt-1 text-sm text-gray-600">{selectedOrder.provisional_diagnosis}</p>
                </div>
              )}

              {selectedOrder.special_instructions && (
                <div>
                  <strong>Special Instructions:</strong>
                  <p className="mt-1 text-sm text-gray-600">{selectedOrder.special_instructions}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Entry Mode Dialog */}
      <Dialog open={isEntryModeOpen} onOpenChange={setIsEntryModeOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-lg font-semibold">Lab Results Entry Form</DialogTitle>
          </DialogHeader>
          
          {selectedTestsForEntry.length > 0 && (
            <div className="space-y-4">
              {/* Header Info Section */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="grid grid-cols-6 gap-4 text-sm">
                  <div><strong>Patient Name:</strong> {selectedTestsForEntry[0]?.patient_name}</div>
                  <div><strong>Age/Sex:</strong> {selectedTestsForEntry[0]?.patient_age}Y {selectedTestsForEntry[0]?.patient_gender}</div>
                  <div><strong>Type:</strong> OPD / BSNL</div>
                  <div><strong>Ref By:</strong> {selectedTestsForEntry[0]?.ordering_doctor}</div>
                  <div><strong>Lab Sample ID:</strong> {selectedTestsForEntry[0]?.order_number}</div>
                  <div><strong>Date:</strong> {formatDate(selectedTestsForEntry[0]?.order_date || '')}</div>
                </div>
              </div>

              {/* Date/Time and Lab Results Header */}
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
                  <Badge variant="secondary">Lab Results</Badge>
                  {isFormSaved && (
                    <Badge className="bg-green-600 hover:bg-green-700">✓ Saved</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="authenticated"
                      className="w-4 h-4"
                      checked={authenticatedResult}
                      onChange={(e) => setAuthenticatedResult(e.target.checked)}
                      disabled={isFormSaved}
                    />
                    <label htmlFor="authenticated" className="text-sm">Authenticated Result</label>
                  </div>
                  {isFormSaved && (
                    <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                      <span className="text-green-600 text-sm">✓</span>
                      <span className="text-green-800 text-sm font-medium">Saved</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tabular Entry Form for Multiple Tests */}
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                {/* Table Header */}
                <div className="bg-gray-50 border-b border-gray-300">
                  <div className="grid grid-cols-3 gap-0 font-semibold text-sm text-gray-800">
                    <div className="p-3 border-r border-gray-300 text-center">INVESTIGATION</div>
                    <div className="p-3 border-r border-gray-300 text-center">OBSERVED VALUE</div>
                    <div className="p-3 text-center">NORMAL RANGE</div>
                  </div>
                </div>

                {/* Test Rows */}
                {selectedTestsForEntry.map((testRow, index) => {
                  const formData = labResultsForm[testRow.id] || {
                    result_value: '',
                    result_unit: '',
                    reference_range: '',
                    comments: '',
                    is_abnormal: false,
                    result_status: 'Preliminary' as 'Preliminary' | 'Final'
                  };

                  // Get sub-tests from the testSubTests data fetched from database
                  const subTests = testSubTests[testRow.test_name] || [{
                    name: testRow.test_name,
                    unit: '',
                    range: calculatedRanges[testRow.id] || 'Consult reference values'
                  }];

                  return (
                    <div key={testRow.id} className="border-b border-gray-200 last:border-b-0">
                      {/* Main Test Header */}
                      <div className="bg-white">
                        <div className="grid grid-cols-3 gap-0">
                          <div className="p-3 border-r border-gray-300">
                            <div className="font-bold text-sm text-blue-900">
                              {testRow.test_name}
                            </div>
                          </div>
                          <div className="p-3 border-r border-gray-300 text-center text-gray-500 text-sm font-medium">
                            {/* Empty for main test header */}
                          </div>
                          <div className="p-3 text-center text-gray-500 text-sm font-medium">
                            {/* Empty for main test header */}
                          </div>
                        </div>
                      </div>

                      {/* Sub-test Rows */}
                      {subTests.map((subTest, subIndex) => {
                        const subTestKey = `${testRow.id}_subtest_${subTest.id}`;
                        const subTestFormData = labResultsForm[subTestKey] || {
                          result_value: '',
                          result_unit: '',
                          reference_range: '',
                          comments: '',
                          is_abnormal: false,
                          result_status: 'Preliminary' as 'Preliminary' | 'Final'
                        };

                        return (
                        <div key={subTestKey} className="bg-white border-t border-gray-100">
                          <div className="grid grid-cols-3 gap-0 min-h-[40px]">
                            <div className="p-2 border-r border-gray-300 flex items-center">
                              <span className="text-sm ml-4">{subTest.name}</span>
                            </div>
                            <div className="p-2 border-r border-gray-300 flex items-center justify-center">
                              <input
                                type="text"
                                className={`w-full max-w-[120px] px-2 py-1 border rounded text-center text-sm ${
                                  isFormSaved
                                    ? 'bg-green-50 border-green-300 text-green-800 cursor-not-allowed font-medium'
                                    : 'border-gray-300'
                                }`}
                                placeholder="Enter value"
                                value={subTestFormData.result_value}
                                onChange={(e) => handleLabResultChange(subTestKey, 'result_value', e.target.value)}
                                disabled={isFormSaved}
                              />
                              <span className="ml-2 text-xs text-gray-600">{subTest.unit}</span>
                              {isFormSaved && subTestFormData.result_value && (
                                <span className="ml-2 text-green-600 text-xs">✓</span>
                              )}
                              {subTestFormData.is_abnormal && (
                                <span className="ml-2 text-red-500 text-xs">🔴</span>
                              )}
                            </div>
                            <div className="p-2 flex items-center justify-center">
                              <span className="text-sm text-gray-700">{subTest.range || 'Consult reference values'}</span>
                            </div>
                          </div>
                        </div>
                        );
                      })}

                      {/* Comments Section */}
                      <div className="bg-gray-50 border-t border-gray-200">
                        <div className="grid grid-cols-3 gap-0">
                          <div className="p-2 border-r border-gray-300">
                            <span className="text-xs text-gray-600">Comments</span>
                          </div>
                          <div className="p-2 border-r border-gray-300">
                            <input
                              type="checkbox"
                              id={`opinion-${testRow.id}`}
                              className="w-3 h-3"
                              disabled={isFormSaved}
                            />
                            <label htmlFor={`opinion-${testRow.id}`} className="text-xs text-gray-600 ml-1">P.S. for Opinion</label>
                          </div>
                          <div className="p-2"></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add More and File Upload Section */}
              <div className="border-t pt-4 space-y-4">
                {/* Add More Button */}
                <div className="flex justify-start">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isFormSaved}
                    className="px-4 py-2"
                  >
                    Add more
                  </Button>
                </div>

                {/* Main File Upload Section */}
              <div className="border-t pt-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    id="main-file-upload"
                    className="hidden"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('main-file-upload')?.click()}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    disabled={isFormSaved}
                  >
                    Choose File
                  </button>
                  <span className="text-sm text-gray-500">No file chosen</span>
                </div>
              </div>

              {/* Action Buttons - Bottom Row */}
              <div className="flex justify-center gap-3 pt-4 border-t bg-gray-50 -mx-6 -mb-6 p-6 rounded-b-lg">
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                  onClick={handleSaveLabResults}
                  disabled={saveLabResultsMutation.isPending || isFormSaved}
                >
                  {saveLabResultsMutation.isPending ? 'Saving...' : (isFormSaved ? '✓ Saved' : 'Save')}
                </Button>

                <Button
                  variant="outline"
                  className="px-8"
                  onClick={() => {
                    // Only close the dialog - keep saved data intact
                    setIsEntryModeOpen(false);
                  }}
                >
                  Back
                </Button>

                {isFormSaved && (
                  <Button
                    variant="outline"
                    className="px-8 text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => {
                      if (confirm('Are you sure you want to clear the saved form data?')) {
                        setIsFormSaved(false);
                        setSavedLabResults({});
                        setLabResultsForm({});
                        setAuthenticatedResult(false);
                        setUploadedFiles([]);
                      }
                    }}
                  >
                    Clear Form
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="px-8"
                  onClick={handlePreviewAndPrint}
                  disabled={selectedTestsForEntry.length === 0}
                >
                  Preview & Print
                </Button>

                <Button
                  variant="outline"
                  className="px-8"
                  onClick={handleDownloadFiles}
                  disabled={!isFormSaved}
                >
                  Download Files
                </Button>
              </div>
            </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LabOrders;
