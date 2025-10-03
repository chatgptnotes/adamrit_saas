import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ArrowLeft, Printer, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';

interface PhysiotherapyItem {
  id: string;
  item_name: string;
  cghs_code: string;
  cghs_rate: number;
  quantity: number;
  amount: number;
}

interface PatientData {
  visit_id: string;
  patient_name: string;
  address: string;
  age: string;
  sex: string;
  diagnosis: string;
  opd_date: string;
  corporate: string;
}

const PhysiotherapyBill = () => {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();

  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [billNo, setBillNo] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [items, setItems] = useState<PhysiotherapyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [billTitle, setBillTitle] = useState('OPD BILL');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingCorporate, setIsEditingCorporate] = useState(false);
  const [corporateType, setCorporateType] = useState('CGHS');
  const [newItem, setNewItem] = useState({
    item_name: '',
    cghs_code: '',
    cghs_rate: 0,
    quantity: 1
  });

  useEffect(() => {
    if (visitId) {
      fetchPatientData();
    }
  }, [visitId]);

  const fetchPatientData = async () => {
    try {
      setIsLoading(true);

      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select(`
          *,
          patients (
            name,
            address,
            age,
            gender,
            date_of_birth
          )
        `)
        .eq('visit_id', visitId)
        .single();

      if (visitError) throw visitError;

      if (visitData) {
        setPatientData({
          visit_id: visitData.visit_id,
          patient_name: visitData.patients?.name || 'N/A',
          address: visitData.patients?.address || 'N/A',
          age: visitData.patients?.age?.toString() || 'N/A',
          sex: visitData.patients?.gender || 'N/A',
          diagnosis: visitData.diagnosis || 'FOR PHYSIOTHERAPY',
          opd_date: visitData.visit_date || new Date().toISOString().split('T')[0],
          corporate: visitData.patients?.corporate || 'CGHS'
        });

        const billNumber = `OH${visitData.visit_id?.replace(/[^0-9]/g, '') || Date.now()}`;
        setBillNo(billNumber);

        setCorporateType(visitData.patients?.corporate || 'CGHS');
        setStartDate(visitData.visit_date || new Date().toISOString().split('T')[0]);
        setEndDate(new Date().toISOString().split('T')[0]);
      }

      const { data: existingItems, error: itemsError } = await supabase
        .from('physiotherapy_bill_items')
        .select('*')
        .eq('visit_id', visitId);

      if (!itemsError && existingItems && existingItems.length > 0) {
        setItems(existingItems.map(item => ({
          id: item.id,
          item_name: item.item_name,
          cghs_code: item.cghs_code,
          cghs_rate: item.cghs_rate,
          quantity: item.quantity,
          amount: item.amount
        })));
      } else {
        // Create default first row if no items exist
        const { data: newRow, error: createError } = await supabase
          .from('physiotherapy_bill_items')
          .insert({
            visit_id: visitId,
            item_name: '',
            cghs_code: '',
            cghs_rate: 0,
            quantity: 1,
            amount: 0
          })
          .select()
          .single();

        if (!createError && newRow) {
          setItems([{
            id: newRow.id,
            item_name: '',
            cghs_code: '',
            cghs_rate: 0,
            quantity: 1,
            amount: 0
          }]);
        } else {
          // If database insert fails, still show a row with temporary ID
          console.error('Error creating default row:', createError);
          setItems([{
            id: 'temp-' + Date.now(),
            item_name: '',
            cghs_code: '',
            cghs_rate: 0,
            quantity: 1,
            amount: 0
          }]);
        }
      }

    } catch (error) {
      console.error('Error fetching patient data:', error);
      toast.error('Failed to load patient data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async () => {
    try {
      const amount = newItem.cghs_rate * newItem.quantity;

      const { error } = await supabase
        .from('physiotherapy_bill_items')
        .insert({
          visit_id: visitId,
          item_name: newItem.item_name,
          cghs_code: newItem.cghs_code,
          cghs_rate: newItem.cghs_rate,
          quantity: newItem.quantity,
          amount: amount
        });

      if (error) throw error;

      setShowAddDialog(false);
      setNewItem({ item_name: '', cghs_code: '', cghs_rate: 0, quantity: 1 });
      await fetchPatientData();
      toast.success('Item added successfully');
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item');
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  const updateItem = async (index: number, field: string, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };

    // Recalculate amount if rate or quantity changed
    if (field === 'cghs_rate' || field === 'quantity') {
      updatedItems[index].amount = updatedItems[index].cghs_rate * updatedItems[index].quantity;
    }

    setItems(updatedItems);

    // Save to database (skip if temp ID)
    try {
      const item = updatedItems[index];

      // If item has a temporary ID, create it in the database first
      if (typeof item.id === 'string' && item.id.startsWith('temp-')) {
        const { data, error } = await supabase
          .from('physiotherapy_bill_items')
          .insert({
            visit_id: visitId,
            item_name: item.item_name,
            cghs_code: item.cghs_code,
            cghs_rate: item.cghs_rate,
            quantity: item.quantity,
            amount: item.amount
          })
          .select()
          .single();

        if (!error && data) {
          updatedItems[index].id = data.id;
          setItems([...updatedItems]);
        }
      } else {
        // Update existing item
        const { error } = await supabase
          .from('physiotherapy_bill_items')
          .update({
            item_name: item.item_name,
            cghs_code: item.cghs_code,
            cghs_rate: item.cghs_rate,
            quantity: item.quantity,
            amount: item.amount
          })
          .eq('id', item.id);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    }
  };

  const addNewRow = async () => {
    try {
      const { data, error } = await supabase
        .from('physiotherapy_bill_items')
        .insert({
          visit_id: visitId,
          item_name: '',
          cghs_code: '',
          cghs_rate: 0,
          quantity: 1,
          amount: 0
        })
        .select()
        .single();

      if (!error && data) {
        setItems([...items, {
          id: data.id,
          item_name: data.item_name,
          cghs_code: data.cghs_code,
          cghs_rate: data.cghs_rate,
          quantity: data.quantity,
          amount: data.amount
        }]);
        toast.success('New row added');
      } else {
        // If database fails, still add row with temp ID
        setItems([...items, {
          id: 'temp-' + Date.now(),
          item_name: '',
          cghs_code: '',
          cghs_rate: 0,
          quantity: 1,
          amount: 0
        }]);
        toast.success('Row added (will save when you edit)');
      }
    } catch (error) {
      console.error('Error adding new row:', error);
      // Still add row even on error
      setItems([...items, {
        id: 'temp-' + Date.now(),
        item_name: '',
        cghs_code: '',
        cghs_rate: 0,
        quantity: 1,
        amount: 0
      }]);
      toast.success('Row added (will save when you edit)');
    }
  };

  const updateOpdDate = async (newDate: Date) => {
    try {
      const formattedDate = format(newDate, 'yyyy-MM-dd');

      // Update in database
      const { error } = await supabase
        .from('visits')
        .update({ visit_date: formattedDate })
        .eq('visit_id', visitId);

      if (error) throw error;

      // Update local state
      if (patientData) {
        setPatientData({
          ...patientData,
          opd_date: formattedDate
        });
      }

      toast.success('OPD date updated');
    } catch (error) {
      console.error('Error updating OPD date:', error);
      toast.error('Failed to update date');
    }
  };

  const updateDateRange = async (newStartDate?: Date, newEndDate?: Date) => {
    try {
      if (newStartDate) {
        setStartDate(format(newStartDate, 'yyyy-MM-dd'));
      }
      if (newEndDate) {
        setEndDate(format(newEndDate, 'yyyy-MM-dd'));
      }
      toast.success('Date range updated');
    } catch (error) {
      console.error('Error updating date range:', error);
      toast.error('Failed to update date range');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Patient data not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header with actions - hide on print */}
      <div className="max-w-4xl mx-auto mb-4 no-print flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigate('/todays-opd')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to OPD
        </Button>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Bill Content - EXACT Printed Format */}
      <div className="max-w-4xl mx-auto bg-white border border-gray-400 p-6">
        {/* Hospital Header */}
        <div className="text-center border-b border-gray-400 pb-2 mb-3">
          <h1 className="text-base font-bold uppercase">
            <Popover open={isEditingTitle} onOpenChange={setIsEditingTitle}>
              <PopoverTrigger asChild>
                <span className="cursor-pointer hover:bg-gray-100 px-1">
                  {billTitle}
                </span>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bill Title</label>
                  <Input
                    value={billTitle}
                    onChange={(e) => setBillTitle(e.target.value)}
                    placeholder="Enter bill title"
                  />
                  <Button
                    size="sm"
                    onClick={() => setIsEditingTitle(false)}
                    className="w-full"
                  >
                    Done
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </h1>
          <Popover open={isEditingCorporate} onOpenChange={setIsEditingCorporate}>
            <PopoverTrigger asChild>
              <p className="text-sm cursor-pointer hover:bg-gray-100 inline-block px-2">
                {corporateType}
              </p>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <label className="text-sm font-medium">Corporate Type</label>
                <Input
                  value={corporateType}
                  onChange={(e) => setCorporateType(e.target.value)}
                  placeholder="Enter corporate type"
                />
                <Button
                  size="sm"
                  onClick={() => setIsEditingCorporate(false)}
                  className="w-full"
                >
                  Done
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Date at top right */}
        <div className="text-right text-xs mb-3">
          <span className="font-medium">DATE:- {new Date().toLocaleDateString('en-GB')}</span>
        </div>

        {/* Patient Details - EXACT format from image */}
        <div className="mb-3 text-xs space-y-0.5">
          <div>
            <span className="inline-block w-48">BILL NO</span>
            <span>: {billNo}</span>
          </div>
          <div>
            <span className="inline-block w-48">NAME OF PATIENT</span>
            <span>: {patientData.patient_name}</span>
          </div>
          <div>
            <span className="inline-block w-48">ADDRESS</span>
            <span>: {patientData.address}</span>
          </div>
          <div className="h-2"></div>
          <div>
            <span className="inline-block w-48">AGE</span>
            <span>: {patientData.age} Yrs.</span>
          </div>
          <div>
            <span className="inline-block w-48">SEX</span>
            <span>: {patientData.sex}</span>
          </div>
          <div>
            <span className="inline-block w-48">DIAGNOSIS</span>
            <span>: {patientData.diagnosis}</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-48">DATE OF OPD</span>
            <span>: </span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="h-auto p-0 font-normal hover:bg-transparent no-print">
                  <span className="underline decoration-dotted">
                    {new Date(patientData.opd_date).toLocaleDateString('en-GB').replace(/\//g, '-')}
                  </span>
                  <CalendarIcon className="ml-1 h-3 w-3 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={new Date(patientData.opd_date)}
                  onSelect={(date) => date && updateOpdDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <span className="print-only">{new Date(patientData.opd_date).toLocaleDateString('en-GB').replace(/\//g, '-')}</span>
          </div>
        </div>

        {/* Items Table - EXACT format */}
        <table className="w-full border border-gray-400 text-xs" style={{ backgroundColor: '#f5f5f5' }}>
          <thead>
            <tr className="border-b border-gray-400">
              <th className="border-r border-gray-400 p-1.5 text-left font-medium w-12">SR.<br />NO.</th>
              <th className="border-r border-gray-400 p-1.5 text-left font-medium">ITEM</th>
              <th className="border-r border-gray-400 p-1.5 text-center font-medium w-24">CGHS<br />NABH<br />CODE No.</th>
              <th className="border-r border-gray-400 p-1.5 text-center font-medium w-24">CGHS<br />NABH<br />RATE</th>
              <th className="border-r border-gray-400 p-1.5 text-center font-medium w-16">QTY</th>
              <th className="border-r border-gray-400 p-1.5 text-right font-medium w-24">AMOUNT</th>
              <th className="p-1.5 text-center font-medium w-16 no-print">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* DATE OF OPD Row */}
            <tr className="border-b border-gray-400">
              <td colSpan={7} className="p-1.5 font-medium">
                DATE OF OPD
              </td>
            </tr>

            {/* Date Range Row */}
            <tr className="border-b border-gray-400">
              <td colSpan={7} className="p-1.5">
                <span className="no-print">
                  DL (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" className="h-auto p-0 font-normal hover:bg-transparent">
                        <span className="underline decoration-dotted">
                          {new Date(startDate).toLocaleDateString('en-GB')}
                        </span>
                        <CalendarIcon className="ml-1 h-3 w-3 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={new Date(startDate)}
                        onSelect={(date) => date && updateDateRange(date, undefined)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {' '}to{' '}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" className="h-auto p-0 font-normal hover:bg-transparent">
                        <span className="underline decoration-dotted">
                          {new Date(endDate).toLocaleDateString('en-GB')}
                        </span>
                        <CalendarIcon className="ml-1 h-3 w-3 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={new Date(endDate)}
                        onSelect={(date) => date && updateDateRange(undefined, date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  )
                </span>
                <span className="print-only">
                  DL ({new Date(startDate).toLocaleDateString('en-GB')} to {new Date(endDate).toLocaleDateString('en-GB')})
                </span>
              </td>
            </tr>

            {/* Item Rows */}
            {items.map((item, index) => (
              <tr key={item.id} className="border-b border-gray-400">
                <td className="border-r border-gray-400 p-1.5 text-center font-medium">{index + 1}</td>
                <td className="border-r border-gray-400 p-0.5">
                  <Input
                    value={item.item_name}
                    onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                    className="border-0 bg-transparent h-auto p-1 text-xs no-print"
                  />
                  <span className="print-only">{item.item_name}</span>
                </td>
                <td className="border-r border-gray-400 p-0.5 text-center">
                  <Input
                    value={item.cghs_code}
                    onChange={(e) => updateItem(index, 'cghs_code', e.target.value)}
                    className="border-0 bg-transparent h-auto p-1 text-xs text-center no-print"
                  />
                  <span className="print-only">{item.cghs_code}</span>
                </td>
                <td className="border-r border-gray-400 p-0.5 text-center">
                  <Input
                    type="number"
                    value={item.cghs_rate}
                    onChange={(e) => updateItem(index, 'cghs_rate', parseFloat(e.target.value) || 0)}
                    className="border-0 bg-transparent h-auto p-1 text-xs text-center no-print"
                  />
                  <span className="print-only">{item.cghs_rate}</span>
                </td>
                <td className="border-r border-gray-400 p-0.5 text-center">
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    className="border-0 bg-transparent h-auto p-1 text-xs text-center no-print"
                  />
                  <span className="print-only">{item.quantity}</span>
                </td>
                <td className="border-r border-gray-400 p-1.5 text-right font-medium">{item.amount.toFixed(2)}</td>
                <td className="p-1.5 text-center no-print">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addNewRow}
                    className="h-6 w-6 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}

            {/* Total Row */}
            <tr>
              <td colSpan={5} className="p-2 text-center font-bold text-sm">
                TOTAL BILL AMOUNT
              </td>
              <td className="p-2 text-right font-bold text-base" colSpan={2}>
                {calculateTotal().toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Print Styles */}
      <style>{`
        .print-only {
          display: none;
        }
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: inline !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            font-size: 12px;
          }
          @page {
            margin: 0.5in;
            size: A4;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }
          table, th, td {
            border: 1px solid #999 !important;
            page-break-inside: avoid;
          }
          th, td {
            padding: 6px !important;
            vertical-align: middle;
          }
          th {
            font-weight: 600;
            text-align: center;
          }
          /* SR NO column */
          tbody tr td:nth-child(1) {
            text-align: center;
            font-weight: 500;
          }
          /* ITEM column */
          tbody tr td:nth-child(2) {
            text-align: left;
            padding-left: 8px !important;
          }
          /* CGHS CODE column */
          tbody tr td:nth-child(3) {
            text-align: center;
          }
          /* CGHS RATE column */
          tbody tr td:nth-child(4) {
            text-align: center;
          }
          /* QTY column */
          tbody tr td:nth-child(5) {
            text-align: center;
          }
          /* AMOUNT column */
          tbody tr td:nth-child(6) {
            text-align: right;
            padding-right: 8px !important;
            font-weight: 500;
          }
          input {
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PhysiotherapyBill;
