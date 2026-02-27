-- SaaS Core Tables Migration
-- Run this first to set up multi-tenancy foundation

-- ============================================
-- 1. SUBSCRIPTION PLANS
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Plan Info
  name TEXT NOT NULL UNIQUE, -- starter, professional, enterprise
  display_name TEXT NOT NULL,
  description TEXT,
  
  -- Pricing
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2), -- Optional annual pricing
  currency TEXT DEFAULT 'INR',
  
  -- Features & Limits (stored as JSON for flexibility)
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  /* Example structure:
  {
    "maxPatients": 500,
    "maxUsers": 20,
    "maxBeds": 50,
    "storageGB": 50,
    "modules": ["opd", "ipd", "lab", "pharmacy", "radiology", "ot", "billing"],
    "support": "priority",
    "customBranding": true,
    "whatsappIntegration": true,
    "apiAccess": false
  }
  */
  
  -- Meta
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. TENANTS (Hospitals)
-- ============================================
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  custom_domain TEXT UNIQUE, -- Optional: custom domain like hospital.com
  
  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#10b981',
  
  -- Contact Information
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  
  -- Subscription
  plan_id UUID REFERENCES subscription_plans(id),
  subscription_status TEXT DEFAULT 'trial' 
    CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled')),
  
  -- Trial & Subscription Dates
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  subscription_starts_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  last_payment_at TIMESTAMPTZ,
  next_payment_due TIMESTAMPTZ,
  
  -- Usage Limits (copied from plan, can be customized)
  max_patients INTEGER DEFAULT 100,
  max_users INTEGER DEFAULT 5,
  max_beds INTEGER DEFAULT 10,
  storage_limit_gb INTEGER DEFAULT 5,
  
  -- Feature Toggles (which modules are enabled)
  enabled_modules JSONB DEFAULT '["opd", "billing"]'::jsonb,
  /* Example:
  ["opd", "ipd", "lab", "pharmacy", "radiology", "ot", "billing"]
  */
  
  -- Settings
  settings JSONB DEFAULT '{}'::jsonb,
  /* Example:
  {
    "dateFormat": "DD/MM/YYYY",
    "currency": "INR",
    "timezone": "Asia/Kolkata",
    "language": "en"
  }
  */
  
  -- Metadata
  onboarding_completed BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  notes TEXT, -- Internal notes for super admin
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT valid_subdomain CHECK (subdomain ~ '^[a-z0-9-]+$')
);

-- ============================================
-- 3. TENANT USAGE TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS public.tenant_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Current Counts
  patient_count INTEGER DEFAULT 0,
  user_count INTEGER DEFAULT 0,
  bed_count INTEGER DEFAULT 0,
  storage_used_gb DECIMAL(10,2) DEFAULT 0,
  
  -- Monthly Statistics (resets every month)
  monthly_patients INTEGER DEFAULT 0,
  monthly_visits INTEGER DEFAULT 0,
  monthly_lab_tests INTEGER DEFAULT 0,
  monthly_bills_amount DECIMAL(12,2) DEFAULT 0,
  
  -- Last Reset
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. BILLING TRANSACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.billing_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Transaction Details
  amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) GENERATED ALWAYS AS (amount + tax_amount) STORED,
  currency TEXT DEFAULT 'INR',
  
  -- Payment Info
  payment_method TEXT, -- card, upi, netbanking, wallet
  status TEXT DEFAULT 'pending' 
    CHECK (status IN ('pending', 'processing', 'success', 'failed', 'refunded')),
  
  -- Payment Gateway (Razorpay/Stripe)
  provider TEXT DEFAULT 'razorpay',
  provider_payment_id TEXT,
  provider_order_id TEXT,
  provider_signature TEXT,
  
  -- Invoice
  invoice_number TEXT UNIQUE,
  invoice_url TEXT,
  
  -- Billing Period
  billing_period_start TIMESTAMPTZ,
  billing_period_end TIMESTAMPTZ,
  
  -- Plan Info (snapshot at time of payment)
  plan_snapshot JSONB,
  
  -- Metadata
  metadata JSONB, -- Store raw provider response
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. AUDIT LOG (Track important actions)
-- ============================================
CREATE TABLE IF NOT EXISTS public.tenant_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Action Details
  action TEXT NOT NULL, -- e.g., 'subscription_upgraded', 'user_added', 'module_enabled'
  entity_type TEXT, -- e.g., 'user', 'plan', 'settings'
  entity_id UUID,
  
  -- Changes
  old_value JSONB,
  new_value JSONB,
  
  -- User Info
  performed_by UUID REFERENCES auth.users(id),
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Tenants
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(subscription_status);
CREATE INDEX IF NOT EXISTS idx_tenants_plan ON tenants(plan_id);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(is_active) WHERE is_active = true;

-- Billing
CREATE INDEX IF NOT EXISTS idx_billing_tenant ON billing_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_status ON billing_transactions(status);
CREATE INDEX IF NOT EXISTS idx_billing_created ON billing_transactions(created_at DESC);

