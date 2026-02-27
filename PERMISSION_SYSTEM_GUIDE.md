# 🔒 Permission System - Complete Guide

**Role-Based Access Control (RBAC) Implementation**

---

## 📋 What's Implemented

✅ **Permission Matrix** - Define what each role can do  
✅ **ProtectedSection** - Show/hide content by role  
✅ **ProtectedButton** - Disable buttons by permissions  
✅ **Role-Based Dashboards** - Different dashboard per role  
✅ **Permission Utilities** - Helper functions  

---

## 🎭 Roles Defined

```typescript
type UserRole = 
  | 'super_admin'    // Platform owner (all hospitals)
  | 'admin'          // Hospital admin (full access)
  | 'reception'      // Front desk (patients + billing)
  | 'lab'            // Lab tech (lab tests only)
  | 'radiology'      // Radiology tech (imaging only)
  | 'pharmacy'       // Pharmacy staff (medicines only)
  | 'doctor'         // Doctor (clinical access)
  | 'nurse'          // Nurse (patient care)
  | 'accountant';    // Accountant (finance only)
```

---

## 📊 Permission Matrix

| Role | Patients | OPD | IPD | Lab | Pharmacy | Billing | Reports | Settings |
|------|----------|-----|-----|-----|----------|---------|---------|----------|
| **Super Admin** | ✅✅✅✅ | ✅✅✅✅ | ✅✅✅✅ | ✅✅✅✅ | ✅✅✅✅ | ✅✅✅✅ | ✅✅✅✅ | ✅✅✅✅ |
| **Admin** | ✅✅✅❌ | ✅✅✅❌ | ✅✅✅❌ | ✅✅✅❌ | ✅✅✅❌ | ✅✅✅❌ | ❌✅❌❌ | ❌✅✅❌ |
| **Reception** | ✅✅✅❌ | ✅✅✅❌ | ✅✅✅❌ | ❌✅❌❌ | ❌✅❌❌ | ✅✅✅❌ | ❌✅❌❌ | ❌❌❌❌ |
| **Lab** | ❌✅❌❌ | ❌❌❌❌ | ❌❌❌❌ | ❌✅✅❌ | ❌❌❌❌ | ❌❌❌❌ | ❌✅❌❌ | ❌❌❌❌ |
| **Pharmacy** | ❌✅❌❌ | ❌❌❌❌ | ❌❌❌❌ | ❌❌❌❌ | ✅✅✅❌ | ❌✅❌❌ | ❌✅❌❌ | ❌❌❌❌ |
| **Doctor** | ❌✅✅❌ | ✅✅✅❌ | ✅✅✅❌ | ✅✅❌❌ | ❌✅❌❌ | ❌✅❌❌ | ❌✅❌❌ | ❌❌❌❌ |

Legend: ✅ Create, ✅ Read, ✅ Update, ✅ Delete

---

## 🚀 Quick Start

### 1. Import Permission Utilities

```typescript
import { hasPermission, canAccessModule } from '@/utils/permissions';
import { ProtectedSection } from '@/components/ProtectedSection';
import { ProtectedButton } from '@/components/ProtectedButton';
import { useAuth } from '@/contexts/AuthContext';
```

### 2. Use in Components

```typescript
function MyComponent() {
  const { user } = useAuth();

  return (
    <div>
      {/* Show section only if user can access */}
      <ProtectedSection module="patients" action="read">
        <PatientList />
      </ProtectedSection>

      {/* Disable button if no permission */}
      <ProtectedButton module="patients" action="delete">
        Delete Patient
      </ProtectedButton>
    </div>
  );
}
```

---

## 📖 API Reference

### hasPermission()
Check if user has specific permission.

```typescript
hasPermission(role: UserRole, module: Module, action: Action): boolean

// Example
if (hasPermission('reception', 'patients', 'create')) {
  // Show register patient button
}
```

### canAccessModule()
Check if user can access a module at all.

```typescript
canAccessModule(role: UserRole, module: Module): boolean

// Example
if (canAccessModule('lab', 'lab')) {
  // Show lab menu item
}
```

### getAccessibleModules()
Get all modules user can access.

