# 🏗️ Complete SaaS Architecture
## Multi-Tenant Hospital Management System

**Vision:** Ek platform → 100+ hospitals → Unlimited users

---

## 🎭 User Roles & Access Control

```
┌─────────────────────────────────────────────────────────────┐
│                      SaaS Platform                           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │               SUPER ADMIN (Platform Owner)            │  │
│  │  - Manage all hospitals                              │  │
│  │  - Create/Delete tenants                             │  │
│  │  - View all data (cross-tenant)                      │  │
│  │  - Billing & subscriptions                           │  │
│  │  - System configuration                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│                            ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              HOSPITAL (Tenant 1)                     │   │
│  │              subdomain: hope-hospital.yourapp.com    │   │
│  │                                                       │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │ ADMIN (Hospital Owner)                      │    │   │
│  │  │ - Manage hospital settings                  │    │   │
│  │  │ - Add/Remove users                          │    │   │
│  │  │ - View all modules                          │    │   │
│  │  │ - Reports & analytics                       │    │   │
│  │  │ - Billing oversight                         │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │                    │                                 │   │
│  │                    ▼                                 │   │
│  │  ┌──────────────┬──────────────┬──────────────┐    │   │
│  │  │  RECEPTION   │     LAB      │   RADIOLOGY  │    │   │
│  │  │              │              │              │    │   │
│  │  │ - Patient    │ - Lab orders │ - X-Ray      │    │   │
│  │  │   register   │ - Test entry │ - CT/MRI     │    │   │
│  │  │ - OPD/IPD    │ - Results    │ - Reports    │    │   │
│  │  │ - Billing    │ - Print      │ - Upload     │    │   │
│  │  └──────────────┴──────────────┴──────────────┘    │   │
│  │                    │                                 │   │
│  │  ┌──────────────┬──────────────┬──────────────┐    │   │
│  │  │  PHARMACY    │   DOCTOR     │    NURSE     │    │   │
│  │  │              │              │              │    │   │
│  │  │ - Medicine   │ - Diagnosis  │ - Vitals     │    │   │
│  │  │   sales      │ - Prescribe  │ - Notes      │    │   │
│  │  │ - Stock      │ - Reports    │ - Care plan  │    │   │
│  │  │ - Inventory  │ - OT notes   │              │    │   │
│  │  └──────────────┴──────────────┴──────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              HOSPITAL (Tenant 2)                     │   │
│  │              subdomain: xyz-clinic.yourapp.com       │   │
│  │              [Same structure as Tenant 1]            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              HOSPITAL (Tenant N...)                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 👥 Role-Based Access Matrix

### 1. SUPER ADMIN (Platform Owner)
**Access Level:** FULL (All Tenants)

| Feature | Can Do |
|---------|--------|
| **Tenant Management** | ✅ Create/Delete/Suspend hospitals |
| **User Management** | ✅ View all users across tenants |
| **Billing** | ✅ Manage subscriptions, view revenue |
| **Analytics** | ✅ Platform-wide analytics |
| **Data Access** | ✅ Read-only access to all data |
| **Configuration** | ✅ System settings, feature flags |
| **Support** | ✅ Login as any hospital admin |

**Dashboard Shows:**
```
┌─────────────────────────────────────────────┐
│ SUPER ADMIN DASHBOARD                       │
├─────────────────────────────────────────────┤
│ 📊 Platform Stats                           │
│   • Total Hospitals: 127                    │
│   • Active Subscriptions: 115               │
│   • Monthly Revenue: ₹17,25,000             │
│   • Total Users: 2,847                      │
│                                              │
│ 🏥 Recent Hospitals                         │
│   • Hope Hospital (Active)                  │
│   • XYZ Clinic (Trial - 3 days left)        │
│   • ABC Nursing Home (Suspended)            │
│                                              │
│ 💰 Revenue Chart                            │
│   [Monthly revenue graph]                   │
│                                              │
│ ⚠️ Alerts                                   │
│   • 5 trials ending in 3 days               │
│   • 2 payment failures                      │
│   • 1 support ticket pending                │
└─────────────────────────────────────────────┘
```

---

### 2. HOSPITAL ADMIN (Hospital Owner)
**Access Level:** FULL (Own Hospital Only)

| Feature | Can Do |
|---------|--------|
| **User Management** | ✅ Add/Edit/Delete users (Reception, Lab, etc.) |
| **All Modules** | ✅ Access OPD, IPD, Lab, Pharmacy, Billing |
| **Reports** | ✅ All hospital reports & analytics |
| **Settings** | ✅ Hospital branding, modules, preferences |
| **Subscription** | ✅ View billing, upgrade/downgrade plan |
| **Data Export** | ✅ Export all data (patients, visits, billing) |

**Dashboard Shows:**
```
┌─────────────────────────────────────────────┐
│ ADMIN DASHBOARD - Hope Hospital             │
├─────────────────────────────────────────────┤
│ 📊 Today's Stats                            │
│   • Patients: 45 OPD, 12 IPD                │
│   • Revenue: ₹1,25,000                      │
│   • Lab Tests: 78                           │
│   • Pharmacy Sales: ₹45,000                 │
│                                              │
│ 👥 Users Online (8)                         │
│   • 2 Reception, 1 Lab, 1 Pharmacy          │
│   • 3 Doctors, 1 Nurse                      │
│                                              │
│ 📈 This Month                               │
│   • Total Patients: 1,245                   │
│   • Revenue: ₹35,00,000                     │
│   • Bed Occupancy: 85%                      │
│                                              │
│ ⚙️ Quick Actions                            │
│   • Add User | View Reports | Settings      │
└─────────────────────────────────────────────┘
```

---

### 3. RECEPTION (Front Desk)
**Access Level:** Patient Management + Billing

| Feature | Can Do | Cannot Do |
|---------|--------|-----------|
| **Patient Registration** | ✅ Register new patients | ❌ Delete patients |
| **OPD** | ✅ Create OPD visits | ❌ View other reception's patients (optional) |
| **IPD** | ✅ Admit/Discharge patients | ❌ Change diagnosis |
| **Billing** | ✅ Generate bills, receive payments | ❌ Cancel bills without approval |
| **Appointments** | ✅ Schedule appointments | ❌ Access lab results |
| **Search** | ✅ Search all patients | ❌ Access financial reports |

**Dashboard Shows:**
```
┌─────────────────────────────────────────────┐
│ RECEPTION DASHBOARD                         │
├─────────────────────────────────────────────┤
│ 📋 Today's Tasks                            │
│   • Pending Registrations: 3                │
│   • Appointments: 12 scheduled              │
│   • Bills to Print: 5                       │
│                                              │
│ 🔍 Quick Search                             │
│   [Search patient by name/phone/ID]         │
│                                              │
│ ⚡ Quick Actions                            │
│   • Register Patient                        │
│   • Create OPD Visit                        │
│   • Generate Bill                           │
│   • View Today's Patients                   │
│                                              │
│ 📊 My Stats (Today)                         │
│   • Patients Registered: 15                 │
│   • Bills Generated: 22                     │
│   • Cash Collected: ₹35,000                 │
└─────────────────────────────────────────────┘
```

---

### 4. LAB TECHNICIAN
**Access Level:** Lab Module Only

| Feature | Can Do | Cannot Do |
|---------|--------|-----------|
| **Lab Orders** | ✅ View pending orders | ❌ Create orders |
| **Test Results** | ✅ Enter test results | ❌ Edit after approval |
| **Reports** | ✅ Print lab reports | ❌ Delete reports |
| **Samples** | ✅ Mark samples collected | ❌ Access billing |
| **Quality Control** | ✅ Flag abnormal results | ❌ View patient's full history |

**Dashboard Shows:**
```
┌─────────────────────────────────────────────┐
│ LAB TECHNICIAN DASHBOARD                    │
├─────────────────────────────────────────────┤
│ 🧪 Pending Tests (18)                       │
│   Patient         Test          Status      │
│   • Ram Kumar     CBC           Sample      │
│   • Sita Devi     Blood Sugar   Pending     │
│   • Raj Sharma    Lipid Profile In Progress │
│                                              │
│ ✅ Completed Today (34)                     │
│   • View Completed                          │
│                                              │
│ ⚠️ Critical Results (2)                     │
│   • Patient #1234 - High WBC                │
│   • Patient #5678 - Low Hemoglobin          │
│                                              │
│ ⚡ Quick Actions                            │
│   • Enter Results                           │
│   • Print Reports                           │
│   • Search Tests                            │
└─────────────────────────────────────────────┘
```

---

### 5. RADIOLOGY TECHNICIAN
**Access Level:** Radiology Module Only

| Feature | Can Do | Cannot Do |
|---------|--------|-----------|
| **X-Ray Orders** | ✅ View pending orders | ❌ Create orders |
| **CT/MRI Scans** | ✅ Schedule scans | ❌ Access patient billing |
| **Upload Images** | ✅ Upload DICOM images | ❌ Delete images after 24h |
| **Reports** | ✅ Enter findings | ❌ Approve final report (Doctor only) |
| **Print** | ✅ Print radiology reports | ❌ View other modules |

**Dashboard Shows:**
```
┌─────────────────────────────────────────────┐
│ RADIOLOGY DASHBOARD                         │
├─────────────────────────────────────────────┤
│ 📸 Pending Orders (12)                      │
│   Patient         Test          Scheduled   │
│   • Ram Kumar     X-Ray Chest   10:30 AM    │
│   • Sita Devi     CT Scan       02:00 PM    │
│   • Raj Sharma    MRI Brain     Tomorrow    │
│                                              │
│ ✅ Completed Today (15)                     │
│   • View Completed                          │
│                                              │
│ 📊 Equipment Status                         │
│   • X-Ray Machine 1: Available              │
│   • CT Scanner: In Use                      │
│   • MRI Machine: Maintenance                │
│                                              │
│ ⚡ Quick Actions                            │
│   • Upload Images                           │
│   • Enter Findings                          │
│   • Print Reports                           │
└─────────────────────────────────────────────┘
```

---

### 6. PHARMACY
**Access Level:** Pharmacy Module Only

| Feature | Can Do | Cannot Do |
|---------|--------|-----------|
| **Medicine Sales** | ✅ Create sales, billing | ❌ Change medicine prices (Admin only) |
| **Stock Management** | ✅ View stock, add GRN | ❌ Delete stock entries |
| **Prescriptions** | ✅ View & fill prescriptions | ❌ Access patient medical history |
| **Returns** | ✅ Process medicine returns | ❌ Cancel bills (Admin approval needed) |
| **Inventory** | ✅ Check expiry, low stock alerts | ❌ View lab/radiology data |

**Dashboard Shows:**
```
┌─────────────────────────────────────────────┐
│ PHARMACY DASHBOARD                          │
├─────────────────────────────────────────────┤
│ 💊 Quick Stats                              │
│   • Today's Sales: ₹45,000                  │
│   • Prescriptions Filled: 56                │
│   • Low Stock Items: 8                      │
│                                              │
│ ⚠️ Alerts                                   │
│   • Paracetamol - Low Stock (50 left)       │
│   • Amoxicillin - Expiring in 30 days       │
│   • Metformin - Out of Stock                │
│                                              │
│ 📋 Pending Prescriptions (12)               │
│   Patient         Medicines       Status    │
│   • Ram Kumar     3 items         New       │
│   • Sita Devi     5 items         Partial   │
│                                              │
│ ⚡ Quick Actions                            │
│   • New Sale                                │
│   • GRN Entry                               │
│   • Stock Check                             │
└─────────────────────────────────────────────┘
```

---

### 7. DOCTOR
**Access Level:** Clinical Modules

| Feature | Can Do | Cannot Do |
|---------|--------|-----------|
| **Patient Care** | ✅ View/Edit medical records | ❌ Delete patient records |
| **Diagnosis** | ✅ Add diagnosis, prescribe | ❌ Access billing details |
| **Lab Orders** | ✅ Order lab tests | ❌ Enter test results |
| **Radiology Orders** | ✅ Order imaging | ❌ Upload images |
| **OT Notes** | ✅ Create surgery notes | ❌ Manage hospital settings |
| **Discharge Summary** | ✅ Create discharge summaries | ❌ Cancel bills |

---

### 8. NURSE
**Access Level:** Patient Care

| Feature | Can Do | Cannot Do |
|---------|--------|-----------|
| **Vitals** | ✅ Record vitals | ❌ Change diagnosis |
| **Nursing Notes** | ✅ Add nursing notes | ❌ Order tests |
| **Medications** | ✅ Mark medication given | ❌ Prescribe medicines |
| **Care Plans** | ✅ Update care plans | ❌ Discharge patients |

---

## 🗄️ Database Architecture (Multi-Tenant)

### Option 1: Row-Level Security (Recommended)

```sql
-- Every table has tenant_id
CREATE TABLE patients (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),  -- Hospital ID
  name TEXT,
  age INTEGER,
  ...
);

