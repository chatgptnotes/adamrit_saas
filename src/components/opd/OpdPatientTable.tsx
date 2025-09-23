import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { TaskSelector } from './TaskSelector';
import { X, Check, DollarSign } from 'lucide-react';

interface Patient {
  id: string;
  visit_id?: string;
  patients?: {
    id: string;
    name: string;
    gender?: string;
    date_of_birth?: string;
    patients_id?: string;
  };
  token_number?: string | number;
  admit_to_hospital?: boolean;
  payment_received?: boolean;
  followup_scheduled?: boolean;
  soap_notes?: boolean;
  initial_assessment?: boolean;
  selected_task?: string;
  status?: string;
}

interface OpdPatientTableProps {
  patients: Patient[];
}

export const OpdPatientTable = ({ patients }: OpdPatientTableProps) => {
  const navigate = useNavigate();
  const [selectedTasks, setSelectedTasks] = useState<Record<string, string>>({});

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return 'N/A';
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  };

  const handleTaskSelect = (patientId: string, task: string) => {
    setSelectedTasks({ ...selectedTasks, [patientId]: task });
  };

  const handleBillClick = (patient: Patient) => {
    if (patient.visit_id) {
      navigate(`/final-bill/${patient.visit_id}`);
    }
  };

  const renderStatusIcon = (status?: boolean) => {
    if (status === true) {
      return <Check className="h-5 w-5 text-green-600" />;
    } else if (status === false) {
      return <X className="h-5 w-5 text-red-600" />;
    }
    return <X className="h-5 w-5 text-red-600" />;
  };

  const renderPaymentStatus = (patient: Patient) => {
    const paymentReceived = patient.payment_received;

    if (paymentReceived === true) {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => handleBillClick(patient)}
          title="Payment Received - View Bill"
        >
          <DollarSign className="h-5 w-5 text-green-600" />
        </Button>
      );
    } else if (paymentReceived === false) {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => handleBillClick(patient)}
          title="Payment Pending - View Bill"
        >
          <DollarSign className="h-5 w-5 text-red-600" />
        </Button>
      );
    }

    // Default state - no payment info
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => handleBillClick(patient)}
        title="View Bill"
      >
        <DollarSign className="h-5 w-5 text-green-600" />
      </Button>
    );
  };

  if (patients.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No OPD patients found for today
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-medium">Patient Name</TableHead>
            <TableHead className="font-medium">Gender/Age</TableHead>
            <TableHead className="text-center font-medium">Admit To Hospital</TableHead>
            <TableHead className="text-center font-medium">Payment Received</TableHead>
            <TableHead className="text-center font-medium">Followup Schedule</TableHead>
            <TableHead className="text-center font-medium">Soap Notes</TableHead>
            <TableHead className="text-center font-medium">Initial Assessment</TableHead>
            <TableHead className="text-center font-medium">Token No</TableHead>
            <TableHead className="font-medium">Task</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => (
            <TableRow key={patient.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{patient.patients?.name || 'Unknown'}</div>
                  <div className="text-xs text-muted-foreground">
                    {patient.patients?.patients_id || 'No ID'}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {patient.patients?.gender || 'N/A'}/{calculateAge(patient.patients?.date_of_birth)} Years
              </TableCell>
              <TableCell className="text-center">
                {renderStatusIcon(patient.admit_to_hospital)}
              </TableCell>
              <TableCell className="text-center">
                {renderPaymentStatus(patient)}
              </TableCell>
              <TableCell className="text-center">
                {renderStatusIcon(patient.followup_scheduled)}
              </TableCell>
              <TableCell className="text-center">
                {renderStatusIcon(patient.soap_notes)}
              </TableCell>
              <TableCell className="text-center">
                {renderStatusIcon(patient.initial_assessment)}
              </TableCell>
              <TableCell className="text-center">
                <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                  Token {patient.token_number || 'N/A'}
                </span>
              </TableCell>
              <TableCell>
                <TaskSelector
                  value={selectedTasks[patient.id] || ''}
                  onValueChange={(value) => handleTaskSelect(patient.id, value)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};