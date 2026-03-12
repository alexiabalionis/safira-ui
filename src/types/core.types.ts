import type {
  AutomacaoEtapaKey,
  AutomacaoTipoKey,
} from "@/services/automation";

export type IntegrationStatus =
  | "Aguardando"
  | "em_andamento"
  | "Bloqueado"
  | "Finalizado";

export type AutomacaoTipo = AutomacaoTipoKey;

export type DashboardCard = {
  label: string;
  total: number;
  active: number;
};

export type DashboardStatusBreakdown = {
  value: number;
  total: number;
};

export type DashboardGroupSummary = {
  total: number;
  aguardando: number;
  iniciadas: number;
  finalizadas: number;
};

export type DashboardErpFinishedSummary = {
  nome: string;
  total: number;
};

export type DashboardTrendPoint = {
  label: string;
  value: number;
};

export type DashboardCompletionHistoryPoint = {
  label: string;
  count: number;
  avg: number;
};

export type DashboardOperatorRankingRow = {
  nome: string;
  finalizados: number;
  total: number;
};

export type DashboardOverview = {
  totals: {
    postos: number;
    redes: number;
    erps: number;
  };
  integrationStatus: {
    total: number;
    aguardando: DashboardStatusBreakdown;
    iniciadas: DashboardStatusBreakdown;
    finalizadas: DashboardStatusBreakdown;
    bloqueados: DashboardStatusBreakdown;
  };
  redes: Array<
    DashboardGroupSummary & {
      id: string | null;
      nome: string;
    }
  >;
  integrations: IntegrationItem[];
  erps: Array<
    DashboardGroupSummary & {
      nome: string;
    }
  >;
  erpsFinalizados: DashboardErpFinishedSummary[];
  leanFlow: {
    mtiDays: number;
    mtiTrend: DashboardTrendPoint[];
    mtiVariation: number | null;
    throughput7d: number;
    throughputGoalRatio: number;
    throughputGoal: number;
    completionHistory: {
      day: DashboardCompletionHistoryPoint[];
      week: DashboardCompletionHistoryPoint[];
      month: DashboardCompletionHistoryPoint[];
    };
    operatorRanking: DashboardOperatorRankingRow[];
    mtiPerErp: Record<string, number>;
  };
};

export type IntegrationItem = {
  id: string;
  nome: string;
  tipo: "Posto" | "Rede" | "ERP";
  status: IntegrationStatus;
  atualizadoEm: string;
};

export type Network = {
  id: string;
  nome: string;
  cnpj: string;
  ativo: boolean;
};

export type ERP = {
  id: string;
  nome: string;
  versao: string;
  status: IntegrationStatus;
};

export type Posto = {
  id: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  cnpjEc: string;
  cnpjEcDigits: string;
  razaoSocial: string;
  nomeFantasia: string;
  cidade: string;
  uf: string;
  redeId: string | null;
  redeNome: string | null;
  erp: string | null;
  responsavelPosto?: string;
  telefone?: string;
  email?: string;
  automacao: {
    tipo?: AutomacaoTipo;
    etapa: AutomacaoEtapaKey;
    dataEtapa: Date | null;
    analistaResponsavel?: string;
  };
  clientesQueAbastecem: Array<{
    id: string;
    cnpj: string;
    razaoSocial: string;
    nomeFantasia: string;
  }>;
};

export type AutomationStatus = {
  id: string;
  posto: string;
  fase: "Aguardando" | "Homologação" | "Ativo";
  erp: string;
  status: IntegrationStatus;
  atualizadoEm: string;
};

export type Cliente = {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  postosAbastece: Array<{
    postoId: string;
    cnpjEc: string;
  }>;
};

export type UserRole = "admin" | "operador" | "visitante";

export type ManagedUser = {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  forcePasswordChange: boolean;
  ativo: boolean;
};

export type PagedResult<T> = {
  data: T[];
  total: number;
};

export type ListParams = {
  page: number;
  pageSize: number;
  search?: string;
  startDate?: string;
  endDate?: string;
};