-- RLS Policy: Users can only see their hospital's data
CREATE POLICY "tenant_isolation" ON patients
  FOR ALL USING (tenant_id = current_tenant_id());
```

**Structure:**
```
public schema
├── tenants (hospitals)
├── users (all users across tenants)
├── subscription_plans
├── billing_transactions
│
├── patients (tenant_id ✓)
├── visits (tenant_id ✓)
├── lab_tests (tenant_id ✓)
├── radiology_orders (tenant_id ✓)
├── pharmacy_sales (tenant_id ✓)
└── ... (all tables have tenant_id)
```

### User + Role Structure

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  password TEXT, -- hashed
  tenant_id UUID REFERENCES tenants(id),
  role TEXT CHECK (role IN (
    'super_admin',
    'admin',
    'reception',
    'lab',
    'radiology', 
    'pharmacy',
    'doctor',
    'nurse'
  )),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role permissions table
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY,
  role TEXT,
  module TEXT, -- 'patients', 'lab', 'pharmacy', etc.
  can_create BOOLEAN DEFAULT false,
  can_read BOOLEAN DEFAULT false,
  can_update BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false
);

-- Example permissions
INSERT INTO role_permissions VALUES
  (gen_random_uuid(), 'reception', 'patients', true, true, true, false),
  (gen_random_uuid(), 'reception', 'billing', true, true, true, false),
  (gen_random_uuid(), 'lab', 'lab_tests', false, true, true, false),
  (gen_random_uuid(), 'lab', 'patients', false, true, false, false);
```

