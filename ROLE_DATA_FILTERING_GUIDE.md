# 🔒 Role-Based Data Filtering - Complete Guide

**Pharmacy ko sirf pharmacy data dikhe, Lab ko sirf lab data!**

---

## 🎯 What This Does

When user logs in:
- **Pharmacy** → Only sees pharmacy data (medicines, sales, stock)
- **Lab** → Only sees lab data (tests, results)
- **Reception** → Sees patients + billing
- **Admin** → Sees everything

---

## ⚡ Quick Setup (3 Steps)

### Step 1: Update Sidebar (Show Only Relevant Menus)

**File:** `src/components/AppSidebar.tsx`

**Replace with:**

```typescript
import { useRoleBasedMenu, RoleBasedMenuItem } from '@/components/RoleBasedSidebar';

export function AppSidebar() {
  const menuItems = useRoleBasedMenu();

  return (
    <Sidebar>
      {menuItems.map(item => (
        <RoleBasedMenuItem key={item.path} item={item} />
      ))}
    </Sidebar>
  );
}
```

**Result:**
- **Admin** → Sees all menus
- **Pharmacy** → Sees only: Dashboard, Pharmacy, Patients (limited)
- **Lab** → Sees only: Dashboard, Lab, Patients (limited)

---

### Step 2: Protect Routes

**File:** `src/components/AppRoutes.tsx`

**Add Route Guards:**

```typescript
import { RouteGuard } from '@/components/RouteGuard';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      
      {/* Pharmacy route - Only pharmacy users */}
      <Route 
        path="/pharmacy/*" 
        element={
          <RouteGuard requiredModule="pharmacy">
            <Pharmacy />
          </RouteGuard>
        } 
      />
      
      {/* Lab route - Only lab users */}
      <Route 
        path="/lab/*" 
        element={
          <RouteGuard requiredModule="lab">
            <Lab />
          </RouteGuard>
        } 
      />
      
      {/* Settings - Admin only */}
      <Route 
        path="/settings" 
        element={
          <RouteGuard requiredModule="settings">
            <Settings />
          </RouteGuard>
        } 
      />
    </Routes>
  );
}
```

**Result:**
- Pharmacy user tries to access `/lab` → Blocked ❌
- Lab user tries to access `/pharmacy` → Blocked ❌
- Admin can access everything ✅

---

### Step 3: Filter Data in Components

**Example: Pharmacy Sales Page**

```typescript
import { useRoleBasedData } from '@/hooks/useRoleBasedData';

function PharmacySalesPage() {
  // Automatically filtered by role!
  const { data: sales, isLoading } = useRoleBasedData<Sale>(
    'pharmacy_sales',
    'pharmacy-sales'
  );

  // Pharmacy user: Only sees their own sales
  // Admin: Sees all hospital sales
  // Lab user: Can't access this page at all

  return (
    <div>
      <h1>Pharmacy Sales</h1>
      {sales?.map(sale => (
        <SaleCard key={sale.id} sale={sale} />
      ))}
    </div>
  );
}
```

---

## 📖 Detailed Examples

### Example 1: Pharmacy Dashboard (Pharmacy User Only)

```typescript
// src/pages/Pharmacy.tsx

import { useRoleBasedData } from '@/hooks/useRoleBasedData';
import { useAuth } from '@/contexts/AuthContext';

function Pharmacy() {
  const { user } = useAuth();
  
  // Only pharmacy data visible
  const { data: medicines } = useRoleBasedData('medicine_master', 'medicines');
  const { data: sales } = useRoleBasedData('pharmacy_sales', 'sales');
  const { data: stock } = useRoleBasedData('pharmacy_stock', 'stock');

  return (
    <div className="p-6">
      <h1>Pharmacy Dashboard</h1>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Medicines" value={medicines?.length || 0} />
        <StatCard title="Today's Sales" value={sales?.length || 0} />
        <StatCard title="Low Stock Items" value={stock?.filter(s => s.quantity < 10).length || 0} />
      </div>
      
      {/* Sales Table */}
      <PharmacySalesTable data={sales} />
    </div>
  );
}
```

**What Pharmacy User Sees:**
- ✅ Only medicines from their hospital
- ✅ Only their own sales (or all if admin)
- ✅ Only their hospital's stock

