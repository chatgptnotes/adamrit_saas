# 🚀 How to Use Permission System - Quick Start

**Enable role-based access in your dashboard in 5 minutes!**

---

## ⚡ Quick Setup (3 Steps)

### Step 1: Update Main Dashboard

Open: `src/pages/Index.tsx`

**Replace the entire file with:**

```typescript
/**
 * Main Dashboard - Shows role-based dashboard
 */
import RoleBasedDashboard from '@/components/dashboards/RoleBasedDashboard';

export default function Index() {
  return <RoleBasedDashboard />;
}
```

That's it! Now each role sees their own dashboard.

---

### Step 2: Protect Sidebar Menu (Optional)

Open: `src/components/AppSidebar.tsx`

**Add permission checks:**

```typescript
import { canAccessModule } from '@/utils/permissions';
import { useAuth } from '@/contexts/AuthContext';

export function AppSidebar() {
  const { user } = useAuth();
  const role = user?.role;

  const menuItems = [
    { name: 'Dashboard', path: '/', module: 'dashboard', icon: Home },
    { name: 'Patients', path: '/patients', module: 'patients', icon: Users },
    { name: 'Lab', path: '/lab', module: 'lab', icon: TestTube },
    { name: 'Pharmacy', path: '/pharmacy', module: 'pharmacy', icon: Pill },
    { name: 'Settings', path: '/settings', module: 'settings', icon: Settings },
  ];

  return (
    <Sidebar>
      {menuItems.map(item => 
        canAccessModule(role, item.module) ? (
          <SidebarItem key={item.name} {...item} />
        ) : null
      )}
    </Sidebar>
  );
}
```

---

### Step 3: Protect Actions (Optional)

**In any page with buttons:**

```typescript
import { ProtectedButton } from '@/components/ProtectedButton';
import { ProtectedSection } from '@/components/ProtectedSection';

function PatientPage() {
  return (
    <div>
      {/* Only show if user can read patients */}
      <ProtectedSection module="patients" action="read">
        <PatientList />
      </ProtectedSection>

      {/* Button auto-disables if no permission */}
      <ProtectedButton module="patients" action="delete">
        Delete Patient
      </ProtectedButton>
    </div>
  );
}
```

---

## ✅ Test It

### Test 1: Login as Admin
```
1. Go to: http://localhost:8081/
2. Click: 🟢 Admin button
3. Click: Sign In
4. Result: Should see FULL dashboard with all modules
```

### Test 2: Login as Reception
```
1. Logout
2. Click: 🔵 Reception button
3. Click: Sign In
4. Result: Should see LIMITED dashboard
   - Only Patients, OPD, IPD, Billing visible
   - Lab, Pharmacy, Settings HIDDEN
```

### Test 3: Login as Lab
```
1. Logout
2. Click: 🟡 Lab button
3. Click: Sign In
4. Result: Should see LAB ONLY dashboard
   - Only Lab module visible
   - Can't access other modules
```

---

## 🎯 What Each Role Sees

### Super Admin / Admin
```
✅ Dashboard
✅ Patients
✅ OPD
✅ IPD
✅ Laboratory
✅ Radiology
✅ Pharmacy
✅ Billing
✅ Accounting
✅ Reports
✅ Settings
```

### Reception
```
✅ Dashboard
✅ Patients (Can't delete)
✅ OPD
✅ IPD
✅ Billing
👁️ Lab (View only)
👁️ Pharmacy (View only)
❌ Settings
❌ Users
```

### Lab Technician
```
✅ Dashboard (Lab-focused)
✅ Lab Orders
✅ Enter Results
✅ Print Reports
👁️ Patient Info (View only)
❌ Everything else
```

### Pharmacy
```
✅ Dashboard (Pharmacy-focused)
✅ Medicine Sales
✅ Stock Management
✅ GRN
👁️ Patient Info (View only)
❌ Everything else
```

### Doctor
```
✅ Dashboard
✅ Patients (View & Edit)
✅ OPD/IPD
✅ Order Lab Tests
✅ Order Radiology
✅ Prescribe Medicines
👁️ Billing (View only)
❌ Settings
```

