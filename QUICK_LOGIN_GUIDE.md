# 🚀 Quick Login Guide - Development Mode

**Easy testing with pre-filled credentials!**

---

## ✨ What's New?

Login page me **Quick Test Login** section add ho gaya hai (Development mode only):

```
┌─────────────────────────────────────────┐
│  🧪 Quick Test Login (Dev Only)         │
├─────────────────────────────────────────┤
│  [🟢 Admin]      [🔵 Reception]         │
│  [🟡 Lab]        [🟠 Pharmacy]          │
│  [🩺 Doctor]     [🔴 Super Admin]       │
└─────────────────────────────────────────┘
```

---

## 🎯 How to Use

### Step 1: Start Dev Server
```bash
npm run dev
# Server starts at http://localhost:8081/
```

### Step 2: Open Login Page
```
Open: http://localhost:8081/
```

### Step 3: Click Any Button
- **🟢 Admin** - Full hospital access
- **🔵 Reception** - Patient registration & billing
- **🟡 Lab** - Lab tests & results
- **🟠 Pharmacy** - Medicine sales
- **🩺 Doctor** - Clinical access
- **🔴 Super Admin** - All hospitals (platform owner)

### Step 4: Click "Sign In"
Credentials auto-filled! Just click login button.

---

## 🔐 Quick Credentials Reference

| Role | Email | Password |
|------|-------|----------|
| 🟢 **Admin** | admin@hopehospital.com | Admin@Hope123 |
| 🔵 **Reception** | reception1@hopehospital.com | Reception@123 |
| 🟡 **Lab** | lab@hopehospital.com | Lab@Hope123 |
| 🟠 **Pharmacy** | pharmacy@hopehospital.com | Pharma@Hope123 |
| 🩺 **Doctor** | doctor1@hopehospital.com | Doctor@Hope123 |
| 🔴 **Super Admin** | superadmin@yourapp.com | SuperAdmin@123 |

---

## 🧪 Testing Different Roles

### Test 1: Admin Access
```
1. Click "🟢 Admin" button
2. Click "Sign In"
3. ✅ Should see: Dashboard with ALL modules
4. ✅ Sidebar shows: Patients, OPD, IPD, Lab, Pharmacy, Billing, etc.
```

### Test 2: Reception Access
```
1. Logout (if logged in)
2. Click "🔵 Reception" button
3. Click "Sign In"
4. ✅ Should see: Dashboard with LIMITED modules
5. ✅ Sidebar shows: Patients, OPD, IPD, Billing
6. ❌ Lab, Pharmacy (read-only or hidden)
```

### Test 3: Lab Access
```
1. Logout
2. Click "🟡 Lab" button
3. Click "Sign In"
4. ✅ Should see: Lab dashboard ONLY
5. ✅ Can: View orders, enter results, print reports
6. ❌ Cannot: Access billing, create orders
```

### Test 4: Super Admin
```
1. Logout
2. Click "🔴 Super Admin" button
3. Click "Sign In"
4. ✅ Should see: Platform-wide dashboard
5. ✅ Can: View ALL hospitals, manage subscriptions
```

---

## ⚙️ Technical Details

### Where is this code?
```
File: src/components/LoginPage.tsx
Lines: Added Quick Login section (bottom of form)
```

### How it works?
```typescript
// Auto-fill credentials on button click
onClick={() => {
  setFormData({
    email: 'admin@hopehospital.com',
    password: 'Admin@Hope123'
  });
}}
```

### When does it show?
```typescript
{import.meta.env.DEV && (
  // Quick Login buttons
)}
```
Only shows when `npm run dev` (development mode)

### Production build?
```bash
npm run build
# Quick Login section automatically REMOVED
# Production users won't see test credentials
```

---

## 🔒 Security Notes

### ✅ Safe for Development
- Only visible in DEV mode (`npm run dev`)
- Auto-removed in production build
- No security risk

### ⚠️ Important
```
❌ DO NOT commit actual production passwords
❌ DO NOT use these passwords in production
✅ These are MOCK credentials for testing only
```

---

## 🛠️ Customization

### Add More Test Users

Edit: `src/components/LoginPage.tsx`

