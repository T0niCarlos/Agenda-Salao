import { z } from "zod";

export const blockSchema = z
  .object({
    professional_id: z.string().uuid("Profissional inválido."),
    // datetime-local do HTML: "YYYY-MM-DDTHH:MM", sem timezone — é
    // interpretado no fuso do navegador de quem preenche (o admin do
    // salão), depois convertido para timestamptz (UTC) pelo Postgres.
    start_datetime: z.string().min(1, "Informe o início do bloqueio."),
    end_datetime: z.string().min(1, "Informe o fim do bloqueio."),
    reason: z
      .string()
      .trim()
      .max(200, "O motivo deve ter até 200 caracteres.")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => new Date(data.end_datetime) > new Date(data.start_datetime),
    {
      message: "O fim do bloqueio deve ser depois do início.",
      path: ["end_datetime"],
    }
  );

export type BlockInput = z.infer<typeof blockSchema>;
