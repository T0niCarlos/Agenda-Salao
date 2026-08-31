import { z } from "zod";

export const professionalSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do profissional."),
});

export type ProfessionalInput = z.infer<typeof professionalSchema>;
