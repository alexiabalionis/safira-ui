export enum AutomacaoTipoKey {
  automacao = "automacao",
  semi_automacao = "semi_automacao",
  manual = "manual",
}

export enum AutomacaoEtapaKey {
  aguardando = "aguardando",
  em_andamento = "em_andamento",
  bloqueado = "bloqueado",
  finalizado = "finalizado",
}

export const AUTOMACAO_TIPO_VALUES = Object.values(AutomacaoTipoKey);
export const AUTOMACAO_ETAPA_VALUES = Object.values(AutomacaoEtapaKey);

function normalizeToken(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizeAutomacaoTipoKey(
  value: string | null | undefined,
): AutomacaoTipoKey | null {
  if (!value) return null;

  const normalized = normalizeToken(value);
  if (!normalized) return null;

  if (normalized.includes("semi")) {
    return AutomacaoTipoKey.semi_automacao;
  }

  if (normalized.includes("manual")) {
    return AutomacaoTipoKey.manual;
  }

  if (normalized.includes("autom")) {
    return AutomacaoTipoKey.automacao;
  }

  return null;
}

export function normalizeAutomacaoEtapaKey(
  value: string | null | undefined,
): AutomacaoEtapaKey {
  const normalized = normalizeToken(value ?? "");

  if (!normalized) return AutomacaoEtapaKey.aguardando;

  if (
    normalized.includes("bloque") ||
    normalized.includes("imped") ||
    normalized.includes("trav")
  ) {
    return AutomacaoEtapaKey.bloqueado;
  }

  if (
    normalized.includes("final") ||
    normalized.includes("concl") ||
    normalized.includes("ativ")
  ) {
    return AutomacaoEtapaKey.finalizado;
  }

  if (
    normalized.includes("andamento") ||
    normalized.includes("homolog") ||
    normalized.includes("process") ||
    normalized.includes("inici")
  ) {
    return AutomacaoEtapaKey.em_andamento;
  }

  return AutomacaoEtapaKey.aguardando;
}
