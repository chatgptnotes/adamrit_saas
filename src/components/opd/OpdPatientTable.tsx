import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Check, Eye, FileText, UserCheck, Trash2, DollarSign, MessageSquare } from 'lucide-react';
import { VisitRegistrationForm } from '@/components/VisitRegistrationForm';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from 'use-debounce';

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
  admit_to_hospital?: boolean;
  payment_received?: boolean;
  status?: string;
  comments?: string;
}

interface OpdPatientTableProps {
  patients: Patient[];
}

export const OpdPatientTable = ({ patients }: OpdPatientTableProps) => {
  const navigate = useNavigate();
  const [selectedPatientForVisit, setSelectedPatientForVisit] = useState<Patient | null>(null);
  const [isVisitFormOpen, setIsVisitFormOpen] = useState(false);
  const [hiddenPatients, setHiddenPatients] = useState<Set<string>>(new Set());
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedPatientForView, setSelectedPatientForView] = useState<Patient | null>(null);

  // Comment state management
  const [commentDialogs, setCommentDialogs] = useState<Record<string, boolean>>({});
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [originalComments, setOriginalComments] = useState<Record<string, string>>({});
  const [savingComments, setSavingComments] = useState<Record<string, boolean>>({});
  const [savedComments, setSavedComments] = useState<Record<string, boolean>>({});

  // Comment handlers
  const handleCommentClick = (patient: Patient) => {
    const existingComment = patient.comments || '';

    // Load existing comment if any
    setCommentTexts(prev => ({
      ...prev,
      [patient.visit_id!]: existingComment
    }));

    // Store original comment to track changes
    setOriginalComments(prev => ({
      ...prev,
      [patient.visit_id!]: existingComment
    }));

    // Open dialog for this visit
    setCommentDialogs(prev => ({
      ...prev,
      [patient.visit_id!]: true
    }));
  };

  const handleCommentChange = (visitId: string, text: string) => {
    setCommentTexts(prev => ({
      ...prev,
      [visitId]: text
    }));
  };

  // Debounced function to auto-save comments
  const [debouncedCommentTexts] = useDebounce(commentTexts, 1500); // 1.5 seconds delay

  // Auto-save comments when debounced value changes
  useEffect(() => {
    Object.entries(debouncedCommentTexts).forEach(async ([visitId, text]) => {
      // Only save if dialog is open and text has actually changed from original
      const originalText = originalComments[visitId] || '';
      const hasChanged = text !== originalText;

      if (commentDialogs[visitId] && text !== undefined && hasChanged) {
        console.log('🔄 Attempting to save comment for visit:', visitId, 'Text:', text, 'Original:', originalText);
        setSavingComments(prev => ({ ...prev, [visitId]: true }));

        try {
          const { error, data } = await supabase
            .from('visits')
            .update({ comments: text })
            .eq('visit_id', visitId)
            .select();

          if (error) {
            console.error('❌ Error saving comment:', error);
            console.error('Error details:', {
              visitId,
              text,
              errorMessage: error.message,
              errorCode: error.code
            });
            alert(`Failed to save comment: ${error.message}`);
            setSavingComments(prev => ({ ...prev, [visitId]: false }));
          } else {
            console.log('✅ Comment saved successfully for visit:', visitId, 'Response:', data);
            // Update the original comment after successful save
            setOriginalComments(prev => ({ ...prev, [visitId]: text }));
            // Show saved indicator
            setSavingComments(prev => ({ ...prev, [visitId]: false }));
            setSavedComments(prev => ({ ...prev, [visitId]: true }));
            // Hide saved indicator after 2 seconds
            setTimeout(() => {
              setSavedComments(prev => ({ ...prev, [visitId]: false }));
            }, 2000);
          }
        } catch (error) {
          console.error('❌ Exception while saving comment:', error);
          setSavingComments(prev => ({ ...prev, [visitId]: false }));
        }
      }
    });
  }, [debouncedCommentTexts, commentDialogs, originalComments]);

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) {
      console.log('Date of birth is missing for patient');
      return null;
    }

    try {
      const birthDate = new Date(dateOfBirth);

      // Check if date is valid
      if (isNaN(birthDate.getTime())) {
        console.log('Invalid date of birth:', dateOfBirth);
        return null;
      }

      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return age - 1;
      }
      return age;
    } catch (error) {
      console.error('Error calculating age:', error);
      return null;
    }
  };

  const handleVisitIdClick = (patientId: string | undefined, visitId: string | undefined) => {
    if (patientId && visitId) {
      navigate(`/patient-profile?patient=${patientId}&visit=${visitId}`);
    } else {
      console.log('Missing required IDs for navigation');
    }
  };

  const handleViewClick = (patient: Patient) => {
    // Open view dialog to show visit registration information
    setSelectedPatientForView(patient);
    setViewDialogOpen(true);
  };

  const handleEditClick = (patient: Patient) => {
    // Open Visit Registration Form with existing patient/visit data for editing
    setSelectedPatientForVisit({ ...patient, isEditMode: true });
    setIsVisitFormOpen(true);
  };

  const handleBillClick = (patient: Patient) => {
    if (patient.visit_id) {
      navigate(`/final-bill/${patient.visit_id}`);
    }
  };

  const handleDeleteClick = async (patient: Patient) => {
    if (patient.visit_id && window.confirm(`Are you sure you want to remove ${patient.patients?.name} from this view?`)) {
      // Just hide from current view, don't delete from database
      setHiddenPatients(prev => {
        const newSet = new Set(prev);
        newSet.add(patient.visit_id!);
        return newSet;
      });
      console.log('Patient hidden from view:', patient.visit_id);
    }
  };

  const handleRegisterVisitClick = (patient: Patient) => {
    setSelectedPatientForVisit({ ...patient, isEditMode: false });
    setIsVisitFormOpen(true);
  };

  const handleVisitFormClose = () => {
    setIsVisitFormOpen(false);
    setSelectedPatientForVisit(null);
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
          <DollarSign className="h-4 w-4 text-green-600" />
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
          <DollarSign className="h-4 w-4 text-red-600" />
        </Button>
      );
    }

    // Default state - show green dollar (same as IPD)
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => handleBillClick(patient)}
        title="View Bill"
      >
        <DollarSign className="h-4 w-4 text-green-600" />
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
            <TableHead className="font-medium">Visit ID</TableHead>
            <TableHead className="font-medium">Patient Name</TableHead>
            <TableHead className="font-medium">Gender/Age</TableHead>
            <TableHead className="font-medium">Visit Type</TableHead>
            <TableHead className="font-medium">Doctor</TableHead>
            <TableHead className="font-medium">Diagnosis</TableHead>
            <TableHead className="font-medium">Corporate</TableHead>
            <TableHead className="text-center font-medium">Payment Received</TableHead>
            <TableHead className="text-center font-medium">Admit To Hospital</TableHead>
            <TableHead className="text-center font-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients
            .filter(patient => !hiddenPatients.has(patient.visit_id || ''))
            .map((patient) => (
            <TableRow key={patient.id}>
              <TableCell className="font-mono text-sm">
                <button
                  onClick={() => handleVisitIdClick(patient.patient_id || patient.patients?.id, patient.visit_id)}
                  className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
                >
                  {patient.visit_id || 'N/A'}
                </button>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{patient.patients?.name || 'Unknown'}</div>
                  <div className="text-xs text-muted-foreground">
                    {patient.patients?.patients_id || 'No ID'}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {(() => {
                  const gender = patient.patients?.gender || 'Unknown';

                  // First try to use the age field from database
                  if (patient.patients?.age !== undefined && patient.patients?.age !== null) {
                    return `${gender}/${patient.patients.age} Years`;
                  }

                  // Fallback to calculating from date_of_birth
                  const calculatedAge = calculateAge(patient.patients?.date_of_birth);
                  if (calculatedAge !== null) {
                    return `${gender}/${calculatedAge} Years`;
                  }

                  return `${gender}/Age N/A`;
                })()}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {patient.visit_type || 'General'}
                </Badge>
              </TableCell>
              <TableCell>
                {patient.appointment_with || 'Not Assigned'}
              </TableCell>
              <TableCell>
                {patient.diagnosis || 'General'}
              </TableCell>
              <TableCell>
                {patient.patients?.corporate || '-'}
              </TableCell>
              <TableCell className="text-center">
                {renderPaymentStatus(patient)}
              </TableCell>
              <TableCell className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleRegisterVisitClick(patient)}
                  title="Register Visit"
                >
                  <UserCheck className="h-4 w-4 text-blue-600" />
                </Button>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleViewClick(patient)}
                    title="View Patient"
                  >
                    <Eye className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleEditClick(patient)}
                    title="Edit Patient"
                  >
                    <FileText className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleCommentClick(patient)}
                    title="View/Add Comments"
                  >
                    <MessageSquare className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleDeleteClick(patient)}
                    title="Delete Visit"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* View Visit Dialog - Shows visit registration information in read-only format */}
      {selectedPatientForView && (
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-blue-600">
                Visit Information
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Patient Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Patient Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Name:</span> {selectedPatientForView.patients?.name || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Patient ID:</span> {selectedPatientForView.patients?.patients_id || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Gender:</span> {selectedPatientForView.patients?.gender || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Age:</span> {selectedPatientForView.patients?.age || 'N/A'} years
                  </div>
                </div>
              </div>

              {/* Visit Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-700 mb-2">Visit Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Visit ID:</span> <span className="text-blue-600 font-mono">{selectedPatientForView.visit_id}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Visit Date:</span> {selectedPatientForView.visit_date ? new Date(selectedPatientForView.visit_date).toLocaleDateString() : 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Visit Type:</span> {selectedPatientForView.visit_type || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Patient Type:</span> <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">{selectedPatientForView.patient_type || 'OPD'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-gray-600">Doctor/Appointment With:</span> {selectedPatientForView.appointment_with || 'Not specified'}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-gray-600">Reason for Visit:</span> {selectedPatientForView.reason_for_visit || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-700 mb-2">Additional Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      selectedPatientForView.status === 'completed' ? 'bg-green-100 text-green-700' :
                      selectedPatientForView.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                      selectedPatientForView.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedPatientForView.status || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Diagnosis:</span> {selectedPatientForView.diagnosis || 'General'}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Relation with Employee:</span> {selectedPatientForView.relation_with_employee || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Claim ID:</span> {selectedPatientForView.claim_id || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Referring Doctor:</span> {selectedPatientForView.referring_doctor || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Record Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Created At:</span> {selectedPatientForView.created_at ? new Date(selectedPatientForView.created_at).toLocaleString() : 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Updated At:</span> {selectedPatientForView.updated_at ? new Date(selectedPatientForView.updated_at).toLocaleString() : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewDialogOpen(false);
                    setSelectedPatientForView(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Visit Registration Form Dialog - Used for both Register Visit and Edit */}
      {selectedPatientForVisit && (
        <VisitRegistrationForm
          isOpen={isVisitFormOpen}
          onClose={handleVisitFormClose}
          patient={{
            id: selectedPatientForVisit.patient_id || selectedPatientForVisit.patients?.id || '',
            name: selectedPatientForVisit.patients?.name || 'Unknown',
            patients_id: selectedPatientForVisit.patients?.patients_id
          }}
          existingVisit={selectedPatientForVisit.isEditMode ? selectedPatientForVisit : undefined}  // Pass visit data only when editing
          editMode={selectedPatientForVisit.isEditMode || false}  // Set edit mode based on action
        />
      )}

      {/* Comment Dialogs */}
      {patients.map((patient) => (
        <Dialog
          key={patient.visit_id}
          open={commentDialogs[patient.visit_id || ''] || false}
          onOpenChange={(open) => {
            setCommentDialogs(prev => ({
              ...prev,
              [patient.visit_id!]: open
            }));
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Comments for {patient.patients?.name || 'Patient'}</DialogTitle>
              <DialogDescription className="text-xs">
                Visit ID: {patient.visit_id} | Auto-saves as you type
              </DialogDescription>
            </DialogHeader>

            <div className="relative">
              <textarea
                className="w-full min-h-[150px] p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-vertical"
                placeholder="Add your comments here..."
                value={commentTexts[patient.visit_id || ''] || ''}
                onChange={(e) => handleCommentChange(patient.visit_id || '', e.target.value)}
              />

              {/* Save indicators */}
              {savingComments[patient.visit_id || ''] && (
                <div className="absolute bottom-2 right-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                  Saving...
                </div>
              )}
              {savedComments[patient.visit_id || ''] && !savingComments[patient.visit_id || ''] && (
                <div className="absolute bottom-2 right-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                  ✓ Saved
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
};