import type { FilterQuery } from "mongoose";
import type { Request, Response } from "express";

import { PostoModel } from "../models/posto.model";
import { resolveOrCreateErp } from "../services/erp-registry.service";
import { ApiError } from "../utils/api-error";
import { postoIdSchema } from "../validators/common";
import {
  createPostoSchema,
  listPostosQuerySchema,
  updatePostoSchema,
} from "../validators/posto.schema";

type PostoRecord = Record<string, unknown>;

function serializePosto(input: PostoRecord) {
  const { _id, clientesQueAbastecem, redeId, erpId, erp, ...rest } = input;

  const normalizedRede =
    redeId && typeof redeId === "object" && "_id" in (redeId as object)
      ? {
          id: String((redeId as Record<string, unknown>)._id),
          nome: String((redeId as Record<string, unknown>).nome ?? ""),
        }
      : redeId
        ? String(redeId)
        : null;

  const normalizedErp =
    erpId && typeof erpId === "object" && "_id" in (erpId as object)
      ? {
          id: String((erpId as Record<string, unknown>)._id),
          nome: String((erpId as Record<string, unknown>).nome ?? erp ?? ""),
        }
      : erpId
        ? {
            id: String(erpId),
            nome: typeof erp === "string" ? erp : "",
          }
        : null;

  return {
    id: String(_id),
    ...rest,
    erp: normalizedErp?.nome || (typeof erp === "string" ? erp : null),
    erpId: normalizedErp?.id ?? null,
    redeId:
      typeof normalizedRede === "object" && normalizedRede
        ? normalizedRede.id
        : typeof normalizedRede === "string"
          ? normalizedRede
          : null,
    rede: normalizedRede,
    clientesQueAbastecem: Array.isArray(clientesQueAbastecem)
      ? clientesQueAbastecem
      : [],
  };
}

export async function listPostos(req: Request, res: Response) {
  const query = listPostosQuerySchema.parse(req.query);
  const filters: FilterQuery<PostoRecord> = {};

  if (query.search) {
    filters.$or = [
      { razaoSocial: { $regex: query.search, $options: "i" } },
      { nomeFantasia: { $regex: query.search, $options: "i" } },
      { responsavelPosto: { $regex: query.search, $options: "i" } },
    ];
  }

  if (query.cidade) {
    filters.cidade = { $regex: query.cidade, $options: "i" };
  }

  if (query.uf) {
    filters.uf = query.uf.toUpperCase();
  }

  if (query.redeId) {
    filters.redeId = query.redeId;
  }

  const skip = (query.page - 1) * query.pageSize;

  const [items, total] = await Promise.all([
    PostoModel.find(filters)
      .sort({ nomeFantasia: 1 })
      .skip(skip)
      .limit(query.pageSize)
      .populate({ path: "redeId", select: "_id nome" })
      .populate({ path: "erpId", select: "_id nome" })
      .lean(),
    PostoModel.countDocuments(filters),
  ]);

  return res.json({
    data: items.map((item) => serializePosto(item as PostoRecord)),
    total,
    page: query.page,
    pageSize: query.pageSize,
  });
}

export async function createPosto(req: Request, res: Response) {
  const payload = createPostoSchema.parse(req.body);
  const { id, ...rest } = payload;

  const erpResolution = await resolveOrCreateErp(rest.erp);

  const posto = await PostoModel.create({
    ...rest,
    erp: erpResolution.erpName,
    erpId: erpResolution.erpId,
    _id: id,
    uf: rest.uf.toUpperCase(),
  });

  const created = await PostoModel.findById(posto._id)
    .populate({ path: "redeId", select: "_id nome" })
    .populate({ path: "erpId", select: "_id nome" })
    .lean();

  return res.status(201).json(serializePosto(created as PostoRecord));
}

export async function getPostoById(req: Request, res: Response) {
  const id = postoIdSchema.parse(req.params.id);
  const posto = await PostoModel.findById(id)
    .populate({ path: "redeId", select: "_id nome" })
    .populate({ path: "erpId", select: "_id nome" })
    .lean();

  if (!posto) {
    throw new ApiError(404, "Posto not found");
  }

  return res.json(serializePosto(posto as PostoRecord));
}

export async function updatePosto(req: Request, res: Response) {
  const id = postoIdSchema.parse(req.params.id);
  const payload = updatePostoSchema.parse(req.body);

  const erpUpdate =
    payload.erp === undefined
      ? undefined
      : payload.erp === null
        ? { erpName: null, erpId: null }
        : await resolveOrCreateErp(payload.erp);

  const posto = await PostoModel.findByIdAndUpdate(
    id,
    {
      ...payload,
      ...(erpUpdate === undefined
        ? {}
        : {
            erp: erpUpdate.erpName,
            erpId: erpUpdate.erpId,
          }),
      uf: payload.uf ? payload.uf.toUpperCase() : undefined,
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .populate({ path: "redeId", select: "_id nome" })
    .populate({ path: "erpId", select: "_id nome" })
    .lean();

  if (!posto) {
    throw new ApiError(404, "Posto not found");
  }

  return res.json(serializePosto(posto as PostoRecord));
}

export async function deletePosto(req: Request, res: Response) {
  const id = postoIdSchema.parse(req.params.id);
  const deleted = await PostoModel.findByIdAndDelete(id).lean();

  if (!deleted) {
    throw new ApiError(404, "Posto not found");
  }

  return res.status(204).send();
}
