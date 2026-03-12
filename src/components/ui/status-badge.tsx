import { Badge } from "@mantine/core";

import {
  AUTOMACAO_ETAPA_LABEL,
  normalizeAutomacaoEtapaKey,
} from "@/services/automation";
import { getStatusPalette } from "@/lib/status-colors";

export function StatusBadge({ status }: { status: string }) {
  const palette = getStatusPalette(status);
  const label = AUTOMACAO_ETAPA_LABEL[normalizeAutomacaoEtapaKey(status)];
  const styles = {
    root: {
      backgroundColor: palette.lightBg,
      color: palette.text,
      borderColor: palette.border,
    },
  };

  return (
    <Badge size="xs" radius="sm" variant="light" styles={styles}>
      {label}
    </Badge>
  );
}
