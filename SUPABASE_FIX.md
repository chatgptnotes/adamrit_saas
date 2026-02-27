# Supabase Connection Timeout Fix

## Problem
`ERR_CONNECTION_TIMED_OUT` error aa raha hai Supabase se connect karte waqt.

## Quick Checks

1. **Supabase Dashboard Check:**
   - Go to: https://supabase.com/dashboard
   - Login and check project status
   - Project ID: xvkxccqaopbnkvwgyfjv
   - If paused → Click "Resume Project"

2. **Internet Connection:**
   ```bash
   ping supabase.co
   curl https://xvkxccqaopbnkvwgyfjv.supabase.co
   ```

3. **Check .env file:**
   ```bash
   cat .env | grep SUPABASE
   ```

## If Supabase is Down/Paused

You have two options:

### Option A: Resume Supabase Project
- Login to Supabase dashboard
- Resume the project
- Wait 2-3 minutes for activation

### Option B: Use Different Supabase Project
1. Create new project on Supabase
2. Update `.env` with new credentials:
   ```
   VITE_SUPABASE_URL=https://your-new-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-new-anon-key
   ```
3. Run migrations on new project
4. Restart dev server

## Current Status
- Project URL: https://xvkxccqaopbnkvwgyfjv.supabase.co
- Status: CONNECTION_TIMEOUT (likely paused or down)
