// Treatment Sheet - Print Optimized View
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TreatmentSheetPrintViewProps {
  visitId: string;
}

const TreatmentSheetPrintView: React.FC<TreatmentSheetPrintViewProps> = ({ visitId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [admissionDate, setAdmissionDate] = useState('');
  const [specialInstruction, setSpecialInstruction] = useState('');
  const [diet, setDiet] = useState('');
  const [consultant, setConsultant] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [date, setDate] = useState('');
  const [intensiveCare, setIntensiveCare] = useState('');
  const [medications, setMedications] = useState<any[]>([]);

  useEffect(() => {
    fetchTreatmentSheetData();
  }, [visitId]);

  const fetchTreatmentSheetData = async () => {
    try {
      setLoading(true);

      // Fetch visit data with patient info
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select(`
          *,
          patient:patient_id (
            name,
            patients_id,
            date_of_birth,
            gender
          )
        `)
        .eq('visit_id', visitId)
        .single();

      if (visitError) throw visitError;

      if (visitData) {
        setPatientName(visitData.patient?.name || '');
        setRegNo(visitData.patient?.patients_id || '');
        setAdmissionDate(visitData.admission_date || visitData.created_at?.split('T')[0] || '');
        setConsultant(visitData.appointment_with || '');
        setDate(new Date().toISOString().split('T')[0]);
        setDiagnosis(visitData.diagnosis || visitData.chief_complaint || '');
        setSpecialInstruction(visitData.special_instructions || '');
        setIntensiveCare(visitData.intensive_care_notes || '');
      }

      // Fetch medications from pharmacy_sale_items via pharmacy_sales
      // First get all sales for this visit
      const { data: sales, error: salesError } = await supabase
        .from('pharmacy_sales')
        .select('sale_id, sale_date')
        .eq('visit_id', visitId)
        .order('sale_date', { ascending: true });

      if (!salesError && sales && sales.length > 0) {
        // Fetch all sale items for these sales
        const saleIds = sales.map(s => s.sale_id);
        const { data: saleItems, error: itemsError } = await supabase
          .from('pharmacy_sale_items')
          .select('*')
          .in('sale_id', saleIds)
          .order('created_at', { ascending: true });

        if (!itemsError && saleItems) {
          // Enrich sale items with sale_date from sales
          const enrichedItems = saleItems.map(item => {
            const sale = sales.find(s => s.sale_id === item.sale_id);
            return {
              ...item,
              sale_date: sale?.sale_date || item.created_at
            };
          });
          setMedications(enrichedItems);
        }
      } else {
        // Fallback: Fetch from visit_medications if no sales found
        const { data: meds, error: medError } = await supabase
          .from('visit_medications')
          .select(`
            *,
            medication:medication_id (
              name,
              generic_name,
              strength,
              dosage_form
            )
          `)
          .eq('visit_id', visitData.id)
          .eq('status', 'dispensed')
          .order('created_at', { ascending: true });

        if (!medError && meds) {
          setMedications(meds);
        }
      }
    } catch (error: any) {
      console.error('Error fetching treatment sheet:', error);
      toast({
        title: 'Error',
        description: 'Failed to load treatment sheet',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading treatment sheet...</div>;
  }

  return (
    <div className="bg-white p-4" style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px' }}>
      <style>{`
        * {
          box-sizing: border-box;
        }
        .ts-table {
          width: 100%;
          border-collapse: collapse;
          border: 2px solid #000;
          table-layout: fixed;
        }
        .ts-table th,
        .ts-table td {
          border: 1px solid #000;
          padding: 4px 6px;
          text-align: left;
          overflow: visible;
          word-wrap: break-word;
          vertical-align: middle;
        }
        .ts-table th {
          font-weight: bold;
          text-align: center;
          background-color: #f0f0f0;
        }
        .ts-header {
          text-align: center;
          font-size: 16px;
          font-weight: bold;
          text-decoration: underline;
          margin-bottom: 8px;
        }
        .ts-time-box {
          display: inline-block;
          width: 40px;
          height: 30px;
          border: 1px solid #000;
          margin: 1px;
          text-align: center;
          padding: 2px;
          font-size: 10px;
          vertical-align: top;
        }
        .ts-time-label {
          font-size: 9px;
          display: block;
          line-height: 1.1;
        }

        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .no-print {
            display: none !important;
          }

          .ts-header {
            page-break-after: avoid;
            page-break-inside: avoid;
          }

          .ts-table {
            page-break-inside: avoid;
            table-layout: fixed !important;
            width: 100% !important;
            border: 2px solid #000 !important;
          }

          .ts-table th,
          .ts-table td {
            border: 1px solid #000 !important;
            padding: 3px 4px !important;
            font-size: 11px !important;
            line-height: 1.3 !important;
            overflow: visible !important;
            word-wrap: break-word !important;
            page-break-inside: avoid;
          }

          .ts-table th {
            background-color: #f0f0f0 !important;
            font-weight: bold !important;
          }

          /* Fixed column widths for medication table */
          .ts-table thead tr th:nth-child(1) {
            width: 5% !important;
          }
          .ts-table thead tr th:nth-child(2) {
            width: 28% !important;
          }
          .ts-table thead tr th:nth-child(3) {
            width: 8% !important;
          }
          .ts-table thead tr th:nth-child(4) {
            width: 8% !important;
          }
          .ts-table thead tr th:nth-child(5) {
            width: 33% !important;
          }
          .ts-table thead tr th:nth-child(6) {
            width: 18% !important;
          }

          /* Time boxes layout */
          .ts-time-box {
            display: inline-block !important;
            width: 38px !important;
            height: 28px !important;
            border: 1px solid #000 !important;
            margin: 0 1px !important;
            padding: 1px !important;
            font-size: 8px !important;
            vertical-align: top !important;
            box-sizing: border-box !important;
          }

          .ts-time-label {
            font-size: 8px !important;
            line-height: 1 !important;
            display: block !important;
          }

          /* Prevent page breaks inside sections */
          .ts-table tbody tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          /* Small text styling */
          small {
            font-size: 9px !important;
          }

          /* Patient info table */
          .ts-table tbody tr td:nth-child(1) {
            width: 20% !important;
          }
          .ts-table tbody tr td:nth-child(2) {
            width: 30% !important;
          }
          .ts-table tbody tr td:nth-child(3) {
            width: 20% !important;
          }
          .ts-table tbody tr td:nth-child(4) {
            width: 30% !important;
          }
        }
      `}</style>

      <div className="ts-header">TREATMENT SHEET</div>

      {/* Patient Info Table */}
      <table className="ts-table mb-2">
        <tbody>
          <tr>
            <td style={{ width: '20%' }}><strong>Name Of the Patient :</strong></td>
            <td style={{ width: '30%' }}>{patientName}</td>
            <td style={{ width: '20%' }}><strong>Reg. No. :</strong></td>
            <td style={{ width: '30%' }}>{regNo}</td>
          </tr>
          <tr>
            <td><strong>Special Instruction</strong></td>
            <td colSpan={3}>{specialInstruction}</td>
          </tr>
          <tr>
            <td><strong>Diet</strong></td>
            <td>{diet}</td>
            <td><strong>Date of Admission:</strong></td>
            <td>{admissionDate}</td>
          </tr>
          <tr>
            <td><strong>Diagnosis</strong></td>
            <td colSpan={3}>{diagnosis}</td>
          </tr>
          <tr>
            <td><strong>Date :</strong></td>
            <td>{date}</td>
            <td><strong>Consultant :</strong></td>
            <td>{consultant}</td>
          </tr>
        </tbody>
      </table>

      {/* Intensive Care Section */}
      {intensiveCare && (
        <div style={{ border: '1px solid #000', padding: '4px', marginBottom: '8px' }}>
          <strong>Intensive care services :</strong> {intensiveCare}
        </div>
      )}

      {/* Medications Table - Group by Date */}
      {(() => {
        // Group medications by date
        const groupedByDate: { [key: string]: any[] } = {};
        medications.forEach(med => {
          const dateKey = med.sale_date
            ? new Date(med.sale_date).toISOString().split('T')[0]
            : med.created_at
            ? new Date(med.created_at).toISOString().split('T')[0]
            : date;
          if (!groupedByDate[dateKey]) {
            groupedByDate[dateKey] = [];
          }
          groupedByDate[dateKey].push(med);
        });

        return Object.entries(groupedByDate).map(([dateKey, meds], groupIdx) => (
          <div key={groupIdx} style={{ marginBottom: '20px', pageBreakAfter: 'always' }}>
            {groupIdx > 0 && (
              <>
                <div className="ts-header" style={{ marginTop: '20px' }}>TREATMENT SHEET</div>
                {/* Repeat Patient Info Table for each date */}
                <table className="ts-table mb-2">
                  <tbody>
                    <tr>
                      <td style={{ width: '20%' }}><strong>Name Of the Patient :</strong></td>
                      <td style={{ width: '30%' }}>{patientName}</td>
                      <td style={{ width: '20%' }}><strong>Reg. No. :</strong></td>
                      <td style={{ width: '30%' }}>{regNo}</td>
                    </tr>
                    <tr>
                      <td><strong>Special Instruction</strong></td>
                      <td colSpan={3}>{specialInstruction}</td>
                    </tr>
                    <tr>
                      <td><strong>Diet</strong></td>
                      <td>{diet}</td>
                      <td><strong>Date of Admission:</strong></td>
                      <td>{admissionDate}</td>
                    </tr>
                    <tr>
                      <td><strong>Diagnosis</strong></td>
                      <td colSpan={3}>{diagnosis}</td>
                    </tr>
                    <tr>
                      <td><strong>Date :</strong></td>
                      <td>{dateKey}</td>
                      <td><strong>Consultant :</strong></td>
                      <td>{consultant}</td>
                    </tr>
                  </tbody>
                </table>
                {intensiveCare && (
                  <div style={{ border: '1px solid #000', padding: '4px', marginBottom: '8px' }}>
                    <strong>Intensive care services :</strong> {intensiveCare}
                  </div>
                )}
              </>
            )}

            {groupIdx === 0 && (
              <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
                Date: {dateKey}
              </div>
            )}

            <table className="ts-table">
              <thead>
                <tr>
                  <th style={{ width: '5%' }}>Sr.No</th>
                  <th style={{ width: '30%' }}>Name of Medicine</th>
                  <th style={{ width: '10%' }}>Route</th>
                  <th style={{ width: '10%' }}>Dose</th>
                  <th style={{ width: '25%' }}>Time - Nurses<br/>Signature</th>
                  <th style={{ width: '20%' }}>Medication<br/>Administered</th>
                </tr>
              </thead>
              <tbody>
                {meds.map((med, idx) => (
                  <tr key={idx}>
                    <td className="text-center">{idx + 1}</td>
                    <td>
                      <strong>
                        {med.medication_name || med.medication?.name || ''}
                      </strong>
                      {med.generic_name && (
                        <>
                          <br/>
                          <small style={{ fontSize: '10px', color: '#555' }}>
                            {med.generic_name}
                          </small>
                        </>
                      )}
                      {!med.generic_name && med.medication?.generic_name && (
                        <>
                          <br/>
                          <small style={{ fontSize: '10px', color: '#555' }}>
                            {med.medication.generic_name}
                          </small>
                        </>
                      )}
                    </td>
                    <td className="text-center">{med.route || 'BD'}</td>
                    <td className="text-center">{med.dosage || med.quantity || ''}</td>
                    <td className="text-center" style={{ whiteSpace: 'nowrap' }}>
                      <div className="ts-time-box">
                        <span className="ts-time-label">6</span>
                        <span className="ts-time-label">AM</span>
                      </div>
                      <div className="ts-time-box">
                        <span className="ts-time-label">2</span>
                        <span className="ts-time-label">PM</span>
                      </div>
                      <div className="ts-time-box">
                        <span className="ts-time-label">6</span>
                        <span className="ts-time-label">PM</span>
                      </div>
                      <div className="ts-time-box">
                        <span className="ts-time-label">10</span>
                        <span className="ts-time-label">PM</span>
                      </div>
                    </td>
                    <td className="text-center" style={{ color: 'blue' }}>
                      Medication<br/>Administered
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Bottom Section - Fluid/Rate/Other Instruction */}
            <table className="ts-table" style={{ marginTop: '8px' }}>
              <tbody>
                <tr>
                  <td style={{ width: '15%' }}><strong>Fluid</strong></td>
                  <td style={{ width: '35%' }}></td>
                  <td style={{ width: '15%' }}><strong>Rate</strong></td>
                  <td style={{ width: '35%' }}></td>
                </tr>
                <tr>
                  <td><strong>Other Instruction</strong></td>
                  <td colSpan={3}></td>
                </tr>
              </tbody>
            </table>

            {/* Signature Section */}
            <table className="ts-table" style={{ marginTop: '8px' }}>
              <tbody>
                <tr>
                  <td style={{ width: '60%' }}>
                    <strong>Signature/Name of Doctor :</strong> {consultant ? `Dr. ${consultant}` : ''}
                  </td>
                  <td style={{ width: '40%' }}>
                    <strong>Date/Time:</strong> {new Date().toLocaleString('en-IN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ));
      })()}
    </div>
  );
};

export default TreatmentSheetPrintView;
