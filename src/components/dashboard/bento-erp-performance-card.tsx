import { Group, Text, Tooltip } from "@mantine/core";
import { useMemo } from "react";

import type { DashboardOverview } from "@/types/core.types";

type ErpSummaryRow = DashboardOverview["erps"][number];

type Props = {
  rows: ErpSummaryRow[];
  mtiPerErp?: Record<string, number>;
};

const COLORS = {
  aguardando: "#94a3b8",
  iniciadas: "#3b82f6",
  finalizadas: "#10b981",
} as const;

function StackedBar({
  row,
  mti,
}: {
  row: ErpSummaryRow;
  mti: number | undefined;
}) {
  const { total, aguardando, iniciadas, finalizadas } = row;
  if (total === 0) return null;

  const aguardandoPct = (aguardando / total) * 100;
  const iniciadasPct = (iniciadas / total) * 100;
  const finalizadasPct = (finalizadas / total) * 100;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <Text
          size="sm"
          fw={600}
          c="#333333"
          style={{ maxWidth: "55%" }}
          truncate
        >
          {row.nome}
        </Text>
        <div className="flex items-center gap-3">
          {mti !== undefined && mti > 0 && (
            <Text size="xs" fw={600} c="#94a3b8">
              MTI: {mti.toFixed(1)}d
            </Text>
          )}
          <Text size="xs" c="#a1a1aa">
            {total}
          </Text>
        </div>
      </div>
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {aguardandoPct > 0 && (
          <Tooltip label={`Aguardando: ${aguardando}`} withArrow>
            <div
              style={{
                width: `${aguardandoPct}%`,
                background: COLORS.aguardando,
              }}
            />
          </Tooltip>
        )}
        {iniciadasPct > 0 && (
          <Tooltip label={`Iniciadas: ${iniciadas}`} withArrow>
            <div
              style={{
                width: `${iniciadasPct}%`,
                background: COLORS.iniciadas,
              }}
            />
          </Tooltip>
        )}
        {finalizadasPct > 0 && (
          <Tooltip label={`Finalizadas: ${finalizadas}`} withArrow>
            <div
              style={{
                width: `${finalizadasPct}%`,
                background: COLORS.finalizadas,
              }}
            />
          </Tooltip>
        )}
      </div>
    </div>
  );
}

export function BentoErpPerformanceCard({ rows, mtiPerErp = {} }: Props) {
  const sorted = useMemo(
    () => [...rows].sort((a, b) => b.total - a.total).slice(0, 8),
    [rows],
  );

  return (
    <div
      className="flex h-full flex-col p-5"
      style={{
        background: "#ffffff",
        borderRadius: 16,
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <Text
          size="xs"
          fw={700}
          c="#a1a1aa"
          tt="uppercase"
          style={{ letterSpacing: "0.06em" }}
        >
          Status por ERP
        </Text>
        <Group gap={10}>
          {(["aguardando", "iniciadas", "finalizadas"] as const).map((key) => (
            <Group gap={4} key={key}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: COLORS[key],
                }}
              />
              <Text
                size="xs"
                c="#a1a1aa"
                style={{ textTransform: "capitalize" }}
              >
                {key}
              </Text>
            </Group>
          ))}
        </Group>
      </div>
      {sorted.length === 0 ? (
        <Text size="xs" c="#a1a1aa">
          Sem dados para exibir.
        </Text>
      ) : (
        <div className="flex flex-1 flex-col justify-between gap-3">
          {sorted.map((row) => (
            <StackedBar key={row.nome} row={row} mti={mtiPerErp[row.nome]} />
          ))}
        </div>
      )}
    </div>
  );
}
