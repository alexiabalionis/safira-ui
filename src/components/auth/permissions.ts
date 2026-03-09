import type { Role } from "@/components/auth/auth-provider";

export const roleRoutePermissions: Record<Role, string[]> = {
  admin: [
    "/dashboard",
    "/postos",
    "/status-automacao",
    "/cadastros",
    "/relatorios",
  ],
  operador: ["/dashboard", "/postos", "/status-automacao"],
  visitante: ["/dashboard"],
};

export function canAccessPath(role: Role, pathname: string) {
  const allowedPrefixes = roleRoutePermissions[role] ?? [];
  return allowedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
