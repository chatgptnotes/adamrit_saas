# 🔐 Mock Credentials for Testing

**⚠️ IMPORTANT: These are DEMO credentials for development/testing only!**

---

## 🏥 Mock Hospitals (Tenants)

### Hospital 1: Hope Hospital
- **Subdomain:** `hope-hospital.yourapp.com`
- **Tenant ID:** `hope-001`
- **Plan:** Professional (₹15,000/month)
- **Status:** Active

### Hospital 2: XYZ Clinic
- **Subdomain:** `xyz-clinic.yourapp.com`
- **Tenant ID:** `xyz-001`
- **Plan:** Starter (₹5,000/month)
- **Status:** Trial

### Hospital 3: ABC Nursing Home
- **Subdomain:** `abc-nursing.yourapp.com`
- **Tenant ID:** `abc-001`
- **Plan:** Enterprise (₹30,000/month)
- **Status:** Active

---

## 👤 Mock User Credentials

### 🔴 SUPER ADMIN (Platform Owner)

```
Email:    superadmin@yourapp.com
Password: SuperAdmin@123
Role:     super_admin
Access:   All hospitals
```

**Can do:**
- Manage all hospitals
- View all data
- Billing & subscriptions
- System settings

---

### 🟢 HOSPITAL ADMIN

#### Hope Hospital - Admin
```
Email:    admin@hopehospital.com
Password: Admin@Hope123
Role:     admin
Tenant:   hope-hospital
```

#### XYZ Clinic - Admin
```
Email:    admin@xyzclinic.com
Password: Admin@XYZ123
Role:     admin
Tenant:   xyz-clinic
```

#### ABC Nursing - Admin
```
Email:    admin@abcnursing.com
Password: Admin@ABC123
Role:     admin
Tenant:   abc-nursing
```

**Can do:**
- Manage hospital users
- View all modules
- Hospital settings
- Reports & analytics

---

### 🔵 RECEPTION

#### Hope Hospital - Reception 1
```
Email:    reception1@hopehospital.com
Password: Reception@123
Role:     reception
Tenant:   hope-hospital
Name:     Priya Sharma
```

#### Hope Hospital - Reception 2
```
Email:    reception2@hopehospital.com
Password: Reception@456
Role:     reception
Tenant:   hope-hospital
Name:     Rahul Kumar
```

**Can do:**
- Patient registration
- OPD/IPD visits
- Billing
- Appointments

**Cannot do:**
- Delete patients
- Access settings
- Add users

---

### 🟡 LAB TECHNICIAN

#### Hope Hospital - Lab
```
Email:    lab@hopehospital.com
Password: Lab@Hope123
Role:     lab
Tenant:   hope-hospital
Name:     Dr. Suresh Patel
```

#### XYZ Clinic - Lab
```
Email:    lab@xyzclinic.com
Password: Lab@XYZ123
Role:     lab
Tenant:   xyz-clinic
Name:     Anita Singh
```

**Can do:**
- View lab orders
- Enter test results
- Print reports
- Mark samples collected

**Cannot do:**
- Create lab orders (only doctors)
- Access billing
- Edit patient info

---

### 🟣 RADIOLOGY TECHNICIAN

#### Hope Hospital - Radiology
```
Email:    radiology@hopehospital.com
Password: Radio@Hope123
Role:     radiology
Tenant:   hope-hospital
Name:     Amit Verma
```

**Can do:**
- View radiology orders
- Upload X-Ray/CT/MRI images
- Enter findings
- Print reports

**Cannot do:**
- Create orders
- Access pharmacy
- Billing

---

### 🟠 PHARMACY

#### Hope Hospital - Pharmacy
```
Email:    pharmacy@hopehospital.com
Password: Pharma@Hope123
Role:     pharmacy
Tenant:   hope-hospital
Name:     Rajesh Gupta
```

#### XYZ Clinic - Pharmacy
```
Email:    pharmacy@xyzclinic.com
Password: Pharma@XYZ123
Role:     pharmacy
Tenant:   xyz-clinic
Name:     Meena Devi
```

**Can do:**
- Medicine sales
- Stock management
- GRN (Goods Receipt Note)
- Billing

**Cannot do:**
- Change prices (admin only)
- Access lab/radiology
- Delete stock entries

---

### 🩺 DOCTOR

#### Hope Hospital - Doctor 1
```
Email:    doctor1@hopehospital.com
Password: Doctor@Hope123
Role:     doctor
Tenant:   hope-hospital
Name:     Dr. Ravi Mehta (Cardiologist)
```

