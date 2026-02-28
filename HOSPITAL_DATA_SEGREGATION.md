# Hospital Data Segregation - Implementation Guide

## 🏥 Overview

**Problem:** Two hospitals (Hope & Ayushman) share the same system. Their data must NOT mix.

**Solution:** Hospital-based data filtering ensures each hospital sees only their own data.

---

## ✅ Implementation Complete

### What's Done:
- ✅ Hospital filter utility created
- ✅ Hospital filter hook created
- ✅ Users page updated with hospital filtering
- ✅ Auto-filters all queries based on user's hospital
- ✅ Super admin can see all hospitals
- ✅ Regular users see only their hospital data

---

## 🔒 Security Rules

| User Type | Can See |
|-----------|---------|
| **Hope User** | Only Hope Hospital data |
| **Ayushman User** | Only Ayushman Hospital data |
| **Super Admin** | All hospitals (Hope + Ayushman) |

---

## 📁 Files Created

### 1. Hospital Filter Utility
**File:** `src/utils/hospitalFilter.ts`

**Functions:**
- `getHospitalFilter(role, hospitalType)` - Returns filter object
- `applyHospitalFilter(query, role, hospitalType)` - Applies filter to Supabase query
- `canAccessHospitalData(userRole, userHospital, dataHospital)` - Access check
- `getHospitalDisplayName(hospitalType)` - Get friendly name
- `isValidHospitalType(hospitalType)` - Validation

---

### 2. Hospital Filter Hook
**File:** `src/hooks/useHospitalFilter.ts`

**Usage:**
```typescript
import { useHospitalFilter } from '@/hooks/useHospitalFilter';

const MyComponent = () => {
  const { applyFilter, getUserHospital, isSuperAdmin } = useHospitalFilter();

  const { data } = useQuery({
    queryKey: ['patients', getUserHospital()],
    queryFn: async () => {
      let query = supabase.from('patients').select('*');
      
      // Apply hospital filter
      query = applyFilter(query);
      
      const { data } = await query;
      return data;
    }
  });
};
```

**Functions:**
- `applyFilter(query)` - Apply hospital filter to query
- `getFilter()` - Get filter object for manual use
- `getUserHospital()` - Get current user's hospital
- `isSuperAdmin()` - Check if user is super admin

---

### 3. Updated Users Page
**File:** `src/pages/Users.tsx`

**Changes:**
- ✅ Imported `useHospitalFilter` hook
- ✅ Applied hospital filter to users query
- ✅ Hospital type defaults to user's hospital
- ✅ Hospital dropdown:
  - **Super Admin:** Can select any hospital
  - **Regular Admin:** Fixed to their hospital (read-only)
- ✅ Users see only their hospital's users

---

## 🔄 How It Works

### Scenario 1: Hope Admin Creates User
```
1. Hope admin logs in
2. Opens Users page
3. Clicks "Create User"
4. Hospital Type = "Hope Hospital" (fixed, cannot change)
5. Creates user
6. ✅ New user is assigned to Hope Hospital
7. ✅ Only Hope users can see this new user
```

### Scenario 2: Ayushman User Views Users List
```
1. Ayushman user logs in
2. Opens Users page
3. Query runs: SELECT * FROM User WHERE hospital_type = 'ayushman'
4. ✅ Only Ayushman users are shown
5. ✅ Hope users are NOT visible
```

### Scenario 3: Super Admin Views All
```
1. Super admin logs in
2. Opens Users page
3. Query runs: SELECT * FROM User (no filter)
4. ✅ All users from all hospitals are shown
5. ✅ Can create users for any hospital
```

---

## 📊 Database Structure

### User Table Columns:
- `id` - UUID
- `email` - text
- `password` - text (hashed)
- `role` - text
- `full_name` - text
- `phone` - text
- `is_active` - boolean
- **`hospital_type`** - varchar ('hope' or 'ayushman') ← **THIS IS KEY!**
- `created_at` - timestamptz

**Every data table must have `hospital_type` column for filtering!**

---

## 🛠️ How to Add Hospital Filtering to Other Pages

### Step 1: Import the Hook
```typescript
import { useHospitalFilter } from '@/hooks/useHospitalFilter';
```

### Step 2: Use the Hook
```typescript
const { applyFilter, getUserHospital } = useHospitalFilter();
```

### Step 3: Apply to Query
```typescript
const { data: patients = [] } = useQuery({
  queryKey: ['patients', getUserHospital()], // Add hospital to cache key
  queryFn: async () => {
    let query = supabase
      .from('patients')
      .select('*');
    
    // Apply hospital filter
    query = applyFilter(query);
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
});
```

### Step 4: When Creating Records
```typescript
const createPatientMutation = useMutation({
  mutationFn: async (patientData) => {
    const { data, error } = await supabase
      .from('patients')
      .insert([{
        ...patientData,
        hospital_type: getUserHospital() // Add hospital to new record
      }]);
    
    if (error) throw error;
    return data;
  }
});
```

---

## 🧪 Testing Checklist

### Test 1: Hope User Cannot See Ayushman Data
**Steps:**
1. Login as Hope user (email: admin@hopehospital.com)
2. Go to Users page
3. Check user list

**Expected:**
- ✅ Only Hope users visible
- ✅ No Ayushman users visible
- ✅ Create User form has "Hope Hospital" (fixed)

---

### Test 2: Ayushman User Cannot See Hope Data
**Steps:**
1. Login as Ayushman user (email: superadmin@ayushman.com)
2. Go to Users page
3. Check user list

**Expected:**
- ✅ Only Ayushman users visible
- ✅ No Hope users visible
- ✅ Create User form has "Ayushman Hospital" (fixed)

---

