import {
  AutomacaoEtapaKey,
  normalizeAutomacaoEtapaKey,
  normalizeAutomacaoTipoKey,
} from "@/services/automation";
import { fetchJson } from "@/services/integrations/api-base";
import {
  emptyToNull,
  inDateRange,
  paginate,
  parseDate,
  toIsoDate,
} from "@/services/integrations/common";
import type {
  AutomationStatus,
  IntegrationStatus,
  ListParams,
  Posto,
} from "@/types/core.types";
import type {
  BackendListPostosResponse,
  BackendPosto,
  ImportWayCsvResult,
  ListPostosFilters,
} from "@/types/posto.types";

function normalizeEtapa(etapa: string): AutomationStatus["fase"] {
  const normalized = etapa.trim().toLowerCase();
  if (normalized === "aguardando") return "Aguardando";
  if (normalized === "homologação" || normalized === "homologacao") {
    return "Homologação";
  }
  return "Ativo";
}

function faseToEtapa(fase: AutomationStatus["fase"]): AutomacaoEtapaKey {
  if (fase === "Aguardando") return AutomacaoEtapaKey.aguardando;
  if (fase === "Homologação") return AutomacaoEtapaKey.em_andamento;
  return AutomacaoEtapaKey.finalizado;
}

function etapaToIntegrationStatus(etapa: string): IntegrationStatus {
  const normalized = normalizeAutomacaoEtapaKey(etapa);
  if (normalized === AutomacaoEtapaKey.aguardando) return "Aguardando";
  if (normalized === AutomacaoEtapaKey.bloqueado) return "Bloqueado";
  if (normalized === AutomacaoEtapaKey.em_andamento) {
    return "em_andamento";
  }
  return "Finalizado";
}

function mapBackendPosto(item: BackendPosto): Posto {
  const redeId =
    item.redeId ??
    (typeof item.rede === "object" && item.rede ? item.rede.id : null);
  const redeNome =
    typeof item.rede === "object" && item.rede
      ? item.rede.nome
      : typeof item.rede === "string"
        ? item.rede
        : null;

  return {
    id: item.id,
    createdAt: parseDate(item.createdAt ?? null),
    updatedAt: parseDate(item.updatedAt ?? null),
    cnpjEc: item.cnpjEc,
    cnpjEcDigits: item.cnpjEcDigits,
    razaoSocial: item.razaoSocial,
    nomeFantasia: item.nomeFantasia,
    cidade: item.cidade,
    uf: item.uf,
    redeId,
    redeNome,
    erp: item.erp,
    responsavelPosto: item.responsavelPosto ?? "",
    telefone: item.telefone ?? "",
    email: item.email ?? "",
    automacao: {
      tipo: normalizeAutomacaoTipoKey(item.automacao?.tipo) ?? undefined,
      etapa: normalizeAutomacaoEtapaKey(item.automacao?.etapa),
      dataEtapa: parseDate(item.automacao?.dataEtapa ?? null),
      analistaResponsavel: item.automacao?.analistaResponsavel ?? "",
    },
    clientesQueAbastecem: item.clientesQueAbastecem ?? [],
  };
}

function mapPostoForBackend(input: Omit<Posto, "id"> | Posto) {
  return {
    cnpjEc: input.cnpjEc,
    cnpjEcDigits: input.cnpjEcDigits,
    razaoSocial: input.razaoSocial,
    nomeFantasia: input.nomeFantasia,
    cidade: input.cidade,
    uf: input.uf,
    redeId: input.redeId,
    erp: emptyToNull(input.erp),
    responsavelPosto: emptyToNull(input.responsavelPosto),
    telefone: emptyToNull(input.telefone),
    email: emptyToNull(input.email),
    automacao: {
      tipo: input.automacao.tipo,
      etapa: emptyToNull(input.automacao.etapa),
      dataEtapa: toIsoDate(input.automacao.dataEtapa),
      analistaResponsavel: emptyToNull(input.automacao.analistaResponsavel),
    },
    clientesQueAbastecem: input.clientesQueAbastecem,
  };
}

function buildListPostosQuery(params: Partial<ListPostosFilters>) {
  const query = new URLSearchParams();

  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  if (params.search) query.set("search", params.search);
  if (params.startDate) query.set("startDate", params.startDate);
  if (params.endDate) query.set("endDate", params.endDate);
  if (params.tipo) query.set("tipo", params.tipo);
  if (params.erp) query.set("erp", params.erp);
  if (params.redeId) query.set("redeId", params.redeId);
  if (params.etapa) query.set("etapa", params.etapa);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);

  return query;
}

async function listAllPostos(params: ListPostosFilters) {
  // Backend validator caps pageSize at 100.
  const pageSize = 100;
  const allRows: BackendPosto[] = [];
  let page = 1;

  while (true) {
    const query = buildListPostosQuery({
      ...params,
      page,
      pageSize,
    });

    const response = await fetchJson<BackendListPostosResponse>(
      `/api/postos?${query.toString()}`,
    );

    allRows.push(...response.data);

    if (allRows.length >= response.total || response.data.length < pageSize) {
      break;
    }

    page += 1;
  }

  return allRows.map(mapBackendPosto);
}

