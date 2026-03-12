import type { FilterQuery } from "mongoose";
import type { Request, Response } from "express";
import { z } from "zod";

import { ERPModel } from "../models/erp.model";
import {
  AUTOMACAO_ETAPA_VALUES,
  AUTOMACAO_TIPO_VALUES,
  AutomacaoEtapaKey,
  normalizeAutomacaoEtapaKey,
} from "../domain/automation";
import { PostoModel } from "../models/posto.model";
import { RedeModel } from "../models/rede.model";
import { type UserRole, UserModel } from "../models/user.model";
import { ApiError } from "../utils/api-error";

type DashboardStatus = AutomacaoEtapaKey;

type StatusCounter = {
  total: number;
  aguardando: number;
  iniciadas: number;
  finalizadas: number;
  bloqueados: number;
};

type RedeCounter = StatusCounter & {
  id: string | null;
  nome: string;
};

type ErpCounter = StatusCounter & {
  nome: string;
};

type ErpFinishedSummary = {
  nome: string;
  total: number;
};

type PostoDashboardRecord = {
  _id?: unknown;
  nomeFantasia?: string | null;
  razaoSocial?: string | null;
  cnpjEc?: string | null;
  cidade?: string | null;
  uf?: string | null;
  redeId?: unknown;
  erpId?: unknown;
  erp?: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  automacao?: {
    tipo?: string | null;
    etapa?: string | null;
    dataEtapa?: Date | string | null;
    analistaResponsavel?: string | null;
  } | null;
};

type DashboardTrendPoint = {
  label: string;
  value: number;
};

type DashboardCompletionHistoryPoint = {
  label: string;
  count: number;
  avg: number;
};

type DashboardOperatorRankingRow = {
  nome: string;
  finalizados: number;
  total: number;
};

type DashboardLeanFlowPosto = {
  etapa: DashboardStatus;
  createdAt: Date | null;
  updatedAt: Date | null;
  dataEtapa: Date | null;
  erpNome: string;
  analistaResponsavel: string | null;
};

const MONTH_TREND_POINTS = 6;
const DASHBOARD_WEEKLY_GOAL = 25;

type ReportCategory = "Posto" | "Rede" | "ERP" | "Usuário";

type ReportFilters = {
  search?: string;
  startDate?: string;
  endDate?: string;
  category?: ReportCategory;
  tipo?: string;
  erp?: string;
  erpStatus?: "Aguardando" | "em_andamento" | "Bloqueado" | "Finalizado";
  redeId?: string;
  etapa?: AutomacaoEtapaKey;
  userRole?: UserRole;
  userStatus?: "ativo" | "inativo";
  passwordState?: "PENDENTE" | "CONCLUIDA";
};

type ReportQueryParams = ReportFilters & {
  page: number;
  pageSize: number;
};

type ReportRow = {
  id: string;
  categoria: ReportCategory;
  nome: string;
  referencia: string;
  status: "Aguardando" | "em_andamento" | "Bloqueado" | "Finalizado";
  atualizadoEm: string;
  cnpjEc?: string;
  cidade?: string;
  uf?: string;
  rede?: string;
  erp?: string;
  tipoAutomacao?: string;
  statusAutomacao?: string;
  perfilUsuario?: UserRole;
  usuarioAtivo?: boolean;
  trocaSenhaPendente?: boolean;
};

type AuthLocals = {
  userId: string;
  email: string;
  nome: string;
  role: UserRole;
  forcePasswordChange: boolean;
};

const reportQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(1000).default(30),
  search: z.string().trim().optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  category: z.enum(["Posto", "Rede", "ERP", "Usuário"]).optional(),
  tipo: z.enum(AUTOMACAO_TIPO_VALUES as [string, ...string[]]).optional(),
  erp: z.string().trim().optional(),
  erpStatus: z
    .enum(["Aguardando", "em_andamento", "Bloqueado", "Finalizado"])
    .optional(),
  redeId: z.string().trim().optional(),
  etapa: z.enum(AUTOMACAO_ETAPA_VALUES as [string, ...string[]]).optional(),
  userRole: z.enum(["admin", "operador", "visitante"]).optional(),
  userStatus: z.enum(["ativo", "inativo"]).optional(),
  passwordState: z.enum(["PENDENTE", "CONCLUIDA"]).optional(),
});

