import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

// Server-side admin (service role) client. NEVER expose the service role key to the browser.
// This should only run in server contexts: Route Handlers / server actions / scripts.
export const createAdminClient = (): SupabaseClient => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL for admin client')
  }
  if (!serviceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY for admin client')
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}
