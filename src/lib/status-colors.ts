export type SemanticStatusKind = "pending" | "in-progress" | "completed";

export function normalizeStatusKind(status: string): SemanticStatusKind {
  const normalized = status
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

  if (normalized === "CONCLUIDO" || normalized === "FINALIZADO") {
    return "completed";
  }

  if (normalized === "INICIADO" || normalized === "EM_ANDAMENTO") {
    return "in-progress";
  }

  return "pending";
}

export function getStatusPalette(status: string) {
  const normalized = status
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

  if (normalized === "BLOQUEADO") {
    return {
      lightBg: "#FDECEC",
      text: "#C92A2A",
      border: "#F8C9C9",
      solid: "#E03131",
    };
  }

  const kind = normalizeStatusKind(status);

  if (kind === "completed") {
    return {
      lightBg: "#E8F5E9",
      text: "#2E7D32",
      border: "#CDE9D0",
      solid: "#01B075",
    };
  }

  if (kind === "in-progress") {
    return {
      lightBg: "#E8F1FF",
      text: "#1D4ED8",
      border: "#CFE0FF",
      solid: "#3B82F6",
    };
  }

  return {
    lightBg: "#FFF4E5",
    text: "#B45309",
    border: "#F8DEBE",
    solid: "#F59E0B",
  };
}
