/**
 * Mock Users for Testing
 * Auto-creates test users in database if they don't exist
 */

import { supabase } from '@/integrations/supabase/client';

export const MOCK_CREDENTIALS = {
  superAdmin: {
    email: 'superadmin@yourapp.com',
    password: 'SuperAdmin@123',
    role: 'super_admin',
    name: 'Super Admin',
  },
  admin: {
    email: 'admin@hopehospital.com',
    password: 'Admin@Hope123',
    role: 'admin',
    name: 'Hospital Admin',
    tenant_id: 'hope-001',
    hospital_type: 'hope',
  },
  reception1: {
    email: 'reception1@hopehospital.com',
    password: 'Reception@123',
    role: 'reception',
    name: 'Priya Sharma',
    tenant_id: 'hope-001',
    hospital_type: 'hope',
  },
  reception2: {
    email: 'reception2@hopehospital.com',
    password: 'Reception@456',
    role: 'reception',
    name: 'Rahul Kumar',
    tenant_id: 'hope-001',
    hospital_type: 'hope',
  },
  lab: {
    email: 'lab@hopehospital.com',
    password: 'Lab@Hope123',
    role: 'lab',
    name: 'Dr. Suresh Patel',
    tenant_id: 'hope-001',
    hospital_type: 'hope',
  },
  radiology: {
    email: 'radiology@hopehospital.com',
    password: 'Radio@Hope123',
    role: 'radiology',
    name: 'Amit Verma',
    tenant_id: 'hope-001',
    hospital_type: 'hope',
  },
  pharmacy: {
    email: 'pharmacy@hopehospital.com',
    password: 'Pharma@Hope123',
    role: 'pharmacy',
    name: 'Rajesh Gupta',
    tenant_id: 'hope-001',
    hospital_type: 'hope',
  },
  doctor1: {
    email: 'doctor1@hopehospital.com',
    password: 'Doctor@Hope123',
    role: 'doctor',
    name: 'Dr. Ravi Mehta',
    tenant_id: 'hope-001',
    hospital_type: 'hope',
  },
  doctor2: {
    email: 'doctor2@hopehospital.com',
    password: 'Doctor@Hope456',
    role: 'doctor',
    name: 'Dr. Sunita Rao',
    tenant_id: 'hope-001',
    hospital_type: 'hope',
  },
  nurse1: {
    email: 'nurse1@hopehospital.com',
    password: 'Nurse@Hope123',
    role: 'nurse',
    name: 'Sister Mary',
    tenant_id: 'hope-001',
    hospital_type: 'hope',
  },
};

/**
 * Auto-create mock users if they don't exist
 * Call this on app initialization in development mode
 */
export async function ensureMockUsersExist() {
  if (!import.meta.env.DEV) {
    console.log('Mock users only created in development mode');
    return;
  }

  console.log('🧪 Checking for mock users...');

  try {
    const users = Object.values(MOCK_CREDENTIALS);
    let created = 0;
    let existing = 0;

    for (const user of users) {
      // Check if user exists
      const { data: existingUser } = await supabase
        .from('User')
        .select('email')
        .eq('email', user.email)
        .single();

      if (existingUser) {
        existing++;
        continue;
      }

      // Create user if doesn't exist
      const { error } = await supabase.from('User').insert([
        {
          email: user.email,
          password: user.password, // Will be hashed by auth system
          role: user.role,
          tenant_id: user.tenant_id || null,
          hospital_type: user.hospital_type || null,
          is_active: true,
        },
      ]);

      if (error) {
        console.error(`Failed to create ${user.email}:`, error);
      } else {
        created++;
        console.log(`✅ Created mock user: ${user.email}`);
      }
    }

    console.log(
      `🎉 Mock users ready: ${existing} existing, ${created} created`
    );
  } catch (error) {
    console.error('Error ensuring mock users:', error);
  }
}

/**
 * Get all mock user emails for display
 */
export function getMockUsersList() {
  return Object.entries(MOCK_CREDENTIALS).map(([key, user]) => ({
    key,
    email: user.email,
    password: user.password,
    role: user.role,
    name: user.name,
  }));
}
