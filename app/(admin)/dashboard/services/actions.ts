"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentAdmin } from "@/lib/auth/get-current-admin";
import { serviceSchema } from "@/lib/validations/service";

export type ServiceFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "duration_minutes" | "price_reais", string>>;
};

function parseServiceForm(
  formData: FormData
): { ok: true; data: ReturnType<typeof serviceSchema.parse> } | { ok: false; state: ServiceFormState } {
  const parsed = serviceSchema.safeParse({
    name: formData.get("name"),
    duration_minutes: formData.get("duration_minutes"),
    price_reais: formData.get("price_reais"),
  });

  if (!parsed.success) {
    const fieldErrors: ServiceFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "name" || field === "duration_minutes" || field === "price_reais") {
        fieldErrors[field] = issue.message;
      }
    }
    return { ok: false, state: { fieldErrors } };
  }

  return { ok: true, data: parsed.data };
}

export async function createService(
  _prevState: ServiceFormState,
  formData: FormData
): Promise<ServiceFormState> {
  const parsed = parseServiceForm(formData);
  if (!parsed.ok) return parsed.state;
  const { data } = parsed;

  const { supabase, admin } = await getCurrentAdmin();

  const { error } = await supabase.from("services").insert({
    salon_id: admin.salonId,
    name: data.name,
    duration_minutes: data.duration_minutes,
    price_cents: Math.round(data.price_reais * 100),
  });

  if (error) {
    return { error: "Não foi possível criar o serviço. Tente novamente." };
  }

  revalidatePath("/dashboard/services");
  redirect("/dashboard/services");
}

export async function updateService(
  serviceId: string,
  _prevState: ServiceFormState,
  formData: FormData
): Promise<ServiceFormState> {
  const parsed = parseServiceForm(formData);
  if (!parsed.ok) return parsed.state;
  const { data } = parsed;

  const { supabase } = await getCurrentAdmin();

  // RLS garante que só é possível atualizar um serviço do próprio salão —
  // não é preciso (nem seguro) confiar em nenhum salon_id vindo do cliente.
  const { error } = await supabase
    .from("services")
    .update({
      name: data.name,
      duration_minutes: data.duration_minutes,
      price_cents: Math.round(data.price_reais * 100),
    })
    .eq("id", serviceId);

  if (error) {
    return { error: "Não foi possível salvar as alterações. Tente novamente." };
  }

  revalidatePath("/dashboard/services");
  redirect("/dashboard/services");
}

export async function toggleServiceActive(serviceId: string, nextActive: boolean) {
  const { supabase } = await getCurrentAdmin();

  await supabase.from("services").update({ active: nextActive }).eq("id", serviceId);

  revalidatePath("/dashboard/services");
}
