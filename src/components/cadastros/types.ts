export const CADASTROS_PANEL_VALUES = {
  CLIENTES: "clientes",
  ERPS: "erps",
  REDES: "redes",
  USUARIOS: "usuarios",
  IMPORTACAO_WAY: "importacao-way",
} as const;

export type CadastrosPanelValue =
  (typeof CADASTROS_PANEL_VALUES)[keyof typeof CADASTROS_PANEL_VALUES];

export type CadastrosTabConfig = {
  value: CadastrosPanelValue;
  label: string;
  adminOnly?: boolean;
};

export const CADASTROS_TABS: CadastrosTabConfig[] = [
  { value: CADASTROS_PANEL_VALUES.CLIENTES, label: "Clientes" },
  { value: CADASTROS_PANEL_VALUES.ERPS, label: "ERPs" },
  { value: CADASTROS_PANEL_VALUES.REDES, label: "Redes" },
  {
    value: CADASTROS_PANEL_VALUES.USUARIOS,
    label: "Usuários",
    adminOnly: true,
  },
  { value: CADASTROS_PANEL_VALUES.IMPORTACAO_WAY, label: "Importação Way" },
];