---

## 🎨 Frontend Architecture

### Routing Structure

```
/                              → Landing page (public)
/pricing                       → Pricing plans (public)
/onboarding                    → Hospital registration

/login                         → Login (all users)

/super-admin/                  → Super admin portal
  ├── /dashboard              → Platform overview
  ├── /hospitals              → Manage hospitals
  ├── /billing                → Revenue & subscriptions
  ├── /analytics              → Platform analytics
  └── /settings               → System settings

/:subdomain/                   → Hospital portal (e.g., hope-hospital)
  ├── /dashboard              → Role-based dashboard
  │
  ├── /admin/                 → Admin only
  │   ├── /users              → User management
  │   ├── /settings           → Hospital settings
  │   └── /reports            → All reports
  │
  ├── /patients               → Reception, Doctors, Nurses
  ├── /opd                    → Reception
  ├── /ipd                    → Reception, Nurses
  ├── /billing                → Reception
  │
  ├── /lab/                   → Lab staff
  │   ├── /orders             → Pending tests
  │   ├── /results            → Enter results
  │   └── /reports            → Print reports
  │
  ├── /radiology/             → Radiology staff
  │   ├── /orders             → Pending scans
  │   ├── /upload             → Upload images
  │   └── /reports            → Reports
  │
  └── /pharmacy/              → Pharmacy staff
      ├── /sales              → New sale
      ├── /stock              → Inventory
      └── /grn                → Goods receipt
```

