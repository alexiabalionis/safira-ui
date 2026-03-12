import { Text, Tooltip } from "@mantine/core";
import { useMemo } from "react";

import type { DashboardOverview } from "@/types/core.types";

type RedeRow = DashboardOverview["redes"][number];

type Props = {
  redes: RedeRow[];
};

function getRedeColor(row: RedeRow): string {
  const { aguardando, iniciadas, finalizadas, total } = row;
  if (total === 0) return "#e5e7eb";
  const dominant = Math.max(aguardando, iniciadas, finalizadas);
  if (dominant === finalizadas && finalizadas > 0) return "#10b981";
  if (dominant === iniciadas && iniciadas > 0) return "#3b82f6";
  return "#94a3b8";
}

export function BentoNetworksTreemapCard({ redes }: Props) {
  const sorted = useMemo(
    () => [...redes].sort((a, b) => b.total - a.total).slice(0, 20),
    [redes],
  );

  const totalPostos = useMemo(
    () => sorted.reduce((sum, r) => sum + r.total, 0),
    [sorted],
  );

  if (sorted.length === 0) {
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
          Panorama de Redes
        </Text>
        <Text size="xs" c="#a1a1aa">
          Sem dados para exibir.
        </Text>
      </div>
    );
  }

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
        Panorama de Redes
      </Text>
      <div className="flex flex-1 flex-wrap content-start gap-2">
        {sorted.map((row) => {
          const areaPct = totalPostos > 0 ? (row.total / totalPostos) * 100 : 0;
          const color = getRedeColor(row);
          const widthPct = Math.max(areaPct, 8);

          return (
            <Tooltip
              key={row.id ?? row.nome}
              label={`${row.nome}: ${row.total} postos (${row.aguardando} Aguardando, ${row.iniciadas} Iniciadas, ${row.finalizadas} Finalizadas)`}
              multiline
              w={230}
              withArrow
            >
              <div
                style={{
                  background: color,
                  borderRadius: 8,
                  padding: "6px 8px",
                  width: `calc(${widthPct}% - 4px)`,
                  minWidth: 48,
                  cursor: "default",
                  opacity: 0.85,
                  transition: "opacity 150ms",
                }}
                className="hover:opacity-100"
              >
                <Text
                  fw={700}
                  c="white"
                  style={{
                    fontSize: "0.7rem",
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {row.nome}
                </Text>
                <Text c="white" style={{ fontSize: "0.7rem", opacity: 0.9 }}>
                  {row.total}
                </Text>
              </div>
            </Tooltip>
          );
        })}
      </div>
      <div className="mt-3 flex gap-4">
        {(
          [
            { label: "Aguardando", color: "#94a3b8" },
            { label: "Iniciadas", color: "#3b82f6" },
            { label: "Finalizadas", color: "#10b981" },
          ] as const
        ).map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1">
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: color,
              }}
            />
            <Text size="xs" c="#a1a1aa">
              {label}
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
}
