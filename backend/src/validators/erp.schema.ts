import { z } from "zod";

export const createERPSchema = z.object({
  nome: z.string().min(2),
  versao: z.string().min(1),
  status: z
    .enum(["Aguardando", "em_andamento", "Finalizado"])
    .default("Aguardando"),
});

export const updateERPSchema = createERPSchema.partial();
