"use client";

import { useActionState, useState, useTransition, useMemo } from "react";
import { ChevronRight, Calendar as CalendarIcon, Check } from "lucide-react";

import {
  createBookingAction,
  getProfessionalsForService,
  getSlotsAction,
  type CreateBookingState,
} from "./actions";

type Service = { id: string; name: string; duration_minutes: number; price_cents: number };
type Professional = { id: string; name: string };
type Slot = { start: string; end: string };

type WeekDayItem = {
  dateStr: string;
  dayLabel: string;
  dayNumber: number;
};

const initialBookingState: CreateBookingState = {};

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// 📸 FOTOS ESPECÍFICAS PARA CADA SERVIÇO INDIVIDUAL
function getServicePhoto(name: string) {
  const lower = name.toLowerCase();

  // 1. Cílios - Fio a Fio (extensão fio a fio com pinça - close-up profissional)
  if (lower.includes("fio a fio")) {
    return "https://images.pexels.com/photos/5128224/pexels-photo-5128224.jpeg?auto=compress&cs=tinysrgb&w=400";
  }
  // 2. Cílios - Volume Russo (aplicação de cílios com pinça - close-up salão)
  if (lower.includes("volume russo")) {
    return "https://images.pexels.com/photos/36930354/pexels-photo-36930354.jpeg?auto=compress&cs=tinysrgb&w=400";
  }
  // 3. Volume Brasileiro / Volume Light / Outros cílios (kit de cílios postiços)
  if (lower.includes("cílio") || lower.includes("cilio") || lower.includes("volume")) {
    return "https://images.pexels.com/photos/8558524/pexels-photo-8558524.jpeg?auto=compress&cs=tinysrgb&w=400";
  }

  // 4. Sobrancelha (Design) — depilação com linha / design de sobrancelha
  if (lower.includes("sobrancelha") || lower.includes("design") || lower.includes("brow")) {
    return "https://images.pexels.com/photos/6135615/pexels-photo-6135615.jpeg?auto=compress&cs=tinysrgb&w=400";
  }

  // 5. Escova Progressiva / Alinhamento (escovação de cabelo liso no salão)
  if (lower.includes("progressiva") || lower.includes("alisamento") || lower.includes("botox")) {
    return "https://images.pexels.com/photos/23349912/pexels-photo-23349912.jpeg?auto=compress&cs=tinysrgb&w=400";
  }
  // 6. Escova Longo / Modelada (cabelo comprido ondulado)
  if (lower.includes("longo") || lower.includes("modelad") || lower.includes("ondas")) {
    return "https://images.pexels.com/photos/8106142/pexels-photo-8106142.jpeg?auto=compress&cs=tinysrgb&w=400";
  }
  // 7. Escova Curto / Tradicional (cabeleireira trabalhando em salão)
  if (lower.includes("escova")) {
    return "https://images.pexels.com/photos/5368632/pexels-photo-5368632.jpeg?auto=compress&cs=tinysrgb&w=400";
  }

  // 8. Hidratação Capilar — lavagem e massagem no lavatório do salão
  if (lower.includes("hidrata") || lower.includes("nutri") || lower.includes("tratamento") || lower.includes("cauteriza")) {
    return "https://images.pexels.com/photos/7755473/pexels-photo-7755473.jpeg?auto=compress&cs=tinysrgb&w=400";
  }

  // 9. Luzes / Mechas / Balayage
  if (lower.includes("luzes") || lower.includes("mecha") || lower.includes("balayage") || lower.includes("loiro")) {
    return "https://images.pexels.com/photos/7755460/pexels-photo-7755460.jpeg?auto=compress&cs=tinysrgb&w=400";
  }
  // 10. Coloração / Tintura
  if (lower.includes("colora") || lower.includes("tintura") || lower.includes("tinta") || lower.includes("tonaliza")) {
    return "https://images.pexels.com/photos/7755460/pexels-photo-7755460.jpeg?auto=compress&cs=tinysrgb&w=400";
  }

  // 11. Corte Masculino / Barba
  if (lower.includes("masculino") || lower.includes("barba") || lower.includes("homem")) {
    return "https://images.pexels.com/photos/8867400/pexels-photo-8867400.jpeg?auto=compress&cs=tinysrgb&w=400";
  }
  // 12. Corte Feminino
  if (lower.includes("corte")) {
    return "https://images.pexels.com/photos/5368632/pexels-photo-5368632.jpeg?auto=compress&cs=tinysrgb&w=400";
  }

  // 13. Manicure / Esmaltação (unhas rosê com esmalte)
  if (lower.includes("manicure") || lower.includes("unha") || lower.includes("gel") || lower.includes("fibra")) {
    return "https://images.pexels.com/photos/2281695/pexels-photo-2281695.jpeg?auto=compress&cs=tinysrgb&w=400";
  }
  // 14. Pedicure / Pés (cuidado dos pés no salão)
  if (lower.includes("pedicure") || lower.includes("pé") || lower.includes("pes") || lower.includes("podologia")) {
    return "https://images.pexels.com/photos/5793888/pexels-photo-5793888.jpeg?auto=compress&cs=tinysrgb&w=400";
  }

  // Foto padrão (salão de beleza)
  return "https://images.pexels.com/photos/5368632/pexels-photo-5368632.jpeg?auto=compress&cs=tinysrgb&w=400";
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
  const [dateStr, setDateStr] = useState<string>(todayStr);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const boundAction = createBookingAction.bind(null, salonSlug);
  const [bookingState, formAction, isSubmitting] = useActionState(boundAction, initialBookingState);

  // Próximos 7 dias estritamente tipados
  const weekDays = useMemo<WeekDayItem[]>(() => {
    const list: WeekDayItem[] = [];
    const base = new Date(todayStr + "T12:00:00");
    const weekLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const dayLabel = weekLabels[d.getDay()] ?? "Seg";
      const dateFormatted = d.toISOString().split("T")[0] ?? todayStr;
      list.push({
        dateStr: dateFormatted,
        dayLabel,
        dayNumber: d.getDate(),
      });
    }
    return list;
  }, [todayStr]);

  function loadSlots(profId: string, date: string) {
    if (!serviceId) return;
    setSelectedSlot(null);
    setSlotsError(null);
    startTransition(async () => {
      const result = await getSlotsAction(salonSlug, profId, serviceId, date);
      if (result.ok) {
        setSlots(result.slots);
      } else {
        setSlots([]);
        setSlotsError(result.error);
      }
    });
  }

  function handleSelectService(service: Service) {
    setServiceId(service.id);
    setProfessionalId(null);
    setSlots([]);
    setSelectedSlot(null);
    startTransition(async () => {
      const list = await getProfessionalsForService(service.id);
      setProfessionals(list);
      const firstProf = list[0];
      if (firstProf && list.length === 1) {
        setProfessionalId(firstProf.id);
        loadSlots(firstProf.id, dateStr);
      }
    });
  }

  const selectedService = services.find((s) => s.id === serviceId) ?? null;
  const ALINE_WHATSAPP = "5521977262946";

  // 🎉 TELA DE SUCESSO COM O BOTÃO DIRETO DO WHATSAPP
  if (bookingState.success && selectedService && selectedSlot) {
    const slotDate = new Date(selectedSlot.start);
    const dateFormatted = slotDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const timeFormatted = slotDate.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const whatsappMessage = encodeURIComponent(
      `Olá, Aline! ✨ Acabei de fazer um agendamento pelo site:\n\n` +
      `✂️ *Serviço:* ${selectedService.name}\n` +
      `📅 *Data:* ${dateFormatted}\n` +
      `⏰ *Horário:* ${timeFormatted}\n` +
      `💰 *Valor:* ${formatPrice(selectedService.price_cents)}\n` +
      (clientName ? `👤 *Cliente:* ${clientName}\n\n` : `\n`) +
      `Pode me confirmar? Obrigada!`
    );

    return (
      <div className="bg-white rounded-3xl border border-[#efe6ee] shadow-xl shadow-[#5c3e59]/10 p-6 sm:p-8 text-center flex flex-col items-center gap-6">
        <div className="w-16 h-16 bg-[#eef8f2] text-emerald-600 rounded-full flex items-center justify-center text-3xl shadow-sm">
          <Check className="w-8 h-8 stroke-[3]" />
        </div>

        <div>
          <h2 className="text-2xl font-serif font-bold text-[#2d1e2b]">
            Agendamento Realizado!
          </h2>
          <p className="text-xs text-[#7d677a] mt-1.5">
            Seu horário com <strong>Aline Lyra</strong> foi reservado com sucesso.
          </p>
        </div>

        <div className="w-full bg-[#faf7f8] rounded-2xl p-4 border border-[#eee2ed] text-left text-sm flex flex-col gap-2.5">
          <div className="flex justify-between items-center border-b border-[#ebdbe9] pb-2">
            <span className="text-[#846f81]">Serviço:</span>
            <span className="font-semibold text-[#2f202e]">{selectedService.name}</span>
          </div>
          <div className="flex justify-between items-center border-b border-[#ebdbe9] pb-2">
            <span className="text-[#846f81]">Data e Horário:</span>
            <span className="font-semibold text-[#2f202e]">
              {dateFormatted} às {timeFormatted}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#846f81]">Valor:</span>
            <span className="font-bold text-[#5c3e59] text-base">{formatPrice(selectedService.price_cents)}</span>
          </div>
        </div>

        <div className="w-full flex flex-col gap-2">
          <a
            href={`https://wa.me/${ALINE_WHATSAPP}?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-200 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 text-center"
          >
            💬 Enviar Confirmação no WhatsApp da Aline
          </a>
          <p className="text-[11px] text-[#9b8898]">
            Toque no botão acima para abrir a conversa e confirmar seu horário diretamente com a Aline!
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="text-xs text-[#5c3e59] hover:underline font-semibold mt-2"
        >
          Fazer outro agendamento
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ✂️ 1. ESCOLHA O SERVIÇO COM FOTOS INDIVIDUAIS */}
      <div className="bg-white rounded-3xl p-5 border border-[#efe6ee] shadow-sm">
        <h3 className="text-base font-bold text-[#2e1f2c] mb-4">Escolha o serviço</h3>

        <div className="flex flex-col gap-3">
          {services.map((service) => {
            const isSelected = serviceId === service.id;
            const photoUrl = getServicePhoto(service.name);

            return (
              <button
                key={service.id}
                type="button"
                onClick={() => handleSelectService(service)}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left ${
                  isSelected
                    ? "border-[#5c3e59] bg-[#fbf6fa] shadow-sm ring-1 ring-[#5c3e59]"
                    : "border-[#f2ebf1] hover:border-[#dbcbd9] bg-white"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <img
                    src={photoUrl}
                    alt={service.name}
                    className="w-[52px] h-[52px] rounded-xl object-cover shrink-0 shadow-sm border border-[#f5edf4]"
                  />
                  <div>
                    <h4 className="font-semibold text-sm text-[#2d1e2b] leading-tight">
                      {service.name}
                    </h4>
                    <p className="text-xs text-[#8a7587] mt-1 font-light">
                      {Math.floor(service.duration_minutes / 60) > 0
                        ? `${Math.floor(service.duration_minutes / 60)}h `
                        : ""}
                      {service.duration_minutes % 60 > 0
                        ? `${service.duration_minutes % 60}min`
                        : "00min"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#2d1e2b]">
                    {formatPrice(service.price_cents)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#9c8799]" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 📅 2. SELECIONE O MELHOR HORÁRIO */}
      {serviceId && (
        <div className="bg-white rounded-3xl p-5 border border-[#efe6ee] shadow-sm flex flex-col gap-4">
          <h3 className="text-base font-bold text-[#2e1f2c]">
            Selecione o melhor horário
          </h3>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {weekDays.map((w) => {
              const isSelectedDate = dateStr === w.dateStr;
              return (
                <button
                  key={w.dateStr}
                  type="button"
                  onClick={() => {
                    if (!w.dateStr) return;
                    setDateStr(w.dateStr);
                    if (professionalId) {
                      loadSlots(professionalId, w.dateStr);
                    }
                  }}
                  className={`flex flex-col items-center justify-center min-w-[56px] py-2.5 rounded-2xl transition-all text-xs font-medium border ${
                    isSelectedDate
                      ? "bg-[#5c3e59] text-white border-[#5c3e59] shadow-md shadow-[#5c3e59]/25 scale-105"
                      : "bg-white text-[#4f3a4c] border-[#eee3ed] hover:border-[#cfbccd]"
                  }`}
                >
                  <span className="text-[11px] opacity-80">{w.dayLabel}</span>
                  <span className="text-base font-bold mt-0.5">{w.dayNumber}</span>
                </button>
              );
            })}
          </div>

          <div>
            {isPending && (
              <p className="text-xs text-[#8c7489] animate-pulse py-3 text-center">
                Buscando horários disponíveis...
              </p>
            )}

            {slotsError && (
              <p className="text-xs text-rose-600 py-2 text-center">{slotsError}</p>
            )}

            {!isPending && !slotsError && slots.length === 0 && (
              <p className="text-xs text-[#8f798c] py-4 text-center">
                Nenhum horário livre para esta data. Selecione outro dia acima.
              </p>
            )}

            <div className="grid grid-cols-4 gap-2.5 mt-2">
              {slots.map((slot) => {
                const isSelectedSlot = selectedSlot?.start === slot.start;
                const timeLabel = new Date(slot.start).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <button
                    key={slot.start}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold border transition-all text-center ${
                      isSelectedSlot
                        ? "bg-[#5c3e59] text-white border-[#5c3e59] shadow-sm"
                        : "bg-white text-[#423140] border-[#ecdfe9] hover:border-[#9f799d]"
                    }`}
                  >
                    {timeLabel}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 👤 3. DADOS DA CLIENTE & BOTÃO AGENDAR */}
      {selectedSlot && selectedService && professionalId && (
        <div className="bg-white rounded-3xl p-5 border border-[#efe6ee] shadow-sm">
          <h3 className="text-base font-bold text-[#2e1f2c] mb-4">
            Seus dados para confirmar
          </h3>

          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="professional_id" value={professionalId} />
            <input type="hidden" name="service_id" value={selectedService.id} />
            <input type="hidden" name="start_datetime" value={selectedSlot.start} />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#543f52]">
                Nome completo
              </label>
              <input
                type="text"
                name="client_name"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Como devemos lhe chamar?"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#ebdbe9] focus:outline-none focus:ring-2 focus:ring-[#5c3e59] bg-[#faf7f8]"
              />
              {bookingState.fieldErrors?.client_name && (
                <p className="text-xs text-rose-600 font-medium">
                  {bookingState.fieldErrors.client_name}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#543f52]">
                WhatsApp (apenas números com DDD)
              </label>
              <input
                type="text"
                name="client_whatsapp"
                inputMode="numeric"
                required
                placeholder="21999999999"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#ebdbe9] focus:outline-none focus:ring-2 focus:ring-[#5c3e59] bg-[#faf7f8]"
              />
              {bookingState.fieldErrors?.client_whatsapp && (
                <p className="text-xs text-rose-600 font-medium">
                  {bookingState.fieldErrors.client_whatsapp}
                </p>
              )}
            </div>

            {bookingState.error && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                {bookingState.error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-4 px-6 bg-[#5c3e59] hover:bg-[#4b3148] text-white rounded-2xl font-bold text-sm shadow-lg shadow-[#5c3e59]/30 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <CalendarIcon className="w-4 h-4" />
              <span>{isSubmitting ? "Agendando..." : "Agendar horário →"}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
