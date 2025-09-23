import { useParams } from 'react-router-dom';
import DischargeSummary from '@/components/DischargeSummary';

export default function DischargeSummaryPrint() {
  const { visitId } = useParams<{ visitId: string }>();

  // Static data based on the provided information
  const staticPatientData = `
Name: NIYATI BAWANKAR
Age: 48
Gender: Female
Visit ID: IH24L12038
Admission Date: 12/02/2025
Discharge Date: 15/02/2025
Primary Diagnosis: syncope with unstable angina
Secondary Diagnosis: N/A
Medications: TAB.VERTIN 16MG Pack- Route-P.O Frequency-BD Days-07, TAB. VERTIGON -25 MG Pack- Route-P.O Frequency-BD Days-07, TAB.DOLO 650 MG Pack- Route-P.O Frequency-SOS Days-07, TAB.PAN D Pack- Route-P.O Frequency-BD Days-07
Presenting Complaints: 48 years old Female patient giddiness, vomiting headache suration in one side of head since 3 days History of Patient admitted here for further management and treatment
Clinical Summary: The patient had no history of trauma or prior surgery. On examination, significant swelling, tenderness, and redness were observed in the right scrotal area without discharge or foul odor. Systemically stable at presentation, except for mild dehydration.
Vital Signs: Temperature: 98.8°F, Pulse Rate: 82/min, Respiration Rate: 28/min, Blood Pressure: 100/60mmHg, SpO2: 98
Investigations: CBC, KFT, LFT, HIV I & II, HBsAg, Coagulation Profile
Treatment On Discharge: TAB.VERTIN 16MG Pack- Route-P.O Frequency-BD Days-07, TAB. VERTIGON -25 MG Pack- Route-P.O Frequency-BD Days-07, TAB.DOLO 650 MG Pack- Route-P.O Frequency-SOS Days-07, TAB.PAN D Pack- Route-P.O Frequency-BD Days-07
Surgeon: Dr. Vishal Nandagawli
Follow-up: OPD follow-up after 7 days from discharge or earlier if needed
Emergency Contact: 7030574619 / 9373111229
Doctor: Dr. B.K. Murali, MS (Orthopaedics), Director of Hope Group Of Hospital
  `.trim();

  const handlePrint = () => {
    try {
      console.log('Print button clicked');

      // Check if print is supported
      if (!window.print) {
        console.error('window.print is not available');
        alert('Print functionality is not supported in this browser.');
        return;
      }

      console.log('Print function is available');

      // Hide any tooltips or dropdowns that might interfere
      const tooltips = document.querySelectorAll('[role="tooltip"], .tooltip, .dropdown-menu');
      tooltips.forEach(tooltip => {
        if (tooltip instanceof HTMLElement) {
          tooltip.style.display = 'none';
        }
      });

      // Add print event listeners for debugging
      const beforePrint = () => {
        console.log('Before print event fired');
      };

      const afterPrint = () => {
        console.log('After print event fired');
      };

      window.addEventListener('beforeprint', beforePrint);
      window.addEventListener('afterprint', afterPrint);

      // Ensure the page is fully loaded before printing
      if (document.readyState !== 'complete') {
        console.log('Document not ready, waiting for load');
        window.addEventListener('load', () => {
          setTimeout(() => {
            console.log('Calling window.print() after load');
            window.print();
          }, 300);
        });
      } else {
        console.log('Document ready, calling window.print()');
        // Small delay to ensure all styles are applied
        setTimeout(() => {
          window.print();
        }, 300);
      }

      // Clean up event listeners after a delay
      setTimeout(() => {
        window.removeEventListener('beforeprint', beforePrint);
        window.removeEventListener('afterprint', afterPrint);
      }, 5000);

    } catch (error) {
      console.error('Print error:', error);
      alert('Print functionality encountered an error. Please try again or use your browser\'s print option (Ctrl+P).');
    }
  };




  return (
    <div className="min-h-screen bg-white">
      {/* Print Button - Hidden in print */}
      <div className="no-print mb-4 text-center p-4 bg-gray-50 border-b">
        <div className="flex justify-center gap-4">
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm"
            title="Print this discharge summary"
          >
            🖨️ Print Discharge Summary
          </button>
          <button
            onClick={() => {
              // Fallback print method
              try {
                // Try to trigger print dialog directly
                window.print();
              } catch (error) {
                // If that fails, show instructions
                alert('Please use Ctrl+P (Windows) or Cmd+P (Mac) to print this document.');
              }
            }}
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors font-medium shadow-sm"
            title="Alternative print method"
          >
            📄 Alternative Print
          </button>
          <button
            onClick={() => window.history.back()}
            className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors font-medium shadow-sm"
            title="Go back to previous page"
          >
            ← Back
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          If print button doesn't work, use <kbd className="bg-gray-200 px-1 rounded">Ctrl+P</kbd> (Windows) or <kbd className="bg-gray-200 px-1 rounded">Cmd+P</kbd> (Mac)
        </p>
        <div className="text-xs text-gray-500 mt-1">
          Print Status: <span id="print-status">Ready</span> |
          Browser: {navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Firefox') ? 'Firefox' : navigator.userAgent.includes('Safari') ? 'Safari' : 'Other'}
        </div>
      </div>

      {/* Use the existing DischargeSummary component with static data */}
      <DischargeSummary
        visitId={visitId}
        allPatientData={staticPatientData}
        patientDataSummary={undefined} // Can be passed from URL params or state if needed
      />

      {/* Print Styles */}
      <style>{`
        @media print {
          /* Hide non-print elements */
          .no-print {
            display: none !important;
          }

          /* Reset body styles for print */
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            font-family: Arial, sans-serif !important;
            font-size: 12px !important;
            line-height: 1.4 !important;
            color: #000 !important;
          }

          /* Ensure colors print correctly */
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Page setup */
          @page {
            margin: 0.5in 0.75in;
            size: A4 portrait;
          }

          /* Reset container styles */
          .min-h-screen {
            min-height: auto !important;
            background: white !important;
          }

          /* Ensure proper text rendering */
          h1, h2, h3, h4, h5, h6 {
            color: #000 !important;
            page-break-after: avoid !important;
          }

          p, div, span {
            color: #000 !important;
          }

          /* Table styles for better print output */
          table {
            border-collapse: collapse !important;
            width: 100% !important;
            page-break-inside: auto !important;
          }

          th, td {
            border: 1px solid #000 !important;
            padding: 8px !important;
            text-align: left !important;
            page-break-inside: avoid !important;
          }

          /* Avoid page breaks in important sections */
          .page-break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Force black text for all elements */
          * {
            color: #000 !important;
            background: transparent !important;
          }

          /* Exception for backgrounds that should print */
          .print-background {
            background: #f5f5f5 !important;
          }
        }

        /* Print preview styles (when not printing) */
        @media screen {
          .print-preview {
            max-width: 8.5in;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            padding: 0.5in;
          }
        }
      `}</style>
    </div>
  );
}