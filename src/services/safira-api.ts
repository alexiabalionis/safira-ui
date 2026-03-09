import type {
  AutomationStatus,
  Cliente,
  DashboardOverview,
  ERP,
  IntegrationStatus,
  ListParams,
  ManagedUser,
  Network,
  PagedResult,
  Posto,
  UserRole,
} from "./types";

export type AuthRole = "admin" | "operador" | "visitante";

export type AuthUser = {
  id: string;
  nome: string;
  email: string;
  role: AuthRole;
  forcePasswordChange: boolean;
};

const PUBLIC_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3333";

const INTERNAL_API_BASE_URL =
  process.env.SAFIRA_API_INTERNAL_URL?.replace(/\/$/, "") ?? null;

const API_BASE_URL =
  typeof window === "undefined" && INTERNAL_API_BASE_URL
    ? INTERNAL_API_BASE_URL
    : PUBLIC_API_BASE_URL;

const REQUEST_TIMEOUT_MS = 15000;

type BackendPosto = {
  id: string;
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
    tipo?: "AUTOMAÇÃO" | "SEMI-AUTOMAÇÃO" | "MANUAL" | null;
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

type BackendListPostosResponse = {
  data: BackendPosto[];
  total: number;
  page: number;
  pageSize: number;
};

type ListPostosFilters = ListParams & {
  tipo?: string;
  erp?: string;
  redeId?: string;
  etapa?: string;
};

function normalizeEtapa(etapa: string): AutomationStatus["fase"] {
  const normalized = etapa.trim().toLowerCase();
  if (normalized === "aguardando") return "Aguardando";
  if (normalized === "homologação" || normalized === "homologacao") {
    return "Homologação";
  }
  return "Ativo";
}

function faseToEtapa(fase: AutomationStatus["fase"]): string {
  if (fase === "Aguardando") return "Aguardando";
  if (fase === "Homologação") return "Homologação";
  return "Ativo";
}

function etapaToIntegrationStatus(etapa: string): IntegrationStatus {
  const normalized = etapa.trim().toLowerCase();
  if (normalized === "aguardando") return "Aguardando";
  if (normalized === "homologação" || normalized === "homologacao") {
    return "em_andamento";
  }
  return "Finalizado";
}

function parseDate(value: string | null) {
  return value ? new Date(value) : null;
}

function toIsoDate(value: Date | null) {
  return value ? value.toISOString() : null;
}

function emptyToNull(value: string | null | undefined) {
  if (typeof value !== "string") return value ?? null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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
      tipo: item.automacao?.tipo ?? undefined,
      etapa: item.automacao?.etapa ?? "",
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
    erp: input.erp,
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

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
    signal: controller.signal,
  }).finally(() => {
    clearTimeout(timeoutId);
  });

  if (!response.ok) {
    let message = `Erro na requisicao (${response.status})`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) {
        message = body.message;
      }
    } catch {
      // Keep fallback message.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function login(payload: { email: string; senha: string }) {
  const response = await fetchJson<{ token: string; user: AuthUser }>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return response.user;
}