#### Hope Hospital - Doctor 2
```
Email:    doctor2@hopehospital.com
Password: Doctor@Hope456
Role:     doctor
Tenant:   hope-hospital
Name:     Dr. Sunita Rao (Orthopedic)
```

**Can do:**
- View/edit patient records
- Add diagnosis
- Order lab tests
- Order radiology
- Prescribe medicines
- OT notes

**Cannot do:**
- Access billing details
- Delete patients
- Manage hospital settings

---

### 👩‍⚕️ NURSE

#### Hope Hospital - Nurse 1
```
Email:    nurse1@hopehospital.com
Password: Nurse@Hope123
Role:     nurse
Tenant:   hope-hospital
Name:     Sister Mary
```

#### Hope Hospital - Nurse 2
```
Email:    nurse2@hopehospital.com
Password: Nurse@Hope456
Role:     nurse
Tenant:   hope-hospital
Name:     Kavita Sharma
```

**Can do:**
- Record vitals
- Nursing notes
- Mark medications given
- Update care plans

**Cannot do:**
- Change diagnosis
- Order tests
- Prescribe medicines
- Discharge patients

---

## 📊 Mock Patients

### Patient 1
```
ID:      PAT001
Name:    Ram Kumar
Age:     45
Gender:  Male
Phone:   9876543210
Email:   ram.kumar@example.com
Address: Delhi
```

### Patient 2
```
ID:      PAT002
Name:    Sita Devi
Age:     32
Gender:  Female
Phone:   9876543211
Email:   sita.devi@example.com
Address: Mumbai
```

### Patient 3
```
ID:      PAT003
Name:    Raj Sharma
Age:     28
Gender:  Male
Phone:   9876543212
Email:   raj.sharma@example.com
Address: Bangalore
```

---

## 💳 Mock Payment Details

### Test Card (Razorpay Test Mode)
```
Card Number:  4111 1111 1111 1111
Expiry:       12/25
CVV:          123
Name:         Test User
```

### Test UPI
```
UPI ID:       success@razorpay
Status:       Will succeed
```

```
UPI ID:       failure@razorpay
Status:       Will fail (for testing failure scenarios)
```

---

## 🏦 Mock Subscription Plans

### Starter Plan
```
Plan ID:      starter-001
Price:        ₹5,000/month
Features:     
  - 100 patients
  - 5 users
  - OPD + Billing
  - 5GB storage
```

### Professional Plan
```
Plan ID:      pro-001
Price:        ₹15,000/month
Features:     
  - 500 patients
  - 20 users
  - All modules
  - 50GB storage
  - WhatsApp integration
```

### Enterprise Plan
```
Plan ID:      enterprise-001
Price:        ₹30,000/month
Features:     
  - Unlimited patients
  - Unlimited users
  - All modules
  - Unlimited storage
  - API access
```

---

## 🔧 Database Seed Script

```sql
-- File: supabase/migrations/seed_mock_data.sql

-- 1. Create Mock Hospitals
INSERT INTO tenants (id, name, subdomain, email, plan_id, subscription_status) VALUES
  ('hope-001', 'Hope Multi-Specialty Hospital', 'hope-hospital', 'admin@hopehospital.com', 'pro-001', 'active'),
  ('xyz-001', 'XYZ Clinic', 'xyz-clinic', 'admin@xyzclinic.com', 'starter-001', 'trial'),
  ('abc-001', 'ABC Nursing Home', 'abc-nursing', 'admin@abcnursing.com', 'enterprise-001', 'active');

-- 2. Create Mock Users
INSERT INTO "User" (email, password, role, tenant_id, hospital_type) VALUES
  -- Super Admin
  ('superadmin@yourapp.com', '$2a$10$hashedpassword', 'super_admin', NULL, NULL),
  
  -- Hope Hospital
  ('admin@hopehospital.com', '$2a$10$hashedpassword', 'admin', 'hope-001', 'hope'),
  ('reception1@hopehospital.com', '$2a$10$hashedpassword', 'reception', 'hope-001', 'hope'),
  ('reception2@hopehospital.com', '$2a$10$hashedpassword', 'reception', 'hope-001', 'hope'),
  ('lab@hopehospital.com', '$2a$10$hashedpassword', 'lab', 'hope-001', 'hope'),
  ('radiology@hopehospital.com', '$2a$10$hashedpassword', 'radiology', 'hope-001', 'hope'),
  ('pharmacy@hopehospital.com', '$2a$10$hashedpassword', 'pharmacy', 'hope-001', 'hope'),
  ('doctor1@hopehospital.com', '$2a$10$hashedpassword', 'doctor', 'hope-001', 'hope'),
  ('doctor2@hopehospital.com', '$2a$10$hashedpassword', 'doctor', 'hope-001', 'hope'),
  ('nurse1@hopehospital.com', '$2a$10$hashedpassword', 'nurse', 'hope-001', 'hope'),
  
  -- XYZ Clinic
  ('admin@xyzclinic.com', '$2a$10$hashedpassword', 'admin', 'xyz-001', 'xyz'),
  ('lab@xyzclinic.com', '$2a$10$hashedpassword', 'lab', 'xyz-001', 'xyz'),
  ('pharmacy@xyzclinic.com', '$2a$10$hashedpassword', 'pharmacy', 'xyz-001', 'xyz');

-- 3. Create Mock Patients
INSERT INTO patients (id, name, age, gender, phone, email, address, tenant_id) VALUES
  ('PAT001', 'Ram Kumar', 45, 'Male', '9876543210', 'ram.kumar@example.com', 'Delhi', 'hope-001'),
  ('PAT002', 'Sita Devi', 32, 'Female', '9876543211', 'sita.devi@example.com', 'Mumbai', 'hope-001'),
  ('PAT003', 'Raj Sharma', 28, 'Male', '9876543212', 'raj.sharma@example.com', 'Bangalore', 'hope-001');
```

