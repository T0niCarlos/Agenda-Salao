import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const workingHourSchema = z
  .object({
    professional_id: z.string().uuid("Profissional inválido."),
    weekday: z.coerce
      .number()
      .int()
      .min(0, "Dia da semana inválido.")
      .max(6, "Dia da semana inválido."),
    start_time: z.string().regex(timeRegex, "Horário inicial inválido."),
    end_time: z.string().regex(timeRegex, "Horário final inválido."),
  })
  .refine((data) => data.end_time > data.start_time, {
    message: "O horário final deve ser depois do horário inicial.",
    path: ["end_time"],
  });

export type WorkingHourInput = z.infer<typeof workingHourSchema>;

export const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;
