import { z } from "zod";

import { cnpjSchema } from "./common";

export const createClienteSchema = z.object({
  id: z.string().min(1).optional(),
  cnpj: cnpjSchema,
  razaoSocial: z.string().min(2),
  nomeFantasia: z.string().min(2),
  postosAbastece: z
    .array(
      z.object({
        postoId: z.string().min(1),
        cnpjEc: cnpjSchema,
      }),
    )
    .default([]),
});

export const updateClienteSchema = createClienteSchema.partial();
