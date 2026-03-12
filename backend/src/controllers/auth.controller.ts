import type { Request, Response } from "express";
import bcrypt from "bcryptjs";

import { env } from "../config/env";
import { type UserRole, UserModel } from "../models/user.model";
import { ApiError } from "../utils/api-error";
import {
  changePasswordSchema,
  createUserSchema,
  listUsersQuerySchema,
  loginSchema,
  resetUserPasswordSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  userIdParamSchema,
} from "../validators/auth.schema";
import { signAuthToken } from "../middlewares/auth.middleware";

const COOKIE_MAX_AGE_MS = 8 * 60 * 60 * 1000;

type AuthLocals = {
  userId: string;
  email: string;
  nome: string;
  role: UserRole;
  forcePasswordChange: boolean;
};

function setAuthCookie(res: Response, token: string) {
  res.cookie(env.AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_MS,
  });
}

function clearAuthCookie(res: Response) {
  res.clearCookie(env.AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

function toPublicUser(user: {
  _id: string;
  nome: string;
  email: string;
  role: UserRole;
  forcePasswordChange: boolean;
}) {
  return {
    id: String(user._id),
    nome: user.nome,
    email: user.email,
    role: user.role,
    forcePasswordChange: Boolean(user.forcePasswordChange),
  };
}

export async function login(req: Request, res: Response) {
  const payload = loginSchema.parse(req.body);

  const user = await UserModel.findOne({
    email: payload.email.trim().toLowerCase(),
    ativo: true,
  })
    .select("_id nome email role passwordHash forcePasswordChange")
    .lean();

  if (!user) {
    throw new ApiError(401, "Credenciais invalidas");
  }

  const validPassword = await bcrypt.compare(payload.senha, user.passwordHash);

  if (!validPassword) {
    throw new ApiError(401, "Credenciais invalidas");
  }

  const token = signAuthToken({
    sub: String(user._id),
    email: user.email,
    role: user.role,
    forcePasswordChange: Boolean(user.forcePasswordChange),
  });

  await UserModel.updateOne(
    { _id: user._id },
    {
      $set: {
        lastLoginAt: new Date(),
      },
    },
  );

  setAuthCookie(res, token);

  return res.json({
    token,
    user: toPublicUser(user),
  });
}

export async function me(_req: Request, res: Response) {
  const auth = res.locals.auth as AuthLocals;

  return res.json({
    user: {
      id: auth.userId,
      nome: auth.nome,
      email: auth.email,
      role: auth.role,
      forcePasswordChange: auth.forcePasswordChange,
    },
  });
}

export async function changePassword(req: Request, res: Response) {
  const payload = changePasswordSchema.parse(req.body);
  const auth = res.locals.auth as AuthLocals;

  const user = await UserModel.findById(auth.userId)
    .select("_id nome email role passwordHash forcePasswordChange")
    .lean();

  if (!user) {
    throw new ApiError(404, "Usuario nao encontrado");
  }

  const validPassword = await bcrypt.compare(
    payload.currentPassword,
    user.passwordHash,
  );

  if (!validPassword) {
    throw new ApiError(400, "Senha atual invalida");
  }

  const samePassword = await bcrypt.compare(
    payload.newPassword,
    user.passwordHash,
  );
  if (samePassword) {
    throw new ApiError(400, "Nova senha deve ser diferente da senha atual");
  }

  const newHash = await bcrypt.hash(payload.newPassword, 12);

  await UserModel.updateOne(
    { _id: auth.userId },
    {
      $set: {
        passwordHash: newHash,
        forcePasswordChange: false,
        passwordUpdatedAt: new Date(),
      },
    },
  );

  const token = signAuthToken({
    sub: String(user._id),
    email: user.email,
    role: user.role,
    forcePasswordChange: false,
  });

  setAuthCookie(res, token);

  return res.json({
    token,
    user: {
      id: String(user._id),
      nome: user.nome,
      email: user.email,
      role: user.role,
      forcePasswordChange: false,
    },
  });
}

export async function createUser(req: Request, res: Response) {
  const payload = createUserSchema.parse(req.body);

  const existing = await UserModel.findOne({
    email: payload.email.trim().toLowerCase(),
  })
    .select("_id")
    .lean();

  if (existing) {
    throw new ApiError(409, "Ja existe usuario com este e-mail");
  }

  const passwordHash = await bcrypt.hash(payload.temporaryPassword, 12);

  const created = await UserModel.create({
    nome: payload.nome.trim(),
    email: payload.email.trim().toLowerCase(),
    role: payload.role,
    passwordHash,
    forcePasswordChange: payload.role === "visitante" ? false : true,
    ativo: true,
  });

  return res.status(201).json({
    user: {
      id: String(created._id),
      nome: created.nome,
      email: created.email,
      role: created.role,
      forcePasswordChange: Boolean(created.forcePasswordChange),
    },
  });
}

export async function listUsers(req: Request, res: Response) {
  const query = listUsersQuerySchema.parse(req.query);

  const filter: {
    role?: UserRole;
    ativo?: boolean;
    $or?: Array<{ nome?: RegExp; email?: RegExp }>;
  } = {};

  if (query.role) {
    filter.role = query.role;
  }

  if (typeof query.ativo === "boolean") {
    filter.ativo = query.ativo;
  }

  if (query.search) {
    const safeRegex = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(safeRegex, "i");

    filter.$or = [{ nome: searchRegex }, { email: searchRegex }];
  }

  const users = await UserModel.find(filter)
    .select(
      "_id nome email role forcePasswordChange ativo createdAt updatedAt lastLoginAt",
    )
    .sort({ nome: 1 })
    .lean();

  return res.json({
    data: users.map((user) => ({
      id: String(user._id),
      nome: user.nome,
      email: user.email,
      role: user.role,
      forcePasswordChange: Boolean(user.forcePasswordChange),
      ativo: Boolean(user.ativo),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    })),
    total: users.length,
  });
}

export async function updateUserStatus(req: Request, res: Response) {
  const params = userIdParamSchema.parse(req.params);
  const payload = updateUserStatusSchema.parse(req.body);
  const auth = res.locals.auth as AuthLocals;

  if (params.id === auth.userId && payload.ativo === false) {
    throw new ApiError(400, "Nao e permitido desativar o proprio usuario");
  }

  const user = await UserModel.findById(params.id)
    .select("_id nome email role forcePasswordChange ativo")
    .lean();

  if (!user) {
    throw new ApiError(404, "Usuario nao encontrado");
  }

  await UserModel.updateOne(
    { _id: params.id },
    {
      $set: {
        ativo: payload.ativo,
      },
    },
  );

  return res.json({
    user: {
      id: String(user._id),
      nome: user.nome,
      email: user.email,
      role: user.role,
      forcePasswordChange: Boolean(user.forcePasswordChange),
      ativo: payload.ativo,
    },
  });
}

export async function resetUserPassword(req: Request, res: Response) {
  const params = userIdParamSchema.parse(req.params);
  const payload = resetUserPasswordSchema.parse(req.body);

  const user = await UserModel.findById(params.id)
    .select("_id nome email role ativo")
    .lean();

  if (!user) {
    throw new ApiError(404, "Usuario nao encontrado");
  }

  const passwordHash = await bcrypt.hash(payload.temporaryPassword, 12);

  await UserModel.updateOne(
    { _id: params.id },
    {
      $set: {
        passwordHash,
        forcePasswordChange: true,
        passwordUpdatedAt: new Date(),
        ativo: true,
      },
    },
  );

  return res.json({
    user: {
      id: String(user._id),
      nome: user.nome,
      email: user.email,
      role: user.role,
      forcePasswordChange: true,
      ativo: true,
    },
  });
}

export async function updateUserRole(req: Request, res: Response) {
  const params = userIdParamSchema.parse(req.params);
  const payload = updateUserRoleSchema.parse(req.body);
  const auth = res.locals.auth as AuthLocals;

  if (params.id === auth.userId) {
    throw new ApiError(400, "Nao e permitido alterar o proprio perfil");
  }

  const user = await UserModel.findById(params.id)
    .select("_id nome email role forcePasswordChange ativo")
    .lean();

  if (!user) {
    throw new ApiError(404, "Usuario nao encontrado");
  }

  await UserModel.updateOne(
    { _id: params.id },
    {
      $set: {
        role: payload.role,
      },
    },
  );

  return res.json({
    user: {
      id: String(user._id),
      nome: user.nome,
      email: user.email,
      role: payload.role,
      forcePasswordChange: Boolean(user.forcePasswordChange),
      ativo: Boolean(user.ativo),
    },
  });
}

export async function logout(_req: Request, res: Response) {
  clearAuthCookie(res);

  return res.status(204).send();
}
