import { AutomacaoEtapaKey } from "@/services/automation";
import type { Posto } from "@/types/core.types";

const MONTH_TREND_POINTS = 6;

export const DEFAULT_WEEKLY_GOAL = 25;

export type LeanFlowMetrics = {
  totalFinished: number;
  finishedToday: number;
  finishedYesterday: number;
  finishedVariation: number | null;
  mtiDays: number;
  mtiTrend: Array<{ label: string; value: number }>;
  mtiVariation: number | null;
  throughput7d: number;
  throughputGoalRatio: number;
  throughputGoal: number;
  conversionRatio: number;
  conversionCreatedMonth: number;
  conversionFinishedMonth: number;
};

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

export function computeLeanFlowMetrics(
  postos: Posto[],
  weeklyGoal = DEFAULT_WEEKLY_GOAL,
): LeanFlowMetrics {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const finalizedWithDates = postos.filter((posto) => {
    if (posto.automacao.etapa !== AutomacaoEtapaKey.finalizado) return false;
    return Boolean(posto.createdAt && posto.automacao.dataEtapa);
  });

  const totalFinished = finalizedWithDates.length;

  const finishedToday = finalizedWithDates.filter((posto) =>
    isWithinDay(posto.automacao.dataEtapa, now),
  ).length;

  const finishedYesterday = finalizedWithDates.filter((posto) =>
    isWithinDay(posto.automacao.dataEtapa, yesterday),
  ).length;

  const finishedVariation =
    finishedYesterday > 0
      ? ((finishedToday - finishedYesterday) / finishedYesterday) * 100
      : null;

  const finalizedLast30d = finalizedWithDates.filter((posto) =>
    withinLastDays(posto.automacao.dataEtapa, now, 30),
  );

  const mtiDays = finalizedLast30d.length
    ? finalizedLast30d.reduce((acc, posto) => {
        const createdAt = posto.createdAt as Date;
        const finishedAt = posto.automacao.dataEtapa as Date;
        return acc + daysBetween(createdAt, finishedAt);
      }, 0) / finalizedLast30d.length
    : 0;

  const mtiTrend = Array.from({ length: MONTH_TREND_POINTS }, (_, index) => {
    const reference = new Date(
      now.getFullYear(),
      now.getMonth() - (MONTH_TREND_POINTS - 1 - index),
      1,
    );
    const monthKey = getMonthKey(reference);

    const monthlyRows = finalizedWithDates.filter((posto) => {
      const finishedAt = posto.automacao.dataEtapa;
      if (!finishedAt) return false;
      return getMonthKey(finishedAt) === monthKey;
    });

    const monthlyAvg = monthlyRows.length
      ? monthlyRows.reduce((acc, posto) => {
          const createdAt = posto.createdAt as Date;
          const finishedAt = posto.automacao.dataEtapa as Date;
          return acc + daysBetween(createdAt, finishedAt);
        }, 0) / monthlyRows.length
      : 0;

    return {
      label: reference.toLocaleDateString("pt-BR", { month: "short" }),
      value: monthlyAvg,
    };
  });

  const currentMonthMti = mtiTrend[mtiTrend.length - 1]?.value ?? 0;
  const previousMonthMti = mtiTrend[mtiTrend.length - 2]?.value ?? 0;
  const mtiVariation =
    previousMonthMti > 0
      ? ((currentMonthMti - previousMonthMti) / previousMonthMti) * 100
      : null;

  const throughput7d = finalizedWithDates.filter((posto) =>
    withinLastDays(posto.automacao.dataEtapa, now, 7),
  ).length;

  const createdThisMonth = postos.filter((posto) =>
    isWithinMonth(posto.createdAt, now),
  );

  const finishedThisMonth = createdThisMonth.filter(
    (posto) => posto.automacao.etapa === AutomacaoEtapaKey.finalizado,
  );

  const conversionRatio = createdThisMonth.length
    ? finishedThisMonth.length / createdThisMonth.length
    : 0;

  return {
    totalFinished,
    finishedToday,
    finishedYesterday,
    finishedVariation,
    mtiDays,
    mtiTrend,
    mtiVariation,
    throughput7d,
    throughputGoal: weeklyGoal,
    throughputGoalRatio:
      weeklyGoal > 0 ? Math.min(throughput7d / weeklyGoal, 1) : 0,
    conversionRatio,
    conversionCreatedMonth: createdThisMonth.length,
    conversionFinishedMonth: finishedThisMonth.length,
  };
}