### Protected Routes Example

```typescript
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute({ 
  children, 
  requiredRole,
  requiredModule 
}: {
  children: React.ReactNode;
  requiredRole?: string[];
  requiredModule?: string;
}) {
  const { user } = useAuth();
  const { tenant, hasModule } = useTenant();

  // Check authentication
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Check role
  if (requiredRole && !requiredRole.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  // Check module subscription
  if (requiredModule && !hasModule(requiredModule)) {
    return <Navigate to="/upgrade-plan" />;
  }

  return <>{children}</>;
}

// Usage
<Route 
  path="/lab" 
  element={
    <ProtectedRoute requiredRole={['admin', 'lab']} requiredModule="lab">
      <LabDashboard />
    </ProtectedRoute>
  } 
/>
```

---

## 💰 Subscription Plans

### Plan Matrix

| Feature | Starter<br>₹5,000/mo | Professional<br>₹15,000/mo | Enterprise<br>₹30,000/mo |
|---------|---------------------|---------------------------|-------------------------|
| **Patients** | 100 | 500 | Unlimited |
| **Users** | 5 | 20 | Unlimited |
| **Modules** | OPD, Billing | +Lab, Pharmacy, Radiology | +OT, Analytics |
| **Storage** | 5 GB | 50 GB | Unlimited |
| **Support** | Email | Priority | Dedicated |
| **Custom Branding** | ❌ | ✅ | ✅ |
| **WhatsApp** | ❌ | ✅ | ✅ |
| **API Access** | ❌ | ❌ | ✅ |
| **Multi-Location** | ❌ | ❌ | ✅ |

