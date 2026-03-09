import type { IntegrationItem } from "@/services/types";
import {
  ActionStatusFilter,
  NetworkFocusFilter,
  NetworkVolumeFilter,
  SLA_DELAY_DAYS,
  SlaFilter,
} from "@/services/dashboard-constants";

type NetworkRowBase = {
  nome: string;
  total: number;
  aguardando: number;
  iniciadas: number;
  finalizadas: number;
};

export function getIntegrationDelayDays(item: IntegrationItem) {
  const updatedAt = new Date(item.atualizadoEm);
  if (Number.isNaN(updatedAt.getTime())) return 0;

  const diffMs = Date.now() - updatedAt.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function isDelayedIntegration(item: IntegrationItem) {
  return getIntegrationDelayDays(item) > SLA_DELAY_DAYS;
}

export function getPrioritizedIntegrations(items: IntegrationItem[]) {
  const critical = items.filter(
    (item) => item.status === "Aguardando" || item.status === "em_andamento",
  );

  const statusWeight: Record<"Aguardando" | "em_andamento", number> = {
    Aguardando: 0,
    em_andamento: 1,
  };

  return critical.sort((left, right) => {
    const leftStatus = left.status as "Aguardando" | "em_andamento";
    const rightStatus = right.status as "Aguardando" | "em_andamento";

    if (statusWeight[leftStatus] !== statusWeight[rightStatus]) {
      return statusWeight[leftStatus] - statusWeight[rightStatus];
    }

    const leftDays = getIntegrationDelayDays(left);
    const rightDays = getIntegrationDelayDays(right);

    if (leftDays !== rightDays) {
      return rightDays - leftDays;
    }

    const leftDelayed = isDelayedIntegration(left);
    const rightDelayed = isDelayedIntegration(right);
    if (leftDelayed !== rightDelayed) {
      return leftDelayed ? -1 : 1;
    }

    const leftDate = new Date(left.atualizadoEm).getTime();
    const rightDate = new Date(right.atualizadoEm).getTime();

    if (Number.isNaN(leftDate) && Number.isNaN(rightDate)) return 0;
    if (Number.isNaN(leftDate)) return 1;
    if (Number.isNaN(rightDate)) return -1;

    return leftDate - rightDate;
  });
}

export function filterPrioritizedIntegrations(
  items: IntegrationItem[],
  statusFilter: ActionStatusFilter,
  slaFilter: SlaFilter,
) {
  const prioritized = getPrioritizedIntegrations(items);

  return prioritized.filter((item) => {
    if (
      statusFilter !== ActionStatusFilter.ALL &&
      item.status !== statusFilter
    ) {
      return false;
    }

    if (slaFilter === SlaFilter.ALL) {
      return true;
    }

    const days = getIntegrationDelayDays(item);
    if (slaFilter === SlaFilter.DAYS_15) return days > 15;
    if (slaFilter === SlaFilter.DAYS_30) return days > 30;
    return days > 60;
  });
}

export function filterAndRankNetworks<T extends NetworkRowBase>(
  rows: T[],
  focusFilter: NetworkFocusFilter,
  volumeFilter: NetworkVolumeFilter,
) {
  const byVolume = rows.filter((row) => {
    if (volumeFilter === NetworkVolumeFilter.ALL) return true;
    if (volumeFilter === NetworkVolumeFilter.PLUS_10) return row.total >= 10;
    if (volumeFilter === NetworkVolumeFilter.PLUS_25) return row.total >= 25;
    return row.total >= 50;
  });

  const ranked = [...byVolume];

  if (focusFilter === NetworkFocusFilter.BOTTLENECK_PENDING) {
    ranked.sort((a, b) => b.aguardando - a.aguardando || b.total - a.total);
  } else if (focusFilter === NetworkFocusFilter.BOTTLENECK_IN_PROGRESS) {
    ranked.sort((a, b) => b.iniciadas - a.iniciadas || b.total - a.total);
  } else if (focusFilter === NetworkFocusFilter.BEST_FINISHED) {
    ranked.sort((a, b) => {
      const aRate = a.total > 0 ? a.finalizadas / a.total : 0;
      const bRate = b.total > 0 ? b.finalizadas / b.total : 0;
      return (
        bRate - aRate || b.finalizadas - a.finalizadas || b.total - a.total
      );
    });
  } else {
    ranked.sort((a, b) => b.total - a.total || b.finalizadas - a.finalizadas);
  }

  return ranked;
}
