import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type Slot = { start: string; end: string }; // ISO 8601 (UTC)

export type AvailabilityError =
  | "professional_not_found"
  | "professional_inactive"
  | "service_not_found"
  | "service_inactive"
  | "professional_does_not_offer_service";

export type AvailabilityResult =
  | { ok: true; slots: Slot[] }
  | { ok: false; error: AvailabilityError };

/**
 * Converte uma data+hora "de parede" (ex.: 14:00 do dia 2026-09-10) num
 * instante UTC correto, dado um timezone IANA. Não depende de nenhuma lib
 * externa — usa o próprio Intl do Node (respeita horário de verão).
 */
export function zonedWallTimeToUtc(dateStr: string, timeStr: string, timeZone: string): Date {
  const [yStr, mStr, dStr] = dateStr.split("-");
  const [hhStr, mmStr] = timeStr.split(":");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  const hh = Number(hhStr);
  const mm = Number(mmStr);

  const utcGuess = Date.UTC(y, m - 1, d, hh, mm, 0);

  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = fmt.formatToParts(new Date(utcGuess)).reduce<Record<string, string>>(
    (acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value;
      return acc;
    },
    {}
  );

  const tzGuess = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) === 24 ? 0 : Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );

  return new Date(utcGuess + (utcGuess - tzGuess));
}

/** Dia da semana (0=domingo..6=sábado) de uma data de calendário "YYYY-MM-DD". */
export function dateStrInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function weekdayOf(dateStr: string): number {
  const [yStr, mStr, dStr] = dateStr.split("-");
  return new Date(Date.UTC(Number(yStr), Number(mStr) - 1, Number(dStr))).getUTCDay();
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/**
 * Calcula os horários disponíveis de um profissional para um serviço numa
 * data específica. Implementa a REGRA CRÍTICA de agendamento (ver
 * supabase/migrations): profissional ativo, serviço ativo, vínculo
 * profissional↔serviço, dentro do expediente, sem bloqueio, sem conflito,
 * não no passado.
 *
 * Este resultado é só para EXIBIÇÃO — a validação definitiva (incluindo a
 * proteção contra double booking sob concorrência) acontece de novo, e é
 * garantida pelo banco, no momento da escrita do agendamento.
 */
export async function getAvailableSlots(
  supabase: SupabaseClient<Database>,
  params: {
    salonTimezone: string;
    professionalId: string;
    serviceId: string;
    dateStr: string; // "YYYY-MM-DD" no calendário do salão
  }
): Promise<AvailabilityResult> {
  const { salonTimezone, professionalId, serviceId, dateStr } = params;

  const [{ data: professional }, { data: service }, { data: link }] = await Promise.all([
    supabase.from("professionals").select("active").eq("id", professionalId).maybeSingle(),
    supabase.from("services").select("active, duration_minutes").eq("id", serviceId).maybeSingle(),
    supabase
      .from("professional_services")
      .select("service_id")
      .eq("professional_id", professionalId)
      .eq("service_id", serviceId)
      .maybeSingle(),
  ]);

  if (!professional) return { ok: false, error: "professional_not_found" };
  if (!professional.active) return { ok: false, error: "professional_inactive" };
  if (!service) return { ok: false, error: "service_not_found" };
  if (!service.active) return { ok: false, error: "service_inactive" };
  if (!link) return { ok: false, error: "professional_does_not_offer_service" };

  const weekday = weekdayOf(dateStr);
  const dayStartUtc = zonedWallTimeToUtc(dateStr, "00:00", salonTimezone);
  const dayEndUtc = zonedWallTimeToUtc(dateStr, "23:59", salonTimezone);

  const [{ data: workingHours }, { data: blocks }, { data: appointments }] = await Promise.all([
    supabase
      .from("working_hours")
      .select("start_time, end_time")
      .eq("professional_id", professionalId)
      .eq("weekday", weekday),
    supabase
      .from("blocks")
      .select("start_datetime, end_datetime")
      .eq("professional_id", professionalId)
      .lt("start_datetime", dayEndUtc.toISOString())
      .gt("end_datetime", dayStartUtc.toISOString()),
    supabase
      .from("appointments")
      .select("start_datetime, end_datetime")
      .eq("professional_id", professionalId)
      .in("status", ["confirmed", "completed"])
      .lt("start_datetime", dayEndUtc.toISOString())
      .gt("end_datetime", dayStartUtc.toISOString()),
  ]);

  const busyRanges = [
    ...(blocks ?? []).map((b) => ({
      start: new Date(b.start_datetime),
      end: new Date(b.end_datetime),
    })),
    ...(appointments ?? []).map((a) => ({
      start: new Date(a.start_datetime),
      end: new Date(a.end_datetime),
    })),
  ];

  const durationMs = service.duration_minutes * 60_000;
  const now = new Date();
  const slots: Slot[] = [];

  for (const window of workingHours ?? []) {
    const windowStart = zonedWallTimeToUtc(dateStr, window.start_time.slice(0, 5), salonTimezone);
    const windowEnd = zonedWallTimeToUtc(dateStr, window.end_time.slice(0, 5), salonTimezone);

    for (
      let slotStart = windowStart;
      slotStart.getTime() + durationMs <= windowEnd.getTime();
      slotStart = new Date(slotStart.getTime() + durationMs)
    ) {
      const slotEnd = new Date(slotStart.getTime() + durationMs);

      if (slotStart < now) continue; // regra: horário não pode estar no passado
      if (busyRanges.some((b) => overlaps(slotStart, slotEnd, b.start, b.end))) continue;

      slots.push({ start: slotStart.toISOString(), end: slotEnd.toISOString() });
    }
  }

  return { ok: true, slots };
}
