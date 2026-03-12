import { z } from "zod";

import {
  AUTOMACAO_ETAPA_VALUES,
  AUTOMACAO_TIPO_VALUES,
  normalizeAutomacaoEtapaKey,
  normalizeAutomacaoTipoKey,
} from "../domain/automation";

import { cnpjSchema } from "./common";

const optionalTrimmedString = z
  .string()
  .transform((value) => value.trim())
  .nullable()
  .optional();

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i)
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
  tipo: z
    .preprocess(
      (value) =>
        normalizeAutomacaoTipoKey(typeof value === "string" ? value : null),
      z
        .enum(AUTOMACAO_TIPO_VALUES as [string, ...string[]])
        .nullable()
        .optional(),
    )
    .optional(),
  etapa: z
    .preprocess(
      (value) =>
        normalizeAutomacaoEtapaKey(typeof value === "string" ? value : null),
      z.enum(AUTOMACAO_ETAPA_VALUES as [string, ...string[]]),
    )
    .nullable()
    .optional(),
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
  erpId: objectIdSchema,
  erp: z
    .preprocess((value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }, z.string().min(2).optional().nullable())
    .optional(),
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
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  cidade: z.string().optional(),
  uf: z.string().length(2).optional(),
  redeId: redeIdSchema,
  tipo: z
    .preprocess(
      (value) =>
        normalizeAutomacaoTipoKey(typeof value === "string" ? value : null),
      z
        .enum(AUTOMACAO_TIPO_VALUES as [string, ...string[]])
        .nullable()
        .optional(),
    )
    .optional(),
  erp: optionalTrimmedString,
  etapa: z
    .preprocess(
      (value) =>
        normalizeAutomacaoEtapaKey(typeof value === "string" ? value : null),
      z
        .enum(AUTOMACAO_ETAPA_VALUES as [string, ...string[]])
        .nullable()
        .optional(),
    )
    .optional(),
  sortBy: z
    .enum([
      "nomeFantasia",
      "razaoSocial",
      "cidade",
      "uf",
      "createdAt",
      "updatedAt",
      "dataEtapa",
      "etapa",
      "responsavelPosto",
      "analistaResponsavel",
    ])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});