/**
 * Calcula o MTI médio (em dias) por nome de ERP, baseado nos postos finalizados.
 */
export type CompletionPeriod = "day" | "week" | "month";

export type CompletionHistoryPoint = {
  label: string;
  count: number;
  avg: number;
};

export type OperatorRankingRow = {
  nome: string;
  finalizados: number;
  total: number;
};

export function computeCompletionHistory(
  postos: Posto[],
  period: CompletionPeriod,
): CompletionHistoryPoint[] {
  const now = new Date();

  if (period === "day") {
    const points = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      const start = dayStart(d);
      const end = dayEnd(d);
      const count = postos.filter((p) => {
        const dt = p.automacao.dataEtapa;
        if (!dt || p.automacao.etapa !== AutomacaoEtapaKey.finalizado)
          return false;
        return dt >= start && dt <= end;
      }).length;
      return {
        label: d.toLocaleDateString("pt-BR", {
          weekday: "short",
          day: "numeric",
        }),
        count,
        avg: 0,
      };
    });
    const total = points.reduce((s, p) => s + p.count, 0);
    const avg = total / points.length;
    return points.map((p) => ({ ...p, avg: Math.round(avg * 10) / 10 }));
  }

  if (period === "week") {
    const points = Array.from({ length: 4 }, (_, i) => {
      const weeksBack = 3 - i;
      const end = new Date(now);
      end.setDate(now.getDate() - weeksBack * 7);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      const count = postos.filter((p) => {
        const dt = p.automacao.dataEtapa;
        if (!dt || p.automacao.etapa !== AutomacaoEtapaKey.finalizado)
          return false;
        return dt >= dayStart(start) && dt <= dayEnd(end);
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
    const total = points.reduce((s, p) => s + p.count, 0);
    const avg = total / points.length;
    return points.map((p) => ({ ...p, avg: Math.round(avg * 10) / 10 }));
  }

  // month
  const points = Array.from({ length: 6 }, (_, i) => {
    const reference = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const count = postos.filter((p) => {
      const dt = p.automacao.dataEtapa;
      if (!dt || p.automacao.etapa !== AutomacaoEtapaKey.finalizado)
        return false;
      return isWithinMonth(dt, reference);
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
  const total = points.reduce((s, p) => s + p.count, 0);
  const avg = total / points.length;
  return points.map((p) => ({ ...p, avg: Math.round(avg * 10) / 10 }));
}

export function computeOperatorRanking(postos: Posto[]): OperatorRankingRow[] {
  const groups: Record<string, { finalizados: number; total: number }> = {};

  for (const posto of postos) {
    const nome =
      posto.automacao.analistaResponsavel?.trim() || "Sem Responsável";
    if (!groups[nome]) groups[nome] = { finalizados: 0, total: 0 };
    groups[nome].total += 1;
    if (posto.automacao.etapa === AutomacaoEtapaKey.finalizado) {
      groups[nome].finalizados += 1;
    }
  }

  return Object.entries(groups)
    .map(([nome, { finalizados, total }]) => ({ nome, finalizados, total }))
    .sort((a, b) => b.finalizados - a.finalizados);
}

export function computeMtiPerErp(postos: Posto[]): Record<string, number> {
  const groups: Record<string, { totalDays: number; count: number }> = {};

  for (const posto of postos) {
    if (posto.automacao.etapa !== AutomacaoEtapaKey.finalizado) continue;
    if (!posto.createdAt || !posto.automacao.dataEtapa) continue;

    const erpName = posto.erp?.trim() || "Sem ERP";
    if (!groups[erpName]) groups[erpName] = { totalDays: 0, count: 0 };

    const days = daysBetween(
      posto.createdAt as Date,
      posto.automacao.dataEtapa as Date,
    );
    groups[erpName].totalDays += days;
    groups[erpName].count += 1;
  }

  return Object.fromEntries(
    Object.entries(groups).map(([name, { totalDays, count }]) => [
      name,
      count > 0 ? totalDays / count : 0,
    ]),
  );
}
