import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { UserModel, type UserRole } from "../models/user.model";
import { ApiError } from "../utils/api-error";

type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
  forcePasswordChange: boolean;
};

type AuthContext = {
  userId: string;
  email: string;
  nome: string;
  role: UserRole;
  forcePasswordChange: boolean;
};

type AuthOptions = {
  allowForcePasswordChange?: boolean;
};

function parseCookieValue(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) return null;

  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!token) return null;
  return decodeURIComponent(token.slice(name.length + 1));
}

function extractToken(
  authHeader: string | undefined,
  cookieHeader: string | undefined,
) {
  const fromCookie = parseCookieValue(cookieHeader, env.AUTH_COOKIE_NAME);
  if (fromCookie) return fromCookie;

  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length).trim() || null;
}

export function signAuthToken(payload: JwtPayload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function authenticate(options?: AuthOptions): RequestHandler {
  return (req, res, next) => {
    void (async () => {
      const token = extractToken(req.headers.authorization, req.headers.cookie);

      if (!token) {
        throw new ApiError(401, "Nao autenticado");
      }

      let decoded: JwtPayload;

      try {
        decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      } catch {
        throw new ApiError(401, "Token invalido ou expirado");
      }

      const user = await UserModel.findById(decoded.sub)
        .select("_id nome email role forcePasswordChange ativo")
        .lean();

      if (!user || user.ativo === false) {
        throw new ApiError(401, "Usuario invalido");
      }

      const auth: AuthContext = {
        userId: String(user._id),
        nome: String(user.nome),
        email: String(user.email),
        role: user.role,
        forcePasswordChange: Boolean(user.forcePasswordChange),
      };

      if (auth.forcePasswordChange && !options?.allowForcePasswordChange) {
        throw new ApiError(
          403,
          "Troca de senha obrigatoria antes de continuar",
        );
      }

      res.locals.auth = auth;
      next();
    })().catch(next);
  };
}

export function authorize(roles: UserRole[]): RequestHandler {
  return (req, res, next) => {
    const auth = res.locals.auth as AuthContext | undefined;

    if (!auth) {
      throw new ApiError(401, "Nao autenticado");
    }

    if (!roles.includes(auth.role)) {
      throw new ApiError(403, "Acesso negado para este perfil");
    }

    next();
  };
}
