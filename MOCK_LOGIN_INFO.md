# 🧪 TEMPORARY MOCK LOGIN ENABLED

## ⚠️ Supabase is Down
Your Supabase project is currently unreachable. Mock login has been enabled for UI testing.

## 🔑 Mock Login Credentials

### Lab User
- Email: `lab@hopehospital.com`
- Password: `Lab@Hope123`
- Access: IPD Dashboard, OPD, Lab, Patient Dashboard, Currently Admitted

### Pharmacy User
- Email: `pharmacy@hopehospital.com`
- Password: `Pharma@Hope123`
- Access: IPD Dashboard, OPD, Dashboard, Patient Dashboard, Currently Admitted, Pharmacy

### Reception User
- Email: `reception1@hopehospital.com`
- Password: `Reception@123`
- Access: IPD Dashboard, OPD, Dashboard, Patient Dashboard, Currently Admitted

### Admin User
- Email: `admin@hopehospital.com`
- Password: `Admin@Hope123`
- Access: All modules

### Doctor User
- Email: `doctor1@hopehospital.com`
- Password: `Doctor@Hope123`
- Access: Clinical modules

## ⚠️ Limitations

1. **No Real Data** - Counts will show 0, no database queries will work
2. **Sidebar Errors** - You'll see connection timeout errors in console (ignore them)
3. **UI Testing Only** - You can test role-based dashboards and sidebar filtering
4. **Mock Only in DEV** - Production won't have mock login

## ✅ What You CAN Test

- ✅ Login with different roles
- ✅ See different dashboards per role
- ✅ Sidebar menu items filtered by role
- ✅ Role-based UI layouts

## ❌ What You CAN'T Test

- ❌ Real patient data
- ❌ Database operations
- ❌ Reports
- ❌ Search functionality
- ❌ Any Supabase-dependent features

## 🔧 To Remove Mock Login

When Supabase is back online, edit `src/contexts/AuthContext.tsx` and remove this block:

```typescript
// 🧪 TEMPORARY MOCK LOGIN (for testing when Supabase is down)
// Remove this block when Supabase is back online
if (import.meta.env.DEV) {
  // ... mock login code ...
}
```

## 🚀 Next Steps

1. Test role-based UI with mock credentials
2. Resume Supabase project when possible
3. Remove mock login code
4. Run SQL to create real users
