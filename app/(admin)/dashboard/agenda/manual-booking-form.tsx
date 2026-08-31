"use client";

import { useActionState, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createManualAppointment, getSlotsForAdmin, type ManualBookingState } from "./actions";

type Service = { id: string; name: string };
type Professional = { id: string; name: string };
type Slot = { start: string; end: string };

const initialState: ManualBookingState = {};

export function ManualBookingForm({
  services,
  professionals,
  todayStr,
}: {
  services: Service[];
  professionals: Professional[];
  todayStr: string;
}) {
  const [serviceId, setServiceId] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [dateStr, setDateStr] = useState(todayStr);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isPending, startTransition] = useTransition();
  const [state, formAction, isSubmitting] = useActionState(createManualAppointment, initialState);

  function reload(nextService: string, nextProfessional: string, nextDate: string) {
    setSelectedSlot(null);
    if (!nextService || !nextProfessional || !nextDate) {
      setSlots([]);
      return;
    }
    startTransition(async () => {
      const result = await getSlotsForAdmin(nextProfessional, nextService, nextDate);
      setSlots(result.ok ? result.slots : []);
    });
  }

  if (state.success) {
    return <p className="text-sm text-muted-foreground">Agendamento criado com sucesso.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="professional_id" value={professionalId} />
      <input type="hidden" name="service_id" value={serviceId} />
      <input type="hidden" name="start_datetime" value={selectedSlot?.start ?? ""} />

      <div className="flex flex-col gap-1">
        <Label>Serviço</Label>
        <select
          className="h-9 rounded-md border border-input px-3 text-sm"
          value={serviceId}
          onChange={(e) => {
            setServiceId(e.target.value);
            reload(e.target.value, professionalId, dateStr);
          }}
        >
          <option value="">Selecione...</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <Label>Profissional</Label>
        <select
          className="h-9 rounded-md border border-input px-3 text-sm"
          value={professionalId}
          onChange={(e) => {
            setProfessionalId(e.target.value);
            reload(serviceId, e.target.value, dateStr);
          }}
        >
          <option value="">Selecione...</option>
          {professionals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <Label>Data</Label>
        <Input
          type="date"
          min={todayStr}
          value={dateStr}
          onChange={(e) => {
            setDateStr(e.target.value);
            reload(serviceId, professionalId, e.target.value);
          }}
          className="w-48"
        />
      </div>

      {isPending && <p className="text-sm text-muted-foreground">Carregando horários...</p>}
      {!isPending && serviceId && professionalId && slots.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum horário disponível.</p>
      )}
      <div className="flex flex-wrap gap-2">
        {slots.map((slot) => (
          <button
            key={slot.start}
            type="button"
            onClick={() => setSelectedSlot(slot)}
            className={`rounded-md border px-3 py-1.5 text-sm hover:bg-accent ${
              selectedSlot?.start === slot.start ? "border-primary" : "border-input"
            }`}
          >
            {new Date(slot.start).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </button>
        ))}
      </div>

      {selectedSlot && (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="client_name">Nome do cliente</Label>
            <Input id="client_name" name="client_name" required />
            {state.fieldErrors?.client_name && (
              <p className="text-sm text-destructive">{state.fieldErrors.client_name}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="client_whatsapp">WhatsApp</Label>
            <Input id="client_whatsapp" name="client_whatsapp" inputMode="numeric" required />
            {state.fieldErrors?.client_whatsapp && (
              <p className="text-sm text-destructive">{state.fieldErrors.client_whatsapp}</p>
            )}
          </div>
          {state.error && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}
          <Button type="submit" disabled={isSubmitting} className="w-fit">
            {isSubmitting ? "Criando..." : "Criar agendamento"}
          </Button>
        </>
      )}
    </form>
  );
}