---

## 🧪 Testing Scenarios

### Scenario 1: Patient Registration (Reception)
```
1. Login as: reception1@hopehospital.com
2. Go to: Patients → Register New
3. Fill details from Mock Patient 1
4. Save
5. Verify: Patient appears in list
```

### Scenario 2: Lab Order (Doctor) & Result Entry (Lab)
```
1. Login as: doctor1@hopehospital.com
2. Open patient: Ram Kumar
3. Order lab test: CBC
4. Logout

5. Login as: lab@hopehospital.com
6. View pending tests
7. Enter results for CBC
8. Save
9. Print report
```

### Scenario 3: Cross-Tenant Isolation
```
1. Login as: admin@hopehospital.com
2. Try to access XYZ Clinic data
3. Should fail: Access denied

4. Login as: superadmin@yourapp.com
5. Can view both hospitals ✅
```

### Scenario 4: Role-Based Access
```
1. Login as: reception1@hopehospital.com
2. Try to access Settings
3. Should fail: No permission

4. Try to delete patient
5. Should fail: No delete permission
```

---

## ⚠️ Security Notes

### DO NOT use these credentials in production!

**Before production:**
1. ✅ Change ALL passwords
2. ✅ Use strong passwords (16+ characters)
3. ✅ Enable 2FA for admins
4. ✅ Implement password reset
5. ✅ Add account lockout after failed attempts
6. ✅ Log all login attempts

### Password Policy (Production)
```
Minimum Length: 12 characters
Required:
  - Uppercase letters
  - Lowercase letters
  - Numbers
  - Special characters
  
Expiry: 90 days (for admins)
History: Cannot reuse last 5 passwords
```

---

## 📝 Quick Login Cheat Sheet

```
TESTING ROLES:
┌─────────────────┬──────────────────────────────────┬─────────────────┐
│ Role            │ Email                            │ Password        │
├─────────────────┼──────────────────────────────────┼─────────────────┤
│ Super Admin     │ superadmin@yourapp.com           │ SuperAdmin@123  │
│ Hospital Admin  │ admin@hopehospital.com           │ Admin@Hope123   │
│ Reception       │ reception1@hopehospital.com      │ Reception@123   │
│ Lab             │ lab@hopehospital.com             │ Lab@Hope123     │
│ Radiology       │ radiology@hopehospital.com       │ Radio@Hope123   │
│ Pharmacy        │ pharmacy@hopehospital.com        │ Pharma@Hope123  │
│ Doctor          │ doctor1@hopehospital.com         │ Doctor@Hope123  │
│ Nurse           │ nurse1@hopehospital.com          │ Nurse@Hope123   │
└─────────────────┴──────────────────────────────────┴─────────────────┘
```

---

## 🔄 Resetting Mock Data

```bash
# To reset all mock data:
psql -f supabase/migrations/reset_mock_data.sql

# Then re-seed:
psql -f supabase/migrations/seed_mock_data.sql
```

---

## 📞 Support

If mock credentials not working:
1. Check database is seeded
2. Verify tenant_id matches
3. Check RLS policies are enabled
4. Review error logs

---

**Created:** 2025-02-27  
**Status:** Development/Testing ONLY  
**⚠️ WARNING:** Never use in production!
