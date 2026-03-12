"use client";

import { Tabs } from "@mantine/core";

import { useAuth } from "@/components/auth/auth-provider";
import { ClientesPanel } from "@/components/cadastros/clientes/clientes-panel";
import { ErpsPanel } from "@/components/cadastros/erps/erps-panel";
import { ImportacaoWayPanel } from "@/components/cadastros/importacao-way/importacao-way-panel";
import { RedesPanel } from "@/components/cadastros/redes/redes-panel";
import {
  CADASTROS_PANEL_VALUES,
  CADASTROS_TABS,
} from "@/components/cadastros/types";
import { UsuariosPanel } from "@/components/cadastros/usuarios/usuarios-panel";

export default function CadastrosPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <Tabs defaultValue={CADASTROS_PANEL_VALUES.CLIENTES} variant="outline">
      <Tabs.List>
        {CADASTROS_TABS.filter((tab) => !tab.adminOnly || isAdmin).map(
          (tab) => (
            <Tabs.Tab key={tab.value} value={tab.value}>
              {tab.label}
            </Tabs.Tab>
          ),
        )}
      </Tabs.List>

      <ClientesPanel />
      <ErpsPanel />
      <RedesPanel />
      {isAdmin ? <UsuariosPanel /> : null}
      <ImportacaoWayPanel />
    </Tabs>
  );
}
