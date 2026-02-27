# 🚀 SaaS Quick Start Guide

Ye file tumhe step-by-step batayegi ki kaise is project ko SaaS mein convert karo.

---

## ✅ Pre-requisites Check

```bash
# 1. Node.js version check
node --version  # Should be >= 18

# 2. Supabase CLI install (agar nahi hai)
npm install -g supabase

# 3. Git status clean hai?
git status
```

---

## 📋 Step-by-Step Implementation

### Step 1: Database Setup (Day 1)

#### 1.1 Run Core Migration

```bash
# Supabase me login karo
supabase login

# Project link karo
supabase link --project-ref YOUR_PROJECT_REF

# Migration run karo
supabase db push

# Ya manually SQL run karo:
# 1. Supabase dashboard kholo
# 2. SQL Editor me jao
# 3. supabase/migrations/saas_001_core_tables.sql copy-paste karo
# 4. Run karo
```

#### 1.2 Verify Tables Created

```sql
-- Run this to verify:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'subscription_plans',
  'tenants', 
  'tenant_usage',
  'billing_transactions',
  'tenant_audit_log'
);

-- Check if plans are inserted
SELECT * FROM subscription_plans;
```

---

### Step 2: Add tenant_id to Existing Tables (Day 1-2)

**Important:** Ye sabse critical step hai!

```sql
-- File: supabase/migrations/saas_002_add_tenant_id.sql

-- List all your main tables
DO $$
DECLARE
  tables TEXT[] := ARRAY[
    'patients',
    'users', 
    'visits',
    'lab_tests',
    'radiology_tests',
    'medications',
    'billing',
    'invoices'
    -- Add all your tables here
  ];
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    -- Add column if not exists
    EXECUTE format('
      ALTER TABLE %I 
      ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
    ', tbl);
    
    -- Add index
    EXECUTE format('
      CREATE INDEX IF NOT EXISTS idx_%I_tenant 
      ON %I(tenant_id);
    ', tbl, tbl);
    
    RAISE NOTICE 'Added tenant_id to %', tbl;
  END LOOP;
END $$;
```

---

### Step 3: Update RLS Policies (Day 2)

```sql
-- File: supabase/migrations/saas_003_update_rls.sql

-- Example for patients table:
DROP POLICY IF EXISTS "Users can view patients" ON patients;

CREATE POLICY "Users can view own tenant patients" ON patients
  FOR SELECT USING (
    tenant_id = current_tenant_id()
  );

CREATE POLICY "Users can insert own tenant patients" ON patients
  FOR INSERT WITH CHECK (
    tenant_id = current_tenant_id()
  );

-- Repeat for all tables
-- Tip: Create a script to generate these for all tables
```

---

### Step 4: Frontend - Install Dependencies (Day 2)

```bash
# If using Razorpay
npm install razorpay

# State management (optional but recommended)
npm install zustand

# For subdomain handling
npm install nanoid
```

---

### Step 5: Create Tenant Context (Day 2-3)

File already created at:
`src/contexts/TenantContext.tsx` (create this)

```typescript
// See SAAS_IMPLEMENTATION_PLAN.md for full code
// Key functions:
// - getTenantFromUrl()
// - loadTenant()
// - applyBranding()
```

---

### Step 6: Update App.tsx (Day 3)

```typescript
// src/App.tsx

import { TenantProvider } from '@/contexts/TenantContext';

function App() {
  return (
    <TenantProvider>
      <BrowserRouter>
        {/* Your existing routes */}
      </BrowserRouter>
    </TenantProvider>
  );
}
```

---

### Step 7: Add Pricing Page (Day 3)

```bash
# Copy the PricingPlans component
# Already created at: src/components/saas/PricingPlans.tsx
```

Add route:
```typescript
// In your router
<Route path="/pricing" element={<PricingPlans />} />
```

---

### Step 8: Create Onboarding Flow (Day 4-5)

```typescript
// src/features/onboarding/OnboardingFlow.tsx

export function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});

  return (
    <div>
      {step === 1 && <HospitalInfo />}
      {step === 2 && <SelectPlan />}
      {step === 3 && <Payment />}
      {step === 4 && <SetupComplete />}
    </div>
  );
}
```

Components needed:
1. **HospitalInfo** - Name, subdomain, contact
2. **SelectPlan** - Show pricing cards
3. **Payment** - Razorpay integration
4. **SetupComplete** - Redirect to dashboard

---

### Step 9: Razorpay Integration (Day 5)

#### 9.1 Get Razorpay Keys

1. Go to https://razorpay.com
2. Create account
3. Get API keys (Test mode first)

#### 9.2 Add to .env

```bash
# .env
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx
VITE_RAZORPAY_KEY_SECRET=xxxxx
```

#### 9.3 Payment Function

