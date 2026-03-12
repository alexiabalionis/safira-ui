export type AuthRole = "admin" | "operador" | "visitante";

export type AuthUser = {
  id: string;
  nome: string;
  email: string;
  role: AuthRole;
  forcePasswordChange: boolean;
};
