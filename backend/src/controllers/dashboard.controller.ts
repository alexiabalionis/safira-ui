import type { Request, Response } from "express";

import { ERPModel } from "../models/erp.model";
import { PostoModel } from "../models/posto.model";
import { RedeModel } from "../models/rede.model";

type DashboardStatus = "AGUARDANDO" | "EM_ANDAMENTO" | "FINALIZADO";

type StatusCounter = {
  total: number;
  aguardando: number;
  iniciadas: number;
  finalizadas: number;
};

type RedeCounter = StatusCounter & {
  id: string | null;
  nome: string;
};

type ErpCounter = StatusCounter & {
  nome: string;
};

type PostoDashboardRecord = {
  _id?: unknown;
  nomeFantasia?: string | null;
  redeId?: unknown;
  erp?: string | null;
  updatedAt?: Date | string | null;
  automacao?: {
    etapa?: string | null;
    dataEtapa?: Date | string | null;
  } | null;
};

function etapaToIntegrationStatus(etapa: DashboardStatus) {
  if (etapa === "FINALIZADO") return "Finalizado";
  if (etapa === "EM_ANDAMENTO") return "em_andamento";
  return "Aguardando";
}

function toIsoDate(value: Date | string | null | undefined) {
  if (!value) return new Date().toISOString();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime())
    ? new Date().toISOString()
    : date.toISOString();
}

function createCounter(): StatusCounter {
  return {
    total: 0,
    aguardando: 0,
    iniciadas: 0,
    finalizadas: 0,
  };
}

function normalizeEtapa(value: string | null | undefined): DashboardStatus {
  if (value === "FINALIZADO") return "FINALIZADO";
  if (value === "EM_ANDAMENTO") return "EM_ANDAMENTO";
  return "AGUARDANDO";
}

function applyStatus(counter: StatusCounter, etapa: DashboardStatus) {
  counter.total += 1;
  if (etapa === "FINALIZADO") {
    counter.finalizadas += 1;
    return;
  }

  if (etapa === "EM_ANDAMENTO") {
    counter.iniciadas += 1;
    return;
  }

  counter.aguardando += 1;
}

function parseRedeInfo(rawRede: unknown): { id: string | null; nome: string } {
  if (rawRede && typeof rawRede === "object") {
    const rede = rawRede as Record<string, unknown>;
    const id = rede._id ? String(rede._id) : null;
    const nome = rede.nome ? String(rede.nome) : "SEM REDE";
    return { id, nome };
  }

  return { id: null, nome: "SEM REDE" };
}

export async function getDashboardOverview(_req: Request, res: Response) {
  const [totalPostos, totalRedes, totalErps, redes, erps, postos] =
    await Promise.all([
      PostoModel.countDocuments(),
      RedeModel.countDocuments(),
      ERPModel.countDocuments(),
      RedeModel.find().select("_id nome").lean(),
      ERPModel.find().select("nome").lean(),
      PostoModel.find()
        .select(
          "_id nomeFantasia redeId erp updatedAt automacao.etapa automacao.dataEtapa",
        )
        .populate({ path: "redeId", select: "_id nome" })
        .lean(),
    ]);

  const integrationCounter = createCounter();

  const redesMap = new Map<string, RedeCounter>();
  const erpsMap = new Map<string, ErpCounter>();
  const integrations: Array<{
    id: string;
    nome: string;
    tipo: "Posto";
    status: "Aguardando" | "em_andamento" | "Finalizado";
    atualizadoEm: string;
  }> = [];

  for (const rede of redes) {
    const id = String((rede as Record<string, unknown>)._id ?? "");
    const nome = String((rede as Record<string, unknown>).nome ?? "SEM REDE");
    redesMap.set(id, {
      id,
      nome,
      ...createCounter(),
    });
  }

  for (const erp of erps) {
    const nome = String((erp as Record<string, unknown>).nome ?? "").trim();
    if (!nome) continue;

    erpsMap.set(nome, {
      nome,
      ...createCounter(),
    });
  }

  for (const posto of postos as PostoDashboardRecord[]) {
    const etapa = normalizeEtapa(posto.automacao?.etapa ?? null);
    applyStatus(integrationCounter, etapa);

    integrations.push({
      id: String(posto._id ?? ""),
      nome: posto.nomeFantasia?.trim() || "POSTO SEM NOME",
      tipo: "Posto",
      status: etapaToIntegrationStatus(etapa),
      atualizadoEm: toIsoDate(
        posto.automacao?.dataEtapa ?? posto.updatedAt ?? null,
      ),
    });

    const parsedRede = parseRedeInfo(posto.redeId);
    const redeKey = parsedRede.id ?? "__SEM_REDE__";

    const existingRede = redesMap.get(redeKey) ?? {
      id: parsedRede.id,
      nome: parsedRede.nome,
      ...createCounter(),
    };
    applyStatus(existingRede, etapa);
    redesMap.set(redeKey, existingRede);

    const erpNome = posto.erp?.trim() || "SEM ERP";
    const existingErp = erpsMap.get(erpNome) ?? {
      nome: erpNome,
      ...createCounter(),
    };
    applyStatus(existingErp, etapa);
    erpsMap.set(erpNome, existingErp);
  }

  const redesSummary = Array.from(redesMap.values()).sort((a, b) =>
    a.nome.localeCompare(b.nome),
  );

  const erpsSummary = Array.from(erpsMap.values()).sort((a, b) =>
    a.nome.localeCompare(b.nome),
  );

  return res.json({
    totals: {
      postos: totalPostos,
      redes: totalRedes,
      erps: totalErps,
    },
    integrationStatus: {
      total: integrationCounter.total,
      aguardando: {
        value: integrationCounter.aguardando,
        total: integrationCounter.total,
      },
      iniciadas: {
        value: integrationCounter.iniciadas,
        total: integrationCounter.total,
      },
      finalizadas: {
        value: integrationCounter.finalizadas,
        total: integrationCounter.total,
      },
    },
    integrations,
    redes: redesSummary,
    erps: erpsSummary,
  });
}