### Test 3: Super Admin Sees All
**Steps:**
1. Login as Super Admin
2. Go to Users page
3. Check user list

**Expected:**
- ✅ All users visible (Hope + Ayushman)
- ✅ Hospital dropdown is enabled (can choose any)
- ✅ Can create users for both hospitals

---

### Test 4: Cross-Hospital Access Denied
**Steps:**
1. Login as Hope admin
2. Manually type URL: `/profile` (of Ayushman user ID if you know it)

**Expected:**
- ✅ Cannot access Ayushman user's profile
- ✅ Error or redirect

---

### Test 5: Data Isolation in All Modules
**Steps:**
1. Login as Hope user
2. Check Patients page
3. Check Lab page
4. Check Pharmacy page
5. Check Accounting page

**Expected:**
- ✅ All pages show only Hope hospital data
- ✅ No Ayushman data visible anywhere

---

## 🚨 Important Notes

### 1. All Tables Need `hospital_type` Column
For data segregation to work, **every table** must have:
```sql
ALTER TABLE "table_name" 
ADD COLUMN IF NOT EXISTS "hospital_type" VARCHAR DEFAULT 'hope';
```

### 2. Always Apply Filter
**DO THIS:**
```typescript
let query = supabase.from('table').select('*');
query = applyFilter(query); // ✅ APPLY FILTER
const { data } = await query;
```

**DON'T DO THIS:**
```typescript
const { data } = await supabase.from('table').select('*'); // ❌ NO FILTER!
```

### 3. Include Hospital on Insert/Update
**DO THIS:**
```typescript
await supabase.from('table').insert({
  ...data,
  hospital_type: getUserHospital() // ✅ ADD HOSPITAL
});
```

**DON'T DO THIS:**
```typescript
await supabase.from('table').insert(data); // ❌ MISSING HOSPITAL!
```

---

## 🔧 Tables That Need Hospital Filtering

Apply hospital filtering to these tables:

- ✅ User (DONE)
- ⚠️ patients
- ⚠️ visits
- ⚠️ bills
- ⚠️ lab_tests
- ⚠️ radiology_tests
- ⚠️ pharmacy_sales
- ⚠️ accounting_transactions
- ⚠️ diagnoses
- ⚠️ medications
- ⚠️ referees
- ⚠️ surgeons
- ⚠️ consultants
- ⚠️ anaesthetists
- ... (all data tables)

---

## 🎯 Next Steps

### For Each Page/Component:

1. **Import the hook:**
   ```typescript
   import { useHospitalFilter } from '@/hooks/useHospitalFilter';
   ```

2. **Use in component:**
   ```typescript
   const { applyFilter, getUserHospital } = useHospitalFilter();
   ```

3. **Apply to queries:**
   ```typescript
   query = applyFilter(query);
   ```

4. **Add hospital to inserts:**
   ```typescript
   hospital_type: getUserHospital()
   ```

5. **Test thoroughly:**
   - Login as Hope user → Only Hope data
   - Login as Ayushman user → Only Ayushman data
   - Login as Super Admin → All data

---

## 📋 Migration Script

Run this to add `hospital_type` to existing tables:

```sql
-- Add hospital_type column to all data tables
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "hospital_type" VARCHAR DEFAULT 'hope';
ALTER TABLE "visits" ADD COLUMN IF NOT EXISTS "hospital_type" VARCHAR DEFAULT 'hope';
ALTER TABLE "bills" ADD COLUMN IF NOT EXISTS "hospital_type" VARCHAR DEFAULT 'hope';
ALTER TABLE "lab_tests" ADD COLUMN IF NOT EXISTS "hospital_type" VARCHAR DEFAULT 'hope';
ALTER TABLE "radiology_tests" ADD COLUMN IF NOT EXISTS "hospital_type" VARCHAR DEFAULT 'hope';
ALTER TABLE "pharmacy_sales" ADD COLUMN IF NOT EXISTS "hospital_type" VARCHAR DEFAULT 'hope';
ALTER TABLE "accounting_ledger" ADD COLUMN IF NOT EXISTS "hospital_type" VARCHAR DEFAULT 'hope';
ALTER TABLE "diagnoses" ADD COLUMN IF NOT EXISTS "hospital_type" VARCHAR DEFAULT 'hope';
ALTER TABLE "medications" ADD COLUMN IF NOT EXISTS "hospital_type" VARCHAR DEFAULT 'hope';
ALTER TABLE "complications" ADD COLUMN IF NOT EXISTS "hospital_type" VARCHAR DEFAULT 'hope';
ALTER TABLE "referees" ADD COLUMN IF NOT EXISTS "hospital_type" VARCHAR DEFAULT 'hope';
ALTER TABLE "hope_surgeons" ADD COLUMN IF NOT EXISTS "hospital_type" VARCHAR DEFAULT 'hope';
ALTER TABLE "hope_consultants" ADD COLUMN IF NOT EXISTS "hospital_type" VARCHAR DEFAULT 'hope';
ALTER TABLE "ayushman_surgeons" ADD COLUMN IF NOT EXISTS "hospital_type" VARCHAR DEFAULT 'ayushman';
ALTER TABLE "ayushman_consultants" ADD COLUMN IF NOT EXISTS "hospital_type" VARCHAR DEFAULT 'ayushman';
-- Add more tables as needed
```

---

**Implementation Date:** 2026-02-28
**Developer:** ClawdBot 🦞
**Status:** ✅ Core Framework Complete

---

## 🎉 Summary

✅ **Hospital Filter Utility** - Created
✅ **Hospital Filter Hook** - Created
✅ **Users Page** - Updated with filtering
✅ **Super Admin** - Can see all hospitals
✅ **Regular Users** - See only their hospital

**Next:** Apply to all other pages/modules! 🚀
