import { Text } from "@mantine/core";

import type { DashboardOverview } from "@/types/core.types";

type IntegrationStatusData = DashboardOverview["integrationStatus"];
type TotalsData = DashboardOverview["totals"];

type Props = {
  integrationStatus?: IntegrationStatusData;
  totals?: TotalsData;
};

const PALETTE = {
  aguardando: { color: "#94a3b8", bg: "#f1f5f9", label: "Aguardando" },
  iniciadas: { color: "#3b82f6", bg: "#eff6ff", label: "Iniciadas" },
  finalizadas: { color: "#10b981", bg: "#ecfdf5", label: "Finalizadas" },
  bloqueados: { color: "#ef4444", bg: "#fef2f2", label: "Bloqueados" },
  total: { color: "#3f3f46", bg: "#f4f4f5", label: "Total Postos" },
  erps: { color: "#8b5cf6", bg: "#faf5ff", label: "ERPs" },
  redes: { color: "#06b6d4", bg: "#f0f9fa", label: "Redes" },
} as const;

function SubCard({
  label,
  color,
  bg,
  mainValue,
  mainValueUnit,
  subValue,
}: {
  label: string;
  color: string;
  bg: string;
  mainValue: string | number | null;
  mainValueUnit: string;
  subValue?: string;
}) {
  return (
    <div className="flex flex-col rounded-xl p-3" style={{ background: bg }}>
      <Text
        size="xs"
        fw={600}
        c="#71717a"
        tt="uppercase"
        style={{ letterSpacing: "0.05em" }}
      >
        {label}
      </Text>
      <Text
        fw={800}
        style={{
          fontSize: "1.75rem",
          color,
          lineHeight: 1.1,
          margin: "6px 0 4px",
        }}
      >
        {mainValue !== null ? `${mainValue}${mainValueUnit}` : "--"}
      </Text>
      {subValue && (
        <Text size="xs" c="#a1a1aa">
          {subValue}
        </Text>
      )}
    </div>
  );
}

export function BentoBaseCompositionCard({ integrationStatus, totals }: Props) {
  const total = integrationStatus?.total ?? 0;
  const pct = (value: number) =>
    total > 0 ? Math.round((value / total) * 100) : null;

  const aguardando = integrationStatus?.aguardando.value ?? 0;
  const iniciadas = integrationStatus?.iniciadas.value ?? 0;
  const finalizadas = integrationStatus?.finalizadas.value ?? 0;
  const bloqueados = integrationStatus?.bloqueados.value ?? 0;

  const totalPostos = total;
  const totalErps = totals?.erps ?? 0;
  const totalRedes = totals?.redes ?? 0;

  return (
    <div
      className="flex h-full flex-col p-5"
      style={{
        background: "#ffffff",
        borderRadius: 16,
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
      }}
    >
      <Text
        size="xs"
        fw={700}
        c="#a1a1aa"
        tt="uppercase"
        mb={12}
        style={{ letterSpacing: "0.06em" }}
      >
        Composição da Base
      </Text>
      <div className="grid flex-1 grid-cols-3 gap-3">
        <SubCard
          label={PALETTE.aguardando.label}
          color={PALETTE.aguardando.color}
          bg={PALETTE.aguardando.bg}
          mainValue={pct(aguardando)}
          mainValueUnit="%"
          subValue={aguardando > 0 ? `${aguardando} postos` : undefined}
        />
        <SubCard
          label={PALETTE.iniciadas.label}
          color={PALETTE.iniciadas.color}
          bg={PALETTE.iniciadas.bg}
          mainValue={pct(iniciadas)}
          mainValueUnit="%"
          subValue={iniciadas > 0 ? `${iniciadas} postos` : undefined}
        />
        <SubCard
          label={PALETTE.finalizadas.label}
          color={PALETTE.finalizadas.color}
          bg={PALETTE.finalizadas.bg}
          mainValue={pct(finalizadas)}
          mainValueUnit="%"
          subValue={finalizadas > 0 ? `${finalizadas} postos` : undefined}
        />
        <SubCard
          label={PALETTE.total.label}
          color={PALETTE.total.color}
          bg={PALETTE.total.bg}
          mainValue={totalPostos}
          mainValueUnit=""
        />
        <SubCard
          label={PALETTE.erps.label}
          color={PALETTE.erps.color}
          bg={PALETTE.erps.bg}
          mainValue={totalErps}
          mainValueUnit=""
        />
        <SubCard
          label={PALETTE.redes.label}
          color={PALETTE.redes.color}
          bg={PALETTE.redes.bg}
          mainValue={totalRedes}
          mainValueUnit=""
        />
      </div>
    </div>
  );
}
