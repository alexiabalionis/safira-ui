import { BarChart3, Bot, Building2, FileSpreadsheet, Home } from "lucide-react";

import type { Role } from "@/components/auth/auth-provider";

export const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: Home,
    roles: ["admin", "operador", "visitante"] satisfies Role[],
  },
  {
    href: "/postos",
    label: "Postos",
    icon: Building2,
    roles: ["admin", "operador"] satisfies Role[],
  },
  {
    href: "/status-automacao",
    label: "Status Automação",
    icon: Bot,
    roles: ["admin", "operador"] satisfies Role[],
  },
  {
    href: "/cadastros",
    label: "Cadastros",
    icon: FileSpreadsheet,
    roles: ["admin"] satisfies Role[],
  },
  {
    href: "/relatorios",
    label: "Relatórios",
    icon: BarChart3,
    roles: ["admin"] satisfies Role[],
  },
];
