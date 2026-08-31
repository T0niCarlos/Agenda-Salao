"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentAdmin } from "@/lib/auth/get-current-admin";
import { professionalSchema } from "@/lib/validations/professional";
import { workingHourSchema } from "@/lib/validations/working-hours";
import { blockSchema } from "@/lib/validations/block";

export type ProfessionalFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"name", string>>;
};

function parseProfessionalForm(formData: FormData) {
  const parsed = professionalSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return {
      fieldErrors: { name: parsed.error.issues[0]?.message ?? "Nome inválido." },
    } satisfies ProfessionalFormState;
  }
  return parsed.data;
}

export async function createProfessional(
  _prevState: ProfessionalFormState,
  formData: FormData
): Promise<ProfessionalFormState> {
  const parsed = parseProfessionalForm(formData);
  if ("fieldErrors" in parsed) return parsed;

  const { supabase, admin } = await getCurrentAdmin();
  const { error } = await supabase
    .from("professionals")
    .insert({ salon_id: admin.salonId, name: parsed.name });

  if (error) return { error: "Não foi possível criar o profissional." };

  revalidatePath("/dashboard/professionals");
  redirect("/dashboard/professionals");
}

export async function updateProfessional(
  professionalId: string,
  _prevState: ProfessionalFormState,
  formData: FormData
): Promise<ProfessionalFormState> {
  const parsed = parseProfessionalForm(formData);
  if ("fieldErrors" in parsed) return parsed;

  const { supabase } = await getCurrentAdmin();
  const { error } = await supabase
    .from("professionals")
    .update({ name: parsed.name })
    .eq("id", professionalId);

  if (error) return { error: "Não foi possível salvar as alterações." };

  revalidatePath("/dashboard/professionals");
  revalidatePath(`/dashboard/professionals/${professionalId}`);
  redirect("/dashboard/professionals");
}

export async function toggleProfessionalActive(
  professionalId: string,
  nextActive: boolean
) {
  const { supabase } = await getCurrentAdmin();
  await supabase
    .from("professionals")
    .update({ active: nextActive })
    .eq("id", professionalId);
  revalidatePath("/dashboard/professionals");
}

// --- Serviços atendidos pelo profissional -------------------------------

export async function setProfessionalServices(
  professionalId: string,
  formData: FormData
) {
  const { supabase, admin } = await getCurrentAdmin();
  const serviceIds = formData.getAll("service_id").map(String);

  // Substitui o conjunto inteiro: remove tudo e insere de novo o que foi
  // marcado. Simples e correto para uma checklist (poucas dezenas de itens).
  await supabase
    .from("professional_services")
    .delete()
    .eq("professional_id", professionalId);

  if (serviceIds.length > 0) {
    await supabase.from("professional_services").insert(
      serviceIds.map((serviceId) => ({
        salon_id: admin.salonId,
        professional_id: professionalId,
        service_id: serviceId,
      }))
    );
  }

  revalidatePath(`/dashboard/professionals/${professionalId}`);
}

// --- Horários de trabalho -------------------------------------------------

export type WorkingHourFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"weekday" | "start_time" | "end_time", string>>;
};

export async function createWorkingHour(
  professionalId: string,
  _prevState: WorkingHourFormState,
  formData: FormData
): Promise<WorkingHourFormState> {
  const parsed = workingHourSchema.safeParse({
    professional_id: professionalId,
    weekday: formData.get("weekday"),
    start_time: formData.get("start_time"),
    end_time: formData.get("end_time"),
  });

  if (!parsed.success) {
    const fieldErrors: WorkingHourFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "weekday" || field === "start_time" || field === "end_time") {
        fieldErrors[field] = issue.message;
      }
    }
    return { fieldErrors };
  }

  const { supabase, admin } = await getCurrentAdmin();
  const { error } = await supabase.from("working_hours").insert({
    salon_id: admin.salonId,
    professional_id: professionalId,
    weekday: parsed.data.weekday,
    start_time: parsed.data.start_time,
    end_time: parsed.data.end_time,
  });

  if (error) return { error: "Não foi possível adicionar o horário." };

  revalidatePath(`/dashboard/professionals/${professionalId}`);
  return {};
}

export async function deleteWorkingHour(
  professionalId: string,
  workingHourId: string
) {
  const { supabase } = await getCurrentAdmin();
  await supabase.from("working_hours").delete().eq("id", workingHourId);
  revalidatePath(`/dashboard/professionals/${professionalId}`);
}

// --- Bloqueios --------------------------------------------------------

export type BlockFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"start_datetime" | "end_datetime" | "reason", string>>;
};

export async function createBlock(
  professionalId: string,
  _prevState: BlockFormState,
  formData: FormData
): Promise<BlockFormState> {
  const parsed = blockSchema.safeParse({
    professional_id: professionalId,
    start_datetime: formData.get("start_datetime"),
    end_datetime: formData.get("end_datetime"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    const fieldErrors: BlockFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "start_datetime" || field === "end_datetime" || field === "reason") {
        fieldErrors[field] = issue.message;
      }
    }
    return { fieldErrors };
  }

  const { supabase, admin } = await getCurrentAdmin();
  const { error } = await supabase.from("blocks").insert({
    salon_id: admin.salonId,
    professional_id: professionalId,
    start_datetime: new Date(parsed.data.start_datetime).toISOString(),
    end_datetime: new Date(parsed.data.end_datetime).toISOString(),
    reason: parsed.data.reason || null,
  });

  if (error) return { error: "Não foi possível criar o bloqueio." };

  revalidatePath(`/dashboard/professionals/${professionalId}`);
  return {};
}

export async function deleteBlock(professionalId: string, blockId: string) {
  const { supabase } = await getCurrentAdmin();
  await supabase.from("blocks").delete().eq("id", blockId);
  revalidatePath(`/dashboard/professionals/${professionalId}`);
}
