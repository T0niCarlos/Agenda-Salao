import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/database.types";

/**
 * Client Supabase para uso em Server Components, Server Actions e Route
 * Handlers. Usa a anon key + os cookies de sessão da requisição, então
 * as RLS policies do usuário autenticado (admin) se aplicam normalmente.
 *
 * Para operações que precisam rodar como o backend (ex.: criação de
 * agendamento pelo cliente público, que não tem sessão), usar
 * `createAdminClient()` de `lib/supabase/admin.ts` — nunca este client.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // `setAll` chamado a partir de um Server Component: pode ser
            // ignorado com segurança se o middleware já cuida do refresh
            // de sessão (ver middleware.ts).
          }
        },
      },
    }
  );
}
