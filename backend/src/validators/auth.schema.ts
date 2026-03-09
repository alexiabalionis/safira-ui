import { z } from "zod";

import { userRoles } from "../models/user.model";

export const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1, "Senha obrigatoria"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual obrigatoria"),
  newPassword: z
    .string()
    .min(8, "Nova senha deve ter ao menos 8 caracteres")
    .max(72, "Nova senha muito longa"),
});

export const createUserSchema = z.object({
  nome: z.string().min(2).max(120),
  email: z.string().email(),
  role: z.enum(userRoles),
  temporaryPassword: z
    .string()
    .min(8, "Senha temporaria deve ter ao menos 8 caracteres")
    .max(72, "Senha temporaria muito longa"),
});

export const listUsersQuerySchema = z.object({
  role: z.enum(userRoles).optional(),
  ativo: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;
      return value === "true";
    }),
  search: z.string().trim().min(1).optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().min(1),
});

export const updateUserStatusSchema = z.object({
  ativo: z.boolean(),
});

export const resetUserPasswordSchema = z.object({
  temporaryPassword: z
    .string()
    .min(8, "Senha temporaria deve ter ao menos 8 caracteres")
    .max(72, "Senha temporaria muito longa"),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(userRoles),
});
