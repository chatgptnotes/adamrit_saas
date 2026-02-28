# Radiology Page - Visit ID & Visit Type Update

## ✅ Changes Made

### 1. Fixed Visit ID Display
**Problem:** Visit ID column showing long UUID instead of readable ID
**Solution:** Changed to show `patients_id` (e.g., 1H26826829)

**Before:**
```
Visit ID: 7ebc848d-15d8-40ed-bb36-14e27b237610
```

**After:**
```
Visit ID: 1H26826829
```

---

### 2. Added Visit Type Column
**New Column:** Visit Type (IPD/OPD)
**Position:** After Visit ID column

**Features:**
- ✅ Shows whether visit is IPD or OPD
- ✅ Color-coded badges:
  - **IPD** → Purple badge (bg-purple-100)
  - **OPD** → Green badge (bg-green-100)
- ✅ Only shows for first row of each patient group

---

## 📊 Table Structure (Updated)

| Column | Description | Display |
|--------|-------------|---------|
| Sr.No | Serial number | 1, 2, 3... |
| Sex | Patient gender | 👨‍⚕️ / 👩‍⚕️ |
| Patient Name | Patient name | Bold for first row |
| Visit ID | Patient ID | patients_id (1H26826829) |
| **Visit Type** | **IPD/OPD** | **Badge (Purple/Green)** ← NEW! |
| Service | Radiology test | MRI BRAIN, X-RAY, etc. |
| Primary care provider | Doctor | - |
| Status | Order status | Ordered/Completed |
| Order Date | Date ordered | 28/02/2026, 14:13:26 |
| Enter Rad Result | Edit button | ✏️ |
| View DICOM Image | View button | 👁️ |

---

## 🎨 Visual Design

### IPD Visit:
```
Visit Type: [IPD] (Purple badge)
           Purple background
           Purple border
           Purple text
```

### OPD Visit:
```
Visit Type: [OPD] (Green badge)
           Green background
           Green border
           Green text
```

---

## 📝 Code Changes

### File: `src/components/radiology/EnhancedRadiologyOrders.tsx`

#### 1. Updated Query (Line ~80)
**Added:** `visit_type` to visits selection

```typescript
visits:visit_id (
  id,
  patient_id,
  visit_type,  // ← NEW!
  patients:patient_id (
    name,
    age,
    gender,
    phone,
    patients_id,
    address
  )
)
```

#### 2. Updated Data Grouping (Line ~130)
**Added:** `visitType` to grouped data

```typescript
const groupedByVisit = {};
(data || []).forEach((item) => {
  const patient = item.visits?.patients;
  const visitType = item.visits?.visit_type;  // ← NEW!
  const visitKey = item.visit_id || `unknown-${item.id}`;
  
  if (!groupedByVisit[visitKey]) {
    groupedByVisit[visitKey] = {
      patient: patient,
      visitId: item.visit_id,
      visitType: visitType,  // ← NEW!
      orders: []
    };
  }
  
  groupedByVisit[visitKey].orders.push(item);
});
```

#### 3. Updated Transformation (Line ~150)
**Changed:** Visit ID to use `patients_id`
**Added:** `visitType` field

```typescript
transformedData.push({
  id: item.id,
  srNo: isFirstOrderForVisit ? serialNumber : '',
  sex: isFirstOrderForVisit ? (patient?.gender || 'Unknown') : '',
  patientName: isFirstOrderForVisit ? (patient?.name || 'Unknown Patient') : '',
  patientId: isFirstOrderForVisit ? (patient?.patients_id || visitId || 'Unknown Visit ID') : '',  // ← CHANGED!
  visitType: isFirstOrderForVisit ? (visitType || 'OPD') : '',  // ← NEW!
  service: radiologyInfo?.name || 'Unknown Service',
  // ... rest
});
```

#### 4. Updated Table Header (Line ~425)
**Added:** Visit Type column