function etapaToIntegrationStatus(etapa: DashboardStatus) {
  if (etapa === AutomacaoEtapaKey.finalizado) return "Finalizado";
  if (etapa === AutomacaoEtapaKey.bloqueado) return "Bloqueado";
  if (etapa === AutomacaoEtapaKey.em_andamento) return "em_andamento";
  return "Aguardando";
}

function toIsoDate(value: Date | string | null | undefined) {
  if (!value) return new Date().toISOString();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime())
    ? new Date().toISOString()
    : date.toISOString();
}

function toDate(value: string | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseDateValue(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(start: Date, end: Date) {
  const diffMs = end.getTime() - start.getTime();
  if (Number.isNaN(diffMs) || diffMs <= 0) return 0;
  return diffMs / (1000 * 60 * 60 * 24);
}

function withinLastDays(
  date: Date | null | undefined,
  now: Date,
  days: number,
) {
  if (!date || Number.isNaN(date.getTime())) return false;
  const diff = now.getTime() - date.getTime();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthEnd(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function dayStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayEnd(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

function isWithinDay(value: Date | null | undefined, reference: Date) {
  if (!value || Number.isNaN(value.getTime())) return false;
  return value >= dayStart(reference) && value <= dayEnd(reference);
}

function isWithinMonth(value: Date | null | undefined, reference: Date) {
  if (!value || Number.isNaN(value.getTime())) return false;
  return value >= monthStart(reference) && value <= monthEnd(reference);
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function createCounter(): StatusCounter {
  return {
    total: 0,
    aguardando: 0,
    iniciadas: 0,
    finalizadas: 0,
    bloqueados: 0,
  };
}

function normalizeEtapa(value: string | null | undefined): DashboardStatus {
  return normalizeAutomacaoEtapaKey(value);
}

function tipoLegacyAliases(value: string) {
  if (value === "automacao") return ["automacao", "AUTOMAÇÃO"];
  if (value === "semi_automacao") return ["semi_automacao", "SEMI-AUTOMAÇÃO"];
  if (value === "manual") return ["manual", "MANUAL"];
  return [value];
}

function etapaLegacyAliases(value: AutomacaoEtapaKey) {
  if (value === AutomacaoEtapaKey.em_andamento) {
    return [value, "EM_ANDAMENTO"];
  }
  if (value === AutomacaoEtapaKey.finalizado) {
    return [value, "FINALIZADO"];
  }
  if (value === AutomacaoEtapaKey.bloqueado) {
    return [value, "BLOQUEADO"];
  }
  return [value, "AGUARDANDO"];
}

function applyStatus(counter: StatusCounter, etapa: DashboardStatus) {
  counter.total += 1;
  if (etapa === AutomacaoEtapaKey.finalizado) {
    counter.finalizadas += 1;
    return;
  }

  if (etapa === AutomacaoEtapaKey.bloqueado) {
    counter.bloqueados += 1;
    return;
  }

  if (etapa === AutomacaoEtapaKey.em_andamento) {
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

function parseErpName(
  rawErpId: unknown,
  rawErpFallback: string | null | undefined,
) {
  if (rawErpId && typeof rawErpId === "object") {
    const erpObj = rawErpId as Record<string, unknown>;
    const nome = typeof erpObj.nome === "string" ? erpObj.nome.trim() : "";
    if (nome) return nome;
  }

  const fallback = rawErpFallback?.trim() ?? "";
  return fallback || "SEM ERP";
}

function buildCompletionHistory(
  postos: DashboardLeanFlowPosto[],
  period: "day" | "week" | "month",
): DashboardCompletionHistoryPoint[] {
  const now = new Date();

  if (period === "day") {
    const points = Array.from({ length: 7 }, (_, index) => {
      const reference = new Date(now);
      reference.setDate(now.getDate() - (6 - index));
      const start = dayStart(reference);
      const end = dayEnd(reference);
      const count = postos.filter((posto) => {
        if (posto.etapa !== AutomacaoEtapaKey.finalizado || !posto.dataEtapa) {
          return false;
        }

        return posto.dataEtapa >= start && posto.dataEtapa <= end;
      }).length;

      return {
        label: reference.toLocaleDateString("pt-BR", {
          weekday: "short",
          day: "numeric",
        }),
        count,
        avg: 0,
      };
    });

    const total = points.reduce((sum, point) => sum + point.count, 0);
    const avg = total / points.length;
    return points.map((point) => ({
      ...point,
      avg: Math.round(avg * 10) / 10,
    }));
  }

  if (period === "week") {
    const points = Array.from({ length: 4 }, (_, index) => {
      const weeksBack = 3 - index;
      const end = new Date(now);
      end.setDate(now.getDate() - weeksBack * 7);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);

      const count = postos.filter((posto) => {
        if (posto.etapa !== AutomacaoEtapaKey.finalizado || !posto.dataEtapa) {
          return false;
        }

        return (
          posto.dataEtapa >= dayStart(start) && posto.dataEtapa <= dayEnd(end)
        );
      }).length;

      const weekNum = Math.ceil(
        (end.getDate() +
          new Date(end.getFullYear(), end.getMonth(), 1).getDay()) /
          7,
      );

      return {
        label: `Sem ${weekNum}/${String(end.getMonth() + 1).padStart(2, "0")}`,
        count,
        avg: 0,
      };
    });

    const total = points.reduce((sum, point) => sum + point.count, 0);
    const avg = total / points.length;
    return points.map((point) => ({
      ...point,
      avg: Math.round(avg * 10) / 10,
    }));
  }

  const points = Array.from({ length: 6 }, (_, index) => {
    const reference = new Date(
      now.getFullYear(),
      now.getMonth() - (5 - index),
      1,
    );
    const count = postos.filter((posto) => {
      if (posto.etapa !== AutomacaoEtapaKey.finalizado || !posto.dataEtapa) {
        return false;
      }

      return isWithinMonth(posto.dataEtapa, reference);
    }).length;

    return {
      label: reference.toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      }),
      count,
      avg: 0,
    };
  });

  const total = points.reduce((sum, point) => sum + point.count, 0);
  const avg = total / points.length;
  return points.map((point) => ({
    ...point,
    avg: Math.round(avg * 10) / 10,
  }));
}

function buildLeanFlowSummary(postos: DashboardLeanFlowPosto[]) {
  const now = new Date();

  const finalizedWithDates = postos.filter(
    (posto) =>
      posto.etapa === AutomacaoEtapaKey.finalizado &&
      Boolean(posto.createdAt && posto.dataEtapa),
  );

  const finalizedLast30d = finalizedWithDates.filter((posto) =>
    withinLastDays(posto.dataEtapa, now, 30),
  );

  const mtiDays = finalizedLast30d.length
    ? finalizedLast30d.reduce((accumulator, posto) => {
        return (
          accumulator +
          daysBetween(posto.createdAt as Date, posto.dataEtapa as Date)
        );
      }, 0) / finalizedLast30d.length
    : 0;

  const mtiTrend: DashboardTrendPoint[] = Array.from(
    { length: MONTH_TREND_POINTS },
    (_, index) => {
      const reference = new Date(
        now.getFullYear(),
        now.getMonth() - (MONTH_TREND_POINTS - 1 - index),
        1,
      );
      const monthKey = getMonthKey(reference);

      const monthlyRows = finalizedWithDates.filter((posto) => {
        if (!posto.dataEtapa) return false;
        return getMonthKey(posto.dataEtapa) === monthKey;
      });

      const monthlyAvg = monthlyRows.length
        ? monthlyRows.reduce((accumulator, posto) => {
            return (
              accumulator +
              daysBetween(posto.createdAt as Date, posto.dataEtapa as Date)
            );
          }, 0) / monthlyRows.length
        : 0;

      return {
        label: reference.toLocaleDateString("pt-BR", { month: "short" }),
        value: monthlyAvg,
      };
    },
  );

  const currentMonthMti = mtiTrend[mtiTrend.length - 1]?.value ?? 0;
  const previousMonthMti = mtiTrend[mtiTrend.length - 2]?.value ?? 0;
  const mtiVariation =
    previousMonthMti > 0
      ? ((currentMonthMti - previousMonthMti) / previousMonthMti) * 100
      : null;

  const throughput7d = finalizedWithDates.filter((posto) =>
    withinLastDays(posto.dataEtapa, now, 7),
  ).length;

  const throughputGoalRatio =
    DASHBOARD_WEEKLY_GOAL > 0
      ? Math.min(throughput7d / DASHBOARD_WEEKLY_GOAL, 1)
      : 0;

  const operatorGroups: Record<string, { finalizados: number; total: number }> =
    {};
  for (const posto of postos) {
    const nome = posto.analistaResponsavel?.trim() || "Sem Responsável";
    if (!operatorGroups[nome]) {
      operatorGroups[nome] = { finalizados: 0, total: 0 };
    }

    operatorGroups[nome].total += 1;
    if (posto.etapa === AutomacaoEtapaKey.finalizado) {
      operatorGroups[nome].finalizados += 1;
    }
  }

  const operatorRanking: DashboardOperatorRankingRow[] = Object.entries(
    operatorGroups,
  )
    .map(([nome, totals]) => ({
      nome,
      finalizados: totals.finalizados,
      total: totals.total,
    }))
    .sort((left, right) => right.finalizados - left.finalizados);

  const mtiPerErpGroups: Record<string, { totalDays: number; count: number }> =
    {};
  for (const posto of postos) {
    if (
      posto.etapa !== AutomacaoEtapaKey.finalizado ||
      !posto.createdAt ||
      !posto.dataEtapa
    ) {
      continue;
    }

    const erpTotals = mtiPerErpGroups[posto.erpNome] ?? {
      totalDays: 0,
      count: 0,
    };
    mtiPerErpGroups[posto.erpNome] = erpTotals;

    erpTotals.totalDays += daysBetween(posto.createdAt, posto.dataEtapa);
    erpTotals.count += 1;
  }

  const mtiPerErp = Object.fromEntries(
    Object.entries(mtiPerErpGroups).map(([name, totals]) => [
      name,
      totals.count > 0 ? totals.totalDays / totals.count : 0,
    ]),
  );

  return {
    mtiDays,
    mtiTrend,
    mtiVariation,
    throughput7d,
    throughputGoal: DASHBOARD_WEEKLY_GOAL,
    throughputGoalRatio,
    completionHistory: {
      day: buildCompletionHistory(postos, "day"),
      week: buildCompletionHistory(postos, "week"),
      month: buildCompletionHistory(postos, "month"),
    },
    operatorRanking,
    mtiPerErp,
  };
}

function buildPostoFilters(
  filters: ReportFilters,
): FilterQuery<PostoDashboardRecord> {
  const query: FilterQuery<PostoDashboardRecord> = {};

  if (filters.search) {
    query.$or = [
      { razaoSocial: { $regex: filters.search, $options: "i" } },
      { nomeFantasia: { $regex: filters.search, $options: "i" } },
      { cnpjEc: { $regex: filters.search, $options: "i" } },
    ];
  }

  if (filters.redeId) {
    query.redeId = filters.redeId;
  }

  if (filters.tipo) {
    query["automacao.tipo"] = { $in: tipoLegacyAliases(filters.tipo) };
  }

  if (filters.etapa) {
    query["automacao.etapa"] = { $in: etapaLegacyAliases(filters.etapa) };
  }

  const start = toDate(filters.startDate);
  const end = toDate(filters.endDate);
  if (start || end) {
    query["automacao.dataEtapa"] = {
      ...(start ? { $gte: start } : {}),
      ...(end ? { $lte: end } : {}),
    };
  }

  return query;
}

async function listReportRows(
  filters: ReportFilters,
  canReadUsers: boolean,
): Promise<ReportRow[]> {
  const includePostos = !filters.category || filters.category === "Posto";
  const includeRedes = !filters.category || filters.category === "Rede";
  const includeErps = !filters.category || filters.category === "ERP";
  const includeUsers =
    canReadUsers && (!filters.category || filters.category === "Usuário");

  if (filters.category === "Usuário" && !canReadUsers) {
    throw new ApiError(403, "Acesso negado para relatórios de usuários");
  }

  const [postosRaw, redesRaw, erpsRaw, usersRaw] = await Promise.all([
    includePostos
      ? PostoModel.find(buildPostoFilters(filters))
          .select(
            "_id nomeFantasia razaoSocial cnpjEc cidade uf redeId erp erpId automacao createdAt updatedAt",
          )
          .populate({ path: "redeId", select: "_id nome" })
          .populate({ path: "erpId", select: "_id nome" })
          .lean()
      : Promise.resolve([]),
    includeRedes
      ? RedeModel.find({
          ...(filters.redeId ? { _id: filters.redeId } : {}),
          ...(filters.search
            ? { nome: { $regex: filters.search, $options: "i" } }
            : {}),
          ...(filters.startDate || filters.endDate
            ? {
                updatedAt: {
                  ...(toDate(filters.startDate)
                    ? { $gte: toDate(filters.startDate) }
                    : {}),
                  ...(toDate(filters.endDate)
                    ? { $lte: toDate(filters.endDate) }
                    : {}),
                },
              }
            : {}),
        })
          .select("_id nome updatedAt")
          .lean()
      : Promise.resolve([]),
    includeErps
      ? ERPModel.find({
          ...(filters.erp ? { nome: filters.erp } : {}),
          ...(filters.erpStatus ? { status: filters.erpStatus } : {}),
          ...(filters.search
            ? {
                $or: [
                  { nome: { $regex: filters.search, $options: "i" } },
                  { versao: { $regex: filters.search, $options: "i" } },
                ],
              }
            : {}),
          ...(filters.startDate || filters.endDate
            ? {
                updatedAt: {
                  ...(toDate(filters.startDate)
                    ? { $gte: toDate(filters.startDate) }
                    : {}),
                  ...(toDate(filters.endDate)
                    ? { $lte: toDate(filters.endDate) }
                    : {}),
                },
              }
            : {}),
        })
          .select("_id nome versao status updatedAt")
          .lean()
      : Promise.resolve([]),
    includeUsers
      ? UserModel.find({
          ...(filters.userRole ? { role: filters.userRole } : {}),
          ...(filters.userStatus
            ? { ativo: filters.userStatus === "ativo" }
            : {}),
          ...(filters.passwordState
            ? { forcePasswordChange: filters.passwordState === "PENDENTE" }
            : {}),
          ...(filters.search
            ? {
                $or: [
                  { nome: { $regex: filters.search, $options: "i" } },
                  { email: { $regex: filters.search, $options: "i" } },
                ],
              }
            : {}),
          ...(filters.startDate || filters.endDate
            ? {
                updatedAt: {
                  ...(toDate(filters.startDate)
                    ? { $gte: toDate(filters.startDate) }
                    : {}),
                  ...(toDate(filters.endDate)
                    ? { $lte: toDate(filters.endDate) }
                    : {}),
                },
              }
            : {}),
        })
          .select("_id nome email role ativo forcePasswordChange updatedAt")
          .lean()
      : Promise.resolve([]),
  ]);

  const postos = (postosRaw as PostoDashboardRecord[])
    .map((posto) => {
      const rede = parseRedeInfo(posto.redeId);
      const erpNome = parseErpName(posto.erpId, posto.erp);
      return {
        id: String(posto._id ?? ""),
        categoria: "Posto" as const,
        nome: posto.nomeFantasia?.trim() || "POSTO SEM NOME",
        referencia: posto.razaoSocial?.trim() || "",
        cnpjEc: posto.cnpjEc?.trim() || "",
        cidade: posto.cidade?.trim() || "",
        uf: posto.uf?.trim() || "",
        rede: rede.nome,
        erp: erpNome,
        tipoAutomacao: posto.automacao?.tipo ?? "",
        statusAutomacao: posto.automacao?.etapa ?? "",
        status: etapaToIntegrationStatus(
          normalizeEtapa(posto.automacao?.etapa ?? null),
        ),
        atualizadoEm: toIsoDate(
          posto.automacao?.dataEtapa ?? posto.updatedAt ?? posto.createdAt,
        ),
      } satisfies ReportRow;
    })
    .filter((row) => !filters.erp || row.erp === filters.erp);

  const redes = (redesRaw as Array<Record<string, unknown>>).map((rede) => ({
    id: String(rede._id ?? ""),
    categoria: "Rede" as const,
    nome: String(rede.nome ?? "SEM REDE"),
    referencia: "-",
    status: "Finalizado" as const,
    atualizadoEm: toIsoDate(rede.updatedAt as Date | string | null),
  }));

  const erps = (erpsRaw as Array<Record<string, unknown>>).map((erp) => ({
    id: String(erp._id ?? ""),
    categoria: "ERP" as const,
    nome: String(erp.nome ?? "SEM ERP"),
    referencia: String(erp.versao ?? ""),
    status:
      (erp.status as
        | "Aguardando"
        | "em_andamento"
        | "Bloqueado"
        | "Finalizado") ?? "Aguardando",
    atualizadoEm: toIsoDate(erp.updatedAt as Date | string | null),
  }));

  const users = (usersRaw as Array<Record<string, unknown>>).map((user) => ({
    id: String(user._id ?? ""),
    categoria: "Usuário" as const,
    nome: String(user.nome ?? ""),
    referencia: String(user.email ?? ""),
    status: Boolean(user.ativo)
      ? ("Finalizado" as const)
      : ("Aguardando" as const),
    atualizadoEm: toIsoDate(user.updatedAt as Date | string | null),
    perfilUsuario: (user.role as UserRole) ?? "visitante",
    usuarioAtivo: Boolean(user.ativo),
    trocaSenhaPendente: Boolean(user.forcePasswordChange),
  }));

  return [...postos, ...redes, ...erps, ...users].sort((a, b) =>
    b.atualizadoEm.localeCompare(a.atualizadoEm),
  );
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
          "_id nomeFantasia redeId erp erpId createdAt updatedAt automacao.etapa automacao.dataEtapa automacao.analistaResponsavel",
        )
        .populate({ path: "redeId", select: "_id nome" })
        .populate({ path: "erpId", select: "_id nome" })
        .lean(),
    ]);

  const integrationCounter = createCounter();

  const redesMap = new Map<string, RedeCounter>();
  const erpsMap = new Map<string, ErpCounter>();
  const integrations: Array<{
    id: string;
    nome: string;
    tipo: "Posto";
    status: "Aguardando" | "em_andamento" | "Bloqueado" | "Finalizado";
    atualizadoEm: string;
  }> = [];
  const leanFlowPostos: DashboardLeanFlowPosto[] = [];

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
    const updatedAt = parseDateValue(posto.updatedAt);
    const createdAt = parseDateValue(posto.createdAt);
    const dataEtapa = parseDateValue(posto.automacao?.dataEtapa);
    const erpNome = parseErpName(posto.erpId, posto.erp);
    applyStatus(integrationCounter, etapa);

    integrations.push({
      id: String(posto._id ?? ""),
      nome: posto.nomeFantasia?.trim() || "POSTO SEM NOME",
      tipo: "Posto",
      status: etapaToIntegrationStatus(etapa),
      atualizadoEm: toIsoDate(dataEtapa ?? updatedAt ?? null),
    });

    leanFlowPostos.push({
      etapa,
      createdAt,
      updatedAt,
      dataEtapa,
      erpNome,
      analistaResponsavel: posto.automacao?.analistaResponsavel?.trim() || null,
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

  const erpsFinalizados = erpsSummary
    .filter((erp) => erp.finalizadas > 0)
    .map<ErpFinishedSummary>((erp) => ({
      nome: erp.nome,
      total: erp.finalizadas,
    }))
    .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome));

  const leanFlow = buildLeanFlowSummary(leanFlowPostos);

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
      bloqueados: {
        value: integrationCounter.bloqueados,
        total: integrationCounter.total,
      },
    },
    integrations,
    redes: redesSummary,
    erps: erpsSummary,
    erpsFinalizados,
    leanFlow,
  });
}

export async function listDashboardReports(req: Request, res: Response) {
  const query = reportQuerySchema.parse(req.query) as ReportQueryParams;
  const auth = res.locals.auth as AuthLocals;
  const rows = await listReportRows(query, auth.role === "admin");

  const start = (query.page - 1) * query.pageSize;
  return res.json({
    data: rows.slice(start, start + query.pageSize),
    total: rows.length,
    page: query.page,
    pageSize: query.pageSize,
  });
}

export async function exportDashboardReports(req: Request, res: Response) {
  const query = reportQuerySchema.parse(req.query) as ReportQueryParams;
  const auth = res.locals.auth as AuthLocals;
  const rows = await listReportRows(query, auth.role === "admin");
  return res.json({ data: rows, total: rows.length });
}
