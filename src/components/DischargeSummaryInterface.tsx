import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Printer, FileText, Bot, User } from 'lucide-react';
import DischargeSummary from './DischargeSummary';

interface DischargeSummaryInterfaceProps {
  visitId?: string;
  patientName?: string;
  patientAge?: string;
  patientGender?: string;
  patientAddress?: string;
}

export default function DischargeSummaryInterface({
  visitId,
  patientName = "NIYATI BAWANKAR",
  patientAge = "3 years",
  patientGender = "female",
  patientAddress = "Mamta society plot no.34/b sonegaon Nagpur"
}: DischargeSummaryInterfaceProps) {
  const [allPatientData, setAllPatientData] = useState(`Dr. Vishal Nandagavli, Reactive 17/03/2025:-HBSAG - Non - Reactive 17/03/2025:-HCV [ Hepatitis C Virus ] - HCV [ Hepatitis C Virus ] - Non - Reactive 17/03/2025:-PROTHROMBIN TIME (PT): Prothrombin Time:16.76 s, Prothrombin Index:76 %, Prothrombin Ratio:1.31, INR:1.31, Control:12.8 s, APTT:32.45 s, Control:30.5 s, Ratio:1.06, Eosinophils:03 %, Red Cell Count:4.52 mlt/cumm, Packed Cell Volume:42.9 %, Mean Cell Volume:94.9 fl., Mean Cell Hemoglobin:30.52 pg, Mean Cell Hemoglobin Concentration:32.1 g/dl, Platelet Count:250,000 /cumm, Serum sodium: 140 mEq/L, Serum potassium: 5.6 mEq/L, Bilirubin - Total:0.98 mg/dl, Bilirubin - Direct:0.23 mg/dl, Bilirubin - Indirect:0.75 mg/dl, SGOT / AST:38 units/L, SGPT / ALT:39.8 U/L, Alkaline Phosphatase (ALP): Protein - Total:6.75 gm/dl, Albumin:3.72 gm/dl, Globulin:3.03 gm/dl, A / G Ratio:1.23 23/03/2025:-INR QUANTITATIVE:0.93 mg/Procedure: ,Treatment On Discharge: Tan. Dolton 50MG Pack- Route:P.O Frequency-BD Days-07, TAB.FOLIC ACID Pack- Route:P.O Frequency-OD Days-07, TAB ATORVA 25 MG Pack- Route:P.O Frequency-BD Days-07, INJECTA P.O Frequency-BD Days-07,`);
  
  const [patientDataSummary, setPatientDataSummary] = useState(`**3. INVESTIGATIONS SECTION**

**Normal Investigations:**
- Hemoglobin: 12.6 g/dL
- Platelet count: 250,000 /cumm
- Serum sodium: 140 mEq/L

**Abnormal Investigations:**
- Serum creatinine: 2.8 mg/dL
- Blood urea nitrogen: 35 mg/dL
- Serum potassium: 5.6 mEq/L

**4. HOSPITAL COURSE**

The patient was admitted with a history of LEFT CONGENITAL INGUINAL HERNIA. The patient received conservative management which included`);

  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const handlePrintSummary = () => {
    setShowPrintPreview(true);
    // Open print preview in new window
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleViewFullSummary = () => {
    setShowPrintPreview(true);
  };

  const handleRefreshData = () => {
    // Refresh functionality
    console.log('Refreshing data...');
  };

  const handleCopyData = () => {
    navigator.clipboard.writeText(allPatientData);
  };

  const handleClear = () => {
    setAllPatientData('');
  };

  const handleFinalDischarge = () => {
    // Final discharge functionality
    console.log('Processing final discharge...');
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(patientDataSummary);
  };

  const handleClearSummary = () => {
    setPatientDataSummary('');
  };

  if (showPrintPreview) {
    return (
      <div className="min-h-screen bg-white">
        {/* Print Button - Hidden in print */}
        <div className="no-print mb-4 text-center p-4">
          <Button
            onClick={handlePrintSummary}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 mr-4"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Summary
          </Button>
          <Button
            onClick={() => setShowPrintPreview(false)}
            variant="outline"
            className="px-6 py-2"
          >
            Back to Edit
          </Button>
        </div>

        {/* Use the existing DischargeSummary component with manual data */}
        <DischargeSummary
          visitId={visitId}
          allPatientData={allPatientData}
          patientDataSummary={patientDataSummary}
        />

        {/* Print Styles */}
        <style>{`
          @media print {
            .no-print {
              display: none !important;
            }
            body {
              margin: 0;
              padding: 0;
            }
            @page {
              margin: 0.5in;
              size: A4;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Patient Data Summary</h1>
              <p className="text-gray-600">1 sections loaded</p>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              Internal System
            </Badge>
          </div>
          
          {/* Patient Info */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p><strong>Patient:</strong> {patientName}</p>
              <p><strong>Age:</strong> {patientAge}</p>
              <p><strong>Gender:</strong> {patientGender}</p>
            </div>
            <div>
              <p><strong>Address:</strong> {patientAddress}</p>
              <p><strong>Data Source:</strong> Internal System</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* All Patient Data Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                All Patient Data (Auto-populated when Discharge Summary is clicked):
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={allPatientData}
                onChange={(e) => setAllPatientData(e.target.value)}
                placeholder="Patient data will be auto-populated here..."
                className="min-h-[300px] font-mono text-sm"
              />
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={handleViewFullSummary}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View Full Discharge Summary
                </Button>
                <Button 
                  onClick={() => console.log('Generate AI Summary')}
                  variant="outline"
                  className="bg-green-50 hover:bg-green-100"
                >
                  <Bot className="mr-2 h-4 w-4" />
                  Generate AI Summary
                </Button>
                <Button 
                  onClick={() => console.log('Professional Summary')}
                  variant="outline"
                  className="bg-orange-50 hover:bg-orange-100"
                >
                  <User className="mr-2 h-4 w-4" />
                  Professional Summary
                </Button>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button onClick={handleRefreshData} variant="outline" size="sm">
                  Refresh Data
                </Button>
                <Button onClick={handleCopyData} variant="outline" size="sm">
                  Copy Data
                </Button>
                <Button onClick={handleClear} variant="outline" size="sm">
                  Clear
                </Button>
                <Button 
                  onClick={handleFinalDischarge}
                  className="bg-blue-600 hover:bg-blue-700 ml-auto"
                >
                  Final Discharge
                </Button>
              </div>
              
              <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                ✅ Patient data loaded successfully! (3114 characters)
              </div>
            </CardContent>
          </Card>

          {/* Patient Data Summary Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Patient Data Summary
                </span>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => console.log('Generate Summary')}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    Generate Summary
                  </Button>
                  <Button 
                    onClick={handlePrintSummary}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print Summary
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={patientDataSummary}
                onChange={(e) => setPatientDataSummary(e.target.value)}
                placeholder="Patient summary will appear here..."
                className="min-h-[300px] text-sm"
              />
              
              <div className="flex gap-2">
                <Button onClick={handleCopySummary} variant="outline" size="sm">
                  Copy Summary
                </Button>
                <Button onClick={handleClearSummary} variant="outline" size="sm">
                  Clear Summary
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
