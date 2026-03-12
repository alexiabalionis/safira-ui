import type { Request, Response } from "express";

import { ERPModel } from "../models/erp.model";
import { PostoModel } from "../models/posto.model";
import {
  canonicalizeErpName,
  normalizeErpKey,
} from "../services/erp-registry.service";
import { ApiError } from "../utils/api-error";
import { objectIdSchema } from "../validators/common";
import { createERPSchema, updateERPSchema } from "../validators/erp.schema";

function serializeERP(doc: Record<string, unknown>) {
  const { _id, ...rest } = doc;
  return { id: String(_id), ...rest };
}

async function findErpByNormalizedName(normalizedNome: string) {
  const erps = await ERPModel.find(
    {},
    { _id: 1, nome: 1, normalizedNome: 1 },
  ).lean();

  return (
    erps.find(
      (item) =>
        item.normalizedNome === normalizedNome ||
        normalizeErpKey(item.nome) === normalizedNome,
    ) ?? null
  );
}

export async function listERPs(_req: Request, res: Response) {
  const erps = await ERPModel.find().sort({ nome: 1, versao: -1 }).lean();
  return res.json(
    erps.map((item) => serializeERP(item as Record<string, unknown>)),
  );
}

export async function createERP(req: Request, res: Response) {
  const payload = createERPSchema.parse(req.body);
  const nome = canonicalizeErpName(payload.nome) ?? payload.nome;
  const normalizedNome = normalizeErpKey(nome);

  const duplicated = await findErpByNormalizedName(normalizedNome);
  if (duplicated) {
    throw new ApiError(409, "Ja existe ERP com nome equivalente");
  }

  const erp = await ERPModel.create({
    ...payload,
    nome,
    normalizedNome,
  });

  return res
    .status(201)
    .json(serializeERP(erp.toObject() as Record<string, unknown>));
}

export async function getERPById(req: Request, res: Response) {
  const id = objectIdSchema.parse(req.params.id);
  const erp = await ERPModel.findById(id).lean();

  if (!erp) {
    throw new ApiError(404, "ERP not found");
  }

  return res.json(serializeERP(erp as Record<string, unknown>));
}

export async function updateERP(req: Request, res: Response) {
  const id = objectIdSchema.parse(req.params.id);
  const payload = updateERPSchema.parse(req.body);

  const nome = payload.nome
    ? (canonicalizeErpName(payload.nome) ?? payload.nome)
    : undefined;

  if (nome) {
    const normalizedNome = normalizeErpKey(nome);
    const duplicated = await findErpByNormalizedName(normalizedNome);
    if (duplicated && String(duplicated._id) !== id) {
      throw new ApiError(409, "Ja existe ERP com nome equivalente");
    }
  }

  const updatePayload = {
    ...payload,
    ...(nome
      ? {
          nome,
          normalizedNome: normalizeErpKey(nome),
        }
      : {}),
  };

  const erp = await ERPModel.findByIdAndUpdate(id, updatePayload, {
    new: true,
    runValidators: true,
  }).lean();

  if (!erp) {
    throw new ApiError(404, "ERP not found");
  }

  if (nome) {
    await PostoModel.updateMany(
      {
        $or: [
          { erpId: id },
          {
            erp: {
              $regex: `^${nome.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
              $options: "i",
            },
          },
        ],
      },
      {
        $set: {
          erp: nome,
          erpId: id,
        },
      },
    );
  }

  return res.json(serializeERP(erp as Record<string, unknown>));
}

export async function deleteERP(req: Request, res: Response) {
  const id = objectIdSchema.parse(req.params.id);
  const deleted = await ERPModel.findByIdAndDelete(id).lean();

  if (!deleted) {
    throw new ApiError(404, "ERP not found");
  }

  return res.status(204).send();
}
