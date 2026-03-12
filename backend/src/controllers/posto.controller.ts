import type { FilterQuery } from "mongoose";
import type { Request, Response } from "express";

import { ERPModel } from "../models/erp.model";
import {
  normalizeAutomacaoEtapaKey,
  normalizeAutomacaoTipoKey,
} from "../domain/automation";
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

type ListPostosQuery = ReturnType<typeof listPostosQuerySchema.parse>;

const POSTO_SORT_FIELDS = {
  nomeFantasia: "nomeFantasia",
  razaoSocial: "razaoSocial",
  cidade: "cidade",
  uf: "uf",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  dataEtapa: "automacao.dataEtapa",
  etapa: "automacao.etapa",
  responsavelPosto: "responsavelPosto",
  analistaResponsavel: "automacao.analistaResponsavel",
} as const;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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
    automacao:
      rest.automacao && typeof rest.automacao === "object"
        ? {
            ...(rest.automacao as Record<string, unknown>),
            tipo:
              normalizeAutomacaoTipoKey(
                (rest.automacao as Record<string, unknown>).tipo as
                  | string
                  | null
                  | undefined,
              ) ?? null,
            etapa: normalizeAutomacaoEtapaKey(
              (rest.automacao as Record<string, unknown>).etapa as
                | string
                | null
                | undefined,
            ),
          }
        : rest.automacao,
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

function buildPostosSort(query: ListPostosQuery) {
  const sortBy = query.sortBy ?? "nomeFantasia";
  const primaryField = POSTO_SORT_FIELDS[sortBy];
  const direction = query.sortOrder === "desc" ? -1 : 1;
  const sort: Record<string, 1 | -1> = {
    [primaryField]: direction,
  };

  if (primaryField !== POSTO_SORT_FIELDS.nomeFantasia) {
    sort.nomeFantasia = 1;
  }

  sort._id = 1;

  return sort;
}

export async function listPostos(req: Request, res: Response) {
  const query = listPostosQuerySchema.parse(req.query);
  const filters: FilterQuery<PostoRecord> = {};

  if (query.search) {
    const escapedSearch = escapeRegExp(query.search.trim());
    const digitsOnly = query.search.replace(/\D/g, "");
    filters.$or = [
      { razaoSocial: { $regex: escapedSearch, $options: "i" } },
      { nomeFantasia: { $regex: escapedSearch, $options: "i" } },
      { responsavelPosto: { $regex: escapedSearch, $options: "i" } },
      { cnpjEc: { $regex: escapedSearch, $options: "i" } },
      ...(digitsOnly
        ? [{ cnpjEcDigits: { $regex: escapeRegExp(digitsOnly) } }]
        : []),
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

  if (query.tipo) {
    filters["automacao.tipo"] = query.tipo;
  }

  if (query.etapa) {
    filters["automacao.etapa"] = query.etapa;
  }

  if (query.erp) {
    filters.erp = {
      $regex: `^${escapeRegExp(query.erp)}$`,
      $options: "i",
    };
  }

  if (query.startDate || query.endDate) {
    const dateFilters: Record<string, Date> = {};

    if (query.startDate) {
      dateFilters.$gte = new Date(query.startDate);
    }

    if (query.endDate) {
      dateFilters.$lte = new Date(query.endDate);
    }

    filters["automacao.dataEtapa"] = dateFilters;
  }

  const skip = (query.page - 1) * query.pageSize;
  const sort = buildPostosSort(query);

  const [items, total] = await Promise.all([
    PostoModel.find(filters)
      .sort(sort)
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
  const body = req.body as Record<string, unknown>;
  const payload = updatePostoSchema.parse({
    ...body,
    erpId: (body.erpId ?? body.erp_id) as unknown,
  });

  const { erpId: payloadErpId, ...restPayload } = payload;

  let erpUpdate:
    | {
        erpName: string | null;
        erpId: string | null;
      }
    | undefined;

  if (payloadErpId !== undefined) {
    if (payloadErpId === null) {
      erpUpdate = { erpName: null, erpId: null };
    } else {
      const selectedErp = await ERPModel.findById(payloadErpId)
        .select("_id nome")
        .lean();

      if (!selectedErp) {
        throw new ApiError(400, "ERP informado nao encontrado");
      }

      erpUpdate = {
        erpName: selectedErp.nome,
        erpId: String(selectedErp._id),
      };
    }
  } else if (restPayload.erp !== undefined) {
    erpUpdate =
      restPayload.erp === null
        ? { erpName: null, erpId: null }
        : await resolveOrCreateErp(restPayload.erp);
  }

  const posto = await PostoModel.findByIdAndUpdate(
    id,
    {
      ...restPayload,
      ...(erpUpdate === undefined
        ? {}
        : {
            erp: erpUpdate.erpName,
            erpId: erpUpdate.erpId,
          }),
      uf: restPayload.uf ? restPayload.uf.toUpperCase() : undefined,
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
