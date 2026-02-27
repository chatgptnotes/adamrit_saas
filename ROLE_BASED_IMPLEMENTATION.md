# 🎭 Role-Based Access Control - Implementation Guide

Complete guide to implement role-based system in your Hospital Management SaaS

---

## 📋 Table of Contents

1. [Database Setup](#database-setup)
2. [Backend Implementation](#backend-implementation)
3. [Frontend Implementation](#frontend-implementation)
4. [Testing](#testing)

---

## 1. Database Setup

### Step 1.1: Create Role Permissions Table

```sql
-- File: supabase/migrations/saas_004_roles_permissions.sql

-- Roles enum
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'admin',
  'reception',
  'lab',
  'radiology',
  'pharmacy',
  'doctor',
  'nurse',
  'accountant'
);

-- Update users table
ALTER TABLE "User" 
  ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'reception',
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Role permissions table
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  module TEXT NOT NULL, -- 'patients', 'lab', 'pharmacy', etc.
  can_create BOOLEAN DEFAULT false,
  can_read BOOLEAN DEFAULT false,
  can_update BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  UNIQUE(role, module)
);

-- Seed permissions
INSERT INTO role_permissions (role, module, can_create, can_read, can_update, can_delete) VALUES
  -- SUPER ADMIN: Full access to everything
  ('super_admin', 'tenants', true, true, true, true),
  ('super_admin', 'users', true, true, true, true),
  ('super_admin', 'patients', true, true, true, true),
  ('super_admin', 'billing', true, true, true, true),
  
  -- ADMIN: Full access to hospital data
  ('admin', 'users', true, true, true, true),
  ('admin', 'patients', true, true, true, true),
  ('admin', 'visits', true, true, true, true),
  ('admin', 'lab', true, true, true, true),
  ('admin', 'radiology', true, true, true, true),
  ('admin', 'pharmacy', true, true, true, true),
  ('admin', 'billing', true, true, true, true),
  ('admin', 'reports', false, true, false, false),
  ('admin', 'settings', false, true, true, false),
  
  -- RECEPTION: Patient management + Billing
  ('reception', 'patients', true, true, true, false),
  ('reception', 'visits', true, true, true, false),
  ('reception', 'billing', true, true, true, false),
  ('reception', 'appointments', true, true, true, false),
  ('reception', 'lab', false, true, false, false), -- View only
  ('reception', 'radiology', false, true, false, false), -- View only
  
  -- LAB: Lab module only
  ('lab', 'lab', false, true, true, false), -- Can read and update
  ('lab', 'patients', false, true, false, false), -- View patient info only
  
  -- RADIOLOGY: Radiology module only
  ('radiology', 'radiology', false, true, true, false),
  ('radiology', 'patients', false, true, false, false),
  
  -- PHARMACY: Pharmacy module only
  ('pharmacy', 'pharmacy', true, true, true, false),
  ('pharmacy', 'patients', false, true, false, false),
  
  -- DOCTOR: Clinical access
  ('doctor', 'patients', false, true, true, false),
  ('doctor', 'visits', false, true, true, false),
  ('doctor', 'lab', true, true, false, false), -- Can order, can't enter results
  ('doctor', 'radiology', true, true, false, false),
  ('doctor', 'pharmacy', false, true, false, false), -- View prescriptions
  
  -- NURSE: Patient care
  ('nurse', 'patients', false, true, true, false),
  ('nurse', 'visits', false, true, true, false),
  ('nurse', 'lab', false, true, false, false),
  ('nurse', 'radiology', false, true, false, false);

-- Function to check permission
CREATE OR REPLACE FUNCTION has_permission(
  user_role user_role,
  module_name TEXT,
  action TEXT -- 'create', 'read', 'update', 'delete'
) RETURNS BOOLEAN AS $$
DECLARE
  permission_column TEXT;
  has_perm BOOLEAN;
BEGIN
  -- Super admin has all permissions
  IF user_role = 'super_admin' THEN
    RETURN true;
  END IF;
  
  -- Build column name
  permission_column := 'can_' || action;
  
  -- Check permission
  EXECUTE format(
    'SELECT %I FROM role_permissions WHERE role = $1 AND module = $2',
    permission_column
  ) INTO has_perm USING user_role, module_name;
  
  RETURN COALESCE(has_perm, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit log for role-based actions
CREATE TABLE user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES "User"(id),
  tenant_id UUID REFERENCES tenants(id),
  action TEXT NOT NULL, -- 'create', 'read', 'update', 'delete'
  module TEXT NOT NULL,
  record_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_log_user ON user_activity_log(user_id);
CREATE INDEX idx_activity_log_tenant ON user_activity_log(tenant_id);
CREATE INDEX idx_activity_log_created ON user_activity_log(created_at DESC);

-- Function to log activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_action TEXT,
  p_module TEXT,
  p_record_id UUID DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO user_activity_log (user_id, tenant_id, action, module, record_id)
  VALUES (
    p_user_id,
    (SELECT tenant_id FROM "User" WHERE id = p_user_id),
    p_action,
    p_module,
    p_record_id
  );
END;
$$ LANGUAGE plpgsql;
```

---

## 2. Backend Implementation

### Step 2.1: Create Permission Checker

```typescript
// src/utils/permissions.ts

export type UserRole = 
  | 'super_admin'
  | 'admin'
  | 'reception'
  | 'lab'
  | 'radiology'
  | 'pharmacy'
  | 'doctor'
  | 'nurse';

export type Module = 
  | 'patients'
  | 'visits'
  | 'lab'
  | 'radiology'
  | 'pharmacy'
  | 'billing'
  | 'users'
  | 'settings'
  | 'reports';

export type Action = 'create' | 'read' | 'update' | 'delete';

interface Permission {
  module: Module;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
}

// Permission cache (loaded once on login)
let permissionsCache: Map<string, Permission[]> = new Map();

export async function loadPermissions(role: UserRole): Promise<void> {
  if (role === 'super_admin') {
    // Super admin has all permissions
    return;
  }

  const { data, error } = await supabase
    .from('role_permissions')
    .select('*')
    .eq('role', role);

  if (error) {
    console.error('Failed to load permissions:', error);
    return;
  }

  permissionsCache.set(role, data);
}

export function canAccess(
  role: UserRole,
  module: Module,
  action: Action
): boolean {
  // Super admin can do everything
  if (role === 'super_admin') {
    return true;
  }

  const permissions = permissionsCache.get(role);
  if (!permissions) {
    console.warn('Permissions not loaded for role:', role);
    return false;
  }

  const modulePermission = permissions.find(p => p.module === module);
  if (!modulePermission) {
    return false;
  }

  const actionKey = `can_${action}` as keyof Permission;
  return modulePermission[actionKey] as boolean;
}

// Helper functions for common checks
export function canCreate(role: UserRole, module: Module): boolean {
  return canAccess(role, module, 'create');
}

export function canRead(role: UserRole, module: Module): boolean {
  return canAccess(role, module, 'read');
}

export function canUpdate(role: UserRole, module: Module): boolean {
  return canAccess(role, module, 'update');
}

export function canDelete(role: UserRole, module: Module): boolean {
  return canAccess(role, module, 'delete');
}

// Log activity
export async function logActivity(
  userId: string,
  action: Action,
  module: Module,
  recordId?: string
): Promise<void> {
  await supabase.rpc('log_user_activity', {
    p_user_id: userId,
    p_action: action,
    p_module: module,
    p_record_id: recordId || null
  });
}
```

### Step 2.2: Update AuthContext

```typescript
// src/contexts/AuthContext.tsx (additions)

import { loadPermissions, UserRole } from '@/utils/permissions';

interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  tenant_id: string;
  hospitalType: HospitalType;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (credentials: { email: string; password: string }): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('User')
        .select('*')
        .eq('email', credentials.email.toLowerCase())
        .single();

      if (error || !data) {
        return false;
      }

      // Check password
      const isPasswordValid = await comparePassword(credentials.password, data.password);
      if (!isPasswordValid) {
        return false;
      }

      const user: User = {
        id: data.id,
        email: data.email,
        username: data.email.split('@')[0],
        role: data.role as UserRole,
        tenant_id: data.tenant_id,
        hospitalType: data.hospital_type || 'hope'
      };

      // Load permissions for this role
      await loadPermissions(user.role);

      // Update last login
      await supabase
        .from('User')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      setUser(user);
      localStorage.setItem('hmis_user', JSON.stringify(user));
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  // ... rest of context
};
```

---

## 3. Frontend Implementation

### Step 3.1: Role-Based Navigation

```typescript
// src/components/RoleBasedSidebar.tsx

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { canRead } from '@/utils/permissions';
import { 
  Home, Users, Calendar, TestTube, Activity, 
  Pill, DollarSign, Settings, FileText 
} from 'lucide-react';

interface MenuItem {
  label: string;
  icon: React.ElementType;
  path: string;
  module: string;
}

const allMenuItems: MenuItem[] = [
  { label: 'Dashboard', icon: Home, path: '/dashboard', module: 'dashboard' },
  { label: 'Patients', icon: Users, path: '/patients', module: 'patients' },
  { label: 'OPD', icon: Calendar, path: '/opd', module: 'visits' },
  { label: 'IPD', icon: Activity, path: '/ipd', module: 'visits' },
  { label: 'Laboratory', icon: TestTube, path: '/lab', module: 'lab' },
  { label: 'Radiology', icon: Activity, path: '/radiology', module: 'radiology' },
  { label: 'Pharmacy', icon: Pill, path: '/pharmacy', module: 'pharmacy' },
  { label: 'Billing', icon: DollarSign, path: '/billing', module: 'billing' },
  { label: 'Reports', icon: FileText, path: '/reports', module: 'reports' },
  { label: 'Settings', icon: Settings, path: '/settings', module: 'settings' },
];

export function RoleBasedSidebar() {
  const { user } = useAuth();

  const visibleMenuItems = useMemo(() => {
    if (!user) return [];

    return allMenuItems.filter(item => {
      // Dashboard is visible to all
      if (item.module === 'dashboard') return true;
      
      // Check if user has read permission for this module
      return canRead(user.role, item.module as any);
    });
  }, [user]);

  return (
    <Sidebar>
      {visibleMenuItems.map(item => (
        <SidebarItem
          key={item.path}
          icon={item.icon}
          label={item.label}
          path={item.path}
        />
      ))}
    </Sidebar>
  );
}
```

### Step 3.2: Protected Actions

```typescript
// src/components/common/ProtectedButton.tsx

import { useAuth } from '@/contexts/AuthContext';
import { canAccess, Action, Module } from '@/utils/permissions';
import { Button, ButtonProps } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';

interface ProtectedButtonProps extends ButtonProps {
  module: Module;
  action: Action;
  fallback?: React.ReactNode;
}

export function ProtectedButton({
  module,
  action,
  fallback,
  children,
  ...props
}: ProtectedButtonProps) {
  const { user } = useAuth();

  if (!user || !canAccess(user.role, module, action)) {
    if (fallback) return <>{fallback}</>;
    
    return (
      <Tooltip content="You don't have permission for this action">
        <Button {...props} disabled>
          {children}
        </Button>
      </Tooltip>
    );
  }

  return <Button {...props}>{children}</Button>;
}

// Usage example:
<ProtectedButton
  module="patients"
  action="delete"
  variant="destructive"
  onClick={handleDelete}
>
  Delete Patient
</ProtectedButton>
```

### Step 3.3: Role-Specific Dashboards

```typescript
// src/pages/Dashboard.tsx

import { useAuth } from '@/contexts/AuthContext';
import SuperAdminDashboard from './dashboards/SuperAdminDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import ReceptionDashboard from './dashboards/ReceptionDashboard';
import LabDashboard from './dashboards/LabDashboard';
import RadiologyDashboard from './dashboards/RadiologyDashboard';
import PharmacyDashboard from './dashboards/PharmacyDashboard';
import DoctorDashboard from './dashboards/DoctorDashboard';
import NurseDashboard from './dashboards/NurseDashboard';

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  const dashboards = {
    super_admin: <SuperAdminDashboard />,
    admin: <AdminDashboard />,
    reception: <ReceptionDashboard />,
    lab: <LabDashboard />,
    radiology: <RadiologyDashboard />,
    pharmacy: <PharmacyDashboard />,
    doctor: <DoctorDashboard />,
    nurse: <NurseDashboard />,
  };

  return dashboards[user.role] || <div>Invalid role</div>;
}
```

### Step 3.4: Data Filtering by Role

```typescript
// src/hooks/usePatients.ts

import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function usePatients() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['patients', user?.tenant_id],
    queryFn: async () => {
      let query = supabase
        .from('patients')
        .select('*')
        .eq('tenant_id', user?.tenant_id);

      // Reception: Only see their own registered patients (optional)
      if (user?.role === 'reception') {
        query = query.eq('created_by', user.id);
      }

      // Lab/Radiology/Pharmacy: Only see patients with orders
      if (user?.role === 'lab') {
        query = query
          .select('*, lab_orders!inner(*)')
          .neq('lab_orders.status', 'completed');
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });
}
```

---

## 4. Testing

### Test Cases for Each Role

```typescript
// src/__tests__/roles.test.tsx

import { describe, it, expect } from 'vitest';
import { canAccess } from '@/utils/permissions';

describe('Role Permissions', () => {
  describe('Super Admin', () => {
    it('should have access to everything', () => {
      expect(canAccess('super_admin', 'patients', 'create')).toBe(true);
      expect(canAccess('super_admin', 'patients', 'delete')).toBe(true);
      expect(canAccess('super_admin', 'billing', 'update')).toBe(true);
    });
  });

  describe('Reception', () => {
    it('should create patients', () => {
      expect(canAccess('reception', 'patients', 'create')).toBe(true);
    });

    it('should NOT delete patients', () => {
      expect(canAccess('reception', 'patients', 'delete')).toBe(false);
    });

    it('should view lab orders but not update', () => {
      expect(canAccess('reception', 'lab', 'read')).toBe(true);
      expect(canAccess('reception', 'lab', 'update')).toBe(false);
    });
  });

  describe('Lab', () => {
    it('should update lab results', () => {
      expect(canAccess('lab', 'lab', 'update')).toBe(true);
    });

    it('should NOT create lab orders', () => {
      expect(canAccess('lab', 'lab', 'create')).toBe(false);
    });

    it('should view patients but not edit', () => {
      expect(canAccess('lab', 'patients', 'read')).toBe(true);
      expect(canAccess('lab', 'patients', 'update')).toBe(false);
    });
  });

  describe('Pharmacy', () => {
    it('should create pharmacy sales', () => {
      expect(canAccess('pharmacy', 'pharmacy', 'create')).toBe(true);
    });

    it('should NOT access lab module', () => {
      expect(canAccess('pharmacy', 'lab', 'read')).toBe(false);
    });
  });
});
```

---

## 5. Quick Implementation Checklist

### Database
- [ ] Run `saas_004_roles_permissions.sql`
- [ ] Add `role` column to User table
- [ ] Add `tenant_id` column to User table
- [ ] Seed role_permissions table
- [ ] Test permission functions

### Backend
- [ ] Create `src/utils/permissions.ts`
- [ ] Update AuthContext with role loading
- [ ] Add activity logging

### Frontend
- [ ] Create RoleBasedSidebar component
- [ ] Create ProtectedButton component
- [ ] Create role-specific dashboards
- [ ] Update all routes with role checks
- [ ] Test each role's access

### Testing
- [ ] Write unit tests for permissions
- [ ] Manual test each role
- [ ] Test data isolation
- [ ] Test permission errors

---

## 6. Security Best Practices

### 1. Always Check Permissions Server-Side
```typescript
// ❌ BAD: Only frontend check
if (canDelete(user.role, 'patients')) {
  await supabase.from('patients').delete().eq('id', patientId);
}

// ✅ GOOD: Backend RLS policy enforces
// Even if frontend is bypassed, RLS will block unauthorized deletes
```

### 2. Use RLS Policies
```sql
-- Patients table RLS
CREATE POLICY "Users can only see own tenant patients" ON patients
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND 
    has_permission(current_user_role(), 'patients', 'read')
  );
```

### 3. Log All Critical Actions
```typescript
await logActivity(user.id, 'delete', 'patients', patientId);
await supabase.from('patients').delete().eq('id', patientId);
```

### 4. Validate on Every Request
```typescript
// Create middleware/wrapper
async function protectedAction(
  role: UserRole,
  module: Module,
  action: Action,
  fn: () => Promise<any>
) {
  if (!canAccess(role, module, action)) {
    throw new Error('Unauthorized');
  }
  
  return await fn();
}
```

---

## Summary

**Implementation Time:** 1-2 weeks

**Steps:**
1. ✅ Database schema (1 day)
2. ✅ Permission system (2 days)
3. ✅ Frontend components (3 days)
4. ✅ Role-specific dashboards (3 days)
5. ✅ Testing (2 days)

**Result:** Complete role-based multi-tenant SaaS system

---

**Document Version:** 1.0  
**Last Updated:** 2025-02-27
