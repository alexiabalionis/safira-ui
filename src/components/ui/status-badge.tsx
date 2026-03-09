import { Badge } from "@mantine/core";

import { getStatusPalette } from "@/lib/status-colors";

export function StatusBadge({
  status,
}: {
  status:
    | "Aguardando"
    | "em_andamento"
    | "Finalizado"
    | "AGUARDANDO"
    | "EM ANDAMENTO"
    | "EM_ANDAMENTO"
    | "FINALIZADO";
}) {
  const palette = getStatusPalette(status);
  const styles = {
    root: {
      backgroundColor: palette.lightBg,
      color: palette.text,
      borderColor: palette.border,
    },
  };

  return (
    <Badge size="xs" radius="sm" variant="light" styles={styles}>
      {status}
    </Badge>
  );
}
