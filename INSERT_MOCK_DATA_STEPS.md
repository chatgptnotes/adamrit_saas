# 🚀 Mock Data Insert Karne Ke Steps

## Method 1: Supabase Dashboard (Easiest) ⭐

### Step 1: Supabase Dashboard Kholo
1. Browser me jao: https://supabase.com
2. Login karo
3. Apna project select karo

### Step 2: SQL Editor Me Jao
1. Left sidebar me "SQL Editor" click karo
2. "New query" button click karo

### Step 3: SQL Paste Karo
```bash
# Terminal me ye command run karo (file copy hoga)
cat supabase/migrations/seed_mock_data.sql
```

1. Output ko copy karo (Ctrl+C / Cmd+C)
2. Supabase SQL Editor me paste karo (Ctrl+V / Cmd+V)
3. "Run" button click karo (ya Ctrl+Enter / Cmd+Enter)

### Step 4: Verify Karo
Success message dikhega:
```
✅ Mock data seeded successfully!

Tenants created: 3
  • hope-001: Hope Multi-Specialty Hospital
  • xyz-001: XYZ Medical Clinic
  • abc-001: ABC Nursing Home

Users created: 20+
Patients created: 10
```

---

## Method 2: Terminal Se (If you have psql)

```bash
# 1. CD to project
cd ~/Hope_projects/adamrit_23oct2025

# 2. Run seed script
psql "postgresql://YOUR_CONNECTION_STRING" -f supabase/migrations/seed_mock_data.sql

# Or if using Supabase CLI:
supabase db push
```

---

## Method 3: Manual Insert (Small data)

Agar sirf 2-3 users chahiye testing ke liye:

```sql
-- Run this in Supabase SQL Editor

-- 1. Create one hospital
INSERT INTO tenants (id, name, subdomain, email, subscription_status) 
VALUES ('hope-001', 'Hope Hospital', 'hope-hospital', 'admin@hope.com', 'active');

-- 2. Create admin user
INSERT INTO "User" (email, password, role, tenant_id, hospital_type) 
VALUES ('admin@hope.com', 'Admin@123', 'admin', 'hope-001', 'hope');

-- 3. Create one patient
INSERT INTO patients (name, age, gender, phone, tenant_id, hospital_name) 
VALUES ('Test Patient', 30, 'Male', '9999999999', 'hope-001', 'hope');
```

---

## ✅ Verification

### Check Users
```sql
SELECT email, role, tenant_id FROM "User" WHERE email LIKE '%hope%';
```

### Check Patients
```sql
SELECT name, age, phone FROM patients WHERE tenant_id = 'hope-001';
```

### Check Hospitals
```sql
SELECT id, name, subdomain, subscription_status FROM tenants;
```

---

## 🔐 Test Login After Seeding

```
Email:    admin@hopehospital.com
Password: Admin@Hope123
```

If it works, mock data successfully inserted! 🎉
