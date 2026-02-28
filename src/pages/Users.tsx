import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, User, Plus, Trash2, Eye, EyeOff, Edit, CheckCircle, XCircle, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { useHospitalFilter } from '@/hooks/useHospitalFilter';

// Lazy load bcrypt only when creating users
const loadBcrypt = async () => {
  const bcrypt = await import('bcryptjs');
  return bcrypt.default;
};

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { applyFilter, getUserHospital, isSuperAdmin } = useHospitalFilter();

  // Form state for new user (defaults to current user's hospital)
  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'user' as 'super_admin' | 'admin' | 'reception' | 'lab' | 'radiology' | 'pharmacy' | 'doctor' | 'nurse' | 'accountant' | 'user',
    hospital_type: (getUserHospital() as 'hope' | 'ayushman'),
    is_active: true
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', currentUser?.hospital_type],
    queryFn: async () => {
      let query = supabase
        .from('User')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Apply hospital filter (super admin sees all, others see only their hospital)
      query = applyFilter(query);
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
      
      return data;
    }
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      // Lazy load bcrypt only when creating user
      const bcrypt = await loadBcrypt();
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const { data, error } = await supabase
        .from('User')
        .insert([{
          full_name: userData.full_name.trim(),
          email: userData.email.toLowerCase().trim(),
          phone: userData.phone.trim(),
          password: hashedPassword,
          role: userData.role,
          hospital_type: userData.hospital_type,
          is_active: userData.is_active
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Success',
        description: 'User created successfully!',
      });
      setIsCreateDialogOpen(false);
      setNewUser({ 
        full_name: '',
        email: '', 
        phone: '',
        password: '', 
        role: 'user', 
        hospital_type: 'hope',
        is_active: true 
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive',
      });
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const { data, error } = await supabase
        .from('User')
        .update({
          full_name: userData.full_name,
          email: userData.email,
          phone: userData.phone,
          role: userData.role,
          hospital_type: userData.hospital_type,
          is_active: userData.is_active
        })
        .eq('id', userData.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Success',
        description: 'User updated successfully!',
      });
      setIsEditDialogOpen(false);
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user',
        variant: 'destructive',
      });
    }
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('User')
        .update({ is_active: isActive })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Success',
        description: `User ${variables.isActive ? 'activated' : 'deactivated'} successfully!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user status',
        variant: 'destructive',
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('User')
        .delete()
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Success',
        description: 'User deleted successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    }
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUser.full_name || !newUser.email || !newUser.password) {
      toast({
        title: 'Validation Error',
        description: 'Name, email and password are required',
        variant: 'destructive',
      });
      return;
    }

    if (newUser.password.length < 6) {
      toast({
        title: 'Validation Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    createUserMutation.mutate(newUser);
  };

  const handleEditUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingUser.full_name || !editingUser.email) {
      toast({
        title: 'Validation Error',
        description: 'Name and email are required',
        variant: 'destructive',
      });
      return;
    }

    updateUserMutation.mutate(editingUser);
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to delete user: ${userName}?`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleToggleActive = (userId: string, currentStatus: boolean) => {
    toggleActiveMutation.mutate({ userId, isActive: !currentStatus });
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isUserSuperAdmin = isSuperAdmin();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <User className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-primary">
              Users Management
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Manage system users and permissions
          </p>
        </div>

        <div className="mb-6 flex justify-between items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name, email, phone, role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {isUserSuperAdmin && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleCreateUser}>
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                      Add a new user to the system with role and hospital assignment.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input
                        id="full_name"
                        placeholder="John Doe"
                        value={newUser.full_name}
                        onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="user@example.com"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 9876543210"
                        value={newUser.phone}
                        onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="password">Password *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Minimum 6 characters"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="role">Role *</Label>
                      <Select value={newUser.role} onValueChange={(value: any) => setNewUser({ ...newUser, role: value })}>
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="reception">Reception</SelectItem>
                          <SelectItem value="lab">Lab</SelectItem>
                          <SelectItem value="pharmacy">Pharmacy</SelectItem>
                          <SelectItem value="radiology">Radiology</SelectItem>
                          <SelectItem value="doctor">Doctor</SelectItem>
                          <SelectItem value="nurse">Nurse</SelectItem>
                          <SelectItem value="accountant">Accountant</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="hospital_type">Hospital Type *</Label>
                      {isUserSuperAdmin ? (
                        <Select value={newUser.hospital_type} onValueChange={(value: any) => setNewUser({ ...newUser, hospital_type: value })}>
                          <SelectTrigger id="hospital_type">
                            <SelectValue placeholder="Select hospital" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hope">Hope Hospital</SelectItem>
                            <SelectItem value="ayushman">Ayushman Hospital</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center gap-2 p-2 border rounded-md bg-muted">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {newUser.hospital_type === 'hope' ? 'Hope Hospital' : 'Ayushman Hospital'}
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            (Fixed to your hospital)
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={newUser.is_active}
                        onCheckedChange={(checked) => setNewUser({ ...newUser, is_active: checked })}
                      />
                      <Label htmlFor="is_active">Active User</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createUserMutation.isPending}>
                      {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Edit User Dialog */}
        {editingUser && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleEditUser}>
                <DialogHeader>
                  <DialogTitle>Edit User</DialogTitle>
                  <DialogDescription>
                    Update user information (password cannot be changed here)
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit_full_name">Full Name *</Label>
                    <Input
                      id="edit_full_name"
                      value={editingUser.full_name || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit_email">Email *</Label>
                    <Input
                      id="edit_email"
                      type="email"
                      value={editingUser.email || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit_phone">Phone</Label>
                    <Input
                      id="edit_phone"
                      value={editingUser.phone || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit_role">Role *</Label>
                    <Select value={editingUser.role} onValueChange={(value: any) => setEditingUser({ ...editingUser, role: value })}>
                      <SelectTrigger id="edit_role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="reception">Reception</SelectItem>
                        <SelectItem value="lab">Lab</SelectItem>
                        <SelectItem value="pharmacy">Pharmacy</SelectItem>
                        <SelectItem value="radiology">Radiology</SelectItem>
                        <SelectItem value="doctor">Doctor</SelectItem>
                        <SelectItem value="nurse">Nurse</SelectItem>
                        <SelectItem value="accountant">Accountant</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit_hospital_type">Hospital Type *</Label>
                    {isUserSuperAdmin ? (
                      <Select value={editingUser.hospital_type} onValueChange={(value: any) => setEditingUser({ ...editingUser, hospital_type: value })}>
                        <SelectTrigger id="edit_hospital_type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hope">Hope Hospital</SelectItem>
                          <SelectItem value="ayushman">Ayushman Hospital</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2 p-2 border rounded-md bg-muted">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {editingUser.hospital_type === 'hope' ? 'Hope Hospital' : 'Ayushman Hospital'}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          (Cannot change)
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit_is_active"
                      checked={editingUser.is_active}
                      onCheckedChange={(checked) => setEditingUser({ ...editingUser, is_active: checked })}
                    />
                    <Label htmlFor="edit_is_active">Active User</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingUser(null);
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateUserMutation.isPending}>
                    {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user) => (
            <Card key={user.id} className={`hover:shadow-md transition-shadow ${!user.is_active ? 'opacity-60' : ''}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg truncate">{user.full_name || user.email}</span>
                  <div className="flex gap-2">
                    <Badge variant={user.role === 'admin' || user.role === 'super_admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                    {user.is_active ? (
                      <Badge variant="outline" className="border-green-500 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-red-500 text-red-700">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><span className="font-semibold">Email:</span> {user.email}</p>
                  {user.phone && <p><span className="font-semibold">Phone:</span> {user.phone}</p>}
                  <p><span className="font-semibold">Hospital:</span> {user.hospital_type || 'hope'}</p>
                  {user.created_at && (
                    <p><span className="font-semibold">Created:</span> {new Date(user.created_at).toLocaleDateString()}</p>
                  )}
                </div>
                {isUserSuperAdmin && user.id !== currentUser?.id && (
                  <div className="mt-4 flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => {
                        setEditingUser(user);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant={user.is_active ? 'secondary' : 'default'}
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => handleToggleActive(user.id, user.is_active)}
                      disabled={toggleActiveMutation.isPending}
                    >
                      {user.is_active ? (
                        <>
                          <XCircle className="h-4 w-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => handleDeleteUser(user.id, user.full_name || user.email)}
                      disabled={deleteUserMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">
              {searchTerm ? 'No users found matching your search.' : 'No users available.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
