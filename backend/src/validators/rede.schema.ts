import { z } from "zod";

export const createRedeSchema = z.object({
  nome: z.string().min(2),
});

export const updateRedeSchema = createRedeSchema.partial();
