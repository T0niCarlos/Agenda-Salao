"use client";

import { useActionState, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  createBookingAction,
  getProfessionalsForService,
  getSlotsAction,
  type CreateBookingState,
} from "./actions";

type Service = { id: string; name: string; duration_minutes: number; price_cents: number };
type Professional = { id: string; name: string };
type Slot = { start: string; end: string };

const initialBookingState: CreateBookingState = {};

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function BookingWizard({
  salonSlug,
  services,
  todayStr,
}: {
  salonSlug: string;
  services: Service[];
  todayStr: string;
}) {
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [dateStr, setDateStr] = useState(todayStr);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const boundCreateBooking = createBookingAction.bind(null, salonSlug);
  const [bookingState, formAction, isSubmitting] = useActionState(
    boundCreateBooking,
    initialBookingState
  );

  function handleSelectService(service: Service) {
    setServiceId(service.id);
    setProfessionalId(null);
    setSlots([]);
    setSelectedSlot(null);
    startTransition(async () => {
      const list = await getProfessionalsForService(service.id);
      setProfessionals(list);
    });
  }

  function loadSlots(nextProfessionalId: string, nextDateStr: string) {
    if (!serviceId) return;
    setSelectedSlot(null);
    setSlotsError(null);
    startTransition(async () => {
      const result = await getSlotsAction(salonSlug, nextProfessionalId, serviceId, nextDateStr);
      if (result.ok) {
        setSlots(result.slots);
      } else {
        setSlots([]);
        setSlotsError(result.error);
      }
    });
  }

  const selectedService = services.find((s) => s.id === serviceId) ?? null;

  if (bookingState.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agendamento confirmado!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Seu horário foi reservado com sucesso. Chegue com alguns minutos de
            antecedência.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Passo 1: serviço */}
      <Card>
        <CardHeader>
          <CardTitle>1. Escolha o serviço</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {services.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum serviço disponível no momento.
            </p>
          )}
          {services.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => handleSelectService(service)}
              className={`flex items-center justify-between rounded-md border p-3 text-left text-sm hover:bg-accent ${
                serviceId === service.id ? "border-primary" : "border-input"
              }`}
            >
              <span>{service.name}</span>
              <span className="text-muted-foreground">
                {service.duration_minutes}min · {formatPrice(service.price_cents)}
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Passo 2: profissional */}
      {serviceId && (
        <Card>
          <CardHeader>
            <CardTitle>2. Escolha a profissional</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {professionals.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum profissional disponível para este serviço.
              </p>
            )}
            {professionals.map((professional) => (
              <button
                key={professional.id}
                type="button"
                onClick={() => {
                  setProfessionalId(professional.id);
                  loadSlots(professional.id, dateStr);
                }}
                className={`rounded-md border p-3 text-left text-sm hover:bg-accent ${
                  professionalId === professional.id ? "border-primary" : "border-input"
                }`}
              >
                {professional.name}
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Passo 3: data + horário */}
      {professionalId && (
        <Card>
          <CardHeader>
            <CardTitle>3. Escolha data e horário</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                min={todayStr}
                value={dateStr}
                onChange={(e) => {
                  setDateStr(e.target.value);
                  loadSlots(professionalId, e.target.value);
                }}
                className="w-48"
              />
            </div>

            {isPending && <p className="text-sm text-muted-foreground">Carregando horários...</p>}
            {slotsError && <p className="text-sm text-destructive">{slotsError}</p>}
            {!isPending && !slotsError && slots.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum horário disponível nesta data.
              </p>
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
                  {new Date(slot.start).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Passo 4: dados do cliente + confirmação */}
      {selectedSlot && selectedService && professionalId && (
        <Card>
          <CardHeader>
            <CardTitle>4. Seus dados</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="flex flex-col gap-4" noValidate>
              <input type="hidden" name="professional_id" value={professionalId} />
              <input type="hidden" name="service_id" value={selectedService.id} />
              <input type="hidden" name="start_datetime" value={selectedSlot.start} />

              <div className="flex flex-col gap-2">
                <Label htmlFor="client_name">Nome</Label>
                <Input id="client_name" name="client_name" required />
                {bookingState.fieldErrors?.client_name && (
                  <p className="text-sm text-destructive">
                    {bookingState.fieldErrors.client_name}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="client_whatsapp">WhatsApp (DDD + número)</Label>
                <Input
                  id="client_whatsapp"
                  name="client_whatsapp"
                  inputMode="numeric"
                  placeholder="11999999999"
                  required
                />
                {bookingState.fieldErrors?.client_whatsapp && (
                  <p className="text-sm text-destructive">
                    {bookingState.fieldErrors.client_whatsapp}
                  </p>
                )}
              </div>

              {bookingState.error && (
                <p role="alert" className="text-sm text-destructive">
                  {bookingState.error}
                </p>
              )}

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Confirmando..." : "Confirmar agendamento"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
