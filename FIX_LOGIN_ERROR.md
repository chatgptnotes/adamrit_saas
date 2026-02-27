# 🔧 Fix Login Error - Step by Step Guide

**Error:** 406 Not Acceptable when trying to login

**Cause:** Users don't exist in database + RLS blocking queries

---

## ⚡ Quick Fix (5 Minutes)

### Step 1: Open Supabase Dashboard

```
1. Go to: https://supabase.com
2. Login
3. Select your project
4. Click "SQL Editor" in left sidebar
```

### Step 2: Run This SQL

```
1. Click "New query"
2. Copy the entire content from: QUICK_FIX_LOGIN.sql
3. Paste in SQL editor
4. Click "Run" button (or Ctrl+Enter)
```

**Or copy-paste this:**

```sql
-- Create mock users
INSERT INTO "User" (email, password, role, hospital_type, is_active)
VALUES 
  ('admin@hopehospital.com', 'Admin@Hope123', 'admin', 'hope', true),
  ('reception1@hopehospital.com', 'Reception@123', 'reception', 'hope', true),
  ('lab@hopehospital.com', 'Lab@Hope123', 'lab', 'hope', true),
  ('pharmacy@hopehospital.com', 'Pharma@Hope123', 'pharmacy', 'hope', true),
  ('doctor1@hopehospital.com', 'Doctor@Hope123', 'doctor', 'hope', true),
  ('superadmin@yourapp.com', 'SuperAdmin@123', 'super_admin', NULL, true)
ON CONFLICT (email) DO NOTHING;

-- Fix RLS for login
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow login for all users" ON "User"
  FOR SELECT USING (true);

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
```

### Step 3: Verify Users Created

Run this query:
```sql
SELECT email, role, hospital_type FROM "User" 
WHERE email LIKE '%hopehospital.com';
```

Should show:
```
admin@hopehospital.com    | admin     | hope
reception1@hopehospital.com | reception | hope
lab@hopehospital.com      | lab       | hope
... etc
```

### Step 4: Test Login

```
1. Refresh your app: http://localhost:8081/
2. Click "🟢 Admin" button
3. Click "Sign In"
4. ✅ Should work now!
```

---

## 🐛 If Still Not Working

### Check 1: User Table Exists?

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'User';
```

**If empty:** Create table first
```sql
CREATE TABLE "User" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  hospital_type TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Check 2: RLS Policies

```sql
-- See current policies
SELECT * FROM pg_policies WHERE tablename = 'User';

-- If blocking, temporarily disable for testing
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
```

### Check 3: Supabase URL Correct?

Check `.env` file:
```bash
cat .env | grep SUPABASE
```

Should match:
```
VITE_SUPABASE_URL=https://xvkxccqaopbnkvwgyfjv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🎯 Alternative: Use Existing Users

If you already have users in the database:

### Check Existing Users
```sql
SELECT email, role FROM "User" LIMIT 10;
```

### Use Those Credentials
Update `LoginPage.tsx` buttons with actual emails.

---

## 📊 Understanding the Error

### 406 Error Means:
```
❌ Supabase RLS blocked the query
❌ Missing SELECT policy on User table
❌ User table doesn't exist
```

### How RLS Works:
```sql
-- Without policy: 406 error
SELECT * FROM "User" WHERE email = 'admin@hopehospital.com';
-- Result: Error 406

-- With permissive policy:
CREATE POLICY "public_select" ON "User" FOR SELECT USING (true);
-- Result: ✅ Works!
```

---

## 🔒 Security Note

**For Development:**
```sql
-- Permissive (for testing)
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
```

**For Production:**
```sql
-- Secure policies
CREATE POLICY "Users can read own record" ON "User"
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Login allowed" ON "User"
  FOR SELECT USING (true); -- Only for login query
```

---

## ✅ Checklist

After running fix:

- [ ] Users created in database
- [ ] RLS policy allows SELECT
- [ ] Can query User table in SQL editor
- [ ] Login works in app
- [ ] Quick Login buttons work

---

## 🚀 Next Steps

Once login works:

1. **Create more test data:**
   - Patients
   - Visits
   - Lab tests

2. **Test role-based access:**
   - Login as different roles
   - Check permissions

3. **Review RLS policies:**
   - Make them secure for production
   - Test data isolation

---

## 💡 Pro Tip

**Quick Test in SQL Editor:**
```sql
-- Simulate login query
SELECT * FROM "User" 
WHERE email = 'admin@hopehospital.com' 
AND password = 'Admin@Hope123';

-- If this works in SQL editor but not in app:
-- → RLS policy issue
-- → Check anon key permissions
```

---

**Run the SQL and you're done!** ✨
