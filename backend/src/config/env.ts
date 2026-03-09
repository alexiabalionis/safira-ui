import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3333),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  MONGODB_DB_NAME: z.string().min(1, "MONGODB_DB_NAME is required"),
  WAY_API_BASE_URL: z.string().min(1).default("https://way.webrouter.com.br"),
  WAY_API_TOKEN: z.string().optional(),
  WAY_API_TOKEN_WHITELABEL: z.string().optional(),
  WAY_API_COOKIE: z.string().optional(),
  WAY_API_REFERER: z
    .string()
    .min(1)
    .default("https://way.webrouter.com.br/webrouter/"),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must have at least 32 chars")
    .optional(),
  JWT_EXPIRES_IN: z.string().default("8h"),
  AUTH_COOKIE_NAME: z.string().default("safira_token"),
  BOOTSTRAP_ADMIN_NAME: z.string().optional(),
  BOOTSTRAP_ADMIN_EMAIL: z.string().email().optional(),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().min(8).optional(),
});

const parsedEnv = envSchema.parse(process.env);

const developmentJwtSecret =
  "dev-only-jwt-secret-change-this-before-production-12345";

const resolvedJwtSecret =
  parsedEnv.JWT_SECRET ??
  (parsedEnv.NODE_ENV === "production" ? undefined : developmentJwtSecret);

if (!resolvedJwtSecret) {
  throw new Error("JWT_SECRET is required in production");
}

if (!parsedEnv.JWT_SECRET && parsedEnv.NODE_ENV !== "production") {
  console.warn(
    "[auth] JWT_SECRET ausente. Usando segredo padrao de desenvolvimento.",
  );
}

export const env = {
  ...parsedEnv,
  JWT_SECRET: resolvedJwtSecret,
};
