// Run this ONCE: node fix-profile-rls.js
// This applies the RLS policy fix using the service_role key from .env
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';

const envPath = '.env';
if (!existsSync(envPath)) {
  console.error('.env file not found');
  process.exit(1);
}

const envContent = readFileSync(envPath, 'utf-8');
function clean(s) {
  return s?.replace(/^["']|["']$/g, '').trim();
}
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) envVars[key.trim()] = clean(vals.join('='));
});

const SUPABASE_URL = envVars.VITE_SUPABASE_URL || envVars.SUPABASE_URL;
const SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

// Use the service_role key to bypass RLS and apply SQL directly
// via the Supabase REST API
async function main() {
  console.log('Applying RLS policy fix to profiles table...');
  console.log(`Supabase URL: ${SUPABASE_URL}`);

  // Use the REST API directly with service_role key to execute SQL
  const sql = encodeURIComponent(`
DROP POLICY IF EXISTS "users update own profile" ON public.profiles;
CREATE POLICY "users update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users insert own profile" ON public.profiles;
CREATE POLICY "users insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
`);

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ sql }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('REST API error:', response.status, text);
    
    // Try alternative: use pg_dump or direct SQL via the management API
    console.log('\nTrying alternative approach via Supabase Management API...');
    
    const projectId = envVars.VITE_SUPABASE_PROJECT_ID || envVars.SUPABASE_PROJECT_ID;
    if (!projectId) {
      console.error('Missing SUPABASE_PROJECT_ID in .env');
      process.exit(1);
    }
    
    // Use the management API to run SQL
    const mgmtResponse = await fetch(
      `https://api.supabase.com/v1/projects/${projectId}/database/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          query: decodeURIComponent(sql),
        }),
      }
    );
    
    if (!mgmtResponse.ok) {
      const mgmtText = await mgmtResponse.text();
      console.error('Management API error:', mgmtResponse.status, mgmtText);
      console.log('\n❌ Could not apply automatically.');
      console.log('Please run this SQL manually in Supabase Dashboard → SQL Editor:');
      console.log('\n' + decodeURIComponent(sql));
      process.exit(1);
    }
    
    console.log('✅ RLS policies fixed via Management API!');
  } else {
    console.log('✅ RLS policies fixed via REST API!');
  }
  
  console.log('🔄 Now sign out and sign back in, then test the profile update.');
}

main().catch(console.error);