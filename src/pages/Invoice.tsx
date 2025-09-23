import React, { useState } from 'react';
import { format } from 'date-fns';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Invoice = () => {
  const [showPharmacyCharges, setShowPharmacyCharges] = useState(false);
  const [showLabAndRadiologyCharges, setShowLabAndRadiologyCharges] = useState(true);
  const [discountRemoved, setDiscountRemoved] = useState(false);
  const navigate = useNavigate();
  const { visitId } = useParams<{ visitId: string }>();

  // Fetch patient and visit data
  const { data: visitData, isLoading } = useQuery({
    queryKey: ['invoice-visit', visitId],
    queryFn: async () => {
      if (!visitId) return null;

      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          patients (*)
        `)
        .eq('visit_id', visitId)
        .single();

      if (error) {
        console.error('Error fetching visit data:', error);
        return null;
      }

      return data;
    },
    enabled: !!visitId
  });

  // Fetch bill data for financial information
  const { data: billData } = useQuery({
    queryKey: ['invoice-bill', visitId],
    queryFn: async () => {
      if (!visitId) return null;

      const { data, error } = await supabase
        .from('bills')
        .select(`
          *,
          bill_sections (
            *,
            bill_line_items (*)
          )
        `)
        .eq('visit_id', visitId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching bill data:', error);
        return null;
      }

      return data;
    },
    enabled: !!visitId
  });

  // Fetch payment data
  const { data: paymentData } = useQuery({
    queryKey: ['invoice-payments', visitId],
    queryFn: async () => {
      if (!visitId) return null;

      const { data, error } = await supabase
        .from('accounting_transactions')
        .select('*')
        .eq('visit_id', visitId)
        .eq('transaction_type', 'payment');

      if (error) {
        console.error('Error fetching payment data:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!visitId
  });

  // Fetch advance payments
  const { data: advanceData } = useQuery({
    queryKey: ['invoice-advances', visitId],
    queryFn: async () => {
      if (!visitId) return null;

      const { data, error } = await supabase
        .from('accounting_transactions')
        .select('*')
        .eq('visit_id', visitId)
        .eq('transaction_type', 'advance');

      if (error) {
        console.error('Error fetching advance data:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!visitId
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice data...</p>
        </div>
      </div>
    );
  }

  // Show error if no data found
  if (!visitData) {
    return (
      <div className="min-h-screen bg-white p-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Invoice Not Found</h2>
          <p className="text-gray-600 mb-4">Unable to load invoice data for visit ID: {visitId}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const patient = visitData.patients;

  // Calculate age string
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 'N/A';
    const birth = new Date(birthDate);
    const today = new Date();
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();
    const days = today.getDate() - birth.getDate();

    let ageYears = years;
    let ageMonths = months;

    if (days < 0) {
      ageMonths--;
    }
    if (ageMonths < 0) {
      ageYears--;
      ageMonths += 12;
    }

    return `${ageYears}Y ${ageMonths}M 0D`;
  };

  // Create services array from actual bill data
  const createServicesFromBillData = () => {
    if (!billData?.bill_sections) {
      return [
        { srNo: 1, item: `General Ward (${visitData.admission_date ? format(new Date(visitData.admission_date), 'dd/MM/yyyy') : 'N/A'}-${visitData.discharge_date ? format(new Date(visitData.discharge_date), 'dd/MM/yyyy') : 'Present'})`, rate: 0, qty: 1, amount: 0 }
      ];
    }

    const services = [];
    let srNo = 1;

    billData.bill_sections.forEach((section) => {
      if (section.bill_line_items && section.bill_line_items.length > 0) {
        section.bill_line_items.forEach((item) => {
          services.push({
            srNo: srNo++,
            item: item.description || section.section_name,
            rate: item.rate || 0,
            qty: item.quantity || 1,
            amount: item.amount || 0
          });
        });
      } else {
        // If no line items, use section data
        services.push({
          srNo: srNo++,
          item: section.section_name,
          rate: section.total_amount || 0,
          qty: 1,
          amount: section.total_amount || 0
        });
      }
    });

    return services;
  };

  // Calculate actual financial amounts from database
  const calculateActualAmounts = () => {
    const totalBillAmount = billData?.total_amount || 0;

    // Calculate total payments (including advances)
    const totalPayments = (paymentData || []).reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const totalAdvances = (advanceData || []).reduce((sum, advance) => sum + (advance.amount || 0), 0);
    const totalAmountPaid = totalPayments + totalAdvances;

    // Get discount from bill data or calculate from accounting transactions
    const discountAmount = billData?.discount || 0;

    // Calculate balance
    const balance = totalBillAmount - totalAmountPaid - discountAmount;

    return {
      total: totalBillAmount,
      amountPaid: totalAmountPaid,
      discount: discountAmount,
      balance: balance
    };
  };

  const actualAmounts = calculateActualAmounts();

  // Create invoice data from fetched data
  const invoiceData = {
    patientName: patient?.name || 'N/A',
    age: patient?.date_of_birth ? calculateAge(patient.date_of_birth) : (patient?.age ? `${patient.age}Y 0M 0D` : 'N/A'),
    sex: patient?.gender || 'N/A',
    address: patient?.address || 'N/A',
    registrationDate: visitData.admission_date ? format(new Date(visitData.admission_date), 'dd/MM/yyyy HH:mm:ss') : 'N/A',
    dischargeDate: visitData.discharge_date ? format(new Date(visitData.discharge_date), 'dd/MM/yyyy HH:mm:ss') : '',
    invoiceNo: billData?.bill_no || visitData.visit_id || 'N/A',
    registrationNo: patient?.patients_id || visitData.visit_id || 'N/A',
    category: billData?.category || 'Private',
    primaryConsultant: visitData.consultant || 'N/A',
    hospitalServiceTaxNo: 'ABUPK3997PSD001',
    hospitalPan: 'AAECD9144P',
    services: createServicesFromBillData(),
    total: actualAmounts.total,
    amountPaid: actualAmounts.amountPaid,
    discount: actualAmounts.discount,
    balance: actualAmounts.balance,
    amountInWords: 'Rupee Thirteen Thousand Nine Hundred Three Only' // TODO: Implement number to words conversion
  };

  // Calculate dynamic total excluding hidden charges
  const calculateVisibleTotal = () => {
    return invoiceData.services.reduce((total, service) => {
      // Exclude both laboratory and radiology charges if hidden
      if ((service.item.toLowerCase().includes('laboratory') || service.item.toLowerCase().includes('radiology')) && !showLabAndRadiologyCharges) {
        return total;
      }
      return total + service.amount;
    }, 0);
  };

  const visibleTotal = calculateVisibleTotal();

  // Calculate current discount and balance using actual data
  const currentDiscount = discountRemoved ? 0 : actualAmounts.discount;
  const currentBalance = visibleTotal - actualAmounts.amountPaid - currentDiscount;

  // Print functionality - matches exact screenshot format
  const handlePrint = () => {
    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Failed to open print window. Please check popup blockers.');
      return;
    }

    // Create the exact print document matching the screenshot
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${new Date().toLocaleDateString('en-IN')}</title>
          <meta charset="UTF-8">
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
              background: white;
              font-size: 12px;
            }

            .print-header {
              text-align: center;
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 30px;
            }

            .invoice-container {
              border: 2px solid #000;
              padding: 15px;
            }

            .patient-info {
              margin-bottom: 20px;
              border: 1px solid #000;
              padding: 10px;
            }

            .patient-info table {
              width: 100%;
              border-collapse: collapse;
            }

            .patient-info td {
              border: none;
              padding: 3px 0;
              font-size: 12px;
              vertical-align: top;
            }

            .patient-info .label {
              width: 20%;
              font-weight: bold;
            }

            .patient-info .colon {
              width: 2%;
            }

            .patient-info .value {
              width: 78%;
            }

            .services-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }

            .services-table th, .services-table td {
              border: 1px solid #000;
              padding: 6px;
              text-align: center;
              font-size: 11px;
            }

            .services-table th {
              background-color: #f0f0f0;
              font-weight: bold;
            }

            .services-table .item-column {
              text-align: left;
            }

            .amount-section {
              display: flex;
              margin-top: 20px;
            }

            .amount-words {
              flex: 1;
              padding-right: 20px;
              font-size: 11px;
            }

            .amount-table {
              width: 300px;
            }

            .amount-table table {
              width: 100%;
              border-collapse: collapse;
            }

            .amount-table td {
              border: 1px solid #000;
              padding: 6px;
              font-size: 11px;
            }

            .amount-table .label-cell {
              background-color: #f0f0f0;
              font-weight: bold;
              width: 50%;
            }

            .footer-info {
              margin-top: 20px;
              font-size: 11px;
            }

            .hospital-footer {
              text-align: center;
              margin-top: 30px;
            }

            .hospital-name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 20px;
            }

            .signatures {
              display: flex;
              justify-content: space-around;
              margin-top: 20px;
            }

            .signature-item {
              text-align: center;
              font-size: 10px;
            }

            .note {
              margin-top: 20px;
              font-size: 10px;
            }

            @page {
              size: A4;
              margin: 0.5in;
            }
          </style>
        </head>
        <body>
          <div class="print-header">Hospital Management System Billing</div>

          <div class="invoice-container">
            <!-- Patient Information -->
            <div class="patient-info">
              <table>
                <tr>
                  <td class="label">Name Of Patient</td>
                  <td class="colon">:</td>
                  <td class="value">${invoiceData.patientName}</td>
                </tr>
                <tr>
                  <td class="label">Age/Sex</td>
                  <td class="colon">:</td>
                  <td class="value">${invoiceData.age}/${invoiceData.sex}</td>
                </tr>
                <tr>
                  <td class="label">Address</td>
                  <td class="colon">:</td>
                  <td class="value">${invoiceData.address}</td>
                </tr>
                <tr>
                  <td class="label">Date Of Registration</td>
                  <td class="colon">:</td>
                  <td class="value">${invoiceData.registrationDate}</td>
                </tr>
                <tr>
                  <td class="label">Date Of Discharge</td>
                  <td class="colon">:</td>
                  <td class="value">${invoiceData.dischargeDate}</td>
                </tr>
                <tr>
                  <td class="label">Invoice No.</td>
                  <td class="colon">:</td>
                  <td class="value">${invoiceData.invoiceNo}</td>
                </tr>
                <tr>
                  <td class="label">Registration No.</td>
                  <td class="colon">:</td>
                  <td class="value">${invoiceData.registrationNo}</td>
                </tr>
                <tr>
                  <td class="label">Category</td>
                  <td class="colon">:</td>
                  <td class="value">${invoiceData.category}</td>
                </tr>
                <tr>
                  <td class="label">Primary Consultant</td>
                  <td class="colon">:</td>
                  <td class="value">${invoiceData.primaryConsultant}</td>
                </tr>
              </table>
            </div>

            <!-- Services Table -->
            <table class="services-table">
              <thead>
                <tr>
                  <th>Sr. No.</th>
                  <th>Item</th>
                  <th>Rate</th>
                  <th>Qty.</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${invoiceData.services.map((service) => {
                  // Hide services based on state
                  if ((service.item.toLowerCase().includes('laboratory') || service.item.toLowerCase().includes('radiology')) && !showLabAndRadiologyCharges) {
                    return '';
                  }
                  return `
                    <tr>
                      <td>${service.srNo}</td>
                      <td class="item-column">${service.item}</td>
                      <td>${service.rate}</td>
                      <td>${service.qty}</td>
                      <td>${service.amount}</td>
                    </tr>
                  `;
                }).join('')}
                <tr>
                  <td colspan="4" style="font-weight: bold;">Total</td>
                  <td style="font-weight: bold;">Rs ${visibleTotal.toLocaleString()}.00</td>
                </tr>
              </tbody>
            </table>

            <!-- Amount Section -->
            <div class="amount-section">
              <div class="amount-words">
                <strong>Amount Chargeable (in words)</strong><br>
                ${invoiceData.amountInWords}
              </div>

              <div class="amount-table">
                <table>
                  <tr>
                    <td class="label-cell">Amount Paid</td>
                    <td style="text-align: right;">Rs ${invoiceData.amountPaid.toLocaleString()}.00</td>
                  </tr>
                  <tr>
                    <td class="label-cell">Discount</td>
                    <td style="text-align: right;">Rs ${currentDiscount.toLocaleString()}.00</td>
                  </tr>
                  <tr>
                    <td class="label-cell">Balance</td>
                    <td style="text-align: right;">Rs ${currentBalance >= 0 ? currentBalance.toLocaleString() : `(${Math.abs(currentBalance).toLocaleString()})`}.00</td>
                  </tr>
                </table>
              </div>
            </div>

            <!-- Footer Information -->
            <div class="footer-info">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Hospital Service Tax No. : ${invoiceData.hospitalServiceTaxNo}</span>
                <span>Hospitals PAN : ${invoiceData.hospitalPan}</span>
              </div>
              <div style="margin-bottom: 20px;">
                <strong>Signature of Patient :</strong>
              </div>
            </div>

            <!-- Hospital Footer -->
            <div class="hospital-footer">
              <div class="hospital-name">Ayushman Hospital</div>
              <div class="signatures">
                <div class="signature-item">Bill Manager</div>
                <div class="signature-item">Cashier</div>
                <div class="signature-item">Med.Supdt.</div>
                <div class="signature-item">Authorised<br>Signatory</div>
              </div>
            </div>

            <!-- Note -->
            <div class="note">
              <strong>NOTE:</strong> ** Indicates that calculated price may vary .Please ask for "Detailled Bill" to see the details.)
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Print and Close Buttons */}
        <div className="flex justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Print
            </button>
          </div>

          {/* Invoice Form */}
          <div className="border border-gray-300 p-4 invoice-content">
          {/* Patient Information Table */}
          <table className="w-full mb-4 text-sm">
            <tbody>
              <tr>
                <td className="py-1 pr-4 font-medium">Name Of Patient</td>
                <td className="py-1">: {invoiceData.patientName}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Age/Sex</td>
                <td className="py-1">: {invoiceData.age}/{invoiceData.sex}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Address</td>
                <td className="py-1">: {invoiceData.address}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Date Of Registration</td>
                <td className="py-1">: {invoiceData.registrationDate}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Date Of Discharge</td>
                <td className="py-1">: {invoiceData.dischargeDate}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Invoice No.</td>
                <td className="py-1">: {invoiceData.invoiceNo}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Registration No.</td>
                <td className="py-1">: {invoiceData.registrationNo}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Category</td>
                <td className="py-1">: {invoiceData.category}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 font-medium">Primary Consultant</td>
                <td className="py-1">: {invoiceData.primaryConsultant}</td>
              </tr>
            </tbody>
          </table>

          {/* Control Buttons */}
          <div className="flex justify-center gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setShowPharmacyCharges(!showPharmacyCharges)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
            >
              Show Pharmacy Charge
            </button>
            <button
              onClick={() => setShowLabAndRadiologyCharges(!showLabAndRadiologyCharges)}
              className={`px-4 py-2 text-white rounded transition-colors text-sm ${
                showLabAndRadiologyCharges
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {showLabAndRadiologyCharges ? 'Hide Lab & Radiology Charges' : 'Show Lab & Radiology Charges'}
            </button>
          </div>

          {/* Services Table */}
          <table className="w-full border border-gray-400 text-sm mb-4">
            <thead>
              <tr>
                <th className="border border-gray-400 p-2 text-center">Sr. No.</th>
                <th className="border border-gray-400 p-2 text-center">Item</th>
                <th className="border border-gray-400 p-2 text-center">Rate</th>
                <th className="border border-gray-400 p-2 text-center">Qty.</th>
                <th className="border border-gray-400 p-2 text-center">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.services.map((service) => {
                // Hide both Laboratory and Radiology Charges if showLabAndRadiologyCharges is false
                if ((service.item.toLowerCase().includes('laboratory') || service.item.toLowerCase().includes('radiology')) && !showLabAndRadiologyCharges) {
                  return null;
                }

                return (
                  <tr key={service.srNo}>
                    <td className="border border-gray-400 p-2 text-center">{service.srNo}</td>
                    <td className="border border-gray-400 p-2">{service.item}</td>
                    <td className="border border-gray-400 p-2 text-center">{service.rate}</td>
                    <td className="border border-gray-400 p-2 text-center">{service.qty}</td>
                    <td className="border border-gray-400 p-2 text-center">{service.amount}</td>
                  </tr>
                );
              })}
              <tr>
                <td className="border border-gray-400 p-2 text-center font-bold" colSpan={4}>Total</td>
                <td className="border border-gray-400 p-2 text-center font-bold">Rs {visibleTotal.toLocaleString()}.00</td>
              </tr>
            </tbody>
          </table>

          {/* Amount Details */}
          <div className="flex">
            <div className="w-1/2 pr-4">
              <div className="text-sm">
                <strong>Amount Chargeable (in words)</strong><br />
                {invoiceData.amountInWords}
              </div>
            </div>
            <div className="w-1/2">
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="border border-gray-400 p-2 bg-gray-100 font-medium">Amount Paid</td>
                    <td className="border border-gray-400 p-2 text-right">Rs {invoiceData.amountPaid.toLocaleString()}.00</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 bg-gray-100 font-medium">Discount</td>
                    <td className="border border-gray-400 p-2 text-right">Rs {currentDiscount.toLocaleString()}.00</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 bg-gray-100 font-medium">Balance</td>
                    <td className="border border-gray-400 p-2 text-right">Rs {currentBalance >= 0 ? currentBalance.toLocaleString() : `(${Math.abs(currentBalance).toLocaleString()})`}.00</td>
                  </tr>
                </tbody>
              </table>

              {/* Remove Discount Button */}
              <div className="mt-2">
                <button
                  onClick={() => setDiscountRemoved(!discountRemoved)}
                  className={`px-3 py-1 text-white rounded text-xs transition-colors ${
                    discountRemoved
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {discountRemoved ? 'Add Discount' : 'Remove Discount'}
                </button>
              </div>
            </div>
          </div>

          {/* Footer Information */}
          <div className="mt-6 text-sm">
            <div className="flex justify-between mb-2">
              <span>Hospital Service Tax No. : {invoiceData.hospitalServiceTaxNo}</span>
              <span>Hospitals PAN : {invoiceData.hospitalPan}</span>
            </div>
            <div className="mb-4">
              <strong>Signature of Patient :</strong>
            </div>

            {/* Hospital Name and Signatures */}
            <div className="text-center border-t border-gray-300 pt-4">
              <h2 className="text-lg font-bold mb-4">Ayushman Hospital</h2>
              <div className="flex justify-between text-center">
                <div>
                  <div className="mb-2">Bill Manager</div>
                </div>
                <div>
                  <div className="mb-2">Cashier</div>
                </div>
                <div>
                  <div className="mb-2">Med.Supdt.</div>
                </div>
                <div>
                  <div className="mb-2">Authorised<br />Signatory</div>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="mt-4 text-xs">
              <strong>NOTE:</strong> ** Indicates that calculated price may vary .Please ask for "Detailled Bill" to see the details.)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
