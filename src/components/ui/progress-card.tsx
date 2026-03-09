import { Box, Progress, Text } from "@mantine/core";

import { getStatusPalette } from "@/lib/status-colors";

export function ProgressCard({
  label,
  total,
  online,
  status,
}: {
  label: string;
  total: number;
  online: number;
  status: "aguardando" | "iniciadas" | "finalizadas";
}) {
  const percent = total > 0 ? Math.round((online / total) * 100) : 0;
  const semanticStatus =
    status === "aguardando"
      ? "AGUARDANDO"
      : status === "iniciadas"
        ? "EM_ANDAMENTO"
        : "FINALIZADO";
  const palette = getStatusPalette(semanticStatus);

  return (
    <Box p={16} mt={12}>
      <Text size="xs" c="#7A7A7A">
        {label}
      </Text>
      <Text fw={700} size="xl" c="#1e1f24">
        {online}
      </Text>
      <Progress mt={6} radius="sm" value={percent} color={palette.solid} />
    </Box>
  );
}
