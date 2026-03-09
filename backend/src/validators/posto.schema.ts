import { z } from "zod";

import { cnpjSchema } from "./common";

const optionalTrimmedString = z
  .string()
  .transform((value) => value.trim())
  .nullable()
  .optional();

const redeIdSchema = z.string().min(1).nullable().optional();

const clienteAbasteceSchema = z.object({
  id: z.string().min(1),
  cnpj: cnpjSchema,
  razaoSocial: z.string().min(2),
  nomeFantasia: z.string().min(2),
});

const automacaoSchema = z.object({
  tipo: z.enum(["AUTOMAÇÃO", "SEMI-AUTOMAÇÃO", "MANUAL"]).nullable().optional(),
  etapa: z.string().min(1).nullable().optional(),
  dataEtapa: z.string().datetime().optional().nullable(),
  analistaResponsavel: optionalTrimmedString,
});

export const createPostoSchema = z.object({
  id: z.string().min(1).optional(),
  cnpjEc: cnpjSchema,
  cnpjEcDigits: z.string().regex(/^\d{14}$/),
  razaoSocial: z.string().min(2),
  nomeFantasia: z.string().min(2),
  cidade: z.string().min(2),
  uf: z.string().length(2),
  redeId: redeIdSchema,
  erp: z.string().min(2).optional().nullable(),
  responsavelPosto: optionalTrimmedString,
  telefone: optionalTrimmedString,
  email: z.string().email().optional().nullable(),
  automacao: automacaoSchema.optional().nullable(),
  clientesQueAbastecem: z.array(clienteAbasteceSchema).default([]),
});

export const updatePostoSchema = createPostoSchema.partial();

export const listPostosQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().length(2).optional(),
  redeId: redeIdSchema,
});
