import type { ManagedUser, UserRole } from "@/types/core.types";

export type UserStatusFilter = "ativo" | "inativo";

export type UsersPageData = {
  total: number;
  data: ManagedUser[];
};

export type UserSelectOption<T extends string> = {
  value: T;
  label: string;
};

export const USER_ROLE_OPTIONS: UserSelectOption<UserRole>[] = [
  { value: "admin", label: "Admin" },
  { value: "operador", label: "Operador" },
  { value: "visitante", label: "Visitante" },
];

export const USER_STATUS_OPTIONS: UserSelectOption<UserStatusFilter>[] = [
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
];
