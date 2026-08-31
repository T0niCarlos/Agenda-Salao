import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

/**
 * Client Supabase com a SERVICE ROLE KEY — faz bypass total de RLS.
 *
 * USO RESTRITO: apenas em Server Actions / Route Handlers que precisam
 * agir "como o backend" porque não existe sessão de usuário (ex.: o
 * cliente público criando um agendamento, ou consultando disponibilidade
 * cruzando working_hours + blocks + appointments).
 *
 * Todo código que usa este client é RESPONSÁVEL POR VALIDAR MANUALMENTE
 * tudo que a RLS validaria (multi-tenant, regras de negócio) — nunca
 * repassar input do cliente direto para uma query sem validar antes.
 *
 * NUNCA importar este arquivo em um Client Component ou em qualquer
 * código que possa acabar no bundle do browser: a `server-only` import
 * acima já quebra o build do Next.js se isso acontecer.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL não configurados."
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