```typescript
<TableHeader>
  <TableRow className="bg-gray-100">
    <TableHead className="w-16">Sr.No</TableHead>
    <TableHead className="w-16">Sex</TableHead>
    <TableHead className="min-w-[150px]">Patient Name</TableHead>
    <TableHead className="min-w-[120px]">Visit ID</TableHead>
    <TableHead className="w-24">Visit Type</TableHead>  {/* ← NEW! */}
    <TableHead className="min-w-[200px]">Service</TableHead>
    // ... rest
  </TableRow>
</TableHeader>
```

#### 5. Updated Table Body (Line ~455)
**Added:** Visit Type badge cell

```typescript
<TableCell>
  {order.visitType && (
    <Badge 
      variant="outline"
      className={
        order.visitType === 'IPD' 
          ? 'bg-purple-100 text-purple-700 border-purple-300' 
          : 'bg-green-100 text-green-700 border-green-300'
      }
    >
      {order.visitType}
    </Badge>
  )}
</TableCell>
```

---

## 🧪 Testing

### Test Case 1: IPD Patient
**Expected:**
- ✅ Visit ID shows patients_id (e.g., 1H26826829)
- ✅ Visit Type shows purple [IPD] badge
- ✅ Badge only on first row of patient group

### Test Case 2: OPD Patient
**Expected:**
- ✅ Visit ID shows patients_id
- ✅ Visit Type shows green [OPD] badge
- ✅ Badge only on first row of patient group

### Test Case 3: Multiple Tests for Same Patient
**Expected:**
- ✅ First row: Has Visit ID + Visit Type badge
- ✅ Subsequent rows: Empty Visit ID + Visit Type cells
- ✅ All rows grouped together with border

---

## 🎯 Benefits

✅ **Clear Visit ID:** No more confusing UUIDs
✅ **Visit Type Visible:** Easy to distinguish IPD vs OPD
✅ **Color Coding:** Quick visual identification
✅ **Professional:** Clean, organized table layout
✅ **User Friendly:** Better UX for radiology staff

---

## 🔧 Database Requirements

**Visits Table Must Have:**
- `visit_type` column (VARCHAR)
- Values: 'IPD' or 'OPD'

**If missing, run:**
```sql
ALTER TABLE visits 
ADD COLUMN IF NOT EXISTS visit_type VARCHAR DEFAULT 'OPD';
```

---

## 📸 Example Table Layout

```
┌────┬────┬──────────────────┬────────────┬───────────┬────────────────────┬──────┐
│Sr.No│Sex │ Patient Name    │ Visit ID   │Visit Type │ Service            │Status│
├────┼────┼──────────────────┼────────────┼───────────┼────────────────────┼──────┤
│ 1  │👨‍⚕️│KHADAGRAM BUDDHA..│1H26826829 │ [IPD]     │ MRI BRAIN WITH...  │Order │
│    │    │                  │            │   🟣      │ x-ray chest        │Order │
├────┼────┼──────────────────┼────────────┼───────────┼────────────────────┼──────┤
│ 2  │👩‍⚕️│ ram siya patel   │609648B3... │ [OPD]     │ x-ray chest        │Order │
│    │    │                  │            │   🟢      │                    │      │
└────┴────┴──────────────────┴────────────┴───────────┴────────────────────┴──────┘

🟣 = Purple badge (IPD)
🟢 = Green badge (OPD)
```

---

**Implementation Date:** 2026-02-28
**Developer:** ClawdBot 🦞
**Status:** ✅ Complete

---

## 🚀 How to Test

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Navigate to Radiology page: `http://localhost:8080/radiology`

3. Check the table:
   - ✅ Visit ID column shows readable IDs (1H26826829)
   - ✅ Visit Type column shows IPD/OPD badges
   - ✅ IPD = Purple badge
   - ✅ OPD = Green badge

4. Verify grouping:
   - ✅ First row of patient has Visit ID + Visit Type
   - ✅ Subsequent rows are empty in those columns
   - ✅ Patient groups clearly separated

---

## 📋 Summary

**Fixed:** Visit ID now shows `patients_id` instead of UUID
**Added:** Visit Type column with color-coded IPD/OPD badges
**Result:** Better UX, clearer information, professional look! 🎉
