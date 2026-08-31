import { z } from "zod";

export const bookingSchema = z.object({
  professional_id: z.string().uuid("Profissional inválido."),
  service_id: z.string().uuid("Serviço inválido."),
  start_datetime: z.string().min(1, "Escolha um horário."),
  client_name: z.string().trim().min(1, "Informe seu nome."),
  client_whatsapp: z
    .string()
    .trim()
    .regex(/^\d{10,15}$/, "WhatsApp inválido (use DDD + número, só números)."),
});

export type BookingInput = z.infer<typeof bookingSchema>;
