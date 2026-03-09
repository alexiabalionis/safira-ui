import type { Request, Response } from "express";

import { ClienteModel } from "../models/cliente.model";
import {
  createClienteSchema,
  updateClienteSchema,
} from "../validators/cliente.schema";
import { ApiError } from "../utils/api-error";

function serializeCliente(doc: Record<string, unknown>) {
  const { _id, ...rest } = doc;
  return { id: String(_id), ...rest };
}

function getClienteIdParam(rawId: string | string[] | undefined) {
  if (typeof rawId !== "string") return null;
  const normalized = rawId.trim();
  return normalized.length > 0 ? normalized : null;
}

export async function listClientes(req: Request, res: Response) {
  const search =
    typeof req.query.search === "string" ? req.query.search.trim() : "";
  const postoCnpj =
    typeof req.query.postoCnpj === "string" ? req.query.postoCnpj.trim() : "";

  const filters: Record<string, unknown> = {};

  if (search) {
    filters.$or = [
      { razaoSocial: { $regex: search, $options: "i" } },
      { nomeFantasia: { $regex: search, $options: "i" } },
      { cnpj: { $regex: search, $options: "i" } },
    ];
  }

  if (postoCnpj) {
    const normalizedPostoCnpj = postoCnpj.replace(/\D/g, "");
    if (normalizedPostoCnpj.length === 14) {
      const masked = normalizedPostoCnpj.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        "$1.$2.$3/$4-$5",
      );
      filters["postosAbastece.cnpjEc"] = masked;
    }
  }

  const clientes = await ClienteModel.find(filters)
    .sort({ razaoSocial: 1 })
    .lean();
  return res.json(
    clientes.map((item) => serializeCliente(item as Record<string, unknown>)),
  );
}

export async function createCliente(req: Request, res: Response) {
  const payload = createClienteSchema.parse(req.body);
  const { id, ...rest } = payload;
  const cliente = await ClienteModel.create({
    ...rest,
    postosAbastece: rest.postosAbastece ?? [],
    _id: id,
  });

  return res
    .status(201)
    .json(serializeCliente(cliente.toObject() as Record<string, unknown>));
}

export async function getClienteById(req: Request, res: Response) {
  const id = getClienteIdParam(req.params.id);
  if (!id) {
    throw new ApiError(400, "Invalid cliente id");
  }
  const cliente = await ClienteModel.findById(id).lean();

  if (!cliente) {
    throw new ApiError(404, "Cliente not found");
  }

  return res.json(serializeCliente(cliente as Record<string, unknown>));
}

export async function updateCliente(req: Request, res: Response) {
  const id = getClienteIdParam(req.params.id);
  if (!id) {
    throw new ApiError(400, "Invalid cliente id");
  }
  const payload = updateClienteSchema.parse(req.body);

  const cliente = await ClienteModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).lean();

  if (!cliente) {
    throw new ApiError(404, "Cliente not found");
  }

  return res.json(serializeCliente(cliente as Record<string, unknown>));
}

export async function deleteCliente(req: Request, res: Response) {
  const id = getClienteIdParam(req.params.id);
  if (!id) {
    throw new ApiError(400, "Invalid cliente id");
  }
  const deleted = await ClienteModel.findByIdAndDelete(id).lean();

  if (!deleted) {
    throw new ApiError(404, "Cliente not found");
  }

  return res.status(204).send();
}
