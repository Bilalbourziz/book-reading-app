import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load environment variables from .env
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Read the migration file
const migrationSQL = readFileSync('./supabase/migrations/20260621140000_allow_users_read_favorites.sql', 'utf-8');

console.log('Applying migration: Allow users to read favorites...');

// Execute the migration
const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

if (error) {
  console.error('Error applying migration:', error);
  process.exit(1);
}

console.log('✓ Migration applied successfully!');
console.log('✓ Users can now see total favorites across all users');