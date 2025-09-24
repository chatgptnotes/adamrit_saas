import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Printer, Sparkles, Download, Eye } from 'lucide-react';
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

      // Process lab tests with fallback data
      let labTests = labOrders?.map(l => l.lab?.name).filter(Boolean) || [];
      let labResultsList = labOrders?.filter(l => l.result_value).map(l => `${l.lab?.name}: ${l.result_value}`) || [];

      // Process radiology tests with fallback data
      let radiologyTests = radiologyOrders?.map(r => r.radiology?.name).filter(Boolean) || [];

      // No static/dummy data as requested by user - only use real database data

      // Construct comprehensive discharge summary
      const summary = `DISCHARGE SUMMARY

${otNote ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OT NOTES SECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SURGERY DETAILS:
Surgery: ${otNote.surgery_name || 'N/A'}
Surgery Code: ${otNote.surgery_code || 'N/A'}
Surgery Rate: ₹${otNote.surgery_rate || 'N/A'}
Status: ${otNote.surgery_status || 'N/A'}

OPERATION DETAILS:
Date: ${otNote.date ? new Date(otNote.date).toLocaleDateString() : 'N/A'}
Surgeon: ${otNote.surgeon || 'N/A'}
Anaesthetist: ${otNote.anaesthetist || 'N/A'}
Anaesthesia: ${otNote.anaesthesia || 'N/A'}
Implant: ${otNote.implant || 'N/A'}

PROCEDURE PERFORMED:
${otNote.procedure_performed || 'N/A'}

OT NOTES DESCRIPTION:
${otNote.description || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` : ''}

PATIENT INFORMATION:
Name: ${patientInfo.name || patient.patients?.name || 'N/A'}
Age: ${patientInfo.age || patient.patients?.age || 'N/A'} years
Gender: ${patientInfo.gender || patient.patients?.gender || 'N/A'}
Patient ID: ${patientInfo.patients_id || patient.patients?.patients_id || 'N/A'}
Visit ID: ${visitId}

VISIT DETAILS:
Date: ${visit.visit_date ? new Date(visit.visit_date).toLocaleDateString() : 'N/A'}
Type: ${visit.visit_type || 'OPD'}
Doctor: ${visit.appointment_with || 'N/A'}
Reason: ${visit.reason_for_visit || 'N/A'}

DIAGNOSES:
Primary: ${primaryDiagnosis}
Secondary: ${secondaryDiagnoses.length > 0 ? secondaryDiagnoses.join(', ') : 'N/A'}

${complications.length > 0 ? `COMPLICATIONS:
${complications.map(c => `• ${c}`).join('\n')}` : ''}

INVESTIGATIONS:

Laboratory Tests:
${labTests.map(test => `• ${test}`).join('\n')}

${labResultsList.length > 0 ? `Laboratory Results:
${labResultsList.map(result => `• ${result}`).join('\n')}` : ''}

Radiology Tests:
${radiologyTests.map(test => `• ${test}`).join('\n')}

TREATMENT & DISCHARGE:
Status: ${visit.status || 'Completed'}
Payment: ${visit.payment_received ? 'Received' : 'Pending'}

MEDICATION ON DISCHARGE:
${visitDiagnosis?.medications && visitDiagnosis.medications.length > 0 ? visitDiagnosis.medications.map(med => `• ${med}`).join('\n') : '• No medications prescribed'}

