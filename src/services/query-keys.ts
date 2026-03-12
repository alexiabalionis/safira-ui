export const queryKeys = {
  dashboard: ["dashboard"] as const,
  integrations: (page: number, pageSize: number) =>
    ["integrations", page, pageSize] as const,
  postos: (params: unknown) => ["postos", params] as const,
  postosInfinite: (params: unknown) => ["postos", "infinite", params] as const,
  postosRedes: ["postos-redes"] as const,
  automations: (params: unknown) => ["automations", params] as const,
  clientes: (params: unknown) => ["clientes", params] as const,
  users: (params: unknown) => ["users", params] as const,
  erps: (params: unknown) => ["erps", params] as const,
  redes: (params: unknown) => ["redes", params] as const,
  reports: (params: unknown) => ["reports", params] as const,
};