**What They DON'T See:**
- ❌ Lab data
- ❌ Other hospitals' data
- ❌ Admin settings

---

### Example 2: Lab Dashboard (Lab User Only)

```typescript
// src/pages/Lab.tsx

import { useRoleBasedData } from '@/hooks/useRoleBasedData';

function Lab() {
  // Only lab data
  const { data: labTests } = useRoleBasedData('lab_tests', 'lab-tests', {
    filters: { status: 'pending' }
  });
  
  const { data: results } = useRoleBasedData('lab_results', 'lab-results', {
    orderBy: { column: 'created_at', ascending: false }
  });

  return (
    <div className="p-6">
      <h1>Laboratory Dashboard</h1>
      
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Pending Tests" value={labTests?.length || 0} />
        <StatCard title="Completed Today" value={results?.length || 0} />
        <StatCard title="Critical Results" value={0} />
      </div>
      
      <LabTestsTable data={labTests} />
    </div>
  );
}
```

**What Lab User Sees:**
- ✅ Only lab tests from their hospital
- ✅ Patient info (read-only, for context)
- ✅ Lab results they entered

**What They DON'T See:**
- ❌ Pharmacy sales
- ❌ Billing data
- ❌ Other modules

---

### Example 3: Patient List (Filtered by Role)

```typescript
// src/pages/Patients.tsx

import { useRoleBasedData } from '@/hooks/useRoleBasedData';
import { useAuth } from '@/contexts/AuthContext';

function Patients() {
  const { user } = useAuth();
  
  // Automatically filtered based on role
  const { data: patients, isLoading } = useRoleBasedData('patients', 'patients');

  // Result depends on role:
  // - Admin: All hospital patients
  // - Pharmacy: Only patients with prescriptions
  // - Lab: Only patients with lab orders
  // - Reception: All patients (but limited edit access)

  return (
    <div>
      <h1>Patients</h1>
      
      {isLoading && <Loading />}
      
      <PatientTable 
        data={patients} 
        role={user?.role} 
      />
    </div>
  );
}
```

---

## 🎨 Sidebar Configuration

### What Each Role Sees:

**Admin:**
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

**Pharmacy:**
```
✅ Dashboard (Pharmacy-focused)
✅ Pharmacy (Full access)
✅ Patients (View prescriptions only)
❌ Lab
❌ Radiology
❌ Billing
❌ Settings
```

**Lab:**
```
✅ Dashboard (Lab-focused)
✅ Lab Orders (Full access)
✅ Patients (View patient info)
❌ Pharmacy
❌ Radiology
❌ Billing
❌ Settings
```

**Reception:**
```
✅ Dashboard
✅ Patients (Full access)
✅ OPD
✅ IPD
✅ Billing
❌ Lab (Can view, can't edit)
❌ Pharmacy (Can view, can't edit)
❌ Settings
```

---

## 🔧 Advanced Usage

### Custom Data Filtering

```typescript
import { useRoleBasedData } from '@/hooks/useRoleBasedData';

// Filter by additional criteria
const { data: recentSales } = useRoleBasedData('pharmacy_sales', 'recent-sales', {
  filters: {
    created_at: '>= 2024-01-01'
  },
  orderBy: {
    column: 'created_at',
    ascending: false
  },
  select: 'id, amount, created_at, patient_id'
});
```

### Check Data Access in Code

```typescript
import { canAccessData } from '@/hooks/useRoleBasedData';

const { user } = useAuth();

if (canAccessData(user?.role, 'pharmacy_sales', sale.created_by, user?.id)) {
  // Show edit/delete buttons
} else {
  // Hide or disable buttons
}
```

### Conditional Route Access

```typescript
import { canAccessRoute } from '@/hooks/useRoleBasedData';

const { user } = useAuth();
const canAccessPharmacy = canAccessRoute(user?.role, '/pharmacy');

if (canAccessPharmacy) {
  // Show pharmacy link
}
```

---

## 📊 Data Filtering Logic

### Pharmacy User:

**Can Access:**
- `pharmacy_sales` → Only their own sales
- `medicine_master` → All medicines (read)
- `pharmacy_stock` → Hospital stock
- `patients` → Only patients with prescriptions

**Cannot Access:**
- `lab_tests` ❌
- `radiology_orders` ❌
- `billing` ❌ (except view)
- `settings` ❌