```typescript
getAccessibleModules(role: UserRole): Module[]

// Example
const modules = getAccessibleModules('reception');
// Returns: ['dashboard', 'patients', 'visits', 'opd', 'ipd', 'billing']
```

---

## 🎨 Components

### ProtectedSection

Hide/show content based on permissions.

```typescript
<ProtectedSection 
  module="patients" 
  action="delete"
  fallback={<div>No permission</div>}
  showMessage={true}
>
  <DeleteButton />
</ProtectedSection>
```

**Props:**
- `module` - Module name
- `action` - Action type (default: 'read')
- `fallback` - Show this if no permission
- `showMessage` - Show error message (default: false)

### ProtectedButton

Button that auto-disables without permission.

```typescript
<ProtectedButton
  module="patients"
  action="create"
  variant="default"
  onClick={handleCreate}
>
  Create Patient
</ProtectedButton>
```

### ProtectedModule

Show content only if module accessible.

```typescript
<ProtectedModule 
  module="lab"
  fallback={<AccessDenied />}
>
  <LabContent />
</ProtectedModule>
```

### RoleSwitch

Show different content per role.

```typescript
<RoleSwitch
  roles={{
    admin: <AdminView />,
    reception: <ReceptionView />,
    lab: <LabView />,
  }}
  fallback={<DefaultView />}
/>
```

---

## 🎯 Usage Examples

### Example 1: Dashboard Page

```typescript
// src/pages/Index.tsx
import RoleBasedDashboard from '@/components/dashboards/RoleBasedDashboard';

export default function Index() {
  return <RoleBasedDashboard />;
}
```

### Example 2: Patient List with Actions

```typescript
function PatientList() {
  return (
    <div>
      <h1>Patients</h1>
      
      {/* Everyone with read access sees list */}
      <ProtectedSection module="patients" action="read">
        <PatientTable />
      </ProtectedSection>
      
      {/* Only roles with create permission see this */}
      <ProtectedSection module="patients" action="create">
        <Button>Add Patient</Button>
      </ProtectedSection>
      
      {/* Delete button disabled for roles without permission */}
      <ProtectedButton 
        module="patients" 
        action="delete"
        variant="destructive"
      >
        Delete
      </ProtectedButton>
    </div>
  );
}
```

### Example 3: Conditional Features

```typescript
function BillingPage() {
  const { user } = useAuth();
  const role = user?.role as UserRole;

  // Check permission programmatically
  const canEditBills = hasPermission(role, 'billing', 'update');
  const canDeleteBills = hasPermission(role, 'billing', 'delete');

  return (
    <div>
      <BillList />
      
      {canEditBills && <EditBillForm />}
      {canDeleteBills && <DeleteBillButton />}
    </div>
  );
}
```

### Example 4: Sidebar Menu

```typescript
function AppSidebar() {
  const { user } = useAuth();
  const role = user?.role as UserRole;
  
  const menuItems = [
    { name: 'Dashboard', module: 'dashboard', icon: Home },
    { name: 'Patients', module: 'patients', icon: Users },
    { name: 'Lab', module: 'lab', icon: TestTube },
    { name: 'Pharmacy', module: 'pharmacy', icon: Pill },
    { name: 'Settings', module: 'settings', icon: Settings },
  ];

  return (
    <Sidebar>
      {menuItems.map(item => (
        canAccessModule(role, item.module as Module) && (
          <SidebarItem key={item.name} {...item} />
        )
      ))}
    </Sidebar>
  );
}
```

---

## 🔧 Customization

### Adding New Role

1. Add to `UserRole` type in `src/utils/permissions.ts`
2. Add permissions in `PERMISSIONS` matrix
3. Create dashboard in `src/components/dashboards/`
4. Update `RoleBasedDashboard.tsx`

```typescript
// 1. Add role type
export type UserRole = 
  | 'super_admin'
  | 'admin'
  | 'your_new_role'; // Add here

// 2. Add permissions
const PERMISSIONS = {
  your_new_role: {
    patients: { create: false, read: true, update: false, delete: false },
    // ... other modules
  }
};

// 3. Create dashboard
// src/components/dashboards/YourNewRoleDashboard.tsx

// 4. Update selector
// RoleBasedDashboard.tsx
case 'your_new_role':
  return <YourNewRoleDashboard />;
```

### Adding New Module

