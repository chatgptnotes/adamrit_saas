// Direct Sales Bill Component
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Calendar, Trash2, Printer, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface MedicineRow {
  id: string;
  itemCode: string;
  itemName: string;
  quantity: string;
  quantityUnit: string;
  pack: string;
  batchNo: string;
  stock: string;
  expiryDate: string;
  mrp: string;
  price: string;
  amount: string;
}

interface CompletedBill {
  billNumber: string;
  billDate: string;
  patientName: string;
  totalAmount: number;
  paymentMode: string;
  medicines: MedicineRow[];
}

const DirectSaleBill: React.FC = () => {
  const { toast } = useToast();
  const { hospitalConfig } = useAuth();
  const [forHopeEmployee, setForHopeEmployee] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [totalAmount, setTotalAmount] = useState('Rs');
  const [netAmount, setNetAmount] = useState('Rs');
  const [completedBill, setCompletedBill] = useState<CompletedBill | null>(null);

  const [medicines, setMedicines] = useState<MedicineRow[]>([
    {
      id: '1',
      itemCode: '',
      itemName: '',
      quantity: '',
      quantityUnit: 'MSU',
      pack: '',
      batchNo: '',
      stock: '',
      expiryDate: '',
      mrp: '',
      price: '',
      amount: ''
    }
  ]);

  const addNewRow = () => {
    const newRow: MedicineRow = {
      id: Date.now().toString(),
      itemCode: '',
      itemName: '',
      quantity: '',
      quantityUnit: 'MSU',
      pack: '',
      batchNo: '',
      stock: '',
      expiryDate: '',
      mrp: '',
      price: '',
      amount: ''
    };
    setMedicines([...medicines, newRow]);
  };

  const removeRow = (id: string) => {
    if (medicines.length > 1) {
      setMedicines(medicines.filter(m => m.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof MedicineRow, value: string) => {
    setMedicines(medicines.map(m => {
      if (m.id === id) {
        const updated = { ...m, [field]: value };

        // Calculate amount when quantity or price changes
        if (field === 'quantity' || field === 'price') {
          const qty = parseFloat(field === 'quantity' ? value : updated.quantity) || 0;
          const price = parseFloat(field === 'price' ? value : updated.price) || 0;
          updated.amount = (qty * price).toFixed(2);
        }

        return updated;
      }
      return m;
    }));
  };

  // Calculate totals whenever medicines change
  React.useEffect(() => {
    const total = medicines.reduce((sum, med) => {
      return sum + (parseFloat(med.amount) || 0);
    }, 0);
    setTotalAmount(`Rs ${total.toFixed(2)}`);
    setNetAmount(`Rs ${total.toFixed(2)}`);
  }, [medicines]);

  const handleSubmit = async () => {
    // Validate required fields
    if (!patientName) {
      toast({
        title: "Error",
        description: "Please enter patient name",
        variant: "destructive"
      });
      return;
    }

    if (!doctorName) {
      toast({
        title: "Error",
        description: "Please enter doctor name",
        variant: "destructive"
      });
      return;
    }

    const hasValidMedicine = medicines.some(m => m.itemName && m.quantity);
    if (!hasValidMedicine) {
      toast({
        title: "Error",
        description: "Please add at least one medicine",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Generate bill number (format: DSB-YYYY-NNNN)
      const year = new Date().getFullYear();
      const { data: lastBill } = await supabase
        .from('direct_sale_bills')
        .select('bill_number')
        .like('bill_number', `DSB-${year}-%`)
        .order('bill_number', { ascending: false })
        .limit(1);

      let billNumber = `DSB-${year}-0001`;
      if (lastBill && lastBill.length > 0) {
        const lastNumber = parseInt(lastBill[0].bill_number.split('-')[2]);
        billNumber = `DSB-${year}-${String(lastNumber + 1).padStart(4, '0')}`;
      }

      // Calculate total from medicines
      const total = medicines.reduce((sum, med) => sum + (parseFloat(med.amount) || 0), 0);

      // Insert one row per medicine (combined bill + item data)
      const validMedicines = medicines.filter(m => m.itemName && m.quantity);
      const billRows = validMedicines.map(med => ({
        bill_number: billNumber,
        is_hope_employee: forHopeEmployee,
        patient_name: patientName,
        date_of_birth: dateOfBirth || null,
        age: age ? parseInt(age) : null,
        gender: gender || null,
        address: address || null,
        doctor_name: doctorName,
        payment_mode: paymentMode,
        total_amount: total,
        net_amount: total,
        item_code: med.itemCode || null,
        item_name: med.itemName,
        quantity: parseFloat(med.quantity),
        quantity_unit: med.quantityUnit,
        pack: med.pack || null,
        batch_no: med.batchNo || null,
        stock: med.stock || null,
        expiry_date: med.expiryDate || null,
        mrp: med.mrp ? parseFloat(med.mrp) : null,
        price: parseFloat(med.price),
        amount: parseFloat(med.amount),
        created_by: user?.email || 'system'
      }));

      const { error: insertError } = await supabase
        .from('direct_sale_bills')
        .insert(billRows);

      if (insertError) throw insertError;

      // Set completed bill for dialog
      setCompletedBill({
        billNumber: billNumber,
        billDate: new Date().toISOString(),
        patientName: patientName,
        totalAmount: total,
        paymentMode: paymentMode,
        medicines: validMedicines
      });

      toast({
        title: "Success",
        description: `Direct sale bill ${billNumber} created successfully`
      });

      // Reset form
      setForHopeEmployee(false);
      setPatientName('');
      setDateOfBirth('');
      setAge('');
      setGender('');
      setAddress('');
      setDoctorName('');
      setPaymentMode('Cash');
      setMedicines([{
        id: '1',
        itemCode: '',
        itemName: '',
        quantity: '',
        quantityUnit: 'MSU',
        pack: '',
        batchNo: '',
        stock: '',
        expiryDate: '',
        mrp: '',
        price: '',
        amount: ''
      }]);

    } catch (error: any) {
      console.error('Error saving direct sale bill:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create direct sale bill",
        variant: "destructive"
      });
    }
  };

  const handleBack = () => {
    // Navigate back
    window.history.back();
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);

  const printReceipt = () => {
    if (!completedBill) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Direct Sale Bill - ${completedBill.billNumber}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .header p {
            margin: 5px 0;
            font-size: 12px;
          }
          .bill-info {
            margin: 20px 0;
          }
          .bill-info table {
            width: 100%;
          }
          .bill-info td {
            padding: 5px 0;
          }
          .bill-info td:first-child {
            font-weight: bold;
            width: 150px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .items-table th,
          .items-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }
          .items-table th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .items-table td:last-child,
          .items-table th:last-child {
            text-align: right;
          }
          .totals {
            margin-top: 20px;
            float: right;
            width: 300px;
          }
          .totals table {
            width: 100%;
          }
          .totals td {
            padding: 5px 0;
          }
          .totals td:first-child {
            text-align: left;
          }
          .totals td:last-child {
            text-align: right;
          }
          .totals .grand-total {
            font-size: 18px;
            font-weight: bold;
            border-top: 2px solid #000;
            padding-top: 10px;
          }
          .footer {
            clear: both;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #000;
            text-align: center;
            font-size: 12px;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${hospitalConfig?.name || 'Hospital Pharmacy'}</h1>
          <p>Direct Sales Bill</p>
          <p>${hospitalConfig?.address || ''}</p>
        </div>

        <div class="bill-info">
          <table>
            <tr>
              <td>Bill Number:</td>
              <td>${completedBill.billNumber}</td>
            </tr>
            <tr>
              <td>Date & Time:</td>
              <td>${new Date(completedBill.billDate).toLocaleString()}</td>
            </tr>
            <tr>
              <td>Patient Name:</td>
              <td>${completedBill.patientName}</td>
            </tr>
            <tr>
              <td>Payment Mode:</td>
              <td>${completedBill.paymentMode}</td>
            </tr>
          </table>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Batch No.</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${completedBill.medicines.map(item => `
              <tr>
                <td>${item.itemName}</td>
                <td>${item.batchNo || 'N/A'}</td>
                <td>${item.quantity} ${item.quantityUnit}</td>
                <td>${formatCurrency(parseFloat(item.price) || 0)}</td>
                <td>${formatCurrency(parseFloat(item.amount) || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <table>
            <tr class="grand-total">
              <td>TOTAL:</td>
              <td>${formatCurrency(completedBill.totalAmount)}</td>
            </tr>
            <tr>
              <td>Payment Mode:</td>
              <td>${completedBill.paymentMode}</td>
            </tr>
          </table>
        </div>

        <div class="footer">
          <p>Thank you for your purchase!</p>
          <p>For any queries, please contact the pharmacy</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 p-6 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <h1 className="text-2xl font-bold text-blue-600">Direct Sales Bill</h1>
        <Button onClick={handleBack} variant="default" className="bg-blue-600">
          Back
        </Button>
      </div>

      {/* Patient Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={forHopeEmployee}
            onCheckedChange={(checked) => setForHopeEmployee(checked as boolean)}
            id="hopeEmployee"
          />
          <label htmlFor="hopeEmployee" className="text-sm font-medium">
            For Hope Employee
          </label>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium">
              Name<span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Type To Search"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Date of Birth:</label>
            <div className="relative">
              <Input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Age:</label>
            <Input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Age"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Gender:</label>
            <select
              className="w-full p-2 border rounded"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Address:</label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter address"
            />
          </div>
          <div>
            <label className="text-sm font-medium">
              Doctor Name:<span className="text-red-500">*</span>
            </label>
            <Input
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="Enter doctor name"
            />
          </div>
        </div>
      </div>

      {/* Medicine Table */}
      <div className="border rounded">
        <div className="bg-gray-100 p-2">
          <p className="text-sm text-red-500">(MSU = Minimum Saleable Unit)</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-600">
              <TableRow>
                <TableHead className="text-white">Item Code</TableHead>
                <TableHead className="text-white">
                  Item Name<span className="text-red-500">*</span>
                </TableHead>
                <TableHead className="text-white">
                  Quantity<span className="text-red-500">*</span>
                </TableHead>
                <TableHead className="text-white">Pack</TableHead>
                <TableHead className="text-white">
                  Batch No.<span className="text-red-500">*</span>
                </TableHead>
                <TableHead className="text-white">Stock</TableHead>
                <TableHead className="text-white">
                  Expiry Date<span className="text-red-500">*</span>
                </TableHead>
                <TableHead className="text-white">
                  MRP<span className="text-red-500">*</span>
                </TableHead>
                <TableHead className="text-white">
                  Price<span className="text-red-500">*</span>
                </TableHead>
                <TableHead className="text-white">Amount</TableHead>
                <TableHead className="text-white">#</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medicines.map((medicine) => (
                <TableRow key={medicine.id}>
                  <TableCell>
                    <Input
                      className="w-24"
                      value={medicine.itemCode}
                      onChange={(e) => updateRow(medicine.id, 'itemCode', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-48"
                      placeholder="Type To Search"
                      value={medicine.itemName}
                      onChange={(e) => updateRow(medicine.id, 'itemName', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input
                        className="w-20"
                        type="number"
                        value={medicine.quantity}
                        onChange={(e) => updateRow(medicine.id, 'quantity', e.target.value)}
                      />
                      <select
                        className="p-1 border rounded text-sm"
                        value={medicine.quantityUnit}
                        onChange={(e) => updateRow(medicine.id, 'quantityUnit', e.target.value)}
                      >
                        <option value="MSU">MSU</option>
                        <option value="Pack">Pack</option>
                      </select>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-24"
                      value={medicine.pack}
                      onChange={(e) => updateRow(medicine.id, 'pack', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <select
                      className="w-32 p-2 border rounded"
                      value={medicine.batchNo}
                      onChange={(e) => updateRow(medicine.id, 'batchNo', e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="BATCH-001">BATCH-001</option>
                      <option value="BATCH-002">BATCH-002</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-24"
                      value={medicine.stock}
                      onChange={(e) => updateRow(medicine.id, 'stock', e.target.value)}
                      readOnly
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-32"
                      type="date"
                      value={medicine.expiryDate}
                      onChange={(e) => updateRow(medicine.id, 'expiryDate', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-24"
                      type="number"
                      value={medicine.mrp}
                      onChange={(e) => updateRow(medicine.id, 'mrp', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-24"
                      type="number"
                      value={medicine.price}
                      onChange={(e) => updateRow(medicine.id, 'price', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-24"
                      value={medicine.amount}
                      readOnly
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeRow(medicine.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="p-4">
          <Button onClick={addNewRow} variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
            Add More
          </Button>
        </div>
      </div>

      {/* Payment and Total */}
      <div className="grid grid-cols-2 gap-8">
        <div>
          <label className="text-sm font-medium">
            Payment Mode:<span className="text-red-500">*</span>
          </label>
          <select
            className="w-48 p-2 border rounded"
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
          >
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="UPI">UPI</option>
            <option value="Insurance">Insurance</option>
          </select>
        </div>
        <div className="text-right space-y-2">
          <div>
            <span className="font-medium">Total Amt :</span>
            <span className="ml-2">{totalAmount}</span>
          </div>
          <div>
            <span className="font-medium">Net Amt :</span>
            <span className="ml-2">{netAmount}</span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleSubmit}
          className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Submit
        </Button>
      </div>

      {/* Success Dialog with Print */}
      <Dialog open={!!completedBill} onOpenChange={() => setCompletedBill(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center text-green-600">
              <CheckCircle className="h-8 w-8 mx-auto mb-2" />
              Bill Created Successfully!
            </DialogTitle>
          </DialogHeader>
          {completedBill && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{completedBill.billNumber}</div>
                <div className="text-muted-foreground">
                  {new Date(completedBill.billDate).toLocaleString()}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Patient Name:</span>
                  <span className="font-medium">{completedBill.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-bold">{formatCurrency(completedBill.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span>{completedBill.paymentMode}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={printReceipt}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setCompletedBill(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DirectSaleBill;
