# Role-Based Automatic Navigation - Implementation Guide

## ✅ Feature Overview

**What it does:**
When a user logs in, they are automatically redirected to their primary work area based on their role.

**Example:**
- Lab user logs in → Auto-navigates to `/lab` page
- Radiology user logs in → Auto-navigates to `/radiology` page
- Pharmacy user logs in → Auto-navigates to `/pharmacy` page
- Reception logs in → Auto-navigates to `/todays-ipd` (IPD Dashboard)

---

## 🎯 Role-to-Route Mapping

| Role | Default Landing Page | Route |
|------|---------------------|-------|
| **Super Admin** | Dashboard | `/dashboard` |
| **Admin** | Dashboard | `/dashboard` |
| **Lab** | Lab Management | `/lab` |
| **Radiology** | Radiology | `/radiology` |
| **Pharmacy** | Pharmacy | `/pharmacy` |
| **Doctor** | Patient Dashboard | `/patient-dashboard` |
| **Nurse** | Patient Dashboard | `/patient-dashboard` |
| **Reception** | IPD Dashboard | `/todays-ipd` |
| **Accountant** | Accounting | `/accounting` |
| **Marketing Manager** | Marketing | `/marketing` |
| **User** | Dashboard | `/dashboard` |

---

## 📁 Files Created/Modified

### 1. New Utility File ✅
**File:** `src/utils/roleNavigation.ts`

**Functions:**
- `getRoleDefaultRoute(role: string)` - Returns route path for role
- `getRoleDefaultPageName(role: string)` - Returns friendly page name

**Usage:**
```typescript
import { getRoleDefaultRoute } from '@/utils/roleNavigation';

const route = getRoleDefaultRoute('lab'); // Returns '/lab'
const route = getRoleDefaultRoute('pharmacy'); // Returns '/pharmacy'
```

---

### 2. Updated LoginPage ✅
**File:** `src/components/LoginPage.tsx`

**Changes:**
- Imported `useNavigate` from react-router-dom
- Imported `getRoleDefaultRoute` utility
- Updated `handleLogin` to redirect after successful login
- Reads user role from localStorage
- Navigates to role-specific page

**Login Flow:**
```
1. User enters credentials
2. Login API call
3. User data saved to localStorage
4. Read user role
5. Get default route for role
6. Navigate to that route ✅
```

---

### 3. New RoleBasedRedirect Component ✅
**File:** `src/components/RoleBasedRedirect.tsx`

**Purpose:**
Handles automatic redirect when user is already logged in and visits root path (`/`)

**Logic:**
- Runs on every route change
- Checks if user is authenticated
- If on root path or `/dashboard`
- Redirects to role-specific page

**Example:**
```
User logged in as Lab → Visits '/' → Auto-redirects to '/lab'
```

---

### 4. Updated App.tsx ✅
**File:** `src/App.tsx`

**Changes:**
- Imported `RoleBasedRedirect` component
- Added `<RoleBasedRedirect />` inside BrowserRouter
- Ensures redirect logic runs on app mount

---

## 🔄 How It Works

### Scenario 1: Fresh Login
```
1. User on login page
2. Enters email + password
3. Clicks "Sign In"
4. ✅ Login successful
5. Read role from user data
6. Map role to default route
7. Navigate to that route
8. User sees their work area immediately!
```

### Scenario 2: Already Logged In (Page Refresh)
```
1. User already logged in (token in localStorage)
2. Opens app or refreshes page
3. App loads user from localStorage
4. RoleBasedRedirect component runs
5. Detects user on root path
6. Gets role-specific route
7. Auto-redirects to that page
8. User sees their work area!
```

### Scenario 3: Manual Navigation
```
1. User manually types '/' in URL
2. RoleBasedRedirect detects
3. Checks user role
4. Redirects to role-specific page
5. User can't stay on root path
```

---

## 🧪 Testing Guide

### Test Case 1: Lab User Login
**Steps:**
1. Logout (if logged in)
2. Go to login page
3. Enter lab user credentials
4. Click "Sign In"

**Expected Result:**
✅ Redirects to `/lab` page
✅ Lab dashboard loads
✅ Sidebar shows Lab menu highlighted

---

### Test Case 2: Pharmacy User Login
**Steps:**
1. Logout
2. Login with pharmacy credentials

**Expected Result:**
✅ Redirects to `/pharmacy` page
✅ Pharmacy dashboard loads