---

## 🎨 Customizing Dashboards

### Modify Admin Dashboard

Open: `src/components/dashboards/AdminDashboard.tsx`

```typescript
export default function AdminDashboard() {
  return (
    <div className="p-6">
      <h1>Admin Dashboard</h1>
      
      {/* Add your custom content */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Patients" value={100} />
        <StatCard title="Today's Revenue" value="₹50,000" />
        <StatCard title="Pending Bills" value={5} />
      </div>
      
      {/* Only admins see this */}
      <ProtectedSection module="users" action="read">
        <UserManagementSection />
      </ProtectedSection>
    </div>
  );
}
```

### Create Custom Dashboard

Create: `src/components/dashboards/MyCustomDashboard.tsx`

```typescript
import { useAuth } from '@/contexts/AuthContext';

export default function MyCustomDashboard() {
  const { user } = useAuth();
  
  return (
    <div className="p-6">
      <h1>Welcome, {user?.email}</h1>
      {/* Your custom content */}
    </div>
  );
}
```

Then update `RoleBasedDashboard.tsx`:
```typescript
case 'my_role':
  return <MyCustomDashboard />;
```

---

## 🔧 Common Patterns

### Pattern 1: Hide Delete Button for Reception
```typescript
<ProtectedButton 
  module="patients" 
  action="delete"
  variant="destructive"
  onClick={handleDelete}
>
  Delete Patient
</ProtectedButton>
```

### Pattern 2: Show Different Content by Role
```typescript
import { RoleSwitch } from '@/components/ProtectedSection';

<RoleSwitch
  roles={{
    admin: <AdminView />,
    reception: <ReceptionView />,
    lab: <LabView />,
  }}
  fallback={<DefaultView />}
/>
```

### Pattern 3: Check Permission in Code
```typescript
import { hasPermission } from '@/utils/permissions';
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user } = useAuth();
  const role = user?.role;

  const canDelete = hasPermission(role, 'patients', 'delete');

  return (
    <div>
      {canDelete ? (
        <button onClick={handleDelete}>Delete</button>
      ) : (
        <span className="text-gray-400">No permission</span>
      )}
    </div>
  );
}
```

### Pattern 4: Protect Entire Page
```typescript
// In route definition
<Route 
  path="/settings" 
  element={
    <ProtectedModule module="settings">
      <SettingsPage />
    </ProtectedModule>
  } 
/>
```

---

## 🐛 Troubleshooting

### Issue: All buttons are disabled
**Solution:** Check if user is logged in
```typescript
const { user } = useAuth();
console.log('User:', user);
console.log('Role:', user?.role);
```

### Issue: Wrong dashboard showing
**Solution:** Check role in database
```sql
SELECT email, role FROM "User" WHERE email = 'your@email.com';
```

### Issue: Can't see any menu items
**Solution:** Check sidebar permission logic
```typescript
// Make sure dashboard is always visible
{ name: 'Dashboard', module: 'dashboard' as const }
```

---

## 📚 Documentation Files

```
✅ PERMISSION_SYSTEM_GUIDE.md  - Complete API reference
✅ HOW_TO_USE_PERMISSIONS.md   - This file (quick start)
✅ MOCK_CREDENTIALS.md         - Test login credentials
✅ LOGIN_QUICK_REFERENCE.txt   - Quick credentials list
```

---

## ✅ Checklist

After implementing:

- [ ] Updated Index.tsx to use RoleBasedDashboard
- [ ] Added permission checks to sidebar
- [ ] Tested login as Admin
- [ ] Tested login as Reception
- [ ] Tested login as Lab
- [ ] Verified buttons disable correctly
- [ ] Verified menus hide/show correctly
- [ ] Tested delete button (should be disabled for reception)

---

## 🎉 You're Done!

Your app now has:
✅ Role-based access control  
✅ Different dashboards per role  
✅ Protected actions  
✅ Secure by design  

**Next:** Read `PERMISSION_SYSTEM_GUIDE.md` for advanced usage!

---

**Created:** 2025-02-27  
**Status:** ✅ Ready to use
