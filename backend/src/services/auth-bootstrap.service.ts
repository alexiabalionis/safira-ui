import bcrypt from "bcryptjs";

import { env } from "../config/env";
import { UserModel } from "../models/user.model";

export async function ensureBootstrapAdmin() {
  const email = env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!email || !password) {
    return;
  }

  const exists = await UserModel.findOne({ email }).select("_id").lean();
  if (exists) {
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await UserModel.create({
    nome: env.BOOTSTRAP_ADMIN_NAME?.trim() || "Administrador Safira",
    email,
    role: "admin",
    passwordHash,
    forcePasswordChange: true,
    ativo: true,
  });

  console.log(`Bootstrap admin created for ${email}`);
}
