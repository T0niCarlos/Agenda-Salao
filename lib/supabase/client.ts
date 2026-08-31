import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/database.types";

/**
 * Client Supabase para uso EXCLUSIVO em Client Components ("use client").
 * Usa apenas a anon key (pública) — respeita as RLS policies do papel `anon`
 * ou `authenticated`, nunca faz bypass de RLS.
 *
 * Não usar em Server Components, Server Actions ou Route Handlers — para
 * esses contextos, usar `createServerSupabaseClient()` de `lib/supabase/server.ts`.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
