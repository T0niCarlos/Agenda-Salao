import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do serviço."),
  duration_minutes: z.coerce
    .number({ message: "Informe a duração em minutos." })
    .int("A duração deve ser um número inteiro de minutos.")
    .positive("A duração deve ser maior que zero."),
  // O admin digita o preço em reais (ex.: "80,00" ou "80.00"); convertemos
  // para centavos no servidor antes de gravar — nunca confiamos em
  // price_cents vindo do cliente em nenhum outro ponto do sistema.
  price_reais: z.coerce
    .number({ message: "Informe o preço." })
    .nonnegative("O preço não pode ser negativo."),
});

export type ServiceInput = z.infer<typeof serviceSchema>;
