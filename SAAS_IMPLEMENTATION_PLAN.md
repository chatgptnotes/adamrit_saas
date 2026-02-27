# 🚀 SaaS Implementation Plan
## Hospital Management System → Multi-Tenant SaaS

---

## Overview

Transform the current single-tenant hospital management system into a multi-tenant SaaS platform where multiple hospitals can register, subscribe, and use the system independently.

---

## Architecture Changes

### 1. Multi-Tenancy Model: **Row-Level Security (RLS) Based**

**Why RLS?**
- Already using Supabase with RLS
- Simpler to implement than schema-per-tenant
- Better performance for moderate scale
- Easier to maintain

**How it works:**
```
Every table gets:
  tenant_id UUID REFERENCES tenants(id)
  
RLS Policy:
  FOR ALL USING (tenant_id = current_tenant_id())
```

---

## Phase 1: Database Foundation (Week 1-2)

### Step 1.1: Create Core SaaS Tables

```sql
-- File: supabase/migrations/001_create_saas_tables.sql

-- Tenants table
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  custom_domain TEXT UNIQUE,
  
  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#10b981',
  
  -- Contact
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  
  -- Subscription
  plan_id UUID REFERENCES subscription_plans(id),
  subscription_status TEXT DEFAULT 'trial' 
    CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled')),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  subscription_starts_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  
  -- Limits (based on plan)
  max_patients INTEGER DEFAULT 100,
  max_users INTEGER DEFAULT 5,
  max_beds INTEGER DEFAULT 10,
  storage_limit_gb INTEGER DEFAULT 5,
  
  -- Feature Flags
  enabled_modules JSONB DEFAULT '["opd", "billing"]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Subscription Plans
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL, -- Starter, Professional, Enterprise
  display_name TEXT NOT NULL,
  description TEXT,
  
  -- Pricing
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2), -- Optional annual discount
  currency TEXT DEFAULT 'INR',
  
  -- Limits
  features JSONB NOT NULL,
  /* Example:
  {
    "maxPatients": 500,
    "maxUsers": 20,
    "maxBeds": 50,
    "storage": 50,
    "modules": ["opd", "ipd", "lab", "pharmacy", "radiology", "ot"],
    "support": "priority",
    "customBranding": true
  }
  */
  
  -- Meta
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Billing Transactions
CREATE TABLE public.billing_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Payment Info
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  payment_method TEXT, -- card, upi, netbanking
  
  -- Status
  status TEXT DEFAULT 'pending' 
    CHECK (status IN ('pending', 'processing', 'success', 'failed', 'refunded')),
  
  -- Provider Info (Razorpay/Stripe)
  provider TEXT DEFAULT 'razorpay',
  provider_payment_id TEXT,
  provider_order_id TEXT,
  provider_signature TEXT,
  
  -- Invoice
  invoice_number TEXT UNIQUE,
  invoice_url TEXT,
  
  -- Period
  billing_period_start TIMESTAMPTZ,
  billing_period_end TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB, -- Store raw provider response
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage Tracking
CREATE TABLE public.tenant_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Current Usage
  patient_count INTEGER DEFAULT 0,
  user_count INTEGER DEFAULT 0,
  bed_count INTEGER DEFAULT 0,
  storage_used_gb DECIMAL(10,2) DEFAULT 0,
  
  -- Last Reset
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Monthly stats
  monthly_patients INTEGER DEFAULT 0,
  monthly_visits INTEGER DEFAULT 0,
  monthly_bills DECIMAL(12,2) DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_status ON tenants(subscription_status);
CREATE INDEX idx_billing_tenant ON billing_transactions(tenant_id);
CREATE INDEX idx_billing_status ON billing_transactions(status);

-- RLS Policies (Super Admin only for these tables)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_transactions ENABLE ROW LEVEL SECURITY;

-- Super admins can see all
CREATE POLICY "Super admins full access tenants" ON tenants
  FOR ALL USING (auth.jwt() ->> 'role' = 'super_admin');

-- Tenant owners can see their own
CREATE POLICY "Tenant owners read own" ON tenants
  FOR SELECT USING (id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Everyone can read active plans
CREATE POLICY "Public can read active plans" ON subscription_plans
  FOR SELECT USING (is_active = true);
```

### Step 1.2: Add tenant_id to Existing Tables

```sql
-- File: supabase/migrations/002_add_tenant_id.sql

-- Add tenant_id to all main tables
ALTER TABLE patients ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE users ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE visits ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE lab_tests ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE medications ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE billing ADD COLUMN tenant_id UUID REFERENCES tenants(id);
-- ... add to all tables

-- Create indexes
CREATE INDEX idx_patients_tenant ON patients(tenant_id);
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_visits_tenant ON visits(tenant_id);
-- ... for all tables

-- Update RLS policies to include tenant isolation
DROP POLICY IF EXISTS "Users can view patients" ON patients;
CREATE POLICY "Users can view own tenant patients" ON patients
  FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Repeat for all tables with existing RLS
```

### Step 1.3: Tenant Context Functions

