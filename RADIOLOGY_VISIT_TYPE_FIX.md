# Radiology Visit Type Fix - IPD/OPD Display

## 🐛 Problem

**Issue:** Visit Type column not showing IPD/OPD
**Root Cause:** Code was fetching `visit_type` column (which has "consultation") instead of `reason_for_visit` column (which has "IPD"/"OPD")

---

## 📊 Database Structure

### Visits Table Columns:
- `visit_type` → Contains: "consultation" (not what we need)
- `reason_for_visit` → Contains: "IPD" or "OPD" (this is what we need!) ✅

**Example Data:**
```
visit_type: consultation
reason_for_visit: IPD  ← We want this!
```

---

## ✅ Solution

Changed query to fetch `reason_for_visit` instead of `visit_type`

### Before (Wrong):
```typescript
visits:visit_id (
  id,
  patient_id,
  visit_type,  // ❌ This has "consultation"
  patients:patient_id (...)
)
```

### After (Correct):
```typescript
visits:visit_id (
  id,
  patient_id,
  visit_type,
  reason_for_visit,  // ✅ This has "IPD"/"OPD"
  patients:patient_id (...)
)
```

---

## 🔧 Code Changes

### File: `src/components/radiology/EnhancedRadiologyOrders.tsx`

#### Change 1: Updated Query (Line ~80)
**Added:** `reason_for_visit` field

```typescript
visits:visit_id (
  id,
  patient_id,
  visit_type,
  reason_for_visit,  // ← ADDED
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

#### Change 2: Updated Data Grouping (Line ~130)
**Changed:** Use `reason_for_visit` for visit type

```typescript
// OLD:
const visitType = item.visits?.visit_type; // ❌ Gets "consultation"

// NEW:
const reasonForVisit = item.visits?.reason_for_visit; // ✅ Gets "IPD"/"OPD"
```

```typescript
groupedByVisit[visitKey] = {
  patient: patient,
  visitId: item.visit_id,
  visitType: reasonForVisit, // ✅ Now has IPD/OPD
  orders: []
};
```

---

## 🎯 Result

**Now the table will show:**
```
Visit Type Column:
- [IPD] with purple badge 🟣
- [OPD] with green badge 🟢
```

**Example:**
```
Patient: KHADAGRAM BUDDHULAL
Visit ID: 1H26826829
Visit Type: [IPD]  ← Purple badge (from reason_for_visit)
```

---

## 🧪 Testing

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Open Radiology page:**
   ```
   http://localhost:8080/radiology
   ```

3. **Check table:**
   - ✅ Visit Type column should now show IPD/OPD badges
   - ✅ IPD = Purple badge
   - ✅ OPD = Green badge
   - ✅ Data from `reason_for_visit` column

4. **Verify in database:**
   - Open Supabase → visits table
   - Check `reason_for_visit` column has IPD/OPD
   - This data should match what's displayed in app

---

## 📝 Summary

**Problem:** Wrong column used for IPD/OPD
**Solution:** Changed from `visit_type` to `reason_for_visit`
**Result:** IPD/OPD badges now display correctly! ✅

---

**Fix Date:** 2026-02-28
**Developer:** ClawdBot 🦞
**Status:** ✅ Fixed

---

## 🔍 Database Schema Reference

### Visits Table:
```
┌─────────────────┬────────────────┬──────────────────┐
│ Column Name     │ Data Type      │ Example Value    │
├─────────────────┼────────────────┼──────────────────┤
│ id              │ uuid           │ 2d7d8d8d-...     │
│ patient_id      │ uuid           │ 24dde8b0-...     │
│ visit_type      │ text           │ "consultation"   │
│ reason_for_visit│ text           │ "IPD" or "OPD"   │ ← USE THIS!
│ visit_date      │ date           │ 2026-02-09       │
│ appointment_with│ text           │ Dr. Afzal Sheikh │
└─────────────────┴────────────────┴──────────────────┘
```

---

## ✨ Expected Behavior After Fix

### IPD Visit:
```
Row 1: KHADAGRAM BUDDHULAL | 1H26826829 | [IPD] 🟣 | MRI BRAIN...
```

### OPD Visit:
```
Row 2: ram siya patel | 609648B3... | [OPD] 🟢 | x-ray chest
```

**Badge Colors:**
- IPD → Purple background, purple text, purple border
- OPD → Green background, green text, green border
