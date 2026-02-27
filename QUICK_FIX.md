# 🚨 SUPABASE CONNECTION TIMEOUT - URGENT FIX NEEDED

## Problem
Supabase project **xvkxccqaopbnkvwgyfjv** is DOWN/PAUSED!

```
ERR_CONNECTION_TIMED_OUT
curl: (28) Connection timed out
```

## ✅ SOLUTION 1: Resume Supabase (RECOMMENDED)

### Step 1: Login to Supabase
```
https://supabase.com/dashboard
```

### Step 2: Find Your Project
- Project ID: **xvkxccqaopbnkvwgyfjv**
- Direct link: https://supabase.com/dashboard/project/xvkxccqaopbnkvwgyfjv

### Step 3: Resume Project
- Click **"Resume Project"** button
- Wait 2-3 minutes for activation
- Refresh browser at http://localhost:8081

---

## 🧪 SOLUTION 2: Temporary Mock Login (Only for UI Testing)

If you can't resume Supabase right now and just want to test the role-based UI:

### Mock Users (No Database Required)
Add this to `AuthContext.tsx` for temporary testing:

```typescript
// TEMPORARY MOCK LOGIN (Remove after Supabase is back)
const MOCK_USERS = {
  'lab@hopehospital.com': { role: 'lab', password: 'Lab@Hope123' },
  'pharmacy@hopehospital.com': { role: 'pharmacy', password: 'Pharma@Hope123' },
  'reception1@hopehospital.com': { role: 'reception', password: 'Reception@123' },
  'admin@hopehospital.com': { role: 'admin', password: 'Admin@Hope123' },
};

// In login function, add fallback before Supabase call:
if (import.meta.env.DEV) {
  const mockUser = MOCK_USERS[credentials.email];
  if (mockUser && mockUser.password === credentials.password) {
    const user = {
      id: 'mock-' + Date.now(),
      email: credentials.email,
      username: credentials.email.split('@')[0],
      role: mockUser.role,
      hospitalType: 'hope'
    };
    setUser(user);
    localStorage.setItem('hmis_user', JSON.stringify(user));
    return true;
  }
}
```

---

## ⚠️ WARNING

**The mock login is ONLY for UI testing!**
- No real data will load
- Counts will show 0
- Database operations won't work
- You MUST resume Supabase for production

---

## Next Steps

1. **Resume Supabase** (best option)
2. Test role-based UI with mock login (temporary)
3. Once Supabase is back, remove mock code
4. Run SQL to create lab/pharmacy users in database

---

## Contact Supabase Support

If project won't resume:
- Check billing: https://supabase.com/dashboard/org/_/billing
- Contact support: https://supabase.com/support