---

### Test Case 3: Radiology User Login
**Steps:**
1. Logout
2. Login with radiology credentials

**Expected Result:**
✅ Redirects to `/radiology` page
✅ Radiology dashboard loads

---

### Test Case 4: Reception User Login
**Steps:**
1. Logout
2. Login with reception credentials

**Expected Result:**
✅ Redirects to `/todays-ipd` (IPD Dashboard)
✅ Today's IPD dashboard loads

---

### Test Case 5: Doctor User Login
**Steps:**
1. Logout
2. Login with doctor credentials

**Expected Result:**
✅ Redirects to `/patient-dashboard`
✅ Patient dashboard loads

---

### Test Case 6: Super Admin Login
**Steps:**
1. Logout
2. Login with super admin credentials

**Expected Result:**
✅ Redirects to `/dashboard`
✅ Main dashboard loads
✅ Has access to all pages

---

### Test Case 7: Page Refresh (Lab User)
**Steps:**
1. Login as Lab user
2. Navigate to `/pharmacy` (different page)
3. Refresh browser (F5)

**Expected Result:**
✅ Stays on `/pharmacy` (doesn't redirect if on non-root path)

---

### Test Case 8: Root Path Visit (Already Logged In)
**Steps:**
1. Login as Pharmacy user
2. Manually type `localhost:8080/` in URL
3. Press Enter

**Expected Result:**
✅ Auto-redirects to `/pharmacy`
✅ Cannot stay on root path

---

## 🎨 User Experience

### Before (Old Behavior):
```
User logs in → Always lands on Dashboard → Manually navigates to their page
```
**Example:** Lab user logs in → Dashboard loads → Clicks "Lab" in sidebar → Lab page loads
- ❌ Extra click needed
- ❌ Wastes time

### After (New Behavior):
```
User logs in → Directly lands on their work page
```
**Example:** Lab user logs in → Lab page loads immediately
- ✅ No extra clicks
- ✅ Saves time
- ✅ Better UX

---

## 🛠️ Customization

### Change Default Route for a Role:

Edit `src/utils/roleNavigation.ts`:

```typescript
const roleRouteMap: Record<UserRole, string> = {
  // Change this:
  lab: '/lab',
  
  // To this (if you want lab users to go to patient dashboard instead):
  lab: '/patient-dashboard',
};
```

### Add New Role:

```typescript
const roleRouteMap: Record<UserRole, string> = {
  // ... existing roles
  
  // Add new role:
  new_role: '/new-role-page',
};
```

---

## 🐛 Troubleshooting

### Issue: Redirect not working after login
**Solution:**
- Check browser console for errors
- Verify user role is saved in localStorage: `localStorage.getItem('hmis_user')`
- Check if role exists in roleRouteMap

### Issue: Keeps redirecting to dashboard
**Solution:**
- Role might not be in the mapping
- Check role spelling (case-sensitive)
- Ensure role matches exactly (e.g., 'lab' not 'Lab')

### Issue: Infinite redirect loop
**Solution:**
- Check RoleBasedRedirect logic
- Ensure default route is different from current path
- Clear localStorage and re-login

---

## 📊 Benefits

✅ **Better UX** - Users land directly on their work area
✅ **Time Saving** - No need to click sidebar every time
✅ **Role Clarity** - Each role has a clear default page
✅ **Professional** - Modern app behavior
✅ **Flexible** - Easy to change routes per role
✅ **Automatic** - Works on login AND page refresh

---

## 🚀 Future Enhancements (Optional)

1. **Remember Last Page** - Instead of default route, redirect to last visited page
2. **Custom Preferences** - Let users set their own landing page
3. **Dashboard Widgets** - Show role-specific widgets on dashboard
4. **Onboarding** - First-time login shows tutorial for that role

---

**Implementation Date:** 2026-02-28
**Developer:** ClawdBot 🦞
**Status:** ✅ Complete and Ready for Testing

---

## Quick Test Checklist

- [ ] Lab user → `/lab`
- [ ] Radiology user → `/radiology`
- [ ] Pharmacy user → `/pharmacy`
- [ ] Reception → `/todays-ipd`
- [ ] Doctor → `/patient-dashboard`
- [ ] Admin → `/dashboard`
- [ ] Page refresh maintains current page
- [ ] Root path visit redirects to role page
- [ ] Logout works correctly
- [ ] Login redirect is instant (no delay)
