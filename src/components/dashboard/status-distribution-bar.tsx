import { Box, Group } from "@mantine/core";

import { getStatusPalette } from "@/lib/status-colors";

type Props = {
  aguardando: number;
  iniciadas: number;
  finalizadas: number;
  height?: number;
  minWidth?: number;
};

export function StatusDistributionBar({
  aguardando,
  iniciadas,
  finalizadas,
  height = 10,
  minWidth = 140,
}: Props) {
  const total = aguardando + iniciadas + finalizadas || 1;
  const aguardandoWidth = (aguardando / total) * 100;
  const iniciadasWidth = (iniciadas / total) * 100;
  const finalizadasWidth = (finalizadas / total) * 100;

  return (
    <Group
      gap={0}
      wrap="nowrap"
      style={{ borderRadius: 4, overflow: "hidden", minWidth }}
    >
      <Box
        h={height}
        style={{
          width: `${aguardandoWidth}%`,
          backgroundColor: getStatusPalette("AGUARDANDO").solid,
        }}
      />
      <Box
        h={height}
        style={{
          width: `${iniciadasWidth}%`,
          backgroundColor: getStatusPalette("EM_ANDAMENTO").solid,
        }}
      />
      <Box
        h={height}
        style={{
          width: `${finalizadasWidth}%`,
          backgroundColor: getStatusPalette("FINALIZADO").solid,
        }}
      />
    </Group>
  );
}
