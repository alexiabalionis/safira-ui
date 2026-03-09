import { z } from "zod";

export const cnpjSchema = z
  .string()
  .regex(/^\d{14}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "Invalid CNPJ");

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid Mongo ObjectId");

export const postoIdSchema = z.string().min(1, "Invalid posto id");
