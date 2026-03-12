import {
  AutomacaoEtapaKey,
  normalizeAutomacaoEtapaKey,
  normalizeAutomacaoTipoKey,
} from "@/services/automation";
import type { Posto } from "@/types/core.types";

type ImportPostoInput = Omit<Posto, "id">;

export type ParsePostosCsvResult = {
  rows: ImportPostoInput[];
  errors: string[];
};

const CNPJ_REGEX = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;

const defaultColumnMap = {
  cnpjEc: 0,
  razaoSocial: 1,
  nomeFantasia: 2,
  cidade: 3,
  uf: 4,
  redeNome: 5,
  erp: 6,
  responsavelPosto: 7,
  telefone: 8,
  email: 9,
  tipo: 10,
  etapa: 11,
  dataEtapa: 12,
  analistaResponsavel: 13,
  clienteCnpj: 14,
  clienteNome: 15,
} as const;

const aliases: Record<keyof typeof defaultColumnMap, string[]> = {
  cnpjEc: ["cnpjec", "cnpj", "cnpjposto", "documento"],
  razaoSocial: ["razaosocial", "razaosocialposto"],
  nomeFantasia: ["nomefantasia", "nomeposto"],
  cidade: ["cidade"],
  uf: ["uf", "estado"],
  redeNome: ["rede", "nomerede"],
  erp: ["erp"],
  responsavelPosto: ["responsavelposto", "responsavel"],
  telefone: ["telefone", "fone"],
  email: ["email"],
  tipo: ["tipo", "tipoautomacao"],
  etapa: ["etapa", "fase", "status", "situacao"],
  dataEtapa: ["dataetapa", "dtetapa"],
  analistaResponsavel: ["analistaresponsavel", "analista"],
  clienteCnpj: ["clientecnpj", "cnpjcliente", "cnpj"],
  clienteNome: ["clientenome", "nomecliente"],
};

function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

function chooseSeparator(firstLine: string) {
  const semicolonCount = (firstLine.match(/;/g) ?? []).length;
  const commaCount = (firstLine.match(/,/g) ?? []).length;
  return semicolonCount >= commaCount ? ";" : ",";
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

function parseDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T00:00:00`);
  }

  const slash = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slash) {
    const [, day, month, year] = slash;
    return new Date(`${year}-${month}-${day}T00:00:00`);
  }

  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function parseTipo(value: string): Posto["automacao"]["tipo"] | undefined {
  return normalizeAutomacaoTipoKey(value) ?? undefined;
}

function parseEtapa(value: string): AutomacaoEtapaKey {
  return normalizeAutomacaoEtapaKey(value);
}

function buildColumnMap(headers: string[]) {
  const normalized = headers.map(normalizeHeader);

  const resolved: Record<keyof typeof defaultColumnMap, number> = {
    ...defaultColumnMap,
  };
  let matched = 0;

  (Object.keys(aliases) as Array<keyof typeof aliases>).forEach((key) => {
    const foundIndex = normalized.findIndex((header) =>
      aliases[key].includes(header),
    );
    if (foundIndex >= 0) {
      resolved[key] = foundIndex;
      matched += 1;
    }
  });

  return {
    hasHeader: matched >= 6,
    map: resolved,
  };
}

export function parsePostosCsv(content: string): ParsePostosCsvResult {
  const normalizedContent = content.replace(/^\uFEFF/, "").trim();
  if (!normalizedContent) {
    return { rows: [], errors: ["Arquivo CSV vazio"] };
  }

  const lines = normalizedContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { rows: [], errors: ["Nenhuma linha valida encontrada"] };
  }

  const separator = chooseSeparator(lines[0]);
  const firstLineValues = splitCsvLine(lines[0], separator);
  const columnMapResult = buildColumnMap(firstLineValues);
  const startIndex = columnMapResult.hasHeader ? 1 : 0;

  const rows: ImportPostoInput[] = [];
  const errors: string[] = [];

  for (let lineIndex = startIndex; lineIndex < lines.length; lineIndex += 1) {
    const values = splitCsvLine(lines[lineIndex], separator);
    const lineNumber = lineIndex + 1;

    const razaoSocial = (values[columnMapResult.map.razaoSocial] ?? "").trim();
    const cnpjEc = (values[columnMapResult.map.cnpjEc] ?? "").trim();
    const nomeFantasia = (
      values[columnMapResult.map.nomeFantasia] ?? ""
    ).trim();
    const cidade = (values[columnMapResult.map.cidade] ?? "").trim();
    const uf = (values[columnMapResult.map.uf] ?? "SP").trim().toUpperCase();
    const redeNome = (values[columnMapResult.map.redeNome] ?? "")
      .trim()
      .toUpperCase();
    const erp = (values[columnMapResult.map.erp] ?? "").trim();
    const responsavelPosto = (
      values[columnMapResult.map.responsavelPosto] ?? ""
    ).trim();
    const telefone = (values[columnMapResult.map.telefone] ?? "").trim();
    const email = (values[columnMapResult.map.email] ?? "").trim();
    const tipoRaw = (values[columnMapResult.map.tipo] ?? "").trim();
    const etapaRaw = (values[columnMapResult.map.etapa] ?? "").trim();
    const dataEtapaRaw = (values[columnMapResult.map.dataEtapa] ?? "").trim();
    const analistaResponsavel = (
      values[columnMapResult.map.analistaResponsavel] ?? ""
    ).trim();
    const clienteCnpj = (values[columnMapResult.map.clienteCnpj] ?? "").trim();
    const clienteNome = (values[columnMapResult.map.clienteNome] ?? "").trim();

    if (!cnpjEc || !razaoSocial || !nomeFantasia || !cidade || !uf) {
      errors.push(
        `Linha ${lineNumber}: campos obrigatorios ausentes (cnpjEc, razaoSocial, nomeFantasia, cidade, uf)`,
      );
      continue;
    }

    const cnpjDigits = cnpjEc.replace(/\D/g, "");
    if (cnpjDigits.length !== 14) {
      errors.push(`Linha ${lineNumber}: CNPJ EC invalido (${cnpjEc})`);
      continue;
    }

    if (clienteCnpj && !CNPJ_REGEX.test(clienteCnpj)) {
      errors.push(
        `Linha ${lineNumber}: CNPJ de cliente invalido (${clienteCnpj})`,
      );
      continue;
    }

    const tipo = parseTipo(tipoRaw);
    if (tipoRaw && !tipo) {
      errors.push(
        `Linha ${lineNumber}: tipo de automacao invalido (${tipoRaw})`,
      );
      continue;
    }

    rows.push({
      cnpjEc,
      cnpjEcDigits: cnpjDigits,
      razaoSocial,
      nomeFantasia,
      cidade,
      uf,
      redeId: null,
      redeNome: redeNome || null,
      erp: erp || null,
      responsavelPosto,
      telefone,
      email,
      automacao: {
        tipo,
        etapa: parseEtapa(etapaRaw),
        dataEtapa: parseDate(dataEtapaRaw),
        analistaResponsavel: analistaResponsavel || undefined,
      },
      clientesQueAbastecem:
        clienteCnpj || clienteNome
          ? [
              {
                id: "",
                cnpj: clienteCnpj,
                razaoSocial: clienteNome || nomeFantasia,
                nomeFantasia: clienteNome || nomeFantasia,
              },
            ]
          : [],
    });
  }

  return { rows, errors };
}