```typescript
// 1. Add to Module type
export type Module = 
  | 'patients'
  | 'your_new_module'; // Add here

// 2. Add permissions for all roles
const PERMISSIONS = {
  admin: {
    // ... existing
    your_new_module: { create: true, read: true, update: true, delete: false },
  },
  reception: {
    // ... existing
    your_new_module: { create: false, read: true, update: false, delete: false },
  },
  // ... all roles
};
```

---

## 📂 File Structure

```
src/
├── utils/
│   └── permissions.ts                    # Permission logic
├── components/
│   ├── ProtectedSection.tsx              # Protected content
│   ├── ProtectedButton.tsx               # Protected button
│   └── dashboards/
│       ├── RoleBasedDashboard.tsx        # Dashboard selector
│       ├── AdminDashboard.tsx            # Admin dashboard
│       ├── ReceptionDashboard.tsx        # Reception dashboard
│       ├── LabDashboard.tsx              # Lab dashboard
│       ├── PharmacyDashboard.tsx         # Pharmacy dashboard
│       ├── RadiologyDashboard.tsx        # Radiology dashboard
│       ├── DoctorDashboard.tsx           # Doctor dashboard
│       └── NurseDashboard.tsx            # Nurse dashboard
└── pages/
    └── Index.tsx                          # Main dashboard (use RoleBasedDashboard)
```

---

## ✅ Testing

### Test Different Roles

```typescript
// 1. Login as admin
// URL: http://localhost:8081/
// Click: 🟢 Admin
// Check: Can see all modules

// 2. Login as reception
// Click: 🔵 Reception
// Check: Only see Patients, OPD, IPD, Billing

// 3. Login as lab
// Click: 🟡 Lab
// Check: Only see Lab module

// 4. Test button states
// Login as reception
// Go to Patients page
// Check: "Delete" button is disabled
```

### Manual Testing Checklist

```
[ ] Admin can access all modules
[ ] Reception can't access Settings
[ ] Lab can only access Lab module
[ ] Pharmacy can only access Pharmacy module
[ ] Delete buttons disabled for reception
[ ] Settings menu hidden for non-admins
[ ] Dashboard shows correct content per role
```

---

## 🐛 Troubleshooting

### Issue: Permission always returns false

**Check:**
```typescript
// 1. User role is set correctly
console.log('User role:', user?.role);

// 2. Role exists in PERMISSIONS
console.log('Has role:', user?.role in PERMISSIONS);

// 3. Module/action spelling
hasPermission('admin', 'patients', 'read'); // ✅ Correct
hasPermission('admin', 'patient', 'read');  // ❌ Wrong (no 's')
```

### Issue: Protected section not hiding

**Check:**
```typescript
// Make sure module and action are spelled correctly
<ProtectedSection module="patients" action="read">
  // Not: module="patient" (typo)
```

### Issue: Dashboard not showing

**Check:**
```typescript
// Make sure role is in switch statement
// RoleBasedDashboard.tsx
switch (role) {
  case 'your_role': // Add this
    return <YourDashboard />;
}
```

---

## 🔐 Security Best Practices

### 1. Always Check Backend Too

```typescript
// ❌ BAD: Only frontend check
<ProtectedButton module="patients" action="delete">
  Delete
</ProtectedButton>

// ✅ GOOD: Frontend + Backend
// Frontend: Hide button
// Backend: RLS policy blocks delete
```

### 2. Use RLS in Supabase

```sql
CREATE POLICY "reception_no_delete" ON patients
  FOR DELETE USING (
    current_user_role() != 'reception'
  );
```

### 3. Don't Trust Client

```typescript
// Never do this:
if (user.role === 'admin') {
  // User can change role in DevTools!
}

// Do this:
// Check role from authenticated session
// Verify in database
// Enforce with RLS
```

---

## 🎉 Summary

**What You Have Now:**
✅ Complete permission system  
✅ Role-based dashboards  
✅ Protected components  
✅ Easy to extend  

**Next Steps:**
1. Update `Index.tsx` to use `RoleBasedDashboard`
2. Add `ProtectedSection` to sensitive areas
3. Test each role
4. Customize dashboards

---

**Created:** 2025-02-27  
**Version:** 1.0  
**Status:** ✅ Ready to use
