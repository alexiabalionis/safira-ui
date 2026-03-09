import { connectDatabase, disconnectDatabase } from "../config/database";
import { ERPModel } from "../models/erp.model";
import { PostoModel } from "../models/posto.model";
import {
  canonicalizeErpName,
  normalizeErpKey,
  resolveOrCreateErp,
} from "../services/erp-registry.service";

async function normalizeErpCatalog() {
  const erps = await ERPModel.find().sort({ createdAt: 1 }).lean();
  const byKey = new Map<string, string>();

  let updated = 0;
  let removedDuplicates = 0;

  for (const erp of erps) {
    const canonicalName = canonicalizeErpName(erp.nome) ?? erp.nome;
    const normalizedNome = normalizeErpKey(canonicalName);

    const keptId = byKey.get(normalizedNome);
    if (keptId && keptId !== String(erp._id)) {
      await PostoModel.updateMany(
        { erpId: erp._id },
        { $set: { erpId: keptId, erp: canonicalName } },
      );
      await ERPModel.deleteOne({ _id: erp._id });
      removedDuplicates += 1;
      continue;
    }

    byKey.set(normalizedNome, String(erp._id));

    if (erp.nome !== canonicalName || erp.normalizedNome !== normalizedNome) {
      await ERPModel.updateOne(
        { _id: erp._id },
        { $set: { nome: canonicalName, normalizedNome } },
      );
      updated += 1;
    }
  }

  return { updated, removedDuplicates };
}

async function normalizePostos() {
  const postos = await PostoModel.find({}, { _id: 1, erp: 1, erpId: 1 }).lean();

  let updated = 0;

  for (const posto of postos) {
    if (!posto.erp && !posto.erpId) {
      continue;
    }

    const resolution = await resolveOrCreateErp(posto.erp ?? null);

    if (!resolution.erpId || !resolution.erpName) {
      if (posto.erp !== null || posto.erpId !== null) {
        await PostoModel.updateOne(
          { _id: posto._id },
          { $set: { erp: null, erpId: null } },
        );
        updated += 1;
      }
      continue;
    }

    if (
      posto.erp !== resolution.erpName ||
      String(posto.erpId ?? "") !== String(resolution.erpId)
    ) {
      await PostoModel.updateOne(
        { _id: posto._id },
        { $set: { erp: resolution.erpName, erpId: resolution.erpId } },
      );
      updated += 1;
    }
  }

  return { updated };
}

async function run() {
  await connectDatabase();

  try {
    const catalogResult = await normalizeErpCatalog();
    const postosResult = await normalizePostos();

    console.log("[erp-normalization] Done", {
      catalogUpdated: catalogResult.updated,
      catalogDuplicatesRemoved: catalogResult.removedDuplicates,
      postosUpdated: postosResult.updated,
    });
  } finally {
    await disconnectDatabase();
  }
}

run().catch((error) => {
  console.error("[erp-normalization] Failed", error);
  process.exit(1);
});