```sql
-- File: supabase/migrations/003_tenant_functions.sql

-- Get current tenant from JWT
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (auth.jwt() ->> 'tenant_id')::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() ->> 'role') = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update usage stats (call this on insert/delete triggers)
CREATE OR REPLACE FUNCTION update_tenant_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'patients' THEN
    UPDATE tenant_usage 
    SET patient_count = (SELECT COUNT(*) FROM patients WHERE tenant_id = NEW.tenant_id),
        updated_at = NOW()
    WHERE tenant_id = NEW.tenant_id;
  END IF;
  -- Add similar blocks for users, beds, etc.
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers
CREATE TRIGGER update_usage_patients
  AFTER INSERT OR DELETE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_tenant_usage();
```

---

## Phase 2: Frontend - Tenant Context (Week 2-3)

### Step 2.1: Tenant Provider

```typescript
// src/contexts/TenantContext.tsx

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  logo_url?: string;
  primary_color: string;
  enabled_modules: string[];
  subscription_status: 'trial' | 'active' | 'suspended' | 'cancelled';
}

interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
  hasModule: (module: string) => boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTenant();
  }, []);

  const loadTenant = async () => {
    try {
      // Get subdomain from URL
      const subdomain = getSubdomainFromUrl();
      
      if (!subdomain) {
        // Redirect to main site or show tenant selection
        window.location.href = 'https://yourapp.com';
        return;
      }

      // Fetch tenant data
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('subdomain', subdomain)
        .single();

      if (error || !data) {
        console.error('Tenant not found:', subdomain);
        // Show "Hospital not found" page
        return;
      }

      // Check subscription status
      if (data.subscription_status === 'suspended') {
        // Show "Subscription expired" page
        return;
      }

      setTenant(data);
      
      // Apply branding
      applyBranding(data);
      
    } catch (error) {
      console.error('Error loading tenant:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubdomainFromUrl = (): string | null => {
    const hostname = window.location.hostname;
    
    // Development: localhost?tenant=xyz
    if (hostname === 'localhost') {
      const params = new URLSearchParams(window.location.search);
      return params.get('tenant');
    }
    
    // Production: xyz.yourapp.com
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      return parts[0]; // xyz
    }
    
    return null;
  };

  const applyBranding = (tenant: Tenant) => {
    // Update CSS variables
    document.documentElement.style.setProperty('--primary', tenant.primary_color);
    
    // Update page title
    document.title = tenant.name;
    
    // Update favicon if available
    if (tenant.logo_url) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (link) {
        link.href = tenant.logo_url;
      }
    }
  };

  const hasModule = (module: string) => {
    if (!tenant) return false;
    return tenant.enabled_modules.includes(module);
  };

  return (
    <TenantContext.Provider value={{ tenant, loading, hasModule }}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
};
```

### Step 2.2: Protected Route with Module Check

```typescript
// src/components/ProtectedRoute.tsx

import { useTenant } from '@/contexts/TenantContext';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredModule?: string;
}

export function ProtectedRoute({ children, requiredModule }: ProtectedRouteProps) {
  const { tenant, loading, hasModule } = useTenant();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!tenant) {
    return <Navigate to="/tenant-not-found" />;
  }

  if (requiredModule && !hasModule(requiredModule)) {
    return <Navigate to="/upgrade-plan" />;
  }

  return <>{children}</>;
}

// Usage in routes:
<Route 
  path="/laboratory" 
  element={
    <ProtectedRoute requiredModule="lab">
      <LaboratoryPage />
    </ProtectedRoute>
  } 
/>
```

---

## Phase 3: Onboarding Flow (Week 3-4)

### Step 3.1: Tenant Registration

```typescript
// src/features/onboarding/TenantRegistration.tsx

export function TenantRegistration() {
  const [step, setStep] = useState(1);

  return (
    <div className="max-w-2xl mx-auto">
      {step === 1 && <HospitalInfo onNext={() => setStep(2)} />}
      {step === 2 && <SelectPlan onNext={() => setStep(3)} />}
      {step === 3 && <PaymentInfo onNext={() => setStep(4)} />}
      {step === 4 && <SetupComplete />}
    </div>
  );
}

function HospitalInfo({ onNext }: { onNext: () => void }) {
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data: any) => {
    // Check subdomain availability
    const { data: existing } = await supabase
      .from('tenants')
      .select('subdomain')
      .eq('subdomain', data.subdomain)
      .single();

    if (existing) {
      alert('Subdomain already taken!');
      return;
    }

    // Save to temp storage or state
    localStorage.setItem('tenant_data', JSON.stringify(data));
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h2>Hospital Information</h2>
      
      <Input 
        {...register('name')} 
        placeholder="Hospital Name" 
        required 
      />
      
      <div className="flex gap-2">
        <Input 
          {...register('subdomain')} 
          placeholder="subdomain" 
          required 
        />
        <span>.yourapp.com</span>
      </div>
      
      <Input 
        {...register('email')} 
        type="email" 
        placeholder="Email" 
        required 
      />
      
      <Input 
        {...register('phone')} 
        placeholder="Phone" 
        required 
      />
      
      <Button type="submit">Next</Button>
    </form>
  );
}
```

