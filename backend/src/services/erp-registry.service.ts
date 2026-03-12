import { ERPModel } from "../models/erp.model";

function removeDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function sanitizeErpDisplayName(value: string) {
  return value
    .replace(/\u00A0/g, " ")
    .replace(/[\t\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[.,;:]+$/g, "")
    .trim();
}

export function normalizeErpKey(value: string) {
  return removeDiacritics(value)
    .toLowerCase()
    .replace(/\u00A0/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function canonicalizeErpName(rawValue: string | null | undefined) {
  if (!rawValue) return null;

  const display = sanitizeErpDisplayName(rawValue);
  if (!display) return null;

  const key = normalizeErpKey(display);
  return display;
}

export async function resolveOrCreateErp(rawValue: string | null | undefined) {
  const canonicalName = canonicalizeErpName(rawValue);
  if (!canonicalName) {
    return { erpId: null, erpName: null };
  }

  const normalizedNome = normalizeErpKey(canonicalName);

  const existingErps = await ERPModel.find({
    $or: [{ normalizedNome }, { nome: canonicalName }],
  })
    .sort({ createdAt: 1 })
    .lean();

  const existing =
    existingErps.find(
      (item) => normalizeErpKey(item.nome) === normalizedNome,
    ) ?? existingErps[0];

  if (existing) {
    if (
      existing.nome !== canonicalName ||
      existing.normalizedNome !== normalizedNome
    ) {
      await ERPModel.updateOne(
        { _id: existing._id },
        { $set: { nome: canonicalName, normalizedNome } },
      );
    }

    return {
      erpId: String(existing._id),
      erpName: canonicalName,
    };
  }

  const created = await ERPModel.create({
    nome: canonicalName,
    normalizedNome,
    versao: "N/A",
    status: "Aguardando",
  });

  return {
    erpId: String(created._id),
    erpName: canonicalName,
  };
}
