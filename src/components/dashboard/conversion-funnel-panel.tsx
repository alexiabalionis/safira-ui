import { Box, Group, Paper, Progress, Text } from "@mantine/core";

import { SectionHeader } from "@/components/ui/section-header";
import { FUNNEL_STAGE_LABELS } from "@/services/dashboard-constants";
import type { DashboardOverview } from "@/services/types";

type Props = {
  integrationStatus: DashboardOverview["integrationStatus"] | undefined;
  stageColors: {
    pending: string;
    inProgress: string;
    completed: string;
  };
};

export function ConversionFunnelPanel({
  integrationStatus,
  stageColors,
}: Props) {
  const funnelTotal = integrationStatus?.total ?? 0;

  const stages = [
    {
      label: FUNNEL_STAGE_LABELS.pending,
      value: integrationStatus?.aguardando.value ?? 0,
      color: stageColors.pending,
    },
    {
      label: FUNNEL_STAGE_LABELS.inProgress,
      value: integrationStatus?.iniciadas.value ?? 0,
      color: stageColors.inProgress,
    },
    {
      label: FUNNEL_STAGE_LABELS.completed,
      value: integrationStatus?.finalizadas.value ?? 0,
      color: stageColors.completed,
    },
  ];

  return (
    <Paper p={18} radius={12}>
      <SectionHeader
        title="Funil de Conversão"
        subtitle="Visão macro do avanço das integrações no SLA"
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {stages.map((stage) => {
          const percent =
            funnelTotal > 0 ? Math.round((stage.value / funnelTotal) * 100) : 0;

          return (
            <Box
              key={stage.label}
              className="rounded-md border border-gray-100 p-3"
            >
              <Group justify="space-between" mb={6}>
                <Text size="xs" c="#7A7A7A">
                  {stage.label}
                </Text>
                <Text size="xs" c="#7A7A7A">
                  {percent}%
                </Text>
              </Group>
              <Text fw={700} size="xl" c="#1e1f24">
                {stage.value}
              </Text>
              <Progress
                mt={8}
                radius="sm"
                value={percent}
                color={stage.color}
              />
            </Box>
          );
        })}
      </div>
    </Paper>
  );
}
