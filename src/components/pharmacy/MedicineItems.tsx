// Medicine Items Management Component
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  Package,
  Edit,
  Trash2,
  Download,
  Upload
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Medicine {
  id: string;
  name: string;
  generic_name?: string;
  item_code?: string;
  barcode?: string;
  therapeutic_category?: string;
  manufacturer?: string;
  strength?: string;
  dosage_form?: string;
  price_per_strip?: string;
  stock?: string;
  exp_date?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

const MedicineItems: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchMedicines = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('medication')
      .select('*')
      .order('name');
    if (error) {
      console.error('Error fetching medicines:', error);
      toast({
        title: "Error",
        description: "Failed to fetch medicines",
        variant: "destructive"
      });
      setMedicines([]);
    } else {
      setMedicines(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }

    const { error } = await supabase
      .from('medication')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting medicine:', error);
      toast({
        title: "Error",
        description: "Failed to delete medicine",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Medicine deleted successfully"
      });
      fetchMedicines();
    }
  };

  const handleEdit = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setIsEditDialogOpen(true);
  };

  const filteredMedicines = medicines.filter(medicine => {
    const searchLower = searchTerm.toLowerCase();
    return medicine.name?.toLowerCase().includes(searchLower) ||
           medicine.generic_name?.toLowerCase().includes(searchLower) ||
           medicine.item_code?.toLowerCase().includes(searchLower) ||
           medicine.manufacturer?.toLowerCase().includes(searchLower);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Medicine Items</h2>
            <p className="text-sm text-muted-foreground">
              Manage medicine items - Add, Edit, and Delete medicines
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Medicine
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Medicine</DialogTitle>
              </DialogHeader>
              <AddMedicineForm
                onSuccess={() => {
                  setIsAddDialogOpen(false);
                  fetchMedicines();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Card */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Medicines</p>
              <p className="text-2xl font-bold">{medicines.length}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search medicines by name, code, or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Medicines Table */}
      <Card>
        <CardHeader>
          <CardTitle>Medicines ({filteredMedicines.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine Name</TableHead>
                  <TableHead>Generic Name</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Strength</TableHead>
                  <TableHead>Dosage Form</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading medicines...
                    </TableCell>
                  </TableRow>
                ) : filteredMedicines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {searchTerm
                            ? 'No medicines found matching your search.'
                            : 'No medicines added yet. Click "Add Medicine" to get started.'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMedicines.map((medicine) => {
                    return (
                      <TableRow key={medicine.id}>
                        <TableCell className="font-medium">{medicine.name}</TableCell>
                        <TableCell>{medicine.generic_name || 'N/A'}</TableCell>
                        <TableCell>{medicine.manufacturer || 'N/A'}</TableCell>
                        <TableCell className="font-mono text-sm">{medicine.item_code || 'N/A'}</TableCell>
                        <TableCell>
                          {medicine.therapeutic_category ? (
                            <Badge variant="outline">{medicine.therapeutic_category}</Badge>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell>{medicine.strength || 'N/A'}</TableCell>
                        <TableCell>{medicine.dosage_form || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(medicine)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(medicine.id, medicine.name)}
                            >
                              <Trash2 className="h-3 w-3 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Medicine Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Medicine</DialogTitle>
          </DialogHeader>
          {selectedMedicine && (
            <EditMedicineForm
              medicine={selectedMedicine}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setSelectedMedicine(null);
                fetchMedicines();
              }}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedMedicine(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Add Medicine Form Component
const AddMedicineForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    medicine_code: '',
    barcode: '',
    category: '',
    manufacturer_id: '',
    strength: '',
    dosage: 'Tablet',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('medication')
      .insert([
        {
          name: formData.name,
          generic_name: formData.generic_name || null,
          item_code: formData.medicine_code || null,
          barcode: formData.barcode || null,
          therapeutic_category: formData.category || null,
          manufacturer: formData.manufacturer_id || null,
          strength: formData.strength || null,
          dosage_form: formData.dosage || null,
          description: formData.description || null,
        }
      ]);

    if (error) {
      console.error('Error adding medicine:', error);
      toast({
        title: "Error",
        description: `Failed to add medicine: ${error.message}`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Medicine added successfully!"
      });
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Medicine Name *</label>
          <Input
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter medicine name"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Generic Name</label>
          <Input
            value={formData.generic_name}
            onChange={(e) => setFormData(prev => ({ ...prev, generic_name: e.target.value }))}
            placeholder="Enter generic name"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Item Code</label>
          <Input
            value={formData.medicine_code}
            onChange={(e) => setFormData(prev => ({ ...prev, medicine_code: e.target.value }))}
            placeholder="Enter item code"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Barcode</label>
          <Input
            value={formData.barcode}
            onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
            placeholder="Enter barcode"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Strength</label>
          <Input
            value={formData.strength}
            onChange={(e) => setFormData(prev => ({ ...prev, strength: e.target.value }))}
            placeholder="e.g., 500mg"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Dosage Form</label>
          <select
            className="w-full p-2 border rounded"
            value={formData.dosage}
            onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
          >
            <option value="Tablet">Tablet</option>
            <option value="Capsule">Capsule</option>
            <option value="Syrup">Syrup</option>
            <option value="Injection">Injection</option>
            <option value="Ointment">Ointment</option>
            <option value="Drop">Drop</option>
            <option value="Cream">Cream</option>
            <option value="Suspension">Suspension</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Category</label>
          <Input
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            placeholder="Enter category"
          />
        </div>
        <div className="col-span-2">
          <label className="text-sm font-medium">Manufacturer</label>
          <Input
            value={formData.manufacturer_id}
            onChange={(e) => setFormData(prev => ({ ...prev, manufacturer_id: e.target.value }))}
            placeholder="Enter manufacturer name"
          />
        </div>
        <div className="col-span-2">
          <label className="text-sm font-medium">Description</label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Enter description"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit">Add Medicine</Button>
      </div>
    </form>
  );
};

// Edit Medicine Form Component
const EditMedicineForm: React.FC<{
  medicine: Medicine;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ medicine, onSuccess, onCancel }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: medicine.name || '',
    generic_name: medicine.generic_name || '',
    medicine_code: medicine.item_code || '',
    barcode: medicine.barcode || '',
    category: medicine.therapeutic_category || '',
    manufacturer_id: medicine.manufacturer || '',
    strength: medicine.strength || '',
    dosage: medicine.dosage_form || 'Tablet',
    description: medicine.description || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('medication')
      .update({
        name: formData.name,
        generic_name: formData.generic_name || null,
        item_code: formData.medicine_code || null,
        barcode: formData.barcode || null,
        therapeutic_category: formData.category || null,
        manufacturer: formData.manufacturer_id || null,
        strength: formData.strength || null,
        dosage_form: formData.dosage || null,
        description: formData.description || null,
      })
      .eq('id', medicine.id);

    if (error) {
      console.error('Error updating medicine:', error);
      toast({
        title: "Error",
        description: `Failed to update medicine: ${error.message}`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Medicine updated successfully!"
      });
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Medicine Name *</label>
          <Input
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter medicine name"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Generic Name</label>
          <Input
            value={formData.generic_name}
            onChange={(e) => setFormData(prev => ({ ...prev, generic_name: e.target.value }))}
            placeholder="Enter generic name"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Item Code</label>
          <Input
            value={formData.medicine_code}
            onChange={(e) => setFormData(prev => ({ ...prev, medicine_code: e.target.value }))}
            placeholder="Enter item code"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Barcode</label>
          <Input
            value={formData.barcode}
            onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
            placeholder="Enter barcode"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Strength</label>
          <Input
            value={formData.strength}
            onChange={(e) => setFormData(prev => ({ ...prev, strength: e.target.value }))}
            placeholder="e.g., 500mg"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Dosage Form</label>
          <select
            className="w-full p-2 border rounded"
            value={formData.dosage}
            onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
          >
            <option value="Tablet">Tablet</option>
            <option value="Capsule">Capsule</option>
            <option value="Syrup">Syrup</option>
            <option value="Injection">Injection</option>
            <option value="Ointment">Ointment</option>
            <option value="Drop">Drop</option>
            <option value="Cream">Cream</option>
            <option value="Suspension">Suspension</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Category</label>
          <Input
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            placeholder="Enter category"
          />
        </div>
        <div className="col-span-2">
          <label className="text-sm font-medium">Manufacturer</label>
          <Input
            value={formData.manufacturer_id}
            onChange={(e) => setFormData(prev => ({ ...prev, manufacturer_id: e.target.value }))}
            placeholder="Enter manufacturer name"
          />
        </div>
        <div className="col-span-2">
          <label className="text-sm font-medium">Description</label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Enter description"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Update Medicine</Button>
      </div>
    </form>
  );
};

export default MedicineItems;