```typescript
// src/lib/razorpay.ts

export async function initiatePayment(
  amount: number, 
  tenantId: string,
  planId: string
) {
  // 1. Create order via Supabase Edge Function
  const { data: order } = await supabase.functions.invoke(
    'create-payment-order',
    { body: { amount, tenantId, planId } }
  );

  // 2. Open Razorpay checkout
  const options = {
    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
    amount: order.amount,
    currency: 'INR',
    order_id: order.id,
    name: 'Hospital Management System',
    handler: async function (response) {
      // 3. Verify payment
      await verifyPayment(response, tenantId);
    }
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
}
```

---

### Step 10: Supabase Edge Functions (Day 6)

Create payment processing functions:

```typescript
// supabase/functions/create-payment-order/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Razorpay from "https://esm.sh/razorpay@2.8.6"

serve(async (req) => {
  const { amount, tenantId, planId } = await req.json()
  
  const razorpay = new Razorpay({
    key_id: Deno.env.get('RAZORPAY_KEY_ID'),
    key_secret: Deno.env.get('RAZORPAY_KEY_SECRET')
  })

  const order = await razorpay.orders.create({
    amount: amount * 100, // Convert to paise
    currency: 'INR'
  })

  return new Response(JSON.stringify(order))
})
```

---

### Step 11: Super Admin Dashboard (Day 7)

```typescript
// src/features/admin/SuperAdminDashboard.tsx

export function SuperAdminDashboard() {
  const { data: tenants } = useQuery({
    queryKey: ['all-tenants'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tenants')
        .select('*, subscription_plans(*), tenant_usage(*)')
        .order('created_at', { ascending: false });
      return data;
    }
  });

  return (
    <div className="p-8">
      <h1>Super Admin Dashboard</h1>
      
      <StatsCards tenants={tenants} />
      <TenantList tenants={tenants} />
      <RevenueChart />
    </div>
  );
}
```

---

### Step 12: Testing (Day 8-9)

#### 12.1 Local Testing with Subdomains

```bash
# Add to /etc/hosts (Mac/Linux) or C:\Windows\System32\drivers\etc\hosts
127.0.0.1 test-hospital.localhost
127.0.0.1 demo-clinic.localhost

# Start dev server
npm run dev

# Test URLs:
# http://test-hospital.localhost:5173
# http://demo-clinic.localhost:5173
```

#### 12.2 Test Checklist

- [ ] Create new tenant via onboarding
- [ ] Login to tenant subdomain
- [ ] Verify data isolation (can't see other tenant's data)
- [ ] Test payment flow (use Razorpay test mode)
- [ ] Check super admin can see all tenants
- [ ] Test module toggles (enable/disable features)
- [ ] Verify usage limits work

---

### Step 13: Deployment (Day 10)

#### 13.1 Vercel Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

#### 13.2 Configure Domain

In Vercel dashboard:
1. Add domain: `yourapp.com`
2. Add wildcard: `*.yourapp.com`
3. Wait for DNS propagation

#### 13.3 Update DNS

In your domain registrar (GoDaddy/Namecheap):
```
A     @       76.76.21.21  (Vercel IP)
CNAME *       cname.vercel-dns.com
```

---

## 🎯 Success Metrics

After implementation, you should be able to:

✅ Register new hospitals with unique subdomains
✅ Each hospital has isolated data
✅ Subscription payment working
✅ Module-based feature access
✅ Super admin can manage all tenants
✅ Usage tracking working
✅ Branding per tenant

---

## 🐛 Common Issues & Solutions

### Issue 1: Subdomain not working locally

**Solution:**
```bash
# Use query param for local dev
http://localhost:5173?tenant=test-hospital

# Or edit /etc/hosts:
127.0.0.1 test-hospital.localhost
```

### Issue 2: RLS blocking queries

**Solution:**
```sql
-- Check current_tenant_id() returns correct value
SELECT current_tenant_id();

-- Temporarily disable RLS for testing
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
-- Test
-- Then re-enable
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
```

### Issue 3: Payment webhook not receiving

**Solution:**
```bash
# Use ngrok for local testing
ngrok http 54321

# Update Razorpay webhook URL to ngrok URL
https://xxxxx.ngrok.io/functions/v1/payment-webhook
```

---

## 📞 Need Help?

1. **Database issues**: Check Supabase logs
2. **Payment issues**: Check Razorpay dashboard logs
3. **Frontend errors**: Check browser console
4. **RLS issues**: Test queries in Supabase SQL editor

---

## 🚀 Next Steps After MVP

Once basic SaaS is working:

1. **Email notifications** (signup, payment, reminders)
2. **WhatsApp integration** per tenant
3. **API access** for Enterprise plans
4. **Mobile app** support
5. **Analytics dashboard** for tenants
6. **Multi-language** support
7. **Backup/Export** features

---

## 💰 Revenue Projections

**Conservative:**
- Month 1-3: 5 hospitals × ₹10,000 = ₹50,000/month
- Month 4-6: 15 hospitals × ₹10,000 = ₹1,50,000/month
- Month 7-12: 30 hospitals × ₹12,000 = ₹3,60,000/month

**Year 1 Target:** ₹20-25 lakhs

**Year 2 Target:** ₹75-100 lakhs

---

Good luck! 🎉
