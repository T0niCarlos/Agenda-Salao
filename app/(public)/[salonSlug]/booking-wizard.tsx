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
          <CardTitle className="text-xl text-pink-600">1. Escolha o serviço</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
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
              className={`flex items-center justify-between rounded-xl border p-4 text-left text-sm transition-all hover:border-pink-300 hover:bg-pink-50/50 ${
                serviceId === service.id ? "border-pink-500 bg-pink-50 ring-1 ring-pink-500" : "border-input bg-white"
              }`}
            >
              <span className="font-medium text-slate-700">{service.name}</span>
              <span className="text-pink-600 font-semibold bg-white px-2 py-1 rounded-md shadow-sm border border-pink-100">
                {service.duration_minutes}min · {formatPrice(service.price_cents)}
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Passo 2: profissional */}
      {serviceId && (
        <Card className="border-pink-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-pink-600">2. Escolha a profissional</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {professionals.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhuma profissional disponível para este serviço.
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
                className={`rounded-xl border p-4 text-left text-sm font-medium transition-all hover:border-pink-300 hover:bg-pink-50/50 ${
                  professionalId === professional.id ? "border-pink-500 bg-pink-50 ring-1 ring-pink-500 text-pink-700" : "border-input text-slate-700 bg-white"
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
        <Card className="border-pink-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-pink-600">3. Escolha data e horário</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="date" className="text-slate-600 font-medium">Data</Label>
              <Input
                id="date"
                type="date"
                min={todayStr}
                value={dateStr}
                onChange={(e) => {
                  setDateStr(e.target.value);
                  loadSlots(professionalId, e.target.value);
                }}
                className="w-48 focus-visible:ring-pink-400 border-pink-200"
              />
            </div>

            {isPending && <p className="text-sm text-pink-500 animate-pulse">Carregando horários disponíveis...</p>}
            {slotsError && <p className="text-sm text-destructive">{slotsError}</p>}
            {!isPending && !slotsError && slots.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum horário disponível nesta data.
              </p>
            )}

            <div className="flex flex-wrap gap-2 mt-2">
              {slots.map((slot) => (
                <button
                  key={slot.start}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all hover:border-pink-300 hover:bg-pink-50 ${
                    selectedSlot?.start === slot.start ? "border-pink-500 bg-pink-500 text-white shadow-md shadow-pink-200" : "border-pink-100 bg-white text-slate-700"
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
        <Card className="border-pink-200 shadow-md ring-1 ring-pink-50">
          <CardHeader className="bg-pink-50/50 border-b border-pink-100 rounded-t-xl pb-4">
            <CardTitle className="text-xl text-pink-600">4. Confirme seus dados</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form action={formAction} className="flex flex-col gap-5" noValidate>
              <input type="hidden" name="professional_id" value={professionalId} />
              <input type="hidden" name="service_id" value={selectedService.id} />
              <input type="hidden" name="start_datetime" value={selectedSlot.start} />

              <div className="flex flex-col gap-2">
                <Label htmlFor="client_name" className="text-slate-700 font-medium">Nome completo</Label>
                <Input id="client_name" name="client_name" required className="border-pink-200 focus-visible:ring-pink-400" placeholder="Como devemos lhe chamar?" />
                {bookingState.fieldErrors?.client_name && (
                  <p className="text-sm text-destructive font-medium">
                    {bookingState.fieldErrors.client_name}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="client_whatsapp" className="text-slate-700 font-medium">WhatsApp (apenas números)</Label>
                <Input
                  id="client_whatsapp"
                  name="client_whatsapp"
                  inputMode="numeric"
                  placeholder="11999999999"
                  required
                  className="border-pink-200 focus-visible:ring-pink-400"
                />
                {bookingState.fieldErrors?.client_whatsapp && (
                  <p className="text-sm text-destructive font-medium">
                    {bookingState.fieldErrors.client_whatsapp}
                  </p>
                )}
              </div>

              {bookingState.error && (
                <p role="alert" className="text-sm text-destructive bg-destructive/10 p-3 rounded-md font-medium border border-destructive/20 mt-2">
                  {bookingState.error}
                </p>
              )}

              <Button type="submit" disabled={isSubmitting} className="mt-2 bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-200 py-6 text-lg rounded-xl transition-all hover:scale-[1.02]">
                {isSubmitting ? "Agendando..." : "Confirmar Agendamento"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
