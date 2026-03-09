import { Paper, Text } from "@mantine/core";

import { ChipFilterGroup } from "@/components/dashboard/chip-filter-group";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ActionStatusFilter, SlaFilter } from "@/services/dashboard-constants";
import {
  filterPrioritizedIntegrations,
  getIntegrationDelayDays,
} from "@/services/dashboard-utils";
import type { IntegrationItem } from "@/services/types";
import { Group } from "@mantine/core";

type Props = {
  items: IntegrationItem[];
  statusFilter: ActionStatusFilter;
  onStatusFilterChange: (value: ActionStatusFilter) => void;
  slaFilter: SlaFilter;
  onSlaFilterChange: (value: SlaFilter) => void;
};

const statusOptions: Array<{
  value: ActionStatusFilter;
  label: string;
  activeColor?: string;
}> = [
  { value: ActionStatusFilter.ALL, label: "Todos", activeColor: "safira" },
  {
    value: ActionStatusFilter.PENDING,
    label: "Aguardando",
    activeColor: "yellow",
  },
  {
    value: ActionStatusFilter.IN_PROGRESS,
    label: "Em andamento",
    activeColor: "blue",
  },
];

const slaOptions: Array<{
  value: SlaFilter;
  label: string;
  activeColor?: string;
}> = [
  { value: SlaFilter.ALL, label: "SLA: Todos", activeColor: "safira" },
  { value: SlaFilter.DAYS_15, label: "15+ dias", activeColor: "yellow" },
  { value: SlaFilter.DAYS_30, label: "30+ dias", activeColor: "orange" },
  { value: SlaFilter.DAYS_60, label: "60+ dias", activeColor: "red" },
];

export function ImmediateActionPanel({
  items,
  statusFilter,
  onStatusFilterChange,
  slaFilter,
  onSlaFilterChange,
}: Props) {
  const filteredActionItems = filterPrioritizedIntegrations(
    items,
    statusFilter,
    slaFilter,
  );

  return (
    <Paper p={20} radius={12}>
      <SectionHeader
        title="Lista de Ação Imediata"
        subtitle={`Integrações críticas com prioridade para "Aguardando" há mais tempo (${filteredActionItems.length})`}
      />

      <ChipFilterGroup
        value={statusFilter}
        options={statusOptions}
        onChange={onStatusFilterChange}
      />

      <ChipFilterGroup
        value={slaFilter}
        options={slaOptions}
        onChange={onSlaFilterChange}
        mb={12}
      />

      <div className="space-y-2">
        {filteredActionItems.slice(0, 8).map((item) => {
          const days = getIntegrationDelayDays(item);
          const delayed = days > 15;

          return (
            <div
              key={item.id}
              className="rounded-md border border-gray-100 bg-white px-3 py-2"
            >
              <Group justify="space-between" align="start" wrap="nowrap">
                <div>
                  <Text size="sm" fw={600} c="#333333">
                    {item.nome}
                  </Text>
                  <Text size="xs" c="#7A7A7A">
                    Atualizado há {days} dias
                  </Text>
                </div>
                <StatusBadge status={item.status} />
              </Group>
              {delayed ? (
                <Text size="10px" c="#B45309" mt={4}>
                  Em atraso de SLA (&gt; 15 dias)
                </Text>
              ) : null}
            </div>
          );
        })}

        {filteredActionItems.length === 0 ? (
          <Text size="xs" c="#7A7A7A">
            Nenhuma integração encontrada para os filtros aplicados.
          </Text>
        ) : null}
      </div>
    </Paper>
  );
}