-- Audit
CREATE INDEX IF NOT EXISTS idx_audit_tenant ON tenant_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON tenant_audit_log(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_audit_log ENABLE ROW LEVEL SECURITY;

-- Subscription Plans: Everyone can read active plans
CREATE POLICY "Public can read active plans" ON subscription_plans
  FOR SELECT USING (is_active = true);

-- Tenants: Super admins see all, tenant owners see their own
CREATE POLICY "Super admins full access tenants" ON tenants
  FOR ALL USING (
    (auth.jwt() ->> 'role') = 'super_admin'
  );

CREATE POLICY "Tenant owners read own" ON tenants
  FOR SELECT USING (
    id::text = (auth.jwt() ->> 'tenant_id')
  );

-- Usage: Same as tenants
CREATE POLICY "Super admins full access usage" ON tenant_usage
  FOR ALL USING (
    (auth.jwt() ->> 'role') = 'super_admin'
  );

CREATE POLICY "Tenant owners read own usage" ON tenant_usage
  FOR SELECT USING (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
  );

-- Billing: Same pattern
CREATE POLICY "Super admins full access billing" ON billing_transactions
  FOR ALL USING (
    (auth.jwt() ->> 'role') = 'super_admin'
  );

CREATE POLICY "Tenant owners read own billing" ON billing_transactions
  FOR SELECT USING (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
  );

-- Audit: Read-only for tenants
CREATE POLICY "Tenant owners read own audit" ON tenant_audit_log
  FOR SELECT USING (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Get current tenant ID from JWT
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (auth.jwt() ->> 'tenant_id')::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() ->> 'role') = 'super_admin';
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update tenant usage counts
CREATE OR REPLACE FUNCTION update_tenant_usage()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get tenant_id from new or old record
  v_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
  
  -- Update based on table
  IF TG_TABLE_NAME = 'patients' THEN
    UPDATE tenant_usage 
    SET patient_count = (SELECT COUNT(*) FROM patients WHERE tenant_id = v_tenant_id),
        monthly_patients = monthly_patients + CASE WHEN TG_OP = 'INSERT' THEN 1 ELSE 0 END,
        updated_at = NOW()
    WHERE tenant_id = v_tenant_id;
    
  ELSIF TG_TABLE_NAME = 'users' THEN
    UPDATE tenant_usage 
    SET user_count = (SELECT COUNT(*) FROM users WHERE tenant_id = v_tenant_id),
        updated_at = NOW()
    WHERE tenant_id = v_tenant_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update timestamps
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tenant_usage_updated_at
  BEFORE UPDATE ON tenant_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_billing_updated_at
  BEFORE UPDATE ON billing_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create usage record when tenant is created
CREATE OR REPLACE FUNCTION create_tenant_usage()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO tenant_usage (tenant_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_usage_on_tenant_insert
  AFTER INSERT ON tenants
  FOR EACH ROW EXECUTE FUNCTION create_tenant_usage();

-- ============================================
-- SEED DATA: Default Plans
-- ============================================

INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, features, is_popular, sort_order) VALUES
(
  'starter',
  'Starter Plan',
  'Perfect for small clinics and nursing homes',
  5000,
  50000,
  '{
    "maxPatients": 100,
    "maxUsers": 5,
    "maxBeds": 10,
    "storageGB": 5,
    "modules": ["opd", "billing"],
    "support": "email",
    "customBranding": false,
    "whatsappIntegration": false,
    "apiAccess": false
  }'::jsonb,
  false,
  1
),
(
  'professional',
  'Professional Plan',
  'Ideal for multi-specialty hospitals',
  15000,
  150000,
  '{
    "maxPatients": 500,
    "maxUsers": 20,
    "maxBeds": 50,
    "storageGB": 50,
    "modules": ["opd", "ipd", "lab", "pharmacy", "radiology", "billing"],
    "support": "priority",
    "customBranding": true,
    "whatsappIntegration": true,
    "apiAccess": false
  }'::jsonb,
  true,
  2
),
(
  'enterprise',
  'Enterprise Plan',
  'For large hospitals and hospital chains',
  30000,
  300000,
  '{
    "maxPatients": -1,
    "maxUsers": -1,
    "maxBeds": -1,
    "storageGB": -1,
    "modules": ["opd", "ipd", "lab", "pharmacy", "radiology", "ot", "billing"],
    "support": "dedicated",
    "customBranding": true,
    "whatsappIntegration": true,
    "apiAccess": true
  }'::jsonb,
  false,
  3
)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- COMMENTS (Documentation)
-- ============================================

COMMENT ON TABLE subscription_plans IS 'Pricing plans available for subscription';
COMMENT ON TABLE tenants IS 'Hospital tenants using the system';
COMMENT ON TABLE tenant_usage IS 'Track resource usage per tenant for billing and limits';
COMMENT ON TABLE billing_transactions IS 'Payment transactions and invoices';
COMMENT ON TABLE tenant_audit_log IS 'Audit trail of important tenant actions';

COMMENT ON COLUMN tenants.subdomain IS 'Unique subdomain like "xyz-hospital" for xyz-hospital.yourapp.com';
COMMENT ON COLUMN tenants.enabled_modules IS 'Array of enabled module names based on subscription plan';
COMMENT ON COLUMN tenant_usage.monthly_patients IS 'Resets every month, used for usage-based billing if needed';
