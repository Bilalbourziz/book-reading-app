// Profile update proxy server - runs alongside npm run dev
// Uses Supabase service_role key to bypass RLS on profile updates
// Start with: node server-proxy.js (in a separate terminal)

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import http from 'http';

// Read .env file
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

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const PORT = 3001;

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method !== 'POST' || req.url !== '/update-profile') {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'POST /update-profile only' }));
    return;
  }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const { userId, displayName, avatarUrl } = JSON.parse(body);
      
      if (!userId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'userId is required' }));
        return;
      }

      const updateData = {};
      if (displayName !== undefined) updateData.display_name = displayName;
      if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl;
      updateData.updated_at = new Date().toISOString();

      const { error } = await adminClient
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        console.error('Update error:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n  🔧 Profile proxy server running on http://localhost:${PORT}`);
  console.log(`  📝 Keep this running alongside 'npm run dev'`);
  console.log(`  ✅ The app will use this server to update profiles (bypassing RLS)\n`);
});