export async function getCurrentUser() {
  const response = await fetchJson<{ user: AuthUser }>("/api/auth/me");
  return response.user;
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}) {
  const response = await fetchJson<{ token: string; user: AuthUser }>(
    "/api/auth/change-password",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return response.user;
}

export async function logout() {
  await fetchJson<void>("/api/auth/logout", {
    method: "POST",
  });
}

export async function listUsers(params?: {
  search?: string;
  role?: UserRole;
  ativo?: boolean;
}) {
  const query = new URLSearchParams();

  if (params?.search) query.set("search", params.search);
  if (params?.role) query.set("role", params.role);
  if (typeof params?.ativo === "boolean") {
    query.set("ativo", String(params.ativo));
  }

  const path =
    query.size > 0 ? `/api/auth/users?${query.toString()}` : "/api/auth/users";
  const response = await fetchJson<{ data: ManagedUser[]; total: number }>(
    path,
  );
  return response;
}

export async function createUser(payload: {
  nome: string;
  email: string;
  role: UserRole;
  temporaryPassword: string;
}) {
  const response = await fetchJson<{ user: ManagedUser }>("/api/auth/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response.user;
}

export async function updateUserRole(payload: { id: string; role: UserRole }) {
  const response = await fetchJson<{ user: ManagedUser }>(
    `/api/auth/users/${payload.id}/role`,
    {
      method: "PATCH",
      body: JSON.stringify({ role: payload.role }),
    },
  );

  return response.user;
}

export async function updateUserStatus(payload: {
  id: string;
  ativo: boolean;
}) {
  const response = await fetchJson<{ user: ManagedUser }>(
    `/api/auth/users/${payload.id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ ativo: payload.ativo }),
    },
  );

  return response.user;
}

export async function resetUserTemporaryPassword(payload: {
  id: string;
  temporaryPassword: string;
}) {
  const response = await fetchJson<{ user: ManagedUser }>(
    `/api/auth/users/${payload.id}/reset-password`,
    {
      method: "POST",
      body: JSON.stringify({ temporaryPassword: payload.temporaryPassword }),
    },
  );

  return response.user;
}

function paginate<T>(
  list: T[],
  params: { page: number; pageSize: number },
): PagedResult<T> {
  const start = (params.page - 1) * params.pageSize;
  return {
    data: list.slice(start, start + params.pageSize),
    total: list.length,
  };
}

function inDateRange(value: Date | null, startDate?: string, endDate?: string) {
  if (!value) return false;
  const timestamp = value.getTime();
  const start = startDate
    ? new Date(startDate).getTime()
    : Number.NEGATIVE_INFINITY;
  const end = endDate ? new Date(endDate).getTime() : Number.POSITIVE_INFINITY;
  return timestamp >= start && timestamp <= end;
}

async function listAllPostos(search?: string, redeId?: string) {
  // Backend validator caps pageSize at 100.
  const pageSize = 100;
  const allRows: BackendPosto[] = [];
  let page = 1;

  while (true) {
    const query = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (search) query.set("search", search);
    if (redeId) query.set("redeId", redeId);

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

export async function getDashboard() {
  return fetchJson<DashboardOverview>("/api/dashboard/overview");
}

export async function listPostos(params: ListPostosFilters) {
  let rows = await listAllPostos(params.search, params.redeId);

  if (params.tipo) {
    rows = rows.filter((item) => item.automacao.tipo === params.tipo);
  }

  if (params.erp) {
    rows = rows.filter((item) => (item.erp ?? "") === params.erp);
  }

  if (params.etapa) {
    rows = rows.filter((item) => item.automacao.etapa === params.etapa);
  }

  if (params.startDate || params.endDate) {
    rows = rows.filter((item) =>
      inDateRange(item.automacao.dataEtapa, params.startDate, params.endDate),
    );
  }

  return paginate(rows, params);
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

export async function importWayCsv(csvContent: string) {
  return fetchJson<ImportWayCsvResult>("/api/importacoes/way-csv", {
    method: "POST",
    body: JSON.stringify({ csvContent }),
  });
}

export async function listAutomationStatus(
  params: ListParams & { fase?: string; erp?: string },
) {
  let rows = await listAllPostos(params.search);

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

export async function listClientes(
  params: ListParams & {
    postoCnpj?: string;
  },
) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.postoCnpj) query.set("postoCnpj", params.postoCnpj);

  const path =
    query.size > 0 ? `/api/clientes?${query.toString()}` : "/api/clientes";
  const clientes = await fetchJson<Cliente[]>(path);

  const filtered = params.search
    ? clientes.filter((item) =>
        `${item.razaoSocial} ${item.nomeFantasia} ${item.cnpj}`
          .toLowerCase()
          .includes(params.search?.toLowerCase() ?? ""),
      )
    : clientes;

  return paginate(filtered, params);
}

export async function listRedes(params: ListParams) {
  const redes =
    await fetchJson<Array<{ id: string; nome: string }>>("/api/redes");

  const mapped: Network[] = redes.map((item) => ({
    id: item.id,
    nome: item.nome,
    cnpj: "-",
    ativo: true,
  }));

  const filtered = params.search
    ? mapped.filter((item) =>
        item.nome.toLowerCase().includes(params.search?.toLowerCase() ?? ""),
      )
    : mapped;

  return paginate(filtered, params);
}

export async function listERPs(params: ListParams) {
  const erps = await fetchJson<ERP[]>("/api/erps");

  const filtered = params.search
    ? erps.filter((item) =>
        `${item.nome} ${item.versao}`
          .toLowerCase()
          .includes(params.search?.toLowerCase() ?? ""),
      )
    : erps;

  return paginate(filtered, params);
}

export async function createCliente(payload: Omit<Cliente, "id">) {
  return fetchJson<Cliente>("/api/clientes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCliente(
  id: string,
  payload: Partial<Omit<Cliente, "id">>,
) {
  return fetchJson<Cliente>(`/api/clientes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function createRede(payload: Omit<Network, "id">) {
  const created = await fetchJson<{ id: string; nome: string }>("/api/redes", {
    method: "POST",
    body: JSON.stringify({ nome: payload.nome }),
  });

  return {
    id: created.id,
    nome: created.nome,
    cnpj: payload.cnpj || "-",
    ativo: true,
  } satisfies Network;
}

export async function createERP(payload: Omit<ERP, "id">) {
  return fetchJson<ERP>("/api/erps", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateERP(id: string, payload: Partial<Omit<ERP, "id">>) {
  return fetchJson<ERP>(`/api/erps/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteCliente(id: string) {
  await fetchJson<void>(`/api/clientes/${id}`, { method: "DELETE" });
}

export async function deleteRede(id: string) {
  await fetchJson<void>(`/api/redes/${id}`, { method: "DELETE" });
}

export async function deleteERP(id: string) {
  await fetchJson<void>(`/api/erps/${id}`, { method: "DELETE" });
}

type ReportCategory = "Posto" | "Rede" | "ERP";

type ReportFilters = {
  search?: string;
  startDate?: string;
  endDate?: string;
  category?: ReportCategory;
  tipo?: string;
  erp?: string;
  redeId?: string;
  etapa?: string;
};

function inIsoDateRange(value: string, startDate?: string, endDate?: string) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return false;

  const start = startDate
    ? new Date(startDate).getTime()
    : Number.NEGATIVE_INFINITY;
  const end = endDate ? new Date(endDate).getTime() : Number.POSITIVE_INFINITY;

  return timestamp >= start && timestamp <= end;
}

async function listReportRows(filters: ReportFilters) {
  const includePostos = !filters.category || filters.category === "Posto";
  const includeRedes = !filters.category || filters.category === "Rede";
  const includeErps = !filters.category || filters.category === "ERP";

  const [postos, redes, erps] = await Promise.all([
    includePostos
      ? listPostos({
          page: 1,
          pageSize: Number.MAX_SAFE_INTEGER,
          search: filters.search,
          startDate: filters.startDate,
          endDate: filters.endDate,
          tipo: filters.tipo,
          erp: filters.erp,
          redeId: filters.redeId,
          etapa: filters.etapa,
        })
      : Promise.resolve({ data: [], total: 0 }),
    includeRedes
      ? listRedes({
          page: 1,
          pageSize: Number.MAX_SAFE_INTEGER,
          search: filters.search,
        })
      : Promise.resolve({ data: [], total: 0 }),
    includeErps
      ? listERPs({
          page: 1,
          pageSize: Number.MAX_SAFE_INTEGER,
          search: filters.search,
        })
      : Promise.resolve({ data: [], total: 0 }),
  ]);

  let rows = [
    ...postos.data.map((item) => ({
      id: item.id,
      categoria: "Posto" as const,
      nome: item.nomeFantasia,
      referencia: item.razaoSocial,
      cnpjEc: item.cnpjEc,
      cidade: item.cidade,
      uf: item.uf,
      rede: item.redeNome ?? "",
      erp: item.erp ?? "",
      tipoAutomacao: item.automacao.tipo ?? "",
      statusAutomacao: item.automacao.etapa,
      status: etapaToIntegrationStatus(item.automacao.etapa),
      atualizadoEm: (item.automacao.dataEtapa ?? new Date()).toISOString(),
    })),
    ...redes.data.map((item) => ({
      id: item.id,
      categoria: "Rede" as const,
      nome: item.nome,
      referencia: item.cnpj,
      status: item.ativo ? "Finalizado" : "Aguardando",
      atualizadoEm: new Date().toISOString(),
    })),
    ...erps.data
      .filter((item) => !filters.erp || item.nome === filters.erp)
      .map((item) => ({
        id: item.id,
        categoria: "ERP" as const,
        nome: item.nome,
        referencia: item.versao,
        status: item.status,
        atualizadoEm: new Date().toISOString(),
      })),
  ];

  if ((includeRedes || includeErps) && (filters.startDate || filters.endDate)) {
    rows = rows.filter((item) => {
      if (item.categoria === "Posto") return true;
      return inIsoDateRange(
        item.atualizadoEm,
        filters.startDate,
        filters.endDate,
      );
    });
  }

  return rows;
}

export async function listReports(params: ListParams & ReportFilters) {
  const rows = await listReportRows(params);
  return paginate(rows, params);
}

export async function listReportsForExport(filters: ReportFilters) {
  return listReportRows(filters);
}
