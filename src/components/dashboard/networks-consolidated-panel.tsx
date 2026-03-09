import { Paper } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";

import { ChipFilterGroup } from "@/components/dashboard/chip-filter-group";
import { StatusDistributionBar } from "@/components/dashboard/status-distribution-bar";
import { DataTable } from "@/components/ui/data-table";
import { SectionHeader } from "@/components/ui/section-header";
import {
  NetworkFocusFilter,
  NetworkVolumeFilter,
} from "@/services/dashboard-constants";
import { filterAndRankNetworks } from "@/services/dashboard-utils";
import type { DashboardOverview } from "@/services/types";

type RedeSummaryRow = DashboardOverview["redes"][number];

type Props = {
  rows: RedeSummaryRow[];
  focusFilter: NetworkFocusFilter;
  onFocusFilterChange: (value: NetworkFocusFilter) => void;
  volumeFilter: NetworkVolumeFilter;
  onVolumeFilterChange: (value: NetworkVolumeFilter) => void;
  loading?: boolean;
};

const focusOptions: Array<{
  value: NetworkFocusFilter;
  label: string;
  activeColor?: string;
}> = [
  { value: NetworkFocusFilter.ALL, label: "Todas", activeColor: "safira" },
  {
    value: NetworkFocusFilter.BOTTLENECK_PENDING,
    label: "Gargalo: Aguardando",
    activeColor: "yellow",
  },
  {
    value: NetworkFocusFilter.BOTTLENECK_IN_PROGRESS,
    label: "Gargalo: Iniciadas",
    activeColor: "blue",
  },
  {
    value: NetworkFocusFilter.BEST_FINISHED,
    label: "Melhor Performance",
    activeColor: "green",
  },
];

const volumeOptions: Array<{
  value: NetworkVolumeFilter;
  label: string;
  activeColor?: string;
}> = [
  {
    value: NetworkVolumeFilter.ALL,
    label: "Volume: Todos",
    activeColor: "safira",
  },
  { value: NetworkVolumeFilter.PLUS_10, label: "10+", activeColor: "safira" },
  { value: NetworkVolumeFilter.PLUS_25, label: "25+", activeColor: "safira" },
  { value: NetworkVolumeFilter.PLUS_50, label: "50+", activeColor: "safira" },
];

export function NetworksConsolidatedPanel({
  rows,
  focusFilter,
  onFocusFilterChange,
  volumeFilter,
  onVolumeFilterChange,
  loading,
}: Props) {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filteredRows = filterAndRankNetworks(rows, focusFilter, volumeFilter);

  useEffect(() => {
    setPage(1);
  }, [focusFilter, volumeFilter, rows]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page]);

  return (
    <Paper p={20} radius={12}>
      <SectionHeader
        title="Redes: visão consolidada por status"
        subtitle={`Redes monitoradas: ${filteredRows.length}`}
      />

      <ChipFilterGroup
        value={focusFilter}
        options={focusOptions}
        onChange={onFocusFilterChange}
      />

      <ChipFilterGroup
        value={volumeFilter}
        options={volumeOptions}
        onChange={onVolumeFilterChange}
        mb={12}
      />

      <DataTable<RedeSummaryRow>
        columns={[
          { key: "nome", header: "Rede", render: (row) => row.nome },
          {
            key: "distribuicao",
            header: "Distribuição 100%",
            render: (row) => (
              <StatusDistributionBar
                aguardando={row.aguardando}
                iniciadas={row.iniciadas}
                finalizadas={row.finalizadas}
              />
            ),
          },
          { key: "total", header: "Total", render: (row) => row.total },
        ]}
        rows={pagedRows}
        total={filteredRows.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        rowKey={(row) => row.id ?? `sem-rede-${row.nome}`}
        loading={loading}
      />
    </Paper>
  );
}