---

## 🚀 Implementation Steps

### Phase 1: Database (Week 1-2)
```bash
# 1. Run SaaS migration
psql -f supabase/migrations/saas_001_core_tables.sql

# 2. Add tenant_id to all tables
psql -f supabase/migrations/saas_002_add_tenant_id.sql

# 3. Update RLS policies
psql -f supabase/migrations/saas_003_update_rls.sql

# 4. Create roles & permissions
psql -f supabase/migrations/saas_004_roles_permissions.sql
```

### Phase 2: Backend (Week 3)
```typescript
// Create role checking functions
// src/utils/permissions.ts

export function canAccess(user: User, module: string, action: string): boolean {
  // Check if user's role has permission for this module+action
  const permission = getPermission(user.role, module);
  return permission?.[`can_${action}`] ?? false;
}

export function getPermission(role: string, module: string) {
  // Fetch from role_permissions table
  // Cache in memory for performance
}
```

### Phase 3: Frontend (Week 4-5)
```typescript
// Update AuthContext to include role
export interface User {
  id: string;
  email: string;
  tenant_id: string;
  role: 'super_admin' | 'admin' | 'reception' | 'lab' | 'radiology' | 'pharmacy' | 'doctor' | 'nurse';
}

// Create role-based navigation
export function AppSidebar() {
  const { user } = useAuth();
  
  const menuItems = getMenuForRole(user.role);
  
  return (
    <Sidebar>
      {menuItems.map(item => (
        <SidebarItem key={item.path} {...item} />
      ))}
    </Sidebar>
  );
}

function getMenuForRole(role: string) {
  const menus = {
    admin: ['Dashboard', 'Patients', 'OPD', 'IPD', 'Lab', 'Pharmacy', 'Billing', 'Reports', 'Settings'],
    reception: ['Dashboard', 'Patients', 'OPD', 'IPD', 'Billing'],
    lab: ['Dashboard', 'Lab Orders', 'Enter Results', 'Reports'],
    radiology: ['Dashboard', 'Orders', 'Upload Images', 'Reports'],
    pharmacy: ['Dashboard', 'Sales', 'Stock', 'GRN'],
    // ... etc
  };
  
  return menus[role] || [];
}
```