### Lab User:

**Can Access:**
- `lab_tests` → All lab tests
- `lab_results` → All results
- `patients` → Only patients with lab orders (read-only)

**Cannot Access:**
- `pharmacy_sales` ❌
- `billing` ❌
- `settings` ❌

---

## 🧪 Testing

### Test 1: Pharmacy Login
```
1. Login as: pharmacy@hopehospital.com / Pharma@Hope123
2. Check sidebar: Should show only Dashboard, Pharmacy, Patients
3. Go to /pharmacy: Should work ✅
4. Try to go to /lab: Should block ❌
5. View patients: Should only see patients with prescriptions
```

### Test 2: Lab Login
```
1. Login as: lab@hopehospital.com / Lab@Hope123
2. Check sidebar: Should show only Dashboard, Lab, Patients
3. Go to /lab: Should work ✅
4. Try to go to /pharmacy: Should block ❌
5. Try to go to /settings: Should block ❌
```

### Test 3: Data Filtering
```
1. Login as pharmacy
2. Add a sale
3. Logout, login as different pharmacy user
4. Check if they can see each other's sales
5. Login as admin
6. Should see all sales ✅
```

---

## 🔒 Security Best Practices

### 1. Always Filter on Backend (Supabase RLS)

```sql
-- Create RLS policy for pharmacy users
CREATE POLICY "pharmacy_own_sales" ON pharmacy_sales
  FOR SELECT USING (
    current_user_role() = 'pharmacy' 
    AND created_by = current_user_id()
  );

-- Admin can see all
CREATE POLICY "admin_all_sales" ON pharmacy_sales
  FOR SELECT USING (
    current_user_role() IN ('admin', 'super_admin')
  );
```

### 2. Never Trust Frontend Filtering Alone

```typescript
// ❌ BAD: Only frontend filter
const sales = allSales.filter(sale => sale.user_id === user.id);

// ✅ GOOD: Backend filter + RLS
const { data: sales } = useRoleBasedData('pharmacy_sales', 'sales');
// Query automatically filtered by role in backend
```

### 3. Log Data Access

```typescript
// Log when users access sensitive data
useEffect(() => {
  if (sales) {
    logDataAccess({
      user: user?.id,
      resource: 'pharmacy_sales',
      action: 'read',
      count: sales.length
    });
  }
}, [sales]);
```

---

## 📂 File Structure

```
src/
├── hooks/
│   └── useRoleBasedData.ts          # Data filtering hook ✨
├── components/
│   ├── RoleBasedSidebar.tsx         # Menu configuration ✨
│   ├── RouteGuard.tsx               # Route protection ✨
│   ├── ProtectedSection.tsx         # Content protection
│   └── ProtectedButton.tsx          # Button protection
├── utils/
│   └── permissions.ts               # Permission logic
└── pages/
    ├── Pharmacy.tsx                 # Pharmacy module
    ├── Lab.tsx                      # Lab module
    └── ...
```

---

## ✅ Implementation Checklist

- [ ] Update `AppSidebar.tsx` with `useRoleBasedMenu`
- [ ] Add `RouteGuard` to protected routes
- [ ] Use `useRoleBasedData` in data-heavy pages
- [ ] Test pharmacy login → only pharmacy data visible
- [ ] Test lab login → only lab data visible
- [ ] Test admin login → all data visible
- [ ] Verify sidebar shows correct menus per role
- [ ] Test route protection (pharmacy can't access /lab)
- [ ] Add RLS policies in Supabase (backend security)

---

## 🎉 Summary

**What You Get:**
✅ Role-based sidebar (different menus per role)  
✅ Route guards (block unauthorized access)  
✅ Automatic data filtering (users see only their data)  
✅ Easy to use hooks  
✅ Secure by design  

**How It Works:**
1. User logs in with role (pharmacy, lab, etc.)
2. Sidebar shows only relevant menus
3. Routes are protected by role
4. Data queries are automatically filtered
5. User sees only what they should see

**Next Steps:**
1. Update your sidebar to use `useRoleBasedMenu`
2. Add `RouteGuard` to sensitive routes
3. Replace data fetching with `useRoleBasedData`
4. Test with different user roles

---

**Created:** 2025-02-27  
**Status:** ✅ Ready to use  
**Security Level:** 🔒 High
