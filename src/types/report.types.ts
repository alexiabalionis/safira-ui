import type {
  AutomacaoEtapaKey,
  AutomacaoTipoKey,
} from "@/services/automation";
import type { IntegrationStatus, UserRole } from "@/types/core.types";

export type ReportCategory = "Posto" | "Rede" | "ERP" | "Usuário";

export type ReportFilters = {
  search?: string;
  startDate?: string;
  endDate?: string;
  category?: ReportCategory;
  tipo?: AutomacaoTipoKey;
  erp?: string;
  erpStatus?: "Aguardando" | "em_andamento" | "Bloqueado" | "Finalizado";
  redeId?: string;
  etapa?: AutomacaoEtapaKey;
  userRole?: UserRole;
  userStatus?: "ativo" | "inativo";
  passwordState?: "PENDENTE" | "CONCLUIDA";
};

export type ReportRow = {
  id: string;
  categoria: ReportCategory;
  nome: string;
  referencia: string;
  status: IntegrationStatus;
  atualizadoEm: string;
  cnpjEc?: string;
  cidade?: string;
  uf?: string;
  rede?: string;
  erp?: string;
  tipoAutomacao?: string;
  statusAutomacao?: string;
  perfilUsuario?: UserRole;
  usuarioAtivo?: boolean;
  trocaSenhaPendente?: boolean;
};
