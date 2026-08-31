import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { AdminRole } from "@/lib/supabase/database.types";

export type CurrentAdmin = {
  userId: string;
  salonId: string;
  name: string;
  role: AdminRole;
};

/**
 * Retorna o client Supabase (com RLS aplicada à sessão atual) e os dados do
 * admin autenticado. Redireciona para /login se não houver sessão, ou se a
 * sessão existir mas não tiver vínculo em admin_users (usuário autenticado
 * no Supabase Auth mas não provisionado como admin de nenhum salão).
 *
 * Toda Server Action que grava dados deve chamar isto para obter o
 * `salonId` a usar no INSERT — NUNCA aceitar salon_id vindo de um campo de
 * formulário/input do cliente, mesmo que a RLS também bloquearia: a fonte
 * da verdade é sempre a sessão do servidor.
 */
export async function getCurrentAdmin(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  admin: CurrentAdmin;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("salon_id, name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!adminUser) {
    redirect("/login?error=not_admin");
  }

  return {
    supabase,
    admin: {
      userId: user.id,
      salonId: adminUser.salon_id,
      name: adminUser.name,
      role: adminUser.role,
    },
  };
}
