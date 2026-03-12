import { fetchJson } from "@/services/integrations/api-base";
import type { AuthUser } from "@/types/auth.types";
import type { ManagedUser, UserRole } from "@/types/core.types";

export async function login(payload: { email: string; senha: string }) {
  const response = await fetchJson<{ token: string; user: AuthUser }>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return response.user;
}

export async function getCurrentUser() {
  const response = await fetchJson<{ user: AuthUser }>("/api/auth/me");
  return response.user;
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}) {
  const response = await fetchJson<{ token: string; user: AuthUser }>(
    "/api/auth/change-password",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return response.user;
}

export async function logout() {
  await fetchJson<void>("/api/auth/logout", {
    method: "POST",
  });
}

export async function listUsers(params?: {
  search?: string;
  role?: UserRole;
  ativo?: boolean;
}) {
  const query = new URLSearchParams();

  if (params?.search) query.set("search", params.search);
  if (params?.role) query.set("role", params.role);
  if (typeof params?.ativo === "boolean") {
    query.set("ativo", String(params.ativo));
  }

  const path =
    query.size > 0 ? `/api/auth/users?${query.toString()}` : "/api/auth/users";
  const response = await fetchJson<{ data: ManagedUser[]; total: number }>(
    path,
  );
  return response;
}

export async function createUser(payload: {
  nome: string;
  email: string;
  role: UserRole;
  temporaryPassword: string;
}) {
  const response = await fetchJson<{ user: ManagedUser }>("/api/auth/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response.user;
}

export async function updateUserRole(payload: { id: string; role: UserRole }) {
  const response = await fetchJson<{ user: ManagedUser }>(
    `/api/auth/users/${payload.id}/role`,
    {
      method: "PATCH",
      body: JSON.stringify({ role: payload.role }),
    },
  );

  return response.user;
}

export async function updateUserStatus(payload: {
  id: string;
  ativo: boolean;
}) {
  const response = await fetchJson<{ user: ManagedUser }>(
    `/api/auth/users/${payload.id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ ativo: payload.ativo }),
    },
  );

  return response.user;
}

export async function resetUserTemporaryPassword(payload: {
  id: string;
  temporaryPassword: string;
}) {
  const response = await fetchJson<{ user: ManagedUser }>(
    `/api/auth/users/${payload.id}/reset-password`,
    {
      method: "POST",
      body: JSON.stringify({ temporaryPassword: payload.temporaryPassword }),
    },
  );

  return response.user;
}