### Step 3.2: Plan Selection

```typescript
// src/features/onboarding/SelectPlan.tsx

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 5000,
    features: {
      maxPatients: 100,
      maxUsers: 5,
      modules: ['opd', 'billing'],
      storage: 5
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 15000,
    popular: true,
    features: {
      maxPatients: 500,
      maxUsers: 20,
      modules: ['opd', 'ipd', 'lab', 'pharmacy', 'billing'],
      storage: 50
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    features: {
      maxPatients: -1,
      maxUsers: -1,
      modules: 'all',
      storage: -1
    }
  }
];

export function SelectPlan({ onNext }: { onNext: () => void }) {
  const [selected, setSelected] = useState('professional');

  return (
    <div className="grid grid-cols-3 gap-4">
      {PLANS.map(plan => (
        <Card 
          key={plan.id}
          className={selected === plan.id ? 'border-primary' : ''}
          onClick={() => setSelected(plan.id)}
        >
          {plan.popular && <Badge>Most Popular</Badge>}
          <h3>{plan.name}</h3>
          <div className="text-3xl font-bold">
            ₹{plan.price}
            <span className="text-sm">/month</span>
          </div>
          
          <ul>
            <li>✓ {plan.features.maxPatients} Patients</li>
            <li>✓ {plan.features.maxUsers} Users</li>
            <li>✓ {plan.features.storage}GB Storage</li>
            <li>✓ {plan.features.modules.join(', ')}</li>
          </ul>
        </Card>
      ))}
      
      <Button onClick={() => {
        localStorage.setItem('selected_plan', selected);
        onNext();
      }}>
        Continue
      </Button>
    </div>
  );
}
```

---

## Phase 4: Payment Integration (Week 4)

### Razorpay Integration

```typescript
// src/lib/razorpay.ts

export async function initiatePayment(amount: number, tenantId: string) {
  // Create order on backend
  const { data: order } = await supabase.functions.invoke('create-razorpay-order', {
    body: { amount, tenantId }
  });

  // Initialize Razorpay
  const options = {
    key: import.meta.env.VITE_RAZORPAY_KEY,
    amount: order.amount,
    currency: 'INR',
    order_id: order.id,
    name: 'Hospital Management System',
    description: 'Subscription Payment',
    handler: async function (response: any) {
      // Verify payment
      await supabase.functions.invoke('verify-payment', {
        body: {
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
          tenantId
        }
      });
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    }
  };

  const rzp = new (window as any).Razorpay(options);
  rzp.open();
}
```

---

## Phase 5: Super Admin Dashboard (Week 5)

```typescript
// src/features/admin/SuperAdminDashboard.tsx

export function SuperAdminDashboard() {
  return (
    <div>
      <Stats />
      <TenantList />
      <RevenueChart />
    </div>
  );
}

function TenantList() {
  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tenants')
        .select('*, subscription_plans(*), tenant_usage(*)')
        .order('created_at', { ascending: false });
      return data;
    }
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Hospital</TableHead>
          <TableHead>Subdomain</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Usage</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tenants?.map(tenant => (
          <TableRow key={tenant.id}>
            <TableCell>{tenant.name}</TableCell>
            <TableCell>{tenant.subdomain}</TableCell>
            <TableCell>{tenant.subscription_plans.name}</TableCell>
            <TableCell>
              <Badge variant={
                tenant.subscription_status === 'active' ? 'success' : 'warning'
              }>
                {tenant.subscription_status}
              </Badge>
            </TableCell>
            <TableCell>
              {tenant.tenant_usage.patient_count} / {tenant.max_patients} patients
            </TableCell>
            <TableCell>
              <Button size="sm">View</Button>
              <Button size="sm" variant="destructive">Suspend</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

## Deployment Checklist

### Vercel Configuration

```json
// vercel.json
{
  "rewrites": [
    {
      "source": "/:path*",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/:path*",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        }
      ]
    }
  ]
}
```

### Wildcard Domain Setup
1. Add `*.yourapp.com` to Vercel domains
2. Add CNAME record in DNS: `* → cname.vercel-dns.com`
3. Enable SSL for wildcard

### Environment Variables
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_RAZORPAY_KEY=
VITE_APP_DOMAIN=yourapp.com
```

---

## Revenue Model

```
Pricing:
├── Starter: ₹5,000/month
├── Professional: ₹15,000/month  
└── Enterprise: ₹30,000+/month

Target:
- Year 1: 20 hospitals = ₹3,00,000/month
- Year 2: 50 hospitals = ₹7,50,000/month
- Year 3: 100 hospitals = ₹15,00,000/month
```

---

## Next Steps

1. Review this plan ✓
2. Set up development environment
3. Run Phase 1 migrations
4. Build tenant onboarding UI
5. Integrate payment gateway
6. Deploy staging version
7. Test with 2-3 pilot hospitals
8. Launch! 🚀