```typescript
<Button
  type="button"
  variant="outline"
  size="sm"
  onClick={() => {
    setFormData({
      email: 'your-test-user@example.com',
      password: 'YourTestPass123'
    });
  }}
  className="text-xs"
>
  🎯 Your Role
</Button>
```

### Change Button Colors

```typescript
<Button
  variant="outline"  // outline, default, destructive, secondary
  size="sm"          // sm, default, lg
  className="text-xs bg-blue-50 hover:bg-blue-100"
>
```

---

## 📊 Mock Data Status

### If Users Don't Exist in Database:

**Option 1: Create Manually** (Supabase Dashboard)
```sql
INSERT INTO "User" (email, password, role, tenant_id, hospital_type) VALUES
  ('admin@hopehospital.com', 'Admin@Hope123', 'admin', 'hope-001', 'hope');
```

**Option 2: Run Seed Script**
```bash
# See: supabase/migrations/seed_mock_data.sql
# Copy contents and run in Supabase SQL Editor
```

**Option 3: Auto-create** (Future Enhancement)
```typescript
// src/utils/mockUsers.ts
// Can auto-create users on first dev run
```

---

## 🎯 Common Workflows

### Workflow 1: Test Patient Registration
```
1. Quick Login as: 🔵 Reception
2. Go to: Patients → Register New
3. Fill form → Save
4. Logout
5. Quick Login as: 🟢 Admin
6. Verify: Patient appears in list
```

### Workflow 2: Test Lab Flow
```
1. Quick Login as: 🩺 Doctor
2. Create patient visit
3. Order lab test (CBC)
4. Logout
5. Quick Login as: 🟡 Lab
6. View pending tests
7. Enter results → Save
8. Logout
9. Quick Login as: 🩺 Doctor
10. View lab results
```

### Workflow 3: Test Role Permissions
```
1. Quick Login as: 🔵 Reception
2. Try to access: Settings
3. Should: Block or show "No permission"
4. Try to: Delete patient
5. Should: Button disabled or error
```

---

## 💡 Pro Tips

### Tip 1: Use Browser Profiles
```
Chrome/Edge: Create multiple profiles
- Profile 1: Admin
- Profile 2: Reception
- Profile 3: Lab

Test simultaneously!
```

### Tip 2: Keyboard Shortcut
```
After clicking button, just press:
Enter key → Auto login!
```

### Tip 3: Console Logging
```typescript
// Add this to see what's happening
console.log('Logged in as:', user.role, user.email);
```

### Tip 4: Save Session
```
Development server keeps you logged in
Refresh page → Still logged in
Clear localStorage to force logout
```

---

## 🐛 Troubleshooting

### Issue 1: Buttons Not Showing
```
✅ Check: npm run dev (not npm run build)
✅ Check: import.meta.env.DEV is true
✅ Check: Browser cache cleared
```

### Issue 2: Login Failed
```
❌ Cause: User doesn't exist in database
✅ Fix: Run seed_mock_data.sql
✅ Fix: Create user manually in Supabase
```

### Issue 3: Wrong Dashboard
```
❌ Cause: Role-based routing not working
✅ Fix: Check user.role in database
✅ Fix: Check AuthContext role mapping
```

---

## 📚 Related Files

```
Primary:
  src/components/LoginPage.tsx           - Login UI with Quick Login
  
Mock Data:
  MOCK_CREDENTIALS.md                    - All credentials list
  LOGIN_QUICK_REFERENCE.txt              - Quick reference
  supabase/migrations/seed_mock_data.sql - Database seed
  
Utilities:
  src/utils/mockUsers.ts                 - Mock user definitions
  src/contexts/AuthContext.tsx           - Authentication logic
```

---

## ✅ Summary

**What Changed:**
- ✅ Added Quick Login buttons (6 roles)
- ✅ One-click credential auto-fill
- ✅ DEV mode only (safe)
- ✅ No database changes needed

**How to Use:**
1. `npm run dev`
2. Click button (🟢 Admin, 🔵 Reception, etc.)
3. Click "Sign In"
4. Start testing!

**Benefits:**
- ⚡ Faster testing
- 🎯 No manual typing
- 🔄 Easy role switching
- 🧪 Perfect for development

---

**Updated:** 2025-02-27  
**Status:** ✅ Ready to use  
**Mode:** Development only
