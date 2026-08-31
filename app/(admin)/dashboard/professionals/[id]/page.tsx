import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentAdmin } from "@/lib/auth/get-current-admin";
import { WEEKDAY_LABELS } from "@/lib/validations/working-hours";

import {
  createBlock,
  createWorkingHour,
  deleteBlock,
  deleteWorkingHour,
  setProfessionalServices,
  updateProfessional,
} from "../actions";
import { BlockForm } from "../block-form";
import { ProfessionalForm } from "../professional-form";
import { WorkingHourForm } from "../working-hour-form";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default async function ProfessionalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await getCurrentAdmin();

  const { data: professional } = await supabase
    .from("professionals")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();

  if (!professional) notFound();

  const [
    { data: services },
    { data: linkedServices },
    { data: workingHours },
    { data: blocks },
  ] = await Promise.all([
    supabase.from("services").select("id, name").eq("active", true).order("name"),
    supabase.from("professional_services").select("service_id").eq("professional_id", id),
    supabase
      .from("working_hours")
      .select("id, weekday, start_time, end_time")
      .eq("professional_id", id)
      .order("weekday"),
    supabase
      .from("blocks")
      .select("id, start_datetime, end_datetime, reason")
      .eq("professional_id", id)
      .order("start_datetime"),
  ]);

  const linkedServiceIds = new Set((linkedServices ?? []).map((s) => s.service_id));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">{professional.name}</h1>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Dados</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfessionalForm
            action={updateProfessional.bind(null, professional.id)}
            defaultValues={{ name: professional.name }}
            submitLabel="Salvar"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Serviços atendidos</CardTitle>
        </CardHeader>
        <CardContent>
          {!services || services.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum serviço ativo cadastrado ainda.
            </p>
          ) : (
            <form action={setProfessionalServices.bind(null, professional.id)} className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                {services.map((service) => (
                  <label key={service.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="service_id"
                      value={service.id}
                      defaultChecked={linkedServiceIds.has(service.id)}
                      className="size-4 rounded border-input"
                    />
                    {service.name}
                  </label>
                ))}
              </div>
              <Button type="submit" size="sm" className="w-fit">
                Salvar serviços
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Horário de trabalho</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <WorkingHourForm action={createWorkingHour.bind(null, professional.id)} />
          {workingHours && workingHours.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {workingHours.map((wh) => (
                <li key={wh.id} className="flex items-center justify-between text-sm">
                  <span>
                    {WEEKDAY_LABELS[wh.weekday]}: {wh.start_time.slice(0, 5)}–
                    {wh.end_time.slice(0, 5)}
                  </span>
                  <form action={deleteWorkingHour.bind(null, professional.id, wh.id)}>
                    <Button type="submit" variant="ghost" size="sm">
                      Remover
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum horário definido.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bloqueios</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <BlockForm action={createBlock.bind(null, professional.id)} />
          {blocks && blocks.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {blocks.map((block) => (
                <li key={block.id} className="flex items-center justify-between text-sm">
                  <span>
                    {formatDateTime(block.start_datetime)} até{" "}
                    {formatDateTime(block.end_datetime)}
                    {block.reason ? ` — ${block.reason}` : ""}
                  </span>
                  <form action={deleteBlock.bind(null, professional.id, block.id)}>
                    <Button type="submit" variant="ghost" size="sm">
                      Remover
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum bloqueio cadastrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
