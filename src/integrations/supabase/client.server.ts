// SPA mode - this file is kept for compatibility
// In SPA mode, admin operations use the regular client with RLS
// No service role key is needed in the browser
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

function cleanEnvValue(value: string | undefined) {
  return value?.trim().replace(/^["']|["']$/g, '');
}

function createDummyClient(message: string): any {
  const dummyHandler: ProxyHandler<any> = {
    get(target, prop, receiver) {
      if (
        prop === 'then' ||
        prop === 'toJSON' ||
        prop === 'constructor' ||
        prop === '__esModule' ||
        prop === 'default' ||
        typeof prop === 'symbol'
      ) {
        return undefined;
      }
      return createDummyClient(message);
    },
    apply() {
      throw new Error(message);
    }
  };
  const dummyFn = () => {};
  return new Proxy(dummyFn, dummyHandler);
}

// SPA mode: use Vite env variables
export function getSupabaseAdminClient() {
  const SUPABASE_URL = cleanEnvValue(
    typeof import.meta !== 'undefined' 
      ? (import.meta.env.VITE_SUPABASE_URL as string)
      : undefined
  );
  
  if (!SUPABASE_URL) {
    return createDummyClient('Missing VITE_SUPABASE_URL');
  }

  // In SPA mode, we use the anon key with RLS - no service role key in browser
  return createClient<Database>(SUPABASE_URL, 
    cleanEnvValue(
      typeof import.meta !== 'undefined'
        ? (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string)
        : undefined
    ) || ''
  );
}

// SPA mode - exports for compatibility
export const supabaseAdmin = getSupabaseAdminClient();