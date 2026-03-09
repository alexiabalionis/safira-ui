"use client";

import { Grid } from "@mantine/core";
import { useMemo, useState } from "react";

import { ConversionFunnelPanel } from "@/components/dashboard/conversion-funnel-panel";
import { ErpPerformanceStackedChart } from "@/components/dashboard/erp-performance-stacked-chart";
import { ImmediateActionPanel } from "@/components/dashboard/immediate-action-panel";
import { NetworksConsolidatedPanel } from "@/components/dashboard/networks-consolidated-panel";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusCard } from "@/components/ui/status-card";
import { useDashboardQuery } from "@/hooks/use-safira-data";
import { getStatusPalette } from "@/lib/status-colors";
import {
  ActionStatusFilter,
  DASHBOARD_CARD_LABELS,
  NetworkFocusFilter,
  NetworkVolumeFilter,
  SlaFilter,
} from "@/services/dashboard-constants";
import { filterPrioritizedIntegrations } from "@/services/dashboard-utils";

export default function DashboardPage() {
  const dashboard = useDashboardQuery();

  const [statusFilter, setStatusFilter] = useState<ActionStatusFilter>(
    ActionStatusFilter.ALL,
  );
  const [slaFilter, setSlaFilter] = useState<SlaFilter>(SlaFilter.ALL);
  const [redeFocusFilter, setRedeFocusFilter] = useState<NetworkFocusFilter>(
    NetworkFocusFilter.ALL,
  );
  const [redeVolumeFilter, setRedeVolumeFilter] = useState<NetworkVolumeFilter>(
    NetworkVolumeFilter.ALL,
  );

  const totals = dashboard.data?.totals;
  const integrations = useMemo(
    () => dashboard.data?.integrations ?? [],
    [dashboard.data?.integrations],
  );

  const delayedIntegrations = useMemo(
    () =>
      filterPrioritizedIntegrations(
        integrations,
        ActionStatusFilter.ALL,
        SlaFilter.DAYS_15,
      ),
    [integrations],
  );

  const cards = [
    {
      label: DASHBOARD_CARD_LABELS.postos,
      total: totals?.postos ?? 0,
      active: totals?.postos ?? 0,
    },
    {
      label: DASHBOARD_CARD_LABELS.redes,
      total: totals?.redes ?? 0,
      active: totals?.redes ?? 0,
    },
    {
      label: DASHBOARD_CARD_LABELS.erps,
      total: totals?.erps ?? 0,
      active: totals?.erps ?? 0,
    },
    {
      label: DASHBOARD_CARD_LABELS.delayed,
      total: integrations.length,
      active: delayedIntegrations.length,
    },
  ];

  return (
    <div className="flex w-full justify-center">
      <div className="w-[92%] 2xl:w-[86%]">
        <Grid gutter={8} pb={8}>
          {cards.map((card) => (
            <Grid.Col span={{ base: 12, md: 6, xl: 3 }} key={card.label}>
              <StatusCard
                label={card.label}
                total={card.total}
                active={card.active}
              />
            </Grid.Col>
          ))}
        </Grid>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
          <div className="space-y-3 xl:col-span-8">
            <ConversionFunnelPanel
              integrationStatus={dashboard.data?.integrationStatus}
              stageColors={{
                pending: getStatusPalette("AGUARDANDO").solid,
                inProgress: getStatusPalette("EM_ANDAMENTO").solid,
                completed: getStatusPalette("FINALIZADO").solid,
              }}
            />

            <div className="rounded-xl bg-white p-5 shadow-[0_4px_6px_rgba(0,0,0,0.05)]">
              <SectionHeader
                title="Comparativo de Performance por ERP"
                subtitle="Distribuição 100% por estágio de integração"
              />
              <ErpPerformanceStackedChart rows={dashboard.data?.erps ?? []} />
            </div>

            <NetworksConsolidatedPanel
              rows={dashboard.data?.redes ?? []}
              focusFilter={redeFocusFilter}
              onFocusFilterChange={setRedeFocusFilter}
              volumeFilter={redeVolumeFilter}
              onVolumeFilterChange={setRedeVolumeFilter}
              loading={dashboard.isLoading}
            />
          </div>

          <div className="xl:col-span-4">
            <ImmediateActionPanel
              items={integrations}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              slaFilter={slaFilter}
              onSlaFilterChange={setSlaFilter}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