async function resolveRedeId(redeId: string | null, redeNome: string | null) {
  if (redeId) return redeId;
  if (!redeNome) return null;

  const redes =
    await fetchJson<Array<{ id: string; nome: string }>>("/api/redes");
  const found = redes.find(
    (item) => item.nome.trim().toLowerCase() === redeNome.trim().toLowerCase(),
  );
  return found?.id ?? null;
}

async function getPostoById(id: string) {
  const posto = await fetchJson<BackendPosto>(`/api/postos/${id}`);
  return mapBackendPosto(posto);
}

export async function listPostos(params: ListPostosFilters) {
  const rows = await listAllPostos(params);

  return paginate(rows, params);
}

export async function listPostosPage(params: ListPostosFilters) {
  const query = buildListPostosQuery(params);

  const response = await fetchJson<BackendListPostosResponse>(
    `/api/postos?${query.toString()}`,
  );

  return {
    data: response.data.map(mapBackendPosto),
    total: response.total,
  };
}

export async function listPostoRedes() {
  const redes =
    await fetchJson<Array<{ id: string; nome: string }>>("/api/redes");
  return redes;
}

export async function updatePosto(
  id: string,
  payload: Partial<Omit<Posto, "id">>,
) {
  const current = await getPostoById(id);

  const merged: Posto = {
    ...current,
    ...payload,
    automacao: {
      ...current.automacao,
      ...(payload.automacao ?? {}),
    },
    clientesQueAbastecem:
      payload.clientesQueAbastecem ?? current.clientesQueAbastecem,
  };

  const resolvedRedeId = await resolveRedeId(merged.redeId, merged.redeNome);

  const updated = await fetchJson<BackendPosto>(`/api/postos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(
      mapPostoForBackend({ ...merged, redeId: resolvedRedeId }),
    ),
  });

  return mapBackendPosto(updated);
}

export async function createPosto(payload: Omit<Posto, "id">) {
  const resolvedRedeId = await resolveRedeId(payload.redeId, payload.redeNome);

  const created = await fetchJson<BackendPosto>("/api/postos", {
    method: "POST",
    body: JSON.stringify(
      mapPostoForBackend({ ...payload, redeId: resolvedRedeId }),
    ),
  });

  return mapBackendPosto(created);
}

export async function importPostos(payloads: Array<Omit<Posto, "id">>) {
  const inserted: Posto[] = [];
  const errors: string[] = [];

  for (const [index, item] of payloads.entries()) {
    try {
      const created = await createPosto(item);
      inserted.push(created);
    } catch (error) {
      errors.push(
        `Linha ${index + 1}: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      );
    }
  }

  return { inserted, errors };
}

export async function importWayCsv(csvContent: string) {
  return fetchJson<ImportWayCsvResult>("/api/importacoes/way-csv", {
    method: "POST",
    body: JSON.stringify({ csvContent }),
  });
}

export async function listAutomationStatus(
  params: ListParams & { fase?: string; erp?: string },
) {
  let rows = await listAllPostos({
    page: 1,
    pageSize: params.pageSize,
    search: params.search,
    startDate: params.startDate,
    endDate: params.endDate,
  });

  if (params.fase) {
    rows = rows.filter(
      (item) => normalizeEtapa(item.automacao.etapa) === params.fase,
    );
  }

  if (params.erp) {
    rows = rows.filter((item) => (item.erp ?? "") === params.erp);
  }

  if (params.startDate || params.endDate) {
    rows = rows.filter((item) =>
      inDateRange(item.automacao.dataEtapa, params.startDate, params.endDate),
    );
  }

  const mapped: AutomationStatus[] = rows.map((item) => ({
    id: item.id,
    posto: item.nomeFantasia,
    fase: normalizeEtapa(item.automacao.etapa),
    erp: item.erp ?? "Nao informado",
    status: etapaToIntegrationStatus(item.automacao.etapa),
    atualizadoEm: (item.automacao.dataEtapa ?? new Date()).toISOString(),
  }));

  return paginate(mapped, params);
}

export async function updateAutomationStatus(
  id: string,
  payload: Partial<Pick<AutomationStatus, "fase" | "erp" | "status">>,
) {
  const current = await getPostoById(id);

  const updated = await updatePosto(id, {
    erp: payload.erp ?? current.erp,
    automacao: {
      ...current.automacao,
      etapa: payload.fase ? faseToEtapa(payload.fase) : current.automacao.etapa,
      dataEtapa: new Date(),
    },
  });

  return {
    id: updated.id,
    posto: updated.nomeFantasia,
    fase: normalizeEtapa(updated.automacao.etapa),
    erp: updated.erp ?? "Nao informado",
    status: payload.status ?? etapaToIntegrationStatus(updated.automacao.etapa),
    atualizadoEm: (updated.automacao.dataEtapa ?? new Date()).toISOString(),
  } satisfies AutomationStatus;
}
