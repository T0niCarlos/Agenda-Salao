"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  dateStrInTimeZone,
  getAvailableSlots,
  type AvailabilityError,
  type Slot,
} from "@/lib/booking/availability";
import { bookingSchema } from "@/lib/validations/booking";

export async function getProfessionalsForService(serviceId: string) {
  const supabase = await createClient();
  const { data: links } = await supabase
    .from("professional_services")
    .select("professional_id")
    .eq("service_id", serviceId);

  const ids = (links ?? []).map((l) => l.professional_id);
  if (ids.length === 0) return [];

  const { data } = await supabase
    .from("professionals")
    .select("id, name")
    .in("id", ids)
    .eq("active", true)
    .order("name");

  return data ?? [];
}

export async function getSlotsAction(
  salonSlug: string,
  professionalId: string,
  serviceId: string,
  dateStr: string
): Promise<{ ok: true; slots: Slot[] } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const { data: salon } = await admin
    .from("salons")
    .select("timezone")
    .eq("slug", salonSlug)
    .maybeSingle();

  if (!salon) return { ok: false, error: "Salão não encontrado." };

  const result = await getAvailableSlots(admin, {
    salonTimezone: salon.timezone,
    professionalId,
    serviceId,
    dateStr,
  });

  if (!result.ok) return { ok: false, error: availabilityErrorMessage(result.error) };
  return { ok: true, slots: result.slots };
}

function availabilityErrorMessage(error: AvailabilityError): string {
  const messages: Record<AvailabilityError, string> = {
    professional_not_found: "Profissional não encontrado.",
    professional_inactive: "Profissional indisponível.",
    service_not_found: "Serviço não encontrado.",
    service_inactive: "Serviço indisponível.",
    professional_does_not_offer_service: "Este profissional não atende esse serviço.",
  };
  return messages[error];
}

export type CreateBookingState = {
  error?: string;
  fieldErrors?: Partial<Record<"client_name" | "client_whatsapp", string>>;
  success?: boolean;
};

export async function createBookingAction(
  salonSlug: string,
  _prevState: CreateBookingState,
  formData: FormData
): Promise<CreateBookingState> {
  const parsed = bookingSchema.safeParse({
    professional_id: formData.get("professional_id"),
    service_id: formData.get("service_id"),
    start_datetime: formData.get("start_datetime"),
    client_name: formData.get("client_name"),
    client_whatsapp: formData.get("client_whatsapp"),
  });

  if (!parsed.success) {
    const fieldErrors: CreateBookingState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "client_name" || field === "client_whatsapp") {
        fieldErrors[field] = issue.message;
      }
    }
    if (Object.keys(fieldErrors).length > 0) return { fieldErrors };
    return { error: "Selecione o serviço, profissional e horário novamente." };
  }

  const data = parsed.data;
  const admin = createAdminClient();

  const { data: salon } = await admin
    .from("salons")
    .select("id, timezone")
    .eq("slug", salonSlug)
    .maybeSingle();
  if (!salon) return { error: "Salão não encontrado." };

  const { data: service } = await admin
    .from("services")
    .select("price_cents, duration_minutes, active")
    .eq("id", data.service_id)
    .maybeSingle();
  if (!service || !service.active) return { error: "Serviço indisponível." };

  // Revalida o horário escolhido com a MESMA regra usada para exibir a
  // disponibilidade (nunca confiamos que o slot ainda esteja livre só
  // porque o cliente o selecionou na tela).
  const requestedStart = new Date(data.start_datetime);
  const dateStr = dateStrInTimeZone(requestedStart, salon.timezone);
  const availability = await getAvailableSlots(admin, {
    salonTimezone: salon.timezone,
    professionalId: data.professional_id,
    serviceId: data.service_id,
    dateStr,
  });

  if (!availability.ok) return { error: availabilityErrorMessage(availability.error) };

  const stillValid = availability.slots.some(
    (s) => s.start === requestedStart.toISOString()
  );
  if (!stillValid) {
    return { error: "Esse horário não está mais disponível. Escolha outro." };
  }

  const { data: client, error: clientError } = await admin
    .from("clients")
    .upsert(
      { salon_id: salon.id, name: data.client_name, whatsapp: data.client_whatsapp },
      { onConflict: "salon_id,whatsapp" }
    )
    .select("id")
    .single();
  if (clientError || !client) {
    return { error: "Não foi possível registrar seus dados. Tente novamente." };
  }

  // end_datetime e price_cents SEMPRE calculados a partir do serviço no
  // banco — nunca a partir de valores vindos do formulário.
  const endDate = new Date(requestedStart.getTime() + service.duration_minutes * 60_000);

  const { error: insertError } = await admin.from("appointments").insert({
    salon_id: salon.id,
    professional_id: data.professional_id,
    service_id: data.service_id,
    client_id: client.id,
    start_datetime: requestedStart.toISOString(),
    end_datetime: endDate.toISOString(),
    price_cents: service.price_cents,
  });

  if (insertError) {
    // 23P01 = violação da EXCLUDE constraint anti double-booking: outra
    // requisição confirmou esse mesmo horário entre a checagem e o insert.
    if (insertError.code === "23P01") {
      return { error: "Esse horário acabou de ser reservado por outra pessoa. Escolha outro." };
    }
    return { error: "Não foi possível confirmar o agendamento. Tente novamente." };
  }

  return { success: true };
}
