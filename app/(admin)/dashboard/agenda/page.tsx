import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { getCurrentAdmin } from "@/lib/auth/get-current-admin";
import { dateStrInTimeZone } from "@/lib/booking/availability";

import { cancelAppointment, updateAppointmentStatus } from "./actions";

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Concluído",
  no_show: "Não compareceu",
};

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { supabase, admin } = await getCurrentAdmin();
  const { data: salon } = await supabase
    .from("salons")
    .select("timezone")
    .eq("id", admin.salonId)
    .maybeSingle();

  const todayStr = dateStrInTimeZone(new Date(), salon?.timezone ?? "America/Sao_Paulo");
  const { date } = await searchParams;
  const selectedDate = date || todayStr;

  const dayStart = `${selectedDate}T00:00:00`;
  const dayEnd = `${selectedDate}T23:59:59`;

  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, start_datetime, status, professional_id, service_id, client_id")
    .gte("start_datetime", dayStart)
    .lte("start_datetime", dayEnd)
    .order("start_datetime");

  const [{ data: professionals }, { data: services }, { data: clients }] = await Promise.all([
    supabase.from("professionals").select("id, name"),
    supabase.from("services").select("id, name"),
    supabase.from("clients").select("id, name, whatsapp"),
  ]);

  const profMap = new Map((professionals ?? []).map((p) => [p.id, p.name]));
  const serviceMap = new Map((services ?? []).map((s) => [s.id, s.name]));
  const clientMap = new Map((clients ?? []).map((c) => [c.id, c]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Agenda</h1>
        <div className="flex items-center gap-2">
          <form method="get" className="flex items-center gap-2">
            <Input type="date" name="date" defaultValue={selectedDate} className="w-44" />
            <Button type="submit" variant="outline" size="sm">
              Ver
            </Button>
          </form>
          <Button asChild size="sm">
            <Link href="/dashboard/agenda/new">Novo agendamento</Link>
          </Button>
        </div>
      </div>

      {!appointments || appointments.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            Nenhum agendamento nesta data.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {appointments.map((appt) => {
            const client = clientMap.get(appt.client_id);
            return (
              <Card key={appt.id}>
                <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">
                      {new Date(appt.start_datetime).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      · {serviceMap.get(appt.service_id) ?? "—"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {profMap.get(appt.professional_id) ?? "—"} · {client?.name ?? "—"} (
                      {client?.whatsapp ?? "—"})
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <form
                      action={async (formData: FormData) => {
                        "use server";
                        await updateAppointmentStatus(appt.id, String(formData.get("status")));
                      }}
                      className="flex items-center gap-1"
                    >
                      <NativeSelect name="status" defaultValue={appt.status} className="w-40">
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </NativeSelect>
                      <Button type="submit" variant="outline" size="sm">
                        Salvar
                      </Button>
                    </form>
                    {appt.status !== "cancelled" && (
                      <form action={cancelAppointment.bind(null, appt.id)}>
                        <Button type="submit" variant="ghost" size="sm">
                          Cancelar
                        </Button>
                      </form>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
