"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentAdmin } from "@/lib/auth/get-current-admin";

const clientSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome."),
  whatsapp: z.string().trim().regex(/^\d{10,15}$/, "WhatsApp inválido."),
});

export async function updateClient(clientId: string, formData: FormData) {
  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    whatsapp: formData.get("whatsapp"),
  });
  if (!parsed.success) {
    redirect(`/dashboard/clients/${clientId}/edit`);
  }

  const { supabase } = await getCurrentAdmin();
  await supabase
    .from("clients")
    .update({ name: parsed.data.name, whatsapp: parsed.data.whatsapp })
    .eq("id", clientId);

  revalidatePath("/dashboard/clients");
  redirect("/dashboard/clients");
}
