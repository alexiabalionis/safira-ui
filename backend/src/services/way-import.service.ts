import { env } from "../config/env";
import {
  normalizeAutomacaoEtapaKey,
  normalizeAutomacaoTipoKey,
} from "../domain/automation";
import { ClienteModel } from "../models/cliente.model";
import { PostoModel } from "../models/posto.model";
import { RedeModel } from "../models/rede.model";
import { resolveOrCreateErp } from "./erp-registry.service";

type WayEstabelecimento = {
  id: number;
  rede?: { id?: number; nome?: string } | null;
  documento?: {
    numero?: string | null;
    numeroSemMascara?: string | null;
  } | null;
  razaoSocial?: string | null;
  nomeFantasia?: string | null;
  uf?: string | null;
  cidade?: string | null;
  email1?: string | null;
  email2?: string | null;
  email3?: string | null;
  email4?: string | null;
  telefone1?: string | null;
  telefone2?: string | null;
  telefone3?: string | null;
  telefone4?: string | null;
  telefone5?: string | null;
  usuarioResponsavel?: { nome?: string | null } | null;
  usuarioResponsavelHigienizacao?: { nome?: string | null } | null;
  pessoasRecolhaDocumento?: Array<{
    nome?: string | null;
    email?: string | null;
    fones?: string | null;
  }>;
  informacoesAdicionais?: {
    sistemaERP?: { nome?: string | null } | null;
    possuiAutomacaoSistemas?: boolean | null;
  } | null;
};

type WayApiResponse = {
  content?: WayEstabelecimento[];
};

type WayCliente = {
  id?: number | null;
  cnpj?: string | null;
  razaoSocial?: string | null;
  nomeFantasia?: string | null;
};

type WayClientesResponse = {
  abastecimentos?: Array<{
    cliente?: WayCliente | null;
  }>;
};

type ParsedCsvRow = {
  cnpj: string;
  tipo: string;
  status: string;
  dataConclusao: string;
};

type ClienteQueAbastece = {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
};

const WAY_REQUEST_DELAY_MS = 120;

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

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function formatCnpj(cnpjDigits: string) {
  if (cnpjDigits.length !== 14) return cnpjDigits;
  return cnpjDigits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5",
  );
}

function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

function normalizeLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

function parseAutomacaoTipo(value: string) {
  return normalizeAutomacaoTipoKey(value);
}

function parseAutomacaoEtapa(value: string) {
  return normalizeAutomacaoEtapaKey(value);
}

function parseCsvDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const brDateMatch = trimmed.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );

  if (brDateMatch) {
    const [, dayRaw, monthRaw, yearRaw, hourRaw, minuteRaw, secondRaw] =
      brDateMatch;

    const day = Number(dayRaw);
    const month = Number(monthRaw);
    const year = Number(yearRaw);
    const hour = Number(hourRaw ?? "0");
    const minute = Number(minuteRaw ?? "0");
    const second = Number(secondRaw ?? "0");

    if (
      Number.isFinite(day) &&
      Number.isFinite(month) &&
      Number.isFinite(year) &&
      Number.isFinite(hour) &&
      Number.isFinite(minute) &&
      Number.isFinite(second)
    ) {
      return new Date(year, month - 1, day, hour, minute, second);
    }
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatWayDate(value: Date) {
  const day = String(value.getDate()).padStart(2, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const year = value.getFullYear();
  return `${day}/${month}/${year}`;
}

function splitCsvLine(line: string, separator: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      const next = line[index + 1];
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === separator && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function getHeaderIndex(headerValues: string[], aliases: string[]) {
  return headerValues.findIndex((header) => aliases.includes(header));
}

function parseCsvRows(content: string) {
  const normalized = content.replace(/^\uFEFF/, "").trim();
  if (!normalized) {
    return [] as ParsedCsvRow[];
  }

  const lines = normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [] as ParsedCsvRow[];

  const firstLine = lines[0] ?? "";

  const separator =
    (firstLine.match(/;/g) ?? []).length >= (firstLine.match(/,/g) ?? []).length
      ? ";"
      : ",";

  const headerValues = splitCsvLine(firstLine, separator).map(normalizeHeader);
  const cnpjAliases = ["cnpjec", "cnpj", "cnpjposto", "documento", "numero"];
  const tipoAliases = ["tipo", "tipoautomacao", "tipodeautomacao"];
  const statusAliases = ["status", "etapa", "statusautomacao"];
  const dataConclusaoAliases = ["dataconclusao", "datadeconclusao"];

  const cnpjIndex = getHeaderIndex(headerValues, cnpjAliases);
  const tipoIndex = getHeaderIndex(headerValues, tipoAliases);
  const statusIndex = getHeaderIndex(headerValues, statusAliases);
  const dataConclusaoIndex = getHeaderIndex(headerValues, dataConclusaoAliases);

  const hasHeader =
    cnpjIndex >= 0 ||
    tipoIndex >= 0 ||
    statusIndex >= 0 ||
    dataConclusaoIndex >= 0;

  const startLine = hasHeader ? 1 : 0;
  const effectiveIndex = cnpjIndex >= 0 ? cnpjIndex : 0;

  const rows: ParsedCsvRow[] = [];
  for (let i = startLine; i < lines.length; i += 1) {
    const values = splitCsvLine(lines[i] ?? "", separator);
    rows.push({
      cnpj: (values[effectiveIndex] ?? "").trim(),
      tipo: tipoIndex >= 0 ? (values[tipoIndex] ?? "").trim() : "",
      status: statusIndex >= 0 ? (values[statusIndex] ?? "").trim() : "",
      dataConclusao:
        dataConclusaoIndex >= 0
          ? (values[dataConclusaoIndex] ?? "").trim()
          : "",
    });
  }

  return rows;
}

function buildWayHeaders(token: string, includeJsonContentType = false) {
  return {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    Referer: env.WAY_API_REFERER,
    token,
    ...(includeJsonContentType ? { "Content-Type": "application/json" } : {}),
    ...(env.WAY_API_TOKEN_WHITELABEL
      ? { tokenWhiteLabel: env.WAY_API_TOKEN_WHITELABEL }
      : {}),
    ...(env.WAY_API_COOKIE ? { Cookie: env.WAY_API_COOKIE } : {}),
  };
}

async function fetchWayByCnpj(cnpjDigits: string) {
  const token = env.WAY_API_TOKEN;
  if (!token) {
    throw new Error("WAY_API_TOKEN not configured");
  }

  const query = new URLSearchParams({
    orderBy: "",
    desc: "true",
    search: cnpjDigits,
    somenteMeusPostos: "false",
  });

  const requestUrl = `${env.WAY_API_BASE_URL}/recolhaDocumentos/estabelecimento/filter/0/20?${query.toString()}`;
  console.log(
    `[way-import] Calling Way API for CNPJ ${cnpjDigits}. URL: ${requestUrl}`,
  );

  const response = await fetch(requestUrl, {
    method: "GET",
    headers: buildWayHeaders(token),
  });

  console.log(`[way-import] Way API response for CNPJ ${cnpjDigits}:`, {
    status: response.status,
    statusText: response.statusText,
  });

  if (!response.ok) {
    let errorBody = "";
    try {
      errorBody = await response.text();
    } catch {
      errorBody = "<unreadable body>";
    }
    console.error(
      `[way-import] Way API request failed for CNPJ ${cnpjDigits}. URL: ${requestUrl}. Body: ${errorBody.slice(0, 500)}`,
    );
    throw new Error(`Way API error ${response.status}`);
  }

  return (await response.json()) as WayApiResponse;
}

async function fetchWayClientesByEstabelecimento(estabelecimentoId: number) {
  const token = env.WAY_API_TOKEN;
  if (!token) {
    throw new Error("WAY_API_TOKEN not configured");
  }

  const now = new Date();
  const periodStart = new Date(now.getFullYear() - 1, 0, 1);

  const requestUrl = `${env.WAY_API_BASE_URL}/recolhaDocumentos/abastecimentos/filtro/clientes`;
  const payload = {
    periodo: {
      dataInicio: formatWayDate(periodStart),
      dataFim: formatWayDate(now),
    },
    estabelecimento: {
      id: estabelecimentoId,
    },
    somenteMeusPostos: false,
  };

  const response = await fetch(requestUrl, {
    method: "POST",
    headers: buildWayHeaders(token, true),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorBody = "";
    try {
      errorBody = await response.text();
    } catch {
      errorBody = "<unreadable body>";
    }

    throw new Error(
      `Way API clients error ${response.status}: ${errorBody.slice(0, 300)}`,
    );
  }

  return (await response.json()) as WayClientesResponse;
}

function parseClientesQueAbastecem(
  response: WayClientesResponse,
): ClienteQueAbastece[] {
  const abastecimentos = response.abastecimentos ?? [];
  const uniqueClientes = new Map<string, ClienteQueAbastece>();

  for (const abastecimento of abastecimentos) {
    const cliente = abastecimento.cliente;
    if (!cliente?.id) continue;

    const cnpjDigits = digitsOnly(cliente.cnpj ?? "");
    if (cnpjDigits.length !== 14) continue;

    const id = String(cliente.id);
    if (uniqueClientes.has(id)) continue;

    const razaoSocial = (cliente.razaoSocial?.trim() ?? "") || "CLIENTE";
    const nomeFantasia =
      (cliente.nomeFantasia?.trim() ?? "") ||
      razaoSocial ||
      "CLIENTE SEM NOME FANTASIA";

    uniqueClientes.set(id, {
      id,
      cnpj: formatCnpj(cnpjDigits),
      razaoSocial,
      nomeFantasia,
    });
  }

  return Array.from(uniqueClientes.values());
}

function pickFirstValue(...values: Array<string | null | undefined>) {
  return values.find((item) => item && item.trim())?.trim() ?? "";
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function importWayCsv(
  csvContent: string,
): Promise<ImportWayCsvResult> {
  console.log("[way-import] Starting CSV import process");

  const parsedRows = parseCsvRows(csvContent);
  const totalCnpjsCsv = parsedRows.length;

  const normalizedRows = parsedRows
    .map((row) => ({
      ...row,
      cnpjDigits: digitsOnly(row.cnpj),
    }))
    .filter((row) => row.cnpjDigits.length === 14);

  const uniqueRows = Array.from(
    new Map(
      normalizedRows.map((row) => [row.cnpjDigits, row] as const),
    ).values(),
  );

  console.log(
    `[way-import] CSV parsed. Total rows: ${totalCnpjsCsv}, valid CNPJs: ${uniqueRows.length}`,
  );

  const result: ImportWayCsvResult = {
    totalCnpjsCsv,
    totalCnpjsValidos: uniqueRows.length,
    importados: 0,
    ignoradosDuplicados: 0,
    falhas: [],
  };

  let hasRequestedWayApi = false;

  let index = 0;

  for (const row of uniqueRows) {
    console.log({ row });
    index += 1;
    const cnpjDigits = row.cnpjDigits;
    const cnpjMasked = formatCnpj(cnpjDigits);

    console.log(
      `[way-import] Processing ${index}/${uniqueRows.length} - CNPJ ${cnpjMasked}`,
    );

    const existing = await PostoModel.findOne({
      cnpjEcDigits: cnpjDigits,
    }).lean();
    if (existing) {
      result.ignoradosDuplicados += 1;
      console.log(
        `[way-import] CNPJ ${cnpjMasked} ignored (already exists by cnpjEcDigits)`,
      );
      continue;
    }

    try {
      if (hasRequestedWayApi) {
        console.log(
          `[way-import] Waiting ${WAY_REQUEST_DELAY_MS}ms before next Way API request`,
        );
        await delay(WAY_REQUEST_DELAY_MS);
      }

      hasRequestedWayApi = true;
      const wayResponse = await fetchWayByCnpj(cnpjDigits);
      const content = wayResponse.content ?? [];

      const estabelecimento =
        content.find(
          (item) =>
            digitsOnly(item.documento?.numeroSemMascara ?? "") === cnpjDigits,
        ) ?? content[0];

      if (!estabelecimento) {
        console.warn(
          `[way-import] No establishment found in Way API for CNPJ ${cnpjMasked}`,
        );
        result.falhas.push({
          cnpjEc: cnpjMasked,
          motivo: "Nenhum estabelecimento encontrado na Way API",
        });
        continue;
      }

      const existingById = await PostoModel.findById(
        String(estabelecimento.id),
      ).lean();
      if (existingById) {
        result.ignoradosDuplicados += 1;
        console.log(
          `[way-import] CNPJ ${cnpjMasked} ignored (posto id ${estabelecimento.id} already exists)`,
        );
        continue;
      }

      const redeNome = (estabelecimento.rede?.nome?.trim() ?? "").toUpperCase();
      let redeId: string | null = null;
      if (redeNome) {
        const existingRede = await RedeModel.findOne({ nome: redeNome }).lean();
        if (existingRede) {
          redeId = String(existingRede._id);
        } else {
          const createdRede = await RedeModel.create({ nome: redeNome });
          redeId = String(createdRede._id);
        }
      }

      const erpNomeRaw =
        estabelecimento.informacoesAdicionais?.sistemaERP?.nome?.trim() || null;
      const erpResolution = await resolveOrCreateErp(erpNomeRaw);

      const telefone = pickFirstValue(
        estabelecimento.telefone1,
        estabelecimento.telefone2,
        estabelecimento.telefone3,
        estabelecimento.telefone4,
        estabelecimento.telefone5,
        estabelecimento.pessoasRecolhaDocumento?.[0]?.fones,
      );

      const email = pickFirstValue(
        estabelecimento.email1,
        estabelecimento.email2,
        estabelecimento.email3,
        estabelecimento.email4,
        estabelecimento.pessoasRecolhaDocumento?.[0]?.email,
      );

      const responsavel = pickFirstValue(
        estabelecimento.usuarioResponsavel?.nome,
        estabelecimento.pessoasRecolhaDocumento?.[0]?.nome,
      );

      let clientesQueAbastecem: ClienteQueAbastece[] = [];
      try {
        const clientesResponse = await fetchWayClientesByEstabelecimento(
          estabelecimento.id,
        );
        clientesQueAbastecem = parseClientesQueAbastecem(clientesResponse);

        if (clientesQueAbastecem.length > 0) {
          await Promise.all(
            clientesQueAbastecem.map((cliente) =>
              ClienteModel.findByIdAndUpdate(
                cliente.id,
                {
                  $set: {
                    cnpj: cliente.cnpj,
                    razaoSocial: cliente.razaoSocial,
                    nomeFantasia: cliente.nomeFantasia,
                  },
                  $addToSet: {
                    postosAbastece: {
                      postoId: String(estabelecimento.id),
                      cnpjEc: cnpjMasked,
                    },
                  },
                  $setOnInsert: {
                    _id: cliente.id,
                  },
                },
                {
                  upsert: true,
                  setDefaultsOnInsert: true,
                  runValidators: true,
                },
              ),
            ),
          );
        }
      } catch (clientsError) {
        console.warn(
          `[way-import] Failed to fetch clients for posto ${estabelecimento.id}. Continuing without clients.`,
          clientsError,
        );
      }

      const automacaoTipo = parseAutomacaoTipo(row.tipo);
      const automacaoEtapa = parseAutomacaoEtapa(row.status);
      const automacaoDataEtapa = parseCsvDate(row.dataConclusao);
      console.log(
        `!!![way-import] Parsed automation data for CNPJ ${cnpjMasked}: tipo=${automacaoTipo}, etapa=${automacaoEtapa}, dataEtapa=${automacaoDataEtapa}`,
      );
      await PostoModel.create({
        _id: String(estabelecimento.id),
        cnpjEc: cnpjMasked,
        cnpjEcDigits: cnpjDigits,
        razaoSocial: estabelecimento.razaoSocial?.trim() || "",
        nomeFantasia: estabelecimento.nomeFantasia?.trim() || "",
        cidade: estabelecimento.cidade?.trim() || "",
        uf: (estabelecimento.uf?.trim() || "").toUpperCase(),
        redeId,
        erp: erpResolution.erpName,
        erpId: erpResolution.erpId,
        responsavelPosto: responsavel,
        telefone,
        email,
        automacao: {
          tipo: automacaoTipo,
          etapa: automacaoEtapa,
          dataEtapa: automacaoDataEtapa,
          analistaResponsavel:
            estabelecimento.usuarioResponsavelHigienizacao?.nome?.trim() || "",
        },
        clientesQueAbastecem,
      });

      result.importados += 1;
      console.log(
        `[way-import] CNPJ ${cnpjMasked} imported successfully as posto id ${estabelecimento.id}`,
      );
    } catch (error) {
      console.error(`[way-import] Failed to process CNPJ ${cnpjMasked}`, error);
      result.falhas.push({
        cnpjEc: cnpjMasked,
        motivo: error instanceof Error ? error.message : "Falha desconhecida",
      });
    }
  }

  console.log(
    `[way-import] Import finished. Imported: ${result.importados}, duplicates ignored: ${result.ignoradosDuplicados}, failures: ${result.falhas.length}`,
  );

  return result;
}
