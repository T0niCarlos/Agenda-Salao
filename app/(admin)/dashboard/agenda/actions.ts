"use server";

import { revalidatePath } from "next/cache";

import { getCurrentAdmin } from "@/lib/auth/get-current-admin";
import { getAvailableSlots, dateStrInTimeZone, type Slot } from "@/lib/booking/availability";
import { appointmentStatusSchema, manualBookingSchema } from "@/lib/validations/manual-booking";

export async function getSlotsForAdmin(
  professionalId: string,
  serviceId: string,
  dateStr: string
): Promise<{ ok: true; slots: Slot[] } | { ok: false; error: string }> {
  const { supabase, admin } = await getCurrentAdmin();
  const { data: salon } = await supabase
    .from("salons")
    .select("timezone")
    .eq("id", admin.salonId)
    .maybeSingle();
  if (!salon) return { ok: false, error: "Salão não encontrado." };

  const result = await getAvailableSlots(supabase, {
    salonTimezone: salon.timezone,
    professionalId,
    serviceId,
    dateStr,
  });

  if (!result.ok) return { ok: false, error: "Não foi possível calcular a disponibilidade." };
  return { ok: true, slots: result.slots };
}

export type ManualBookingState = {
  error?: string;
  fieldErrors?: Partial<Record<"client_name" | "client_whatsapp", string>>;
  success?: boolean;
};

export async function createManualAppointment(
  _prevState: ManualBookingState,
  formData: FormData
): Promise<ManualBookingState> {
  const parsed = manualBookingSchema.safeParse({
    professional_id: formData.get("professional_id"),
    service_id: formData.get("service_id"),
    start_datetime: formData.get("start_datetime"),
    client_name: formData.get("client_name"),
    client_whatsapp: formData.get("client_whatsapp"),
  });

  if (!parsed.success) {
    const fieldErrors: ManualBookingState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "client_name" || field === "client_whatsapp") fieldErrors[field] = issue.message;
    }
    if (Object.keys(fieldErrors).length > 0) return { fieldErrors };
    return { error: "Selecione profissional, serviço e horário." };
  }

  const data = parsed.data;
  const { supabase, admin } = await getCurrentAdmin();

  const { data: salon } = await supabase
    .from("salons")
    .select("timezone")
    .eq("id", admin.salonId)
    .maybeSingle();
  if (!salon) return { error: "Salão não encontrado." };

  const { data: service } = await supabase
    .from("services")
    .select("price_cents, duration_minutes, active")
    .eq("id", data.service_id)
    .maybeSingle();
  if (!service || !service.active) return { error: "Serviço indisponível." };

  // Mesma regra de disponibilidade do fluxo público — sem duplicar lógica.
  const requestedStart = new Date(data.start_datetime);
  const dateStr = dateStrInTimeZone(requestedStart, salon.timezone);
  const availability = await getAvailableSlots(supabase, {
    salonTimezone: salon.timezone,
    professionalId: data.professional_id,
    serviceId: data.service_id,
    dateStr,
  });
  if (!availability.ok) return { error: "Não foi possível validar o horário." };
  if (!availability.slots.some((s) => s.start === requestedStart.toISOString())) {
    return { error: "Esse horário não está mais disponível. Escolha outro." };
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .upsert(
      { salon_id: admin.salonId, name: data.client_name, whatsapp: data.client_whatsapp },
      { onConflict: "salon_id,whatsapp" }
    )
    .select("id")
    .single();
  if (clientError || !client) return { error: "Não foi possível registrar o cliente." };

  const endDate = new Date(requestedStart.getTime() + service.duration_minutes * 60_000);

  const { error: insertError } = await supabase.from("appointments").insert({
    salon_id: admin.salonId,
    professional_id: data.professional_id,
    service_id: data.service_id,
    client_id: client.id,
    start_datetime: requestedStart.toISOString(),
    end_datetime: endDate.toISOString(),
    price_cents: service.price_cents,
  });

  if (insertError) {
    if (insertError.code === "23P01") {
      return { error: "Esse horário acabou de ser reservado. Escolha outro." };
    }
    return { error: "Não foi possível criar o agendamento." };
  }

  revalidatePath("/dashboard/agenda");
  return { success: true };
}

export async function cancelAppointment(appointmentId: string) {
  const { supabase } = await getCurrentAdmin();
  await supabase.from("appointments").update({ status: "cancelled" }).eq("id", appointmentId);
  revalidatePath("/dashboard/agenda");
}

export async function updateAppointmentStatus(appointmentId: string, status: string) {
  const parsed = appointmentStatusSchema.safeParse(status);
  if (!parsed.success) return;
  const { supabase } = await getCurrentAdmin();
  await supabase.from("appointments").update({ status: parsed.data }).eq("id", appointmentId);
  revalidatePath("/dashboard/agenda");
}
// 1. APAGAR AGENDAMENTO DEFINITIVAMENTE DO BANCO
export async function deleteAppointment(appointmentId: string) {
  const { supabase } = await getCurrentAdmin();
  await supabase.from("appointments").delete().eq("id", appointmentId);
  revalidatePath("/dashboard/agenda");
  revalidatePath("/dashboard/faturamento");
}

// 2. APAGAR SERVIÇO
export async function deleteService(serviceId: string) {
  const { supabase } = await getCurrentAdmin();
  await supabase.from("services").delete().eq("id", serviceId);
  revalidatePath("/dashboard/services");
}

// 3. APAGAR CLIENTE
export async function deleteClient(clientId: string) {
  const { supabase } = await getCurrentAdmin();
  await supabase.from("clients").delete().eq("id", clientId);
  revalidatePath("/dashboard/clients");
}