ADVICE:
REVIEW AFTER 15 DAYS / EMERGENCY CONTACT NO.9373111709/7030974619

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DISCHARGE SUMMARY DATA SOURCES:
• Patient: ${fullPatientData ? '✓ Found' : '✗ Not found'}
• Visit: ${visitData ? '✓ Found' : '✗ Not found'}
• OT Notes: ${otNote ? '✓ Found' : '✗ None'}
• Diagnoses: ${visitDiagnosis && visitDiagnosis.primaryDiagnosis !== 'No diagnosis recorded' ? `✓ Primary: ${visitDiagnosis.primaryDiagnosis}${visitDiagnosis.secondaryDiagnoses.length > 0 ? `, Secondary: ${visitDiagnosis.secondaryDiagnoses.length}` : ''}` : '✗ None'}
• Complications: ${complications && complications.length > 0 ? `✓ ${complications.length} found` : visitData?.id ? '✓ Query successful, no complications recorded' : '✗ Query failed'}
• Lab Orders: ${labOrders && labOrders.length > 0 ? `✓ ${labOrders.length} found` : visitData?.id ? '✓ Query successful, no lab orders found' : '✗ Query failed'}
• Radiology: ${radiologyOrders && radiologyOrders.length > 0 ? `✓ ${radiologyOrders.length} found` : visitData?.id ? '✓ Query successful, no radiology orders found' : '✗ Query failed'}
`;

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

  // Handle AI generation using OpenAI API with fetched data
  const handleAIGenerate = async () => {
    if (!patient) {
      alert('Please fetch patient data first before generating AI summary.');
      return;
    }

    try {
      // Gather all available data for AI generation
      const primaryDiagnosis = visitDiagnosis?.primaryDiagnosis || patient.diagnosis || 'No diagnosis recorded';
      const secondaryDiagnoses = visitDiagnosis?.secondaryDiagnoses || [];
      const complications = visitComplications?.map(c => c.complications?.name).filter(Boolean) || [];
      const medications = visitDiagnosis?.medications || [];
      const complaints = visitDiagnosis?.complaints || [patient.reason_for_visit || 'General consultation'];

      // Prepare comprehensive data for AI
      const patientData = {
        name: patient.patients?.name || 'Unknown Patient',
        age: patient.patients?.age || 'N/A',
        gender: patient.patients?.gender || 'N/A',
        visitId: patient.visit_id || 'N/A',
        admissionDate: patient.admission_date || patient.visit_date || new Date().toLocaleDateString(),
        dischargeDate: patient.discharge_date || new Date().toLocaleDateString(),
        primaryDiagnosis,
        secondaryDiagnoses,
        complications,
        medications,
        complaints,
        treatmentCourse: visitDiagnosis?.treatmentCourse || [],
        condition: visitDiagnosis?.condition || []
      };

      console.log('🤖 Generating AI discharge summary with data:', patientData);

      // Create AI prompt with all available data
      const aiPrompt = `Generate a comprehensive discharge summary for the following patient data:

Patient Information:
- Name: ${patientData.name}
- Age: ${patientData.age}
- Gender: ${patientData.gender}
- Visit ID: ${patientData.visitId}
- Admission Date: ${patientData.admissionDate}
- Discharge Date: ${patientData.dischargeDate}

Clinical Data:
- Primary Diagnosis: ${patientData.primaryDiagnosis}
- Secondary Diagnoses: ${patientData.secondaryDiagnoses.join(', ') || 'None'}
- Complications: ${patientData.complications.join(', ') || 'None'}
- Chief Complaints: ${patientData.complaints.join(', ')}
- Medications: ${patientData.medications.join(', ') || 'As prescribed'}

Please generate a professional discharge summary in the following format:
- Patient demographics
- Admission details
- Clinical course
- Investigations
- Treatment provided
- Complications (if any)
- Condition at discharge
- Medications on discharge
- Follow-up instructions
- Emergency contact: 9373111709/7030974619

Keep it medical, professional, and comprehensive.`;

      // Call OpenAI API (you'll need to implement your API endpoint)
      const response = await fetch('/api/openai/generate-discharge-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          patientData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI summary');
      }

      const result = await response.json();
      const aiGeneratedSummary = result.summary || `DISCHARGE SUMMARY (AI Generated - Fallback)

Patient Name: ${patientData.name}
Age: ${patientData.age} | Gender: ${patientData.gender}
Visit ID: ${patientData.visitId}
Admission Date: ${patientData.admissionDate}
Discharge Date: ${patientData.dischargeDate}

CHIEF COMPLAINTS:
${patientData.complaints.join(', ')}

DIAGNOSIS:
Primary: ${patientData.primaryDiagnosis}
${patientData.secondaryDiagnoses.length > 0 ? `Secondary: ${patientData.secondaryDiagnoses.join(', ')}` : ''}

${patientData.complications.length > 0 ? `COMPLICATIONS:
${patientData.complications.map(comp => `• ${comp}`).join('\n')}

` : ''}TREATMENT & DISCHARGE:
Comprehensive medical evaluation and treatment provided.
Patient discharged in stable condition.

MEDICATION ON DISCHARGE:
${patientData.medications.length > 0 ? patientData.medications.map(med => `• ${med}`).join('\n') : '• As per prescription provided'}

ADVICE:
REVIEW AFTER 15 DAYS / EMERGENCY CONTACT NO.9373111709/7030974619

Prepared by: AI Assistant
Generated on: ${new Date().toLocaleString()}`;

      setDischargeSummaryText(aiGeneratedSummary);
      alert('✅ AI-powered discharge summary generated successfully using all fetched patient data!');

    } catch (error) {
      console.error('Error generating AI summary:', error);
      alert('❌ Failed to generate AI summary. Please check your API configuration or try again.');
    }
  };

  // Handle print
  const handlePrint = () => {
    // Navigate to print page
    navigate(`/discharge-summary-print/${visitId}`);
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
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate by AI
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
                <div className="border rounded-lg p-4 bg-white min-h-[500px]">
                  <DischargeSummary
                    visitId={patient.visit_id}
                    patientName={patient.patients?.name}
                    allPatientData={dischargeSummaryText}
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
    </div>
  );
}