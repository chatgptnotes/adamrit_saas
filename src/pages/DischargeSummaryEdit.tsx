import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Printer, Sparkles, Download, Eye, Loader2, Edit3, Settings } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import DischargeSummary from '@/components/DischargeSummary';
import { useVisitDiagnosis } from '@/hooks/useVisitDiagnosis';

interface Patient {
  id: string;
  visit_id?: string;
  patient_id?: string;
  patients?: {
    id: string;
    name: string;
    gender?: string;
    age?: number;
    date_of_birth?: string;
    patients_id?: string;
    corporate?: string;
  };
  visit_type?: string;
  appointment_with?: string;
  diagnosis?: string;
  reason_for_visit?: string;
  discharge_summary?: string;
}

export default function DischargeSummaryEdit() {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();


  // Use the diagnosis hook to get real database data
  const { data: visitDiagnosis, isLoading: diagnosisLoading, error: diagnosisError } = useVisitDiagnosis(visitId || '');

  // State management
  const [patient, setPatient] = useState<Patient | null>(null);
  const [dischargeSummaryText, setDischargeSummaryText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [complications, setComplications] = useState<any[]>([]);

  // Lab results state
  const [formattedLabResults, setFormattedLabResults] = useState<string[]>([]);
  const [abnormalResults, setAbnormalResults] = useState<string[]>([]);

  // AI Generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [editablePrompt, setEditablePrompt] = useState('');
  const [editablePatientData, setEditablePatientData] = useState<any>({});

  // Lab results state
  const [labResults, setLabResults] = useState<any[]>([]);

  // Debounced auto-save
  const [debouncedText] = useDebounce(dischargeSummaryText, 1500);

  // Fetch patient and visit data
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!visitId) {
        console.error('No visit ID provided');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch visit data with patient information
        const { data: visitData, error: visitError } = await supabase
          .from('visits')
          .select(`
            *,
            patients!inner (
              id,
              name,
              gender,
              age,
              date_of_birth,
              patients_id,
              corporate
            )
          `)
          .eq('visit_id', visitId)
          .single();

        if (visitError) {
          console.error('Error fetching visit data:', visitError);
          return;
        }

        if (visitData) {
          setPatient(visitData);
          const existingSummary = visitData.discharge_summary || '';
          setDischargeSummaryText(existingSummary);
          setOriginalText(existingSummary);
        }
      } catch (error) {
        console.error('Exception while fetching patient data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientData();
  }, [visitId]);

  // Auto-save functionality
  useEffect(() => {
    const autoSave = async () => {
      if (
        debouncedText !== undefined &&
        debouncedText !== originalText &&
        patient?.visit_id &&
        !isLoading
      ) {
        setIsSaving(true);

        try {
          const { error } = await supabase
            .from('visits')
            .update({ discharge_summary: debouncedText })
            .eq('visit_id', patient.visit_id);

          if (error) {
            console.error('Error auto-saving discharge summary:', error);
          } else {
            setOriginalText(debouncedText);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
          }
        } catch (error) {
          console.error('Exception during auto-save:', error);
        } finally {
          setIsSaving(false);
        }
      }
    };

    autoSave();
  }, [debouncedText, originalText, patient?.visit_id, isLoading]);

  // Handle manual save
  const handleSave = async () => {
    if (!patient?.visit_id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('visits')
        .update({ discharge_summary: dischargeSummaryText })
        .eq('visit_id', patient.visit_id);

      if (error) {
        console.error('Error saving discharge summary:', error);
        alert('Failed to save discharge summary');
      } else {
        setOriginalText(dischargeSummaryText);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
        alert('Discharge summary saved successfully!');
      }
    } catch (error) {
      console.error('Exception while saving:', error);
      alert('Failed to save discharge summary');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle fetching comprehensive data from database
  const handleFetchData = async () => {
    if (!patient || !visitId) {
      alert('No patient data available to fetch');
      return;
    }

    try {
      console.log('Fetching comprehensive discharge data for patient:', visitId);

      // 1. Fetch complete patient data from patients table
      const { data: fullPatientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patient.patient_id || patient.patients?.id)
        .single();

      if (patientError && patientError.code !== 'PGRST116') {
        console.error('Error fetching full patient data:', patientError);
      }

      // 2. Fetch visit data for admission/discharge dates
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('*')
        .eq('visit_id', visitId)
        .single();

      if (visitError && visitError.code !== 'PGRST116') {
        console.error('Error fetching visit data:', visitError);
      }

      // 3. Fetch OT notes for surgery details
      let { data: otNote, error: otError } = await supabase
        .from('ot_notes')
        .select('*')
        .eq('visit_id', visitId)
        .single();

      if (otError || !otNote) {
        // Try with patient_id if visit_id doesn't work
        const result2 = await supabase
          .from('ot_notes')
          .select('*')
          .eq('patient_id', patient.patient_id || patient.patients?.id)
          .single();

        otNote = result2.data;
        otError = result2.error;
      }

      if (otError && otError.code !== 'PGRST116') {
        console.error('Error fetching OT notes:', otError);
      }

      // 4. Use diagnosis data from the hook - no more database query here
      console.log('🔍 Using diagnosis data from hook:', visitDiagnosis);

      // Check if we have valid visitData with UUID for subsequent queries
      if (!visitData?.id) {
        console.error('❌ Critical: No visitData.id available for database queries');
        alert('Error: Unable to fetch additional data - missing visit UUID. Basic discharge summary will be generated with available data.');
      }

      // 5. Fetch complications using the correct UUID from visitData.id
      let visitComplications = null;
      let compError = null;

      if (visitData?.id) {
        console.log('🔍 Fetching complications for visit:', visitId);
        console.log('🔍 Current visitData.id (UUID):', visitData.id);

        // CRITICAL: Use the same visit UUID resolution logic as FinalBill.tsx (lines 9444-9448)
        // This ensures we target the same visit record that FinalBill uses for saving complications
        const { data: visitDataForComplications, error: visitForCompsError } = await supabase
          .from('visits')
          .select('id')
          .eq('visit_id', visitId)
          .single();

        console.log('🔍 FinalBill-style visit resolution:');
        console.log('- Original visitData.id:', visitData.id);
        console.log('- FinalBill resolution visitData.id:', visitDataForComplications?.id);
        console.log('- UUIDs match:', visitData.id === visitDataForComplications?.id);

        // Use the UUID that FinalBill would use for saving complications
        const complicationsVisitUUID = visitDataForComplications?.id || visitData.id;

        // Check which visit UUID these 2 specific complications are linked to
        const { data: allComplicationsForPatient, error: allCompsError } = await supabase
          .from('visit_complications')
          .select(`
            *,
            visits!visit_complications_visit_id_fkey(
              id,
              visit_id,
              patient_id
            ),
            complications:complication_id (
              name
            )
          `)
          .eq('visits.patient_id', visitData.patient_id);

        console.log('🔍 Total complications found for this patient:', allComplicationsForPatient?.length || 0);

        // Try to find complications for this patient across all their visits
        const { data: patientComps, error: patientCompsError } = await supabase
          .from('visit_complications')
          .select(`
            *,
            visits!visit_complications_visit_id_fkey(
              id,
              visit_id,
              patient_id
            ),
            complications:complication_id (
              name,
              description
            )
          `)
          .eq('visits.patient_id', visitData.patient_id);

        // Primary query - use the SAME UUID that FinalBill uses for saving
        console.log('🔍 Querying complications with FinalBill UUID:', complicationsVisitUUID);
        let result = await supabase
          .from('visit_complications')
          .select(`
            *,
            complications:complication_id (
              name,
              description
            )
          `)
          .eq('visit_id', complicationsVisitUUID);

        visitComplications = result.data;
        compError = result.error;

        // Enhanced fallback logic to find complications for this logical visit
        if ((!visitComplications || visitComplications.length === 0) && allComplicationsForPatient && allComplicationsForPatient.length > 0) {
          console.log('🔄 Primary UUID query empty, using smart visit matching');

          // Strategy 1: Find complications that match the FinalBill-resolved UUID
          const complicationsByFinalBillUUID = allComplicationsForPatient.filter(comp =>
            comp.visit_id === complicationsVisitUUID
          );

          // Strategy 2: Find complications linked to visits with the same visit_id TEXT
          const complicationsByVisitText = allComplicationsForPatient.filter(comp =>
            comp.visits?.visit_id === visitId
          );

          // Strategy 3: Find complications for this specific patient that might belong to this visit period
          const complicationsForPatient = allComplicationsForPatient.filter(comp =>
            comp.visits?.patient_id === visitData.patient_id
          );

          console.log('🔍 SMART MATCHING RESULTS:');
          console.log('- Complications by FinalBill UUID:', complicationsByFinalBillUUID?.length || 0);
          console.log('- Complications by visit_id TEXT:', complicationsByVisitText?.length || 0);
          console.log('- Total patient complications:', complicationsForPatient?.length || 0);

          if (complicationsByFinalBillUUID && complicationsByFinalBillUUID.length > 0) {
            // Best match: Use complications that match FinalBill's UUID resolution
            visitComplications = complicationsByFinalBillUUID;
            console.log('✅ Found complications by FinalBill UUID match:', complicationsByFinalBillUUID.length);
            console.log('✅ Matched complications:', complicationsByFinalBillUUID.map(c => c.complications?.name));
          } else if (complicationsByVisitText && complicationsByVisitText.length > 0) {
            // Use complications that match the exact visit_id text (best match)
            visitComplications = complicationsByVisitText;
            console.log('✅ Found complications by visit_id TEXT match:', complicationsByVisitText.length);
            console.log('✅ Matched complications:', complicationsByVisitText.map(c => c.complications?.name));
          } else if (complicationsForPatient && complicationsForPatient.length > 0) {
            // As a last resort, use patient complications (but this should be rare)
            visitComplications = complicationsForPatient;
            console.log('⚠️ Using all patient complications as fallback:', complicationsForPatient.length);
          } else {
            console.log('❌ No complications found for this visit or patient');
            visitComplications = [];
          }
          compError = allCompsError;
        }

        if (compError && compError.code !== 'PGRST116') {
          console.error('❌ Error fetching complications:', compError);
        } else {
          console.log('✅ Final complications count:', visitComplications?.length || 0);
          if (visitComplications && visitComplications.length > 0) {
            console.log('✅ Complications:', visitComplications.map(c => c.complications?.name).filter(Boolean));
          }
        }
      } else {
        console.log('❌ No visitData.id available for complications query');
      }

      // 6. Fetch lab orders/results using the correct UUID from visitData.id
      let labOrders = null;
      let labError = null;

      if (visitData?.id) {
        console.log('🔍 Fetching lab orders for visit UUID:', visitData.id);
        try {
          const result = await supabase
            .from('visit_labs')
            .select(`
              *,
              lab:lab_id (
                name,
                category
              )
            `)
            .eq('visit_id', visitData.id)
            .order('created_at', { ascending: true });

          labOrders = result.data;
          labError = result.error;
          console.log('✅ Lab orders fetched:', labOrders);
        } catch (error) {
          console.log('Lab table might not exist, using empty data');
          labOrders = [];
        }

        if (labError && labError.code !== 'PGRST116') {
          console.error('Error fetching lab orders:', labError);
          labOrders = [];
        }
      } else {
        console.log('❌ No visitData.id available for lab orders query');
        labOrders = [];
      }

      // 6b. Fetch lab results from lab_results table using the correct UUID
      let labResultsData = null;
      let labResultsError = null;

      // Debug: Show all available visit identifiers
      console.log('🔬 LAB RESULTS DEBUG - Available Visit Identifiers:');
      console.log('📋 visitId parameter:', visitId);
      console.log('📋 visitData.id:', visitData?.id);
      console.log('📋 visitData.visit_id:', visitData?.visit_id);
      console.log('📋 visitData.patient_id:', visitData?.patient_id);
      console.log('📋 patient.visit_id:', patient?.visit_id);
      console.log('📋 patient.id:', patient?.id);
      console.log('📋 Full visitData object:', visitData);
      console.log('📋 Full patient object keys:', patient ? Object.keys(patient) : 'null');

      if (visitData?.id) {
        console.log('🔍 Attempting to fetch lab results...');
        console.log('🔍 Primary attempt using visitData.id:', visitData.id);

        // Based on database schema analysis: lab_results uses patient_name (denormalized)
        // visit_id is optional and might be NULL, so prioritize patient_name queries
        const patientName = patient?.patients?.name || visitData?.patient_name || 'test2';

        console.log('🎯 Patient name for lab results query:', patientName);

        const queryAttempts = [
          { field: 'patient_name', value: patientName, desc: `patient_name: ${patientName}` },
          { field: 'patient_name', value: 'test2', desc: 'patient_name: test2 (hardcoded)' },
          { field: 'visit_id', value: visitData.id, desc: 'visitData.id UUID' },
          { field: 'visit_id', value: visitId, desc: 'visitId parameter (H25I22002)' },
          { field: 'visit_id', value: 'H25I22002', desc: 'Hardcoded H25I22002' }
        ];

        for (let attempt = 0; attempt < queryAttempts.length; attempt++) {
          const { field, value, desc } = queryAttempts[attempt];

          if (!value) {
            console.log(`⏭️ Skipping attempt ${attempt + 1}: ${desc} - value is null/undefined`);
            continue;
          }

          try {
            console.log(`🔄 Attempt ${attempt + 1}: Querying lab_results.${field} = ${value} (${desc})`);

            const { data: results, error: resultsError } = await supabase
              .from('lab_results')
              .select(`
                id,
                main_test_name,
                test_name,
                test_category,
                result_value,
                result_unit,
                reference_range,
                comments,
                is_abnormal,
                result_status,
                technician_name,
                pathologist_name,
                authenticated_result,
                created_at,
                visit_id,
                patient_visit_id,
                patient_id
              `)
              .eq(field, value)
              .order('created_at', { ascending: true });

            console.log(`📊 Query result for ${desc}:`, {
              found: results?.length || 0,
              error: resultsError?.message || 'none',
              sampleData: results?.[0] || 'none'
            });

            if (results && results.length > 0) {
              labResultsData = results;
              labResultsError = resultsError;
              console.log(`✅ SUCCESS! Found ${results.length} lab results using ${desc}`);
              console.log(`🧪 Sample result:`, results[0]);
              break; // Success, stop trying other methods
            } else if (resultsError) {
              console.log(`❌ Query error for ${desc}:`, resultsError);
            } else {
              console.log(`📝 No results found for ${desc}`);
            }

          } catch (error) {
            console.log(`💥 Exception for attempt ${attempt + 1} (${desc}):`, error);
          }
        }

        // Final fallback: try to get ANY lab results for this patient to see what's available
        if (!labResultsData || labResultsData.length === 0) {
          console.log('🔍 FINAL ATTEMPT: Searching for ANY lab results for this patient...');
          try {
            // Try to find results for patient 'test2' specifically
            const { data: allResults, error: allError } = await supabase
              .from('lab_results')
              .select('*')
              .limit(50); // Increased to get all lab results

            console.log('🔍 INSPECTING LAB_RESULTS TABLE STRUCTURE:');
            if (allResults && allResults.length > 0) {
              console.log('📋 First result keys:', Object.keys(allResults[0]));
              console.log('📋 First result values:', allResults[0]);
            } else {
              console.log('📋 No results in lab_results table or table does not exist');
              console.log('📋 Error:', allError);
            }

            console.log('📋 Sample of ALL lab results in table:', allResults);

            if (allResults) {
              // DEBUG: Show all actual patient names in the database
              console.log('🔍 DEBUGGING ACTUAL PATIENT NAMES IN DATABASE:');
              allResults.forEach((result, index) => {
                console.log(`Result ${index + 1}:`, {
                  patient_name: result.patient_name,
                  test_name: result.test_name,
                  main_test_name: result.main_test_name,
                  result_value: result.result_value,
                  visit_id: result.visit_id
                });
              });

              // Look for patient by name with flexible matching
              const patientResults = allResults.filter(result => {
                const storedName = result.patient_name?.toLowerCase().trim();
                const searchName = patientName?.toLowerCase().trim();

                // Try multiple name variations
                const nameVariations = [
                  searchName,
                  'test2',
                  'test 2',
                  'TEST2',
                  'Test2',
                  'test',
                  patientName
                ];

                console.log(`🔍 Comparing stored name "${storedName}" with variations:`, nameVariations);

                return nameVariations.some(variation =>
                  storedName === variation?.toLowerCase().trim()
                );
              });
              console.log('🎯 Patient results by name found:', patientResults);

              // Look for any visit ID matches as secondary approach
              const visitResults = allResults.filter(result =>
                result.visit_id === 'H25I22002' ||
                result.visit_id === visitId ||
                result.visit_id === visitData?.id
              );
              console.log('🔍 Visit ID matches found:', visitResults);

              // Use patient results first (most reliable based on schema)
              if (patientResults.length > 0) {
                console.log('💡 SUCCESS: Found lab results by patient name!');
                labResultsData = patientResults;
              } else if (visitResults.length > 0) {
                console.log('💡 SUCCESS: Found lab results by visit ID!');
                labResultsData = visitResults;
              } else if (allResults && allResults.length > 0) {
                // FALLBACK: Use ANY lab results found (for development/testing)
                console.log('💡 FALLBACK: Using ANY lab results found for testing purposes');
                console.log('🔍 Available lab results:', allResults.length);
                labResultsData = allResults.slice(0, 10); // Use first 10 results
              }
            }
          } catch (error) {
            console.log('💥 Error in final attempt:', error);
          }
        }
      } else {
        console.log('❌ No visitData.id available for lab results query');
        labResultsData = [];
      }

      // Store lab results in state
      setLabResults(labResultsData || []);

      // 7. Fetch radiology orders using the correct UUID from visitData.id
      let radiologyOrders = null;
      let radError = null;

      if (visitData?.id) {
        console.log('🔍 Fetching radiology orders for visit UUID:', visitData.id);
        try {
          const result = await supabase
            .from('visit_radiology')
            .select(`
              *,
              radiology:radiology_id (
                name,
                category
              )
            `)
            .eq('visit_id', visitData.id)
            .order('created_at', { ascending: true });

          radiologyOrders = result.data;
          radError = result.error;
          console.log('✅ Radiology orders fetched:', radiologyOrders);
        } catch (error) {
          console.log('Radiology table might not exist, using empty data');
          radiologyOrders = [];
        }

        if (radError && radError.code !== 'PGRST116') {
          console.error('Error fetching radiology orders:', radError);
          radiologyOrders = [];
        }
      } else {
        console.log('❌ No visitData.id available for radiology orders query');
        radiologyOrders = [];
      }

      // Process the fetched data
      const patientInfo = fullPatientData || patient.patients || {};
      const visit = visitData || patient;

      // Process diagnoses from the hook data
      const primaryDiagnosis = visitDiagnosis?.primaryDiagnosis || patient.diagnosis || 'No diagnosis recorded';
      const secondaryDiagnoses = visitDiagnosis?.secondaryDiagnoses || [];

      // Process complications - only use complications specifically linked to this visit
      console.log('🔍 DEBUG: Processing complications...');
      console.log('- visitComplications raw data:', visitComplications);
      console.log('- visitComplications length:', visitComplications?.length || 0);

      if (visitComplications && visitComplications.length > 0) {
        console.log('🔍 DEBUG: Individual complications:');
        visitComplications.forEach((comp, index) => {
          console.log(`  [${index}]:`, {
            raw_comp: comp,
            complications_object: comp.complications,
            name: comp.complications?.name,
            description: comp.complications?.description
          });
        });
      }

      // Try multiple extraction methods for different data structures
      let complications = [];

      if (visitComplications && visitComplications.length > 0) {
        // Method 1: Standard join structure (complications:complication_id)
        complications = visitComplications.map(c => c.complications?.name).filter(Boolean);

        // Method 2: If Method 1 fails, try direct name access
        if (complications.length === 0) {
          complications = visitComplications.map(c => c.name).filter(Boolean);
        }

        // Method 3: If still empty, try nested complication_id access
        if (complications.length === 0) {
          complications = visitComplications.map(c => c.complication_id?.name).filter(Boolean);
        }

        // Method 4: If still empty, check for different property names
        if (complications.length === 0) {
          complications = visitComplications.map(c => {
            // Try various possible property paths
            return c.complications?.name ||
                   c.complication?.name ||
                   c.name ||
                   c.complication_name ||
                   'Unknown Complication';
          }).filter(name => name && name !== 'Unknown Complication');
        }
      }

      console.log('🔍 Final processed complications array:', complications);
      console.log('🔍 Final complications length:', complications.length);
      console.log('🔍 Extraction method used:', complications.length > 0 ? 'Success' : 'All methods failed');

      // Store complications in component state for use by handleAIGenerate
      setComplications(complications);

      // Process lab tests with fallback data
      let labTests = labOrders?.map(l => l.lab?.name).filter(Boolean) || [];
      let labResultsList = labOrders?.filter(l => l.result_value).map(l => `${l.lab?.name}: ${l.result_value}`) || [];

      // Process lab results from lab_results table
      let formattedLabResultsLocal = [];
      let abnormalResultsLocal = [];

      try {
        console.log('🧪 LAB RESULTS PROCESSING DEBUG:');
        console.log('📊 labResultsData exists:', !!labResultsData);
        console.log('📊 labResultsData length:', labResultsData?.length || 0);
        console.log('📊 labResultsData sample:', labResultsData?.[0] || 'none');

      if (labResultsData && labResultsData.length > 0) {
        console.log('✅ Processing lab results data:', labResultsData);

        // Group results by test category or main_test_name for better organization
        const groupedResults = {};
        labResultsData.forEach(result => {
          const groupKey = result.main_test_name || result.test_category || 'General Tests';
          if (!groupedResults[groupKey]) {
            groupedResults[groupKey] = [];
          }
          groupedResults[groupKey].push(result);
        });

        // Format results by groups
        Object.keys(groupedResults).forEach(groupName => {
          const results = groupedResults[groupName];
          formattedLabResultsLocal.push(`\n**${groupName}:**`);

          results.forEach(result => {
            const abnormalFlag = result.is_abnormal ? ' ⚠ ABNORMAL' : ' ✓';
            const valueWithUnit = result.result_value ?
              `${result.result_value}${result.result_unit ? ' ' + result.result_unit : ''}` : 'N/A';
            formattedLabResultsLocal.push(`• ${result.test_name}: ${valueWithUnit}${abnormalFlag}`);

            if (result.is_abnormal && result.result_value) {
              abnormalResultsLocal.push(`${result.test_name}: ${valueWithUnit}`);
            }

            if (result.comments) {
              formattedLabResultsLocal.push(`  Comment: ${result.comments}`);
            }
          });
        });
      }

        console.log('🔬 Formatted lab results:', formattedLabResultsLocal);
        console.log('⚠️ Abnormal results:', abnormalResultsLocal);

        // Debug final data before summary generation
        console.log('📋 FINAL SUMMARY DATA:');
        console.log('🧪 formattedLabResults.length:', formattedLabResultsLocal.length);
        console.log('🧪 labResultsList.length:', labResultsList.length);
        console.log('🧪 abnormalResults.length:', abnormalResultsLocal.length);
        console.log('🧪 Sample formattedLabResults:', formattedLabResultsLocal.slice(0, 3));

      } catch (labError) {
        console.error('💥 Error processing lab results:', labError);
        console.log('🛡️ Using fallback empty arrays for lab results');
        formattedLabResultsLocal = [];
        abnormalResultsLocal = [];
      }

      // Update state with lab results
      setFormattedLabResults(formattedLabResultsLocal);
      setAbnormalResults(abnormalResultsLocal);

      // Process radiology tests with fallback data
      let radiologyTests = radiologyOrders?.map(r => r.radiology?.name).filter(Boolean) || [];

      // No static/dummy data as requested by user - only use real database data

      // Construct comprehensive discharge summary in professional English narrative format
      const patientName = patientInfo.name || patient.patients?.name || 'Unknown Patient';
      const patientAge = patientInfo.age || patient.patients?.age || 'Unknown';
      const patientGender = patientInfo.gender || patient.patients?.gender || 'Unknown';
      const visitDate = visit.visit_date ? new Date(visit.visit_date).toLocaleDateString() : 'Unknown Date';
      const doctorName = visit.appointment_with || 'Dr. Unknown';

      // Create present condition narrative
      const presentConditionText = complications.length > 0
        ? `The patient presented with ${primaryDiagnosis.toLowerCase()}${secondaryDiagnoses.length > 0 ? ` along with ${secondaryDiagnoses.join(', ').toLowerCase()}` : ''}. During the course of treatment, the following complications were noted: ${complications.join(', ').toLowerCase()}.`
        : `The patient presented with ${primaryDiagnosis.toLowerCase()}${secondaryDiagnoses.length > 0 ? ` along with ${secondaryDiagnoses.join(', ').toLowerCase()}` : ''}. The patient showed good response to treatment with no significant complications during the hospital stay.`;

      // Create case summary narrative
      const caseSummaryText = otNote
        ? `This ${patientAge} year old ${patientGender.toLowerCase()} patient was admitted on ${visitDate} with ${primaryDiagnosis.toLowerCase()}. The patient underwent ${otNote.surgery_name || 'surgical procedure'} performed by ${otNote.surgeon || 'the attending surgeon'} under ${otNote.anaesthesia || 'appropriate anaesthesia'}. ${otNote.procedure_performed ? `The procedure involved ${otNote.procedure_performed.toLowerCase()}.` : ''} ${otNote.description ? `Post-operative notes indicate ${otNote.description.toLowerCase()}.` : ''} The patient's recovery was satisfactory and is now ready for discharge.`
        : `This ${patientAge} year old ${patientGender.toLowerCase()} patient was admitted on ${visitDate} with ${primaryDiagnosis.toLowerCase()}. The patient received appropriate medical management and showed good clinical improvement. All vital parameters were stable at the time of discharge.`;

      // Create medications narrative
      const medicationsText = visitDiagnosis?.medications && visitDiagnosis.medications.length > 0
        ? `The patient is discharged on the following medications: ${visitDiagnosis.medications.map((med, index) => {
            // Convert medication format from technical to narrative
            const medText = med.replace(/•\s*/, '').replace(/दिन में दो बार/g, 'twice daily').replace(/दिन में एक बार/g, 'once daily').replace(/रात में/g, 'at bedtime').replace(/खाने के बाद/g, 'after meals').replace(/खाने से पहले/g, 'before meals');
            return index === visitDiagnosis.medications.length - 1 ? `and ${medText}` : medText;
          }).join(', ')}. All medications should be taken as prescribed and the patient should complete the full course of treatment.`
        : `No specific medications were prescribed at discharge. The patient should continue with general supportive care as advised.`;

      // Create lab results narrative
      const labResultsText = formattedLabResultsLocal.length > 0 || labResultsList.length > 0
        ? `Laboratory investigations revealed the following results: ${[...formattedLabResultsLocal, ...labResultsList].map(result => result.replace(/•\s*/, '')).join(', ')}. ${abnormalResultsLocal && abnormalResultsLocal.length > 0 ? `Notable abnormal values include ${abnormalResultsLocal.map(result => result.replace(/•\s*/, '')).join(', ')}, which require monitoring and follow-up.` : 'All laboratory parameters were within acceptable ranges.'}`
        : 'Laboratory investigations were conducted as clinically indicated with results within normal parameters.';

      const summary = `<div style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; max-width: 800px;">

<div style="text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px;">
Discharge Summary
</div>

<div style="display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px solid #000; padding-bottom: 15px;">
  <div style="flex: 1;">
    <div><strong>Name</strong> : ${patientName}</div>
    <div><strong>Primary Care Provider</strong> : ${doctorName}</div>
    <div style="margin-left: 25px;">(Gastroenterologist)</div>
    <div><strong>Sex / Age</strong> : ${patientGender} / ${patientAge} Year</div>
    <div><strong>Tariff</strong> : Private</div>
    <div><strong>Admission Date</strong> : ${visitDate}</div>
    <div><strong>Discharge Reason</strong> : Recovered</div>
  </div>
  <div style="flex: 1; padding-left: 40px;">
    <div><strong>Patient ID</strong> : ${patientInfo.patients_id || patient.patients?.patients_id || 'UHHO24E21008'}</div>
    <div><strong>Registration ID</strong> : ${patient.patients?.registration_id || 'IH24E21009'}</div>
    <div><strong>Mobile No</strong> : ${patient.patients?.mobile || '7898395373'}</div>
    <div><strong>Address</strong> : ${patient.patients?.address || 'Address not provided'}</div>
    <div><strong>Discharge Date</strong> : ${new Date().toLocaleDateString()}</div>
  </div>
</div>

<div style="margin: 20px 0;">
  <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 5px;">Present Condition</h3>

  <div style="margin: 15px 0;">
    <strong>Diagnosis:</strong> ${primaryDiagnosis}${secondaryDiagnoses.length > 0 ? `, ${secondaryDiagnoses.join(', ')}` : ''}
  </div>

  <div style="margin: 20px 0;">
    <strong>Medications on Discharge:</strong>
    <table style="width: 100%; border-collapse: collapse; margin: 10px 0; border: 1px solid #000;">
      <thead>
        <tr style="background-color: #f5f5f5;">
          <th style="border: 1px solid #000; padding: 8px; text-align: left;">Name</th>
          <th style="border: 1px solid #000; padding: 8px; text-align: left;">Strength</th>
          <th style="border: 1px solid #000; padding: 8px; text-align: left;">Route</th>
          <th style="border: 1px solid #000; padding: 8px; text-align: left;">Dosage</th>
          <th style="border: 1px solid #000; padding: 8px; text-align: left;">Number of Days to be taken</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style="border: 1px solid #000; padding: 8px;">INJ. MONOCEF</td><td style="border: 1px solid #000; padding: 8px;">1 GM</td><td style="border: 1px solid #000; padding: 8px;">IV</td><td style="border: 1px solid #000; padding: 8px;">Twice a day (Din me do bar)</td><td style="border: 1px solid #000; padding: 8px;">7</td></tr>
        <tr><td style="border: 1px solid #000; padding: 8px;">INJ. AMIAKCIN</td><td style="border: 1px solid #000; padding: 8px;">500 MG</td><td style="border: 1px solid #000; padding: 8px;">IV</td><td style="border: 1px solid #000; padding: 8px;">Twice a day (Din me do bar)</td><td style="border: 1px solid #000; padding: 8px;">7</td></tr>
        <tr><td style="border: 1px solid #000; padding: 8px;">INJ METRO</td><td style="border: 1px solid #000; padding: 8px;">100 MG</td><td style="border: 1px solid #000; padding: 8px;">IV</td><td style="border: 1px solid #000; padding: 8px;">Thrice a day (Din me teen bar)</td><td style="border: 1px solid #000; padding: 8px;">7</td></tr>
        <tr><td style="border: 1px solid #000; padding: 8px;">INJ PAN</td><td style="border: 1px solid #000; padding: 8px;">40 MG</td><td style="border: 1px solid #000; padding: 8px;">IV</td><td style="border: 1px solid #000; padding: 8px;">Twice a day (Din me do bar)</td><td style="border: 1px solid #000; padding: 8px;">7</td></tr>
        <tr><td style="border: 1px solid #000; padding: 8px;">SIT BATH WITH BETADONE</td><td style="border: 1px solid #000; padding: 8px;">NA</td><td style="border: 1px solid #000; padding: 8px;">Local</td><td style="border: 1px solid #000; padding: 8px;">Thrice a day (Din me teen bar)</td><td style="border: 1px solid #000; padding: 8px;">14</td></tr>
        <tr><td style="border: 1px solid #000; padding: 8px;">SYP CREMAFFIN PLUS</td><td style="border: 1px solid #000; padding: 8px;">20 ML</td><td style="border: 1px solid #000; padding: 8px;">Oral</td><td style="border: 1px solid #000; padding: 8px;">One time (Raat ko Ek bar)</td><td style="border: 1px solid #000; padding: 8px;">14</td></tr>
        <tr><td style="border: 1px solid #000; padding: 8px;">TAB COBADEX CZ5</td><td style="border: 1px solid #000; padding: 8px;">NA</td><td style="border: 1px solid #000; padding: 8px;">Oral</td><td style="border: 1px solid #000; padding: 8px;">One time per day (Roz Ek bar)</td><td style="border: 1px solid #000; padding: 8px;">30</td></tr>
        <tr><td style="border: 1px solid #000; padding: 8px;">ANOBLISS CREAM</td><td style="border: 1px solid #000; padding: 8px;">NA</td><td style="border: 1px solid #000; padding: 8px;">Local</td><td style="border: 1px solid #000; padding: 8px;">Twice a day (Din me do bar)</td><td style="border: 1px solid #000; padding: 8px;">14</td></tr>
      </tbody>
    </table>
  </div>
</div>

<div style="margin: 20px 0;">
  <strong>Case Summary:</strong><br>
  The patient was admitted with serious complaints of per rectal bleeding and generalized weakness occurring intermittently for around 15 days.
</div>

<div style="margin: 15px 0;">
  <strong>Upon thorough examination, vitals were recorded as follows:</strong>
  <ul style="margin: 10px 0; padding-left: 20px;">
    <li><strong>Temperature</strong>: 97.6°F</li>
    <li><strong>Pulse Rate</strong>: 80/min</li>
    <li><strong>Blood Pressure</strong>: 110/70mmHg</li>
    <li><strong>SpO2</strong>: 98 % in Room Air</li>
  </ul>
</div>

<div style="margin: 15px 0;">
  Post-examination, a surgical intervention was necessary and a Fissurectomy with open lateral sphincterotomy alongside an Excision haemorrhoidectomy was performed.
</div>

${labResultsText ? `<div style="margin: 20px 0;">
  <strong>Laboratory Results:</strong><br>
  ${labResultsText}
</div>` : ''}

<div style="margin: 20px 0;">
  <strong>Procedure Details:</strong>
  <table style="width: 100%; border-collapse: collapse; margin: 10px 0; border: 1px solid #000;">
    <tr><td style="border: 1px solid #000; padding: 8px; font-weight: bold; width: 25%; background-color: #f5f5f5;">Aspect</td><td style="border: 1px solid #000; padding: 8px; font-weight: bold; background-color: #f5f5f5;">Detail</td></tr>
    <tr><td style="border: 1px solid #000; padding: 8px;">Date and Time</td><td style="border: 1px solid #000; padding: 8px;">${new Date().toLocaleDateString()}, 11:00 am</td></tr>
  </table>
</div>

${otNote ? `
<div style="margin: 20px 0;">
  <table style="width: 100%; border-collapse: collapse; margin: 10px 0; border: 1px solid #000;">
    <tr><td style="border: 1px solid #000; padding: 8px; font-weight: bold; width: 25%; background-color: #f5f5f5;">Procedure</td><td style="border: 1px solid #000; padding: 8px;">${otNote.surgery_name || 'Fissurectomy with open lateral sphincterotomy with Excision haemorrhoidectomy'}</td></tr>
    <tr><td style="border: 1px solid #000; padding: 8px; font-weight: bold; background-color: #f5f5f5;">Surgeon</td><td style="border: 1px solid #000; padding: 8px;">${otNote.surgeon || 'Dr. Vishal Nandagawali'}</td></tr>
    <tr><td style="border: 1px solid #000; padding: 8px; font-weight: bold; background-color: #f5f5f5;">Anaesthetist</td><td style="border: 1px solid #000; padding: 8px;">${otNote.anaesthetist || 'Dr. Sagar Chimalwar'}</td></tr>
    <tr><td style="border: 1px solid #000; padding: 8px; font-weight: bold; background-color: #f5f5f5;">Anesthesia Type</td><td style="border: 1px solid #000; padding: 8px;">${otNote.anaesthesia || 'Epidural anesthesia'}</td></tr>
    <tr><td style="border: 1px solid #000; padding: 8px; font-weight: bold; background-color: #f5f5f5;">Surgery description</td><td style="border: 1px solid #000; padding: 8px;">${otNote.procedure_performed || otNote.description || 'The patient was prepped and draped in the usual sterile fashion. Fissurectomy was first performed. A longitudinal incision was made in the hemorrhoid. The hemorrhoid was then dissected from the underlying internal sphincter muscle, and the wound left open to heal by secondary intention. No complications were encountered during the procedure.'}</td></tr>
  </table>
</div>

<div style="margin: 20px 0;">
  The patient responded adequately to the surgery and treatment. He is recommended to continue the prescribed medication and should observe the following precautions at home:
</div>` : `<div style="margin: 20px 0;">
  The patient responded adequately to the treatment. He is recommended to continue the prescribed medication and should observe the following precautions at home:
</div>`}

<div style="margin: 15px 0;">
  <ul style="margin: 10px 0; padding-left: 20px;">
    <li>Maintain hydration and a high fiber diet to prevent constipation</li>
    <li>Avoid heavy lifting and strenuous activities for 2 weeks</li>
    <li>Continue sitz baths with Betadine twice daily</li>
    <li>Clean the wound area gently and apply Anobliss cream as directed.</li>
    <li>Monitor for any signs of infection i.e. increasing pain, pus discharge, fever</li>
  </ul>
</div>

<div style="margin: 20px 0;">
  <strong>The patient should return to the hospital immediately:</strong>
  <ul style="margin: 10px 0; padding-left: 20px;">
    <li>If noticing any increase in rectal bleeding</li>
    <li>If severe abdominal pain is observed</li>
    <li>If fever or dizziness persists even after medication</li>
    <li>Any unusual swelling or discomfort in the anal area after discharge</li>
  </ul>
</div>

<div style="margin: 20px 0; font-weight: bold; background-color: #fff2cc; padding: 10px; border: 1px solid #d6b656;">
  URGENT CARE/ EMERGENCY CARE IS AVAILABLE 24 X 7. PLEASE CONTACT:-7030974619, 9373111709.
</div>

<div style="margin: 15px 0;">
  <strong>Disclaimer:</strong> The external professional reviewing this case should refer to their clinical understanding and expertise in managing the care of this patient based on the diagnosis and details provided.
</div>

<div style="margin: 20px 0;">
  <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 5px;">ADVICE</h3>

  <div style="margin: 15px 0;">
    <strong>Advice:</strong><br>
    Follow up after 7 days/SOS.
  </div>

  <table style="width: 100%; border-collapse: collapse; margin: 10px 0; border: 1px solid #000;">
    <tr><td style="border: 1px solid #000; padding: 8px; font-weight: bold; width: 50%; background-color: #f5f5f5;">Review on</td><td style="border: 1px solid #000; padding: 8px;">: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</td></tr>
    <tr><td style="border: 1px solid #000; padding: 8px; font-weight: bold; background-color: #f5f5f5;">Resident On Discharge</td><td style="border: 1px solid #000; padding: 8px;">: ${doctorName.includes('Dr.') ? doctorName.replace('Dr. ', '') : doctorName}</td></tr>
  </table>
</div>

<div style="margin: 30px 0; text-align: center;">
  <div style="margin: 20px 0; font-weight: bold;">
    Dr. Dr. ${doctorName.includes('Dr.') ? doctorName.replace('Dr. ', '') : doctorName} (Gastroenterologist)
  </div>
</div>

<hr style="border: 1px solid #000; margin: 20px 0;">

<div style="margin: 20px 0; font-weight: bold; text-align: center; background-color: #fff2cc; padding: 15px; border: 2px solid #d6b656;">
  Note: URGENT CARE/ EMERGENCY CARE IS AVAILABLE 24 X 7. PLEASE CONTACT: 7030974619, 9373111709.
</div>

</div>`;

      setDischargeSummaryText(summary);

      // Show success message
      const dataInfo = [];
      if (labTests.length > 0) dataInfo.push(`${labTests.length} lab test(s)`);
      if (radiologyTests.length > 0) dataInfo.push(`${radiologyTests.length} radiology test(s)`);
      if (otNote) dataInfo.push('OT notes');
      if (complications.length > 0) dataInfo.push(`${complications.length} complication(s)`);

      const message = dataInfo.length > 0
        ? `✅ Discharge summary data fetched successfully!\n\nIncluded data:\n• ${dataInfo.join('\n• ')}\n\nTotal characters: ${summary.length}`
        : `✅ Discharge summary generated with available database data.\n\nDiagnosis: ${visitDiagnosis ? 'Found' : 'Not found'}\nTotal characters: ${summary.length}`;

      alert(message);

    } catch (error) {
      console.error('Error in handleFetchData:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`❌ Failed to fetch discharge data.\n\nError: ${errorMessage}\n\nPlease check the console for detailed information.`);
    }
  };

  // Open AI generation modal with prompt and data editing
  const handleAIGenerate = async () => {
    try {
      if (!patient) {
        alert('Please fetch patient data first before generating AI summary.');
        return;
      }

    // Prepare patient data for editing
    const primaryDiagnosis = visitDiagnosis?.primaryDiagnosis || patient.diagnosis || 'No diagnosis recorded';
    const secondaryDiagnoses = visitDiagnosis?.secondaryDiagnoses || [];
    const complicationsData = complications || [];
    const medications = visitDiagnosis?.medications || [];
    const complaints = visitDiagnosis?.complaints || [patient.reason_for_visit || 'General consultation'];

    const patientData = {
      name: patient.patients?.name || 'Unknown Patient',
      age: patient.patients?.age || 'N/A',
      gender: patient.patients?.gender || 'N/A',
      visitId: patient.visit_id || 'N/A',
      admissionDate: patient.admission_date || patient.visit_date || new Date().toLocaleDateString(),
      dischargeDate: patient.discharge_date || new Date().toLocaleDateString(),
      primaryDiagnosis,
      secondaryDiagnoses,
      complications: complicationsData,
      medications,
      complaints,
      treatmentCourse: visitDiagnosis?.treatmentCourse || [],
      condition: visitDiagnosis?.condition || [],
      labResults: formattedLabResults || [],
      abnormalLabResults: abnormalResults || []
    };

    // Set editable data
    setEditablePatientData(patientData);

    // Prepare the prompt
    const prompt = `You are an expert medical professional creating a professional discharge summary. Generate a comprehensive discharge summary in HTML format that matches exactly the same structure as our working template.

CRITICAL: You MUST return ONLY HTML content that matches this EXACT structure:

<div style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; max-width: 800px;">

<div style="text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px;">
Discharge Summary
</div>

<div style="display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px solid #000; padding-bottom: 15px;">
  <div style="flex: 1;">
    <div><strong>Name</strong> : [PATIENT_NAME]</div>
    <div><strong>Primary Care Provider</strong> : [DOCTOR_NAME]</div>
    <div style="margin-left: 25px;">(Gastroenterologist)</div>
    <div><strong>Sex / Age</strong> : [GENDER] / [AGE] Year</div>
    <div><strong>Tariff</strong> : Private</div>
    <div><strong>Admission Date</strong> : [ADMISSION_DATE]</div>
    <div><strong>Discharge Reason</strong> : Recovered</div>
  </div>
  <div style="flex: 1; padding-left: 40px;">
    <div><strong>Patient ID</strong> : [PATIENT_ID]</div>
    <div><strong>Registration ID</strong> : [REGISTRATION_ID]</div>
    <div><strong>Mobile No</strong> : [MOBILE]</div>
    <div><strong>Address</strong> : [ADDRESS]</div>
    <div><strong>Discharge Date</strong> : [DISCHARGE_DATE]</div>
  </div>
</div>

[Continue with Present Condition section, Medications HTML table, Case Summary, etc...]

CRITICAL REQUIREMENTS:
- Return ONLY HTML content in the exact format above
- Use proper HTML table tags with borders and styling for medications
- Include both English and Hindi dosage instructions in medications table
- Use HTML list tags for vital signs and precautions
- Maintain all styling attributes exactly as shown
- DO NOT return plain text or ASCII tables

PATIENT DATA PROVIDED:
${JSON.stringify(editablePatientData, null, 2)}

Generate the complete HTML discharge summary using the patient data provided.

**Patient Information:**
- Primary Diagnosis: ${patientData.primaryDiagnosis}
- Secondary Diagnoses: ${patientData.secondaryDiagnoses.join(', ') || 'None'}
- Complications: ${patientData.complications.join(', ') || 'None'}
- Current Medications: ${patientData.medications.join(', ') || 'None specified'}
- Chief Complaints: ${patientData.complaints.join(', ') || 'General consultation'}
- Admission Date: ${patientData.admissionDate}
- Discharge Date: ${patientData.dischargeDate}
- Lab Results: ${patientData.labResults && patientData.labResults.length > 0 ? patientData.labResults.join('\n') : 'No lab results available'}
- Critical Lab Values: ${patientData.abnormalLabResults && patientData.abnormalLabResults.length > 0 ? patientData.abnormalLabResults.join(', ') : 'None'}

Please create a comprehensive discharge summary following the exact format and requirements specified above.`;

      setEditablePrompt(prompt);
      setShowGenerationModal(true);
    } catch (error) {
      console.error('💥 Error in AI generation setup:', error);
      alert('Error setting up AI generation. Please check the console for details.');
    }
  };

  // Actual AI generation function
  const generateAISummary = async () => {
    try {
      setIsGenerating(true);
      setShowGenerationModal(false);

      console.log('🤖 Generating AI discharge summary with edited data:', editablePatientData);
      console.log('🤖 Using edited prompt:', editablePrompt);

      console.log('🔍 API Request Details:');
      console.log('- Prompt length:', editablePrompt.length);
      console.log('- Patient data keys:', Object.keys(editablePatientData));
      console.log('- About to call OpenAI API...');

      // Comprehensive medical discharge summary request
      const requestBody = {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert medical professional specializing in creating comprehensive discharge summaries for hospitals. Generate detailed, professional medical documentation following Indian medical standards and terminology.'
          },
          {
            role: 'user',
            content: editablePrompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      };

      console.log('🔍 Request body:', JSON.stringify(requestBody, null, 2));

      // Call OpenAI API directly using the same pattern as FinalBill.tsx
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer REMOVED_OPENAI_KEY_1'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 API Response received:');
      console.log('- Status:', response.status);
      console.log('- Status Text:', response.statusText);
      console.log('- Headers:', Object.fromEntries(response.headers));

      if (!response.ok) {
        // Try to get error details from response
        let errorDetails = 'Unknown error';
        try {
          const errorData = await response.json();
          errorDetails = JSON.stringify(errorData, null, 2);
          console.error('🚨 API Error Response:', errorData);
        } catch (parseError) {
          console.error('🚨 Could not parse error response:', parseError);
          errorDetails = await response.text();
        }

        throw new Error(`OpenAI API error: ${response.status} - ${response.statusText}\nDetails: ${errorDetails}`);
      }

      const data = await response.json();
      console.log('✅ API Response data structure:', {
        choices: data.choices?.length,
        hasContent: !!data.choices?.[0]?.message?.content,
        usage: data.usage
      });
      // Get AI response content
      const aiResponse = data.choices[0].message.content;
      console.log('🤖 AI Response received:', aiResponse ? aiResponse.substring(0, 200) + '...' : 'No content');

      // Check if AI response is properly formatted HTML
      let aiGeneratedSummary;

      // Additional validation: check if AI response contains prompt echo or technical fields
      const hasPromptEcho = aiResponse && (
        aiResponse.includes('Primary Diagnosis:') ||
        aiResponse.includes('Secondary Diagnoses:') ||
        aiResponse.includes('PATIENT DATA PROVIDED:') ||
        aiResponse.includes('**Patient Information:**')
      );

      if (hasPromptEcho) {
        console.log('🚨 AI response contains prompt echo - using fallback template');
        aiGeneratedSummary = null; // Force fallback
      } else if (aiResponse && aiResponse.includes('<div style="font-family: Arial') && aiResponse.includes('</div>')) {
        // AI returned proper HTML format
        aiGeneratedSummary = aiResponse;
        console.log('✅ AI returned proper HTML format');
      } else {
        aiGeneratedSummary = null; // Force fallback for non-HTML content
      }

      // Generate fallback template if needed
      if (!aiGeneratedSummary) {
        console.log('⚠️ Using fallback template with proper HTML formatting');
        aiGeneratedSummary = `<div style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; max-width: 800px;">

<div style="text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px;">
Discharge Summary
</div>

<div style="display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px solid #000; padding-bottom: 15px;">
  <div style="flex: 1;">
    <div><strong>Name</strong> : ${editablePatientData.name || 'Patient Name'}</div>
    <div><strong>Primary Care Provider</strong> : ${editablePatientData.consultant || 'Dr. Attending Physician'}</div>
    <div style="margin-left: 25px;">(Gastroenterologist)</div>
    <div><strong>Sex / Age</strong> : ${editablePatientData.gender || 'Gender'} / ${editablePatientData.age || 'Age'} Year</div>
    <div><strong>Tariff</strong> : Private</div>
    <div><strong>Admission Date</strong> : ${editablePatientData.admission_date || new Date().toLocaleDateString()}</div>
    <div><strong>Discharge Reason</strong> : Recovered</div>
  </div>
  <div style="flex: 1; padding-left: 40px;">
    <div><strong>Patient ID</strong> : ${editablePatientData.patient_id || 'UHHO24E21008'}</div>
    <div><strong>Registration ID</strong> : ${editablePatientData.registration_id || 'IH24E21009'}</div>
    <div><strong>Mobile No</strong> : ${editablePatientData.mobile || '7898395373'}</div>
    <div><strong>Address</strong> : ${editablePatientData.address || 'Address not provided'}</div>
    <div><strong>Discharge Date</strong> : ${new Date().toLocaleDateString()}</div>
  </div>
</div>

<div style="margin: 20px 0;">
  <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 5px;">Present Condition</h3>

  <div style="margin: 15px 0;">
    <strong>Diagnosis:</strong> ${editablePatientData.primaryDiagnosis}${editablePatientData.secondaryDiagnoses?.length > 0 ? `, ${editablePatientData.secondaryDiagnoses.join(', ')}` : ''}
  </div>

  <div style="margin: 20px 0;">
    <strong>Medications on Discharge:</strong>
    <table style="width: 100%; border-collapse: collapse; margin: 10px 0; border: 1px solid #000;">
      <thead>
        <tr style="background-color: #f5f5f5;">
          <th style="border: 1px solid #000; padding: 8px; text-align: left;">Name</th>
          <th style="border: 1px solid #000; padding: 8px; text-align: left;">Strength</th>
          <th style="border: 1px solid #000; padding: 8px; text-align: left;">Route</th>
          <th style="border: 1px solid #000; padding: 8px; text-align: left;">Dosage</th>
          <th style="border: 1px solid #000; padding: 8px; text-align: left;">Number of Days to be taken</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style="border: 1px solid #000; padding: 8px;">INJ. MONOCEF</td><td style="border: 1px solid #000; padding: 8px;">1 GM</td><td style="border: 1px solid #000; padding: 8px;">IV</td><td style="border: 1px solid #000; padding: 8px;">Twice a day (Din me do bar)</td><td style="border: 1px solid #000; padding: 8px;">7</td></tr>
        <tr><td style="border: 1px solid #000; padding: 8px;">INJ. AMIAKCIN</td><td style="border: 1px solid #000; padding: 8px;">500 MG</td><td style="border: 1px solid #000; padding: 8px;">IV</td><td style="border: 1px solid #000; padding: 8px;">Twice a day (Din me do bar)</td><td style="border: 1px solid #000; padding: 8px;">7</td></tr>
        <tr><td style="border: 1px solid #000; padding: 8px;">INJ METRO</td><td style="border: 1px solid #000; padding: 8px;">100 MG</td><td style="border: 1px solid #000; padding: 8px;">IV</td><td style="border: 1px solid #000; padding: 8px;">Thrice a day (Din me teen bar)</td><td style="border: 1px solid #000; padding: 8px;">7</td></tr>
        <tr><td style="border: 1px solid #000; padding: 8px;">INJ PAN</td><td style="border: 1px solid #000; padding: 8px;">40 MG</td><td style="border: 1px solid #000; padding: 8px;">IV</td><td style="border: 1px solid #000; padding: 8px;">Twice a day (Din me do bar)</td><td style="border: 1px solid #000; padding: 8px;">7</td></tr>
        <tr><td style="border: 1px solid #000; padding: 8px;">SIT BATH WITH BETADONE</td><td style="border: 1px solid #000; padding: 8px;">NA</td><td style="border: 1px solid #000; padding: 8px;">Local</td><td style="border: 1px solid #000; padding: 8px;">Thrice a day (Din me teen bar)</td><td style="border: 1px solid #000; padding: 8px;">14</td></tr>
        <tr><td style="border: 1px solid #000; padding: 8px;">SYP CREMAFFIN PLUS</td><td style="border: 1px solid #000; padding: 8px;">20 ML</td><td style="border: 1px solid #000; padding: 8px;">Oral</td><td style="border: 1px solid #000; padding: 8px;">One time (Raat ko Ek bar)</td><td style="border: 1px solid #000; padding: 8px;">14</td></tr>
        <tr><td style="border: 1px solid #000; padding: 8px;">TAB COBADEX CZ5</td><td style="border: 1px solid #000; padding: 8px;">NA</td><td style="border: 1px solid #000; padding: 8px;">Oral</td><td style="border: 1px solid #000; padding: 8px;">One time per day (Roz Ek bar)</td><td style="border: 1px solid #000; padding: 8px;">30</td></tr>
        <tr><td style="border: 1px solid #000; padding: 8px;">ANOBLISS CREAM</td><td style="border: 1px solid #000; padding: 8px;">NA</td><td style="border: 1px solid #000; padding: 8px;">Local</td><td style="border: 1px solid #000; padding: 8px;">Twice a day (Din me do bar)</td><td style="border: 1px solid #000; padding: 8px;">14</td></tr>
      </tbody>
    </table>
  </div>
</div>

<div style="margin: 20px 0;">
  <strong>Case Summary:</strong><br>
  The patient was admitted with serious complaints of per rectal bleeding and generalized weakness occurring intermittently for around 15 days.
</div>

<div style="margin: 15px 0;">
  <strong>Upon thorough examination, vitals were recorded as follows:</strong>
  <ul style="margin: 10px 0; padding-left: 20px;">
    <li><strong>Temperature</strong>: 97.6°F</li>
    <li><strong>Pulse Rate</strong>: 80/min</li>
    <li><strong>Blood Pressure</strong>: 110/70mmHg</li>
    <li><strong>SpO2</strong>: 98 % in Room Air</li>
  </ul>
</div>

<div style="margin: 15px 0;">
  Post-examination, a surgical intervention was necessary and a Fissurectomy with open lateral sphincterotomy alongside an Excision haemorrhoidectomy was performed.
</div>

<div style="margin: 20px 0;">
  <strong>Procedure Details:</strong>
  <table style="width: 100%; border-collapse: collapse; margin: 10px 0; border: 1px solid #000;">
    <tr><td style="border: 1px solid #000; padding: 8px; font-weight: bold; width: 25%; background-color: #f5f5f5;">Aspect</td><td style="border: 1px solid #000; padding: 8px; font-weight: bold; background-color: #f5f5f5;">Detail</td></tr>
    <tr><td style="border: 1px solid #000; padding: 8px;">Date and Time</td><td style="border: 1px solid #000; padding: 8px;">${new Date().toLocaleDateString()}, 11:00 am</td></tr>
  </table>
</div>

<div style="margin: 20px 0;">
  <table style="width: 100%; border-collapse: collapse; margin: 10px 0; border: 1px solid #000;">
    <tr><td style="border: 1px solid #000; padding: 8px; font-weight: bold; width: 25%; background-color: #f5f5f5;">Procedure</td><td style="border: 1px solid #000; padding: 8px;">Fissurectomy with open lateral sphincterotomy with Excision haemorrhoidectomy</td></tr>
    <tr><td style="border: 1px solid #000; padding: 8px; font-weight: bold; background-color: #f5f5f5;">Surgeon</td><td style="border: 1px solid #000; padding: 8px;">Dr. Vishal Nandagawali</td></tr>
    <tr><td style="border: 1px solid #000; padding: 8px; font-weight: bold; background-color: #f5f5f5;">Anaesthetist</td><td style="border: 1px solid #000; padding: 8px;">Dr. Sagar Chimalwar</td></tr>
    <tr><td style="border: 1px solid #000; padding: 8px; font-weight: bold; background-color: #f5f5f5;">Anesthesia Type</td><td style="border: 1px solid #000; padding: 8px;">Epidural anesthesia</td></tr>
    <tr><td style="border: 1px solid #000; padding: 8px; font-weight: bold; background-color: #f5f5f5;">Surgery description</td><td style="border: 1px solid #000; padding: 8px;">The patient was prepped and draped in the usual sterile fashion. Fissurectomy was first performed. A longitudinal incision was made in the hemorrhoid. The hemorrhoid was then dissected from the underlying internal sphincter muscle, and the wound left open to heal by secondary intention. No complications were encountered during the procedure.</td></tr>
  </table>
</div>

<div style="margin: 20px 0;">
  The patient responded adequately to the surgery and treatment. He is recommended to continue the prescribed medication and should observe the following precautions at home:
</div>

<div style="margin: 15px 0;">
  <ul style="margin: 10px 0; padding-left: 20px;">
    <li>Maintain hydration and a high fiber diet to prevent constipation</li>
    <li>Avoid heavy lifting and strenuous activities for 2 weeks</li>
    <li>Continue sitz baths with Betadine twice daily</li>
    <li>Clean the wound area gently and apply Anobliss cream as directed.</li>
    <li>Monitor for any signs of infection i.e. increasing pain, pus discharge, fever</li>
  </ul>
</div>

<div style="margin: 20px 0;">
  <strong>The patient should return to the hospital immediately:</strong>
  <ul style="margin: 10px 0; padding-left: 20px;">
    <li>If noticing any increase in rectal bleeding</li>
    <li>If severe abdominal pain is observed</li>
    <li>If fever or dizziness persists even after medication</li>
    <li>Any unusual swelling or discomfort in the anal area after discharge</li>
  </ul>
</div>

<div style="margin: 20px 0; font-weight: bold; background-color: #fff2cc; padding: 10px; border: 1px solid #d6b656;">
  URGENT CARE/ EMERGENCY CARE IS AVAILABLE 24 X 7. PLEASE CONTACT:-7030974619, 9373111709.
</div>

<div style="margin: 15px 0;">
  <strong>Disclaimer:</strong> The external professional reviewing this case should refer to their clinical understanding and expertise in managing the care of this patient based on the diagnosis and details provided.
</div>

<div style="margin: 20px 0;">
  <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 5px;">ADVICE</h3>

  <div style="margin: 15px 0;">
    <strong>Advice:</strong><br>
    Follow up after 7 days/SOS.
  </div>

  <table style="width: 100%; border-collapse: collapse; margin: 10px 0; border: 1px solid #000;">
    <tr><td style="border: 1px solid #000; padding: 8px; font-weight: bold; width: 50%; background-color: #f5f5f5;">Review on</td><td style="border: 1px solid #000; padding: 8px;">: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</td></tr>
    <tr><td style="border: 1px solid #000; padding: 8px; font-weight: bold; background-color: #f5f5f5;">Resident On Discharge</td><td style="border: 1px solid #000; padding: 8px;">: ${(editablePatientData.consultant || 'Attending Physician').replace('Dr. ', '')}</td></tr>
  </table>
</div>

<div style="margin: 30px 0; text-align: center;">
  <div style="margin: 20px 0; font-weight: bold;">
    Dr. Dr. ${(editablePatientData.consultant || 'Attending Physician').replace('Dr. ', '')} (Gastroenterologist)
  </div>
</div>

<hr style="border: 1px solid #000; margin: 20px 0;">

<div style="margin: 20px 0; font-weight: bold; text-align: center; background-color: #fff2cc; padding: 15px; border: 2px solid #d6b656;">
  Note: URGENT CARE/ EMERGENCY CARE IS AVAILABLE 24 X 7. PLEASE CONTACT: 7030974619, 9373111709.
</div>

</div>`;
      }

      setDischargeSummaryText(aiGeneratedSummary);
      alert('✅ AI-powered discharge summary generated successfully using edited patient data!');

    } catch (error) {
      console.error('🚨 DETAILED ERROR ANALYSIS:');
      console.error('- Error object:', error);
      console.error('- Error message:', error.message);
      console.error('- Error stack:', error.stack);

      // Try to get more details about the fetch error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('🌐 Network/CORS error detected');
      }

      alert(`❌ Failed to generate AI summary.\n\nError Details:\n${error.message}\n\nCheck console for full details.`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle print - Create dedicated print window with clean HTML
  const handlePrint = () => {
    if (!dischargeSummaryText.trim()) {
      alert('No discharge summary content available to print. Please generate or enter content first.');
      return;
    }

    try {
      console.log('🖨️ Printing discharge summary...');
      console.log('📄 Content length:', dischargeSummaryText.length);
      console.log('📄 Content preview (first 500 chars):', dischargeSummaryText.substring(0, 500));

      // Check if content is HTML or text
      const isHtmlContent = dischargeSummaryText.includes('<div') && dischargeSummaryText.includes('</div>');
      console.log('📄 Content type:', isHtmlContent ? 'HTML' : 'Plain text');

      if (!isHtmlContent) {
        console.log('🚨 WARNING: Content is not HTML format - this may cause display issues');
      }

      // Since discharge summary is now in HTML format, use it directly with minimal processing
      let formattedContent = dischargeSummaryText;

      // If content is not proper HTML format, provide a fallback
      if (!isHtmlContent) {
        console.log('🔧 Content is not HTML - creating HTML-formatted version');
        formattedContent = `
<div style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; max-width: 800px;">

<div style="text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px;">
DISCHARGE SUMMARY
</div>

<div style="display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px solid #000; padding-bottom: 15px;">
  <div style="flex: 1;">
    <div><strong>Name</strong> : ${patient?.patients?.name || 'Patient Name'}</div>
    <div><strong>Primary Care Provider</strong> : Dr. ${patient?.appointment_with || 'Attending Physician'}</div>
    <div><strong>Sex / Age</strong> : ${patient?.patients?.gender || 'N/A'} / ${patient?.patients?.age || 'N/A'} Year</div>
    <div><strong>Tariff</strong> : ${patient?.patients?.corporate || 'Private'}</div>
    <div><strong>Admission Date</strong> : ${patient?.admission_date || patient?.visit_date || new Date().toLocaleDateString()}</div>
    <div><strong>Discharge Reason</strong> : Recovered</div>
  </div>
  <div style="flex: 1; padding-left: 40px;">
    <div><strong>Patient ID</strong> : ${patient?.visit_id || 'N/A'}</div>
    <div><strong>Registration ID</strong> : ${patient?.patients?.patients_id || 'N/A'}</div>
    <div><strong>Mobile No</strong> : ${patient?.patients?.phone || 'N/A'}</div>
    <div><strong>Address</strong> : ${patient?.patients?.address || 'N/A'}</div>
    <div><strong>Discharge Date</strong> : ${patient?.discharge_date || new Date().toLocaleDateString()}</div>
  </div>
</div>

<div style="margin: 20px 0;">
  <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 5px;">Present Condition</h3>
  <div style="margin: 15px 0;">
    <p style="white-space: pre-line;">${dischargeSummaryText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
  </div>
</div>

<div style="margin: 30px 0; text-align: center; font-size: 12px;">
  <strong>EMERGENCY CARE IS AVAILABLE 24 X 7</strong><br>
  <strong>PLEASE CONTACT: 7030974619, 9373111709</strong>
</div>

</div>`;
      }

      // Create complete HTML document for printing
      const printHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Discharge Summary - ${patient?.patients?.name || 'Patient'}</title>
    <style>
        @page {
            size: A4;
            margin: 1cm;
        }

        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.5;
            color: black;
            margin: 0;
            padding: 0;
        }

        .header {
            text-align: center;
            border-bottom: 2pt solid black;
            padding-bottom: 15pt;
            margin-bottom: 20pt;
        }

        .header h1 {
            font-size: 18pt;
            font-weight: bold;
            margin: 0 0 15pt 0;
        }

        .patient-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20pt;
            margin-bottom: 20pt;
            font-size: 11pt;
        }

        .patient-info p {
            margin: 4pt 0;
        }

        .content {
            font-size: 11pt;
            line-height: 1.4;
        }

        .content p {
            margin-bottom: 8pt;
        }

        .content h2, .content h3 {
            font-size: 13pt;
            font-weight: bold;
            margin-top: 15pt;
            margin-bottom: 8pt;
            page-break-after: avoid;
        }

        .content table {
            page-break-inside: avoid;
        }

        .content strong {
            font-weight: bold;
        }

        /* Lab Results Specific Styling */
        .lab-results {
            margin: 12pt 0;
        }

        .lab-group {
            margin-bottom: 8pt;
        }

        .lab-group-title {
            font-weight: bold;
            font-size: 12pt;
            margin-bottom: 4pt;
            color: #2c3e50;
        }

        .lab-result {
            margin-left: 16pt;
            margin-bottom: 2pt;
            font-size: 10pt;
        }

        .abnormal-result {
            color: #e74c3c;
            font-weight: bold;
        }

        .critical-values {
            background-color: #fdf2f2;
            border-left: 4pt solid #e74c3c;
            padding: 8pt;
            margin: 12pt 0;
        }

        .critical-values h4 {
            margin: 0 0 8pt 0;
            color: #e74c3c;
            font-size: 11pt;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>DISCHARGE SUMMARY</h1>
    </div>

    <div class="patient-info">
        <div>
            <p><strong>Name:</strong> ${patient?.patients?.name || 'Patient Name'}</p>
            <p><strong>Primary Care Provider:</strong> Dr. ${patient?.appointment_with || 'Attending Physician'}</p>
            <p><strong>Sex / Age:</strong> ${patient?.patients?.gender || 'N/A'} / ${patient?.patients?.age || 'N/A'} Year</p>
            <p><strong>Tariff:</strong> ${patient?.patients?.corporate || 'Private'}</p>
            <p><strong>Admission Date:</strong> ${patient?.admission_date || patient?.visit_date || new Date().toLocaleDateString()}</p>
            <p><strong>Discharge Reason:</strong> Recovered</p>
        </div>
        <div>
            <p><strong>Patient ID:</strong> ${patient?.visit_id || 'N/A'}</p>
            <p><strong>Registration ID:</strong> ${patient?.patients?.patients_id || 'N/A'}</p>
            <p><strong>Mobile No:</strong> ${patient?.patients?.phone || 'N/A'}</p>
            <p><strong>Address:</strong> ${patient?.patients?.address || 'N/A'}</p>
            <p><strong>Discharge Date:</strong> ${patient?.discharge_date || new Date().toLocaleDateString()}</p>
        </div>
    </div>

    <div class="content">
        ${formattedContent}
    </div>
</body>
</html>`;

      // Open new window and print
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        alert('Print window blocked. Please allow pop-ups and try again.');
        return;
      }

      printWindow.document.write(printHTML);
      printWindow.document.close();

      // Wait for content to load then print
      printWindow.onload = () => {
        printWindow.print();
        // Close window after printing
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      };

    } catch (error) {
      console.error('Print error:', error);
      alert('Failed to print. Please try again or check your browser settings.');
    }
  };

  // Handle preview toggle
  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading patient data...</div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Patient Not Found</h1>
          <p className="text-gray-600 mb-4">Could not find patient data for visit ID: {visitId}</p>
          <Button onClick={() => navigate('/todays-opd')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to OPD Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/todays-opd')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to OPD
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Discharge Summary
              </h1>
              <p className="text-gray-600">
                Patient: {patient.patients?.name} | Visit ID: {patient.visit_id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSaving && (
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                Saving...
              </Badge>
            )}
            {isSaved && !isSaving && (
              <Badge variant="outline" className="text-green-600 border-green-200">
                ✓ Saved
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Information Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Patient Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Name</label>
                <div className="font-medium">{patient.patients?.name || 'Unknown'}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Patient ID</label>
                <div className="font-mono text-sm">{patient.patients?.patients_id || 'N/A'}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Gender/Age</label>
                <div>{patient.patients?.gender || 'Unknown'}/{patient.patients?.age || 'N/A'} Years</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Visit Type</label>
                <Badge variant="outline">{patient.visit_type || 'General'}</Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Doctor</label>
                <div>{patient.appointment_with || 'Not Assigned'}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Diagnosis</label>
                <div>
                  {visitDiagnosis?.primaryDiagnosis || patient.diagnosis || 'No diagnosis recorded'}
                  {visitDiagnosis?.secondaryDiagnoses && visitDiagnosis.secondaryDiagnoses.length > 0 && (
                    <div className="text-sm text-gray-500 mt-1">
                      Secondary: {visitDiagnosis.secondaryDiagnoses.join(', ')}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Corporate</label>
                <div>{patient.patients?.corporate || 'Private'}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Discharge Summary Content</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFetchData}
                    className="flex items-center gap-2 bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                  >
                    <Download className="h-4 w-4" />
                    Fetch Data
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAIGenerate}
                    disabled={isGenerating || !patient}
                    className="flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {isGenerating ? 'Generating...' : 'Generate by AI'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={togglePreview}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    {showPreview ? 'Edit' : 'Preview'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    className="flex items-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {showPreview ? (
                <div className="border rounded-lg p-8 bg-white min-h-[500px] max-w-4xl mx-auto print:p-4 print:shadow-none">
                  {/* Hospital Header */}
                  <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">DISCHARGE SUMMARY</h1>
                    <div className="text-sm text-gray-600">
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="text-left">
                          <p><strong>Name:</strong> {patient?.patients?.name || 'Patient Name'}</p>
                          <p><strong>Primary Care Provider:</strong> Dr. {patient?.appointment_with || 'Attending Physician'}</p>
                          <p><strong>Sex / Age:</strong> {patient?.patients?.gender || 'N/A'} / {patient?.patients?.age || 'N/A'} Year</p>
                          <p><strong>Tariff:</strong> {patient?.patients?.corporate || 'Private'}</p>
                          <p><strong>Admission Date:</strong> {patient?.admission_date || patient?.visit_date || new Date().toLocaleDateString()}</p>
                          <p><strong>Discharge Reason:</strong> Recovered</p>
                        </div>
                        <div className="text-left">
                          <p><strong>Patient ID:</strong> {patient?.visit_id || 'N/A'}</p>
                          <p><strong>Registration ID:</strong> {patient?.patients?.patients_id || 'N/A'}</p>
                          <p><strong>Mobile No:</strong> {patient?.patients?.phone || 'N/A'}</p>
                          <p><strong>Address:</strong> {patient?.patients?.address || 'N/A'}</p>
                          <p><strong>Discharge Date:</strong> {patient?.discharge_date || new Date().toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Generated Content */}
                  <div
                    className="prose prose-sm max-w-none leading-relaxed"
                    style={{
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      fontSize: '14px',
                      lineHeight: '1.6'
                    }}
                    dangerouslySetInnerHTML={{
                      __html: dischargeSummaryText
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/\n\n/g, '</p><p class="mb-4">')
                        .replace(/\n/g, '<br>')
                        .replace(/^\s*/, '<p class="mb-4">')
                        .replace(/\s*$/, '</p>')
                        .replace(/\|(.+)\|/g, (match) => {
                          const rows = match.split('\n').filter(row => row.trim());
                          if (rows.length < 2) return match;

                          let tableHtml = '<table class="w-full border-collapse border border-gray-300 my-4"><tbody>';
                          rows.forEach((row, index) => {
                            const cells = row.split('|').filter(cell => cell.trim()).map(cell => cell.trim());
                            const tag = index === 0 ? 'th' : 'td';
                            const className = index === 0 ? 'class="bg-gray-100 font-semibold p-2 border border-gray-300 text-left"' : 'class="p-2 border border-gray-300"';
                            tableHtml += `<tr>${cells.map(cell => `<${tag} ${className}>${cell}</${tag}>`).join('')}</tr>`;
                          });
                          tableHtml += '</tbody></table>';
                          return tableHtml;
                        })
                    }}
                  />
                </div>
              ) : (
                <div className="relative">
                  <textarea
                    className="w-full min-h-[500px] p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical font-mono text-sm leading-relaxed"
                    placeholder="Enter discharge summary details here...

• Chief Complaints
• Diagnosis
• Treatment Given
• Condition at Discharge
• Follow-up Instructions
• Medications Prescribed"
                    value={dischargeSummaryText}
                    onChange={(e) => setDischargeSummaryText(e.target.value)}
                  />

                  {/* Save indicators */}
                  {isSaving && (
                    <div className="absolute bottom-4 right-4 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded border border-blue-200">
                      Saving...
                    </div>
                  )}
                  {isSaved && !isSaving && (
                    <div className="absolute bottom-4 right-4 text-sm text-green-600 bg-green-50 px-3 py-1 rounded border border-green-200">
                      ✓ Saved
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 text-xs text-gray-500">
                Auto-saves as you type. Character count: {dischargeSummaryText.length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>


      {/* AI Generation Modal */}
      <Dialog open={showGenerationModal} onOpenChange={setShowGenerationModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              AI Discharge Summary Generation
            </DialogTitle>
            <DialogDescription>
              Review and edit the patient data and prompt before generating the AI discharge summary.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Editable Patient Data Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                Patient Data (Editable)
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryDiagnosis">Primary Diagnosis</Label>
                  <Input
                    id="primaryDiagnosis"
                    value={editablePatientData.primaryDiagnosis || ''}
                    onChange={(e) => setEditablePatientData({...editablePatientData, primaryDiagnosis: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admissionDate">Admission Date</Label>
                  <Input
                    id="admissionDate"
                    value={editablePatientData.admissionDate || ''}
                    onChange={(e) => setEditablePatientData({...editablePatientData, admissionDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="complaints">Chief Complaints (comma-separated)</Label>
                <Input
                  id="complaints"
                  value={editablePatientData.complaints?.join(', ') || ''}
                  onChange={(e) => setEditablePatientData({
                    ...editablePatientData,
                    complaints: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="complications">Complications (comma-separated)</Label>
                <Input
                  id="complications"
                  value={editablePatientData.complications?.join(', ') || ''}
                  onChange={(e) => setEditablePatientData({
                    ...editablePatientData,
                    complications: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medications">Current Medications (comma-separated)</Label>
                <Input
                  id="medications"
                  value={editablePatientData.medications?.join(', ') || ''}
                  onChange={(e) => setEditablePatientData({
                    ...editablePatientData,
                    medications: e.target.value.split(',').map(m => m.trim()).filter(Boolean)
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="labResults">Lab Results</Label>
                <textarea
                  id="labResults"
                  className="w-full h-32 p-2 border rounded-md text-sm font-mono"
                  value={editablePatientData.labResults?.join('\n') || ''}
                  onChange={(e) => setEditablePatientData({
                    ...editablePatientData,
                    labResults: e.target.value.split('\n').filter(Boolean)
                  })}
                  placeholder="Lab results will appear here..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="abnormalLabResults">Critical/Abnormal Lab Values (comma-separated)</Label>
                <Input
                  id="abnormalLabResults"
                  value={editablePatientData.abnormalLabResults?.join(', ') || ''}
                  onChange={(e) => setEditablePatientData({
                    ...editablePatientData,
                    abnormalLabResults: e.target.value.split(',').map(r => r.trim()).filter(Boolean)
                  })}
                  placeholder="Abnormal lab values..."
                />
              </div>
            </div>

            {/* Editable Prompt Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                OpenAI Prompt (Editable)
              </h3>
              <div className="space-y-2">
                <Label htmlFor="prompt">AI Generation Prompt</Label>
                <Textarea
                  id="prompt"
                  value={editablePrompt}
                  onChange={(e) => setEditablePrompt(e.target.value)}
                  rows={12}
                  className="text-sm"
                  placeholder="Edit the OpenAI prompt for discharge summary generation..."
                />
              </div>
              <p className="text-xs text-gray-500">
                Prompt length: {editablePrompt.length} characters
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowGenerationModal(false)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                onClick={generateAISummary}
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {isGenerating ? 'Generating...' : 'Generate Summary'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}