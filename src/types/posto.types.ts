import type {
  AutomacaoEtapaKey,
  AutomacaoTipoKey,
} from "@/services/automation";
import type { ListParams } from "@/types/core.types";

export type BackendPosto = {
  id: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  cnpjEc: string;
  cnpjEcDigits: string;
  razaoSocial: string;
  nomeFantasia: string;
  cidade: string;
  uf: string;
  redeId?: string | null;
  rede: { id: string; nome: string } | string | null;
  erp: string | null;
  responsavelPosto?: string | null;
  telefone?: string | null;
  email?: string | null;
  automacao?: {
    tipo?: string | null;
    etapa?: string | null;
    dataEtapa?: string | null;
    analistaResponsavel?: string | null;
  } | null;
  clientesQueAbastecem: Array<{
    id: string;
    cnpj: string;
    razaoSocial: string;
    nomeFantasia: string;
  }>;
};

export type BackendListPostosResponse = {
  data: BackendPosto[];
  total: number;
  page: number;
  pageSize: number;
};

export type PostoSortBy =
  | "nomeFantasia"
  | "razaoSocial"
  | "cidade"
  | "uf"
  | "createdAt"
  | "updatedAt"
  | "dataEtapa"
  | "etapa"
  | "responsavelPosto"
  | "analistaResponsavel";

export type SortOrder = "asc" | "desc";

export type ListPostosFilters = ListParams & {
  tipo?: AutomacaoTipoKey;
  erp?: string;
  redeId?: string;
  etapa?: AutomacaoEtapaKey;
  sortBy?: PostoSortBy;
  sortOrder?: SortOrder;
};

export type ImportWayCsvResult = {
  totalCnpjsCsv: number;
  totalCnpjsValidos: number;
  importados: number;
  ignoradosDuplicados: number;
  falhas: Array<{
    cnpjEc: string;
    motivo: string;
  }>;
};
