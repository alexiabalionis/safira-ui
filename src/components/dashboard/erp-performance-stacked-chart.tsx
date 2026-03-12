import { Box, Group, Text } from "@mantine/core";
import { useMemo } from "react";

import { getStatusPalette } from "@/lib/status-colors";
import type { DashboardOverview } from "@/types/core.types";

import { StatusDistributionBar } from "./status-distribution-bar";

type ErpSummaryRow = DashboardOverview["erps"][number];

type Props = {
  rows: ErpSummaryRow[];
};

export function ErpPerformanceStackedChart({ rows }: Props) {
  const topRows = useMemo(
    () =>
      [...rows]
        .sort(
          (a, b) =>
            b.total - a.total ||
            b.finalizadas - a.finalizadas ||
            a.nome.localeCompare(b.nome),
        )
        .slice(0, 10),
    [rows],
  );

  const aguardandoPalette = getStatusPalette("AGUARDANDO");
  const iniciadasPalette = getStatusPalette("EM_ANDAMENTO");
  const finalizadasPalette = getStatusPalette("FINALIZADO");

  if (topRows.length === 0) {
    return (
      <Text size="xs" c="#7A7A7A" mb={12}>
        Sem dados para exibir no gráfico.
      </Text>
    );
  }

  return (
    <Box mb={16}>
      <Box className="space-y-2">
        {topRows.map((row) => (
          <Box key={row.nome}>
            <Group justify="space-between" mb={4} wrap="nowrap">
              <Text size="sm" fw={600} c="#333333">
                {row.nome}
              </Text>
              <Text size="sm" c="#7A7A7A">
                {row.total}
              </Text>
            </Group>

            <StatusDistributionBar
              aguardando={row.aguardando}
              iniciadas={row.iniciadas}
              finalizadas={row.finalizadas}
              height={12}
              minWidth={0}
            />
          </Box>
        ))}
      </Box>

      <Group gap={12} mt={10} justify="flex-end">
        <Group gap={6}>
          <Box
            w={10}
            h={10}
            bg={aguardandoPalette.solid}
            style={{ borderRadius: 2 }}
          />
          <Text size="xs" c="#7A7A7A">
            Aguardando
          </Text>
        </Group>
        <Group gap={6}>
          <Box
            w={10}
            h={10}
            bg={iniciadasPalette.solid}
            style={{ borderRadius: 2 }}
          />
          <Text size="xs" c="#7A7A7A">
            Iniciadas
          </Text>
        </Group>
        <Group gap={6}>
          <Box
            w={10}
            h={10}
            bg={finalizadasPalette.solid}
            style={{ borderRadius: 2 }}
          />
          <Text size="xs" c="#7A7A7A">
            Finalizadas
          </Text>
        </Group>
      </Group>
    </Box>
  );
}
