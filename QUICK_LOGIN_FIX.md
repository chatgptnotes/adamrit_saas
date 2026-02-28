# Quick Login Fix - RPC Not Working

## Problem
Login stuck at "Signing In..." - RPC function not returning data

## Quick Fix - Test in Supabase

### Step 1: Test Function
Run this in Supabase SQL Editor:

```sql
-- Test with a real user
SELECT * FROM verify_user_password('b@gmail.com', 'your_actual_password');
```

**Expected:** Should return user data
**If error:** Note the error message

### Step 2: Check Function Exists
```sql
SELECT proname, proargnames 
FROM pg_proc 
WHERE proname = 'verify_user_password';
```

### Step 3: Check Permissions
```sql
-- Grant permissions again
GRANT EXECUTE ON FUNCTION verify_user_password(TEXT, TEXT) TO anon, authenticated;
```

### Step 4: Alternative - Rollback to Old Login

If RPC still not working, use old method temporarily:

**File:** `src/contexts/AuthContext.tsx`

**Replace the RPC section with old code:**

```typescript
// OLD METHOD (temporary fix)
const { data, error } = await supabase
  .from('User')
  .select('*')
  .eq('email', credentials.email.toLowerCase())
  .single();

if (error || !data) {
  console.error('Login error:', error);
  return false;
}

// Simple password check (plain text for now)
if (data.password !== credentials.password) {
  console.error('❌ Invalid password');
  return false;
}

const user: User = {
  id: data.id,
  email: data.email,
  username: data.email.split('@')[0],
  full_name: data.full_name,
  phone: data.phone,
  is_active: data.is_active,
  role: data.role,
  hospitalType: data.hospital_type || 'hope',
  hospital_type: data.hospital_type || 'hope'
};
```

This will make login work again (though slower on mobile).