### Phase 4: Super Admin Portal (Week 6)
```typescript
// src/pages/SuperAdmin/Dashboard.tsx

export function SuperAdminDashboard() {
  const { data: tenants } = useQuery({
    queryKey: ['all-tenants'],
    queryFn: fetchAllTenants
  });

  return (
    <div>
      <StatsCards 
        totalHospitals={tenants.length}
        activeSubscriptions={tenants.filter(t => t.status === 'active').length}
        monthlyRevenue={calculateRevenue(tenants)}
      />
      
      <TenantList 
        tenants={tenants}
        onSuspend={handleSuspend}
        onDelete={handleDelete}
      />
      
      <RevenueChart data={getRevenueData(tenants)} />
    </div>
  );
}
```

---

## 🎯 Feature Comparison: Current vs SaaS

| Feature | Current (Single Hospital) | SaaS (Multi-Tenant) |
|---------|--------------------------|---------------------|
| **Deployment** | One installation per hospital | Single deployment, all hospitals |
| **Database** | Separate DB per hospital | One DB, tenant isolation |
| **Updates** | Update each hospital separately | Update once, all benefit |
| **Costs** | ₹10k/month per hospital | ₹100k/month (hosting) for 100+ hospitals |
| **Branding** | Hospital specific | Customizable per tenant |
| **Data** | Isolated by default | Isolated via RLS |
| **Users** | Fixed users | Unlimited users (per plan) |
| **Billing** | One-time or manual | Automated subscription |

---

## 📊 Revenue Model

### Pricing Strategy

```
Starter Plan: ₹5,000/month
  Target: Small clinics (10-20 patients/day)
  Margin: ₹3,500/month (after costs)

Professional Plan: ₹15,000/month ⭐ MOST POPULAR
  Target: Mid-size hospitals (50-100 patients/day)
  Margin: ₹12,000/month

Enterprise Plan: ₹30,000+/month
  Target: Large hospitals, chains
  Margin: ₹25,000+/month
```

### Projections

```
Month 1-3:   10 hospitals × ₹10,000 = ₹1,00,000/month
Month 4-6:   25 hospitals × ₹12,000 = ₹3,00,000/month
Month 7-12:  50 hospitals × ₹12,000 = ₹6,00,000/month
Year 2:     100 hospitals × ₹15,000 = ₹15,00,000/month

Annual Revenue (Year 2): ₹1.8 Crores
```

---

## 🔧 Technical Requirements

### Infrastructure

```
Hosting:
├── Vercel (Frontend)      ₹2,000/month
├── Supabase Pro (DB)      ₹5,000/month
├── Cloudinary (Images)    ₹2,000/month
├── SendGrid (Emails)      ₹1,000/month
└── Sentry (Monitoring)    ₹1,000/month
    Total: ~₹11,000/month

Domain:
└── yourapp.com + wildcard SSL: ₹500/month

Payment Gateway:
└── Razorpay: 2% transaction fee
```

### Team Required

```
Development Phase (2-3 months):
├── 1 Backend Developer      (₹60k/month)
├── 1 Frontend Developer     (₹50k/month)
├── 1 DevOps Engineer        (₹70k/month)
└── 1 QA Tester             (₹30k/month)
    Total: ₹2,10,000/month

Maintenance (After Launch):
├── 1 Full-stack Developer   (₹60k/month)
├── 1 Support Engineer       (₹30k/month)
└── 1 Sales/Marketing        (₹40k/month)
    Total: ₹1,30,000/month
```

---

## ✅ Success Metrics

**Technical:**
- Uptime: 99.9%
- Response Time: <200ms
- Zero data leaks between tenants
- <0.1% error rate

**Business:**
- 50 hospitals in Year 1
- 90% customer retention
- <2% churn rate
- ₹50+ lakhs ARR in Year 1

---

## 🎓 Next Steps

1. **Review Architecture** (This doc)
2. **Run Database Migrations** (saas_001, 002, 003, 004)
3. **Implement Role System**
4. **Build Dashboards** (Role-specific)
5. **Super Admin Portal**
6. **Testing** (Use MANUAL_TESTING_CHECKLIST.md)
7. **Pilot Launch** (2-3 hospitals)
8. **Full Launch**

---

**Document Version:** 1.0  
**Last Updated:** 2025-02-27  
**Status:** Architecture Design
