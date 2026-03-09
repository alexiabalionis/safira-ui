import type { Request, Response } from "express";

import { RedeModel } from "../models/rede.model";
import { objectIdSchema } from "../validators/common";
import { createRedeSchema, updateRedeSchema } from "../validators/rede.schema";
import { ApiError } from "../utils/api-error";

function serializeRede(doc: Record<string, unknown>) {
  const { _id, ...rest } = doc;
  return { id: String(_id), ...rest };
}

export async function listRedes(_req: Request, res: Response) {
  const redes = await RedeModel.find().sort({ nome: 1 }).lean();
  return res.json(
    redes.map((item) => serializeRede(item as Record<string, unknown>)),
  );
}

export async function createRede(req: Request, res: Response) {
  const payload = createRedeSchema.parse(req.body);
  const rede = await RedeModel.create(payload);

  return res
    .status(201)
    .json(serializeRede(rede.toObject() as Record<string, unknown>));
}

export async function getRedeById(req: Request, res: Response) {
  const id = objectIdSchema.parse(req.params.id);
  const rede = await RedeModel.findById(id).lean();

  if (!rede) {
    throw new ApiError(404, "Rede not found");
  }

  return res.json(serializeRede(rede as Record<string, unknown>));
}

export async function updateRede(req: Request, res: Response) {
  const id = objectIdSchema.parse(req.params.id);
  const payload = updateRedeSchema.parse(req.body);

  const rede = await RedeModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).lean();

  if (!rede) {
    throw new ApiError(404, "Rede not found");
  }

  return res.json(serializeRede(rede as Record<string, unknown>));
}

export async function deleteRede(req: Request, res: Response) {
  const id = objectIdSchema.parse(req.params.id);
  const deleted = await RedeModel.findByIdAndDelete(id).lean();

  if (!deleted) {
    throw new ApiError(404, "Rede not found");
  }

  return res.status(204).send();
}
