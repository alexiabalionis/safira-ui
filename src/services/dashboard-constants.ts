export enum ActionStatusFilter {
  ALL = "todos",
  PENDING = "Aguardando",
  IN_PROGRESS = "em_andamento",
}

export enum SlaFilter {
  ALL = "all",
  DAYS_15 = "15",
  DAYS_30 = "30",
  DAYS_60 = "60",
}

export enum NetworkFocusFilter {
  ALL = "todos",
  BOTTLENECK_PENDING = "gargalo-aguardando",
  BOTTLENECK_IN_PROGRESS = "gargalo-iniciadas",
  BEST_FINISHED = "melhores-finalizadas",
}

export enum NetworkVolumeFilter {
  ALL = "all",
  PLUS_10 = "10",
  PLUS_25 = "25",
  PLUS_50 = "50",
}

export const SLA_DELAY_DAYS = 15;

export const FUNNEL_STAGE_LABELS = {
  pending: "Aguardando",
  inProgress: "Iniciadas",
  completed: "Finalizadas",
} as const;

export const DASHBOARD_CARD_LABELS = {
  postos: "Postos",
  redes: "Redes",
  erps: "ERPs",
  delayed: "Integrações em Atraso",
} as const;
