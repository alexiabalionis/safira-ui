import { Text, Tooltip } from "@mantine/core";

import type { OperatorRankingRow } from "@/services/dashboard-lean-flow";

type Props = {
  rows: OperatorRankingRow[];
};

function getInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  "#6366f1",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
];

function OperatorRow({ row, rank }: { row: OperatorRankingRow; rank: number }) {
  const pct = row.total > 0 ? (row.finalizados / row.total) * 100 : 0;
  const avatarColor = AVATAR_COLORS[rank % AVATAR_COLORS.length];
  const initials = getInitials(row.nome);

  return (
    <div className="flex items-center gap-3" style={{ padding: "6px 0" }}>
      {/* Rank */}
      <Text
        size="xs"
        fw={700}
        c="#cbd5e1"
        style={{ width: 18, textAlign: "right", flexShrink: 0 }}
      >
        {rank + 1}
      </Text>

      {/* Avatar */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: avatarColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Text
          size="xs"
          fw={700}
          c="white"
          style={{ fontSize: "0.65rem", letterSpacing: "0.03em" }}
        >
          {initials}
        </Text>
      </div>

      {/* Name + bar */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Text size="xs" fw={600} c="#334155" truncate>
          {row.nome}
        </Text>
        <Tooltip
          label={`${row.finalizados} finalizados de ${row.total} postos`}
          withArrow
        >
          <div
            style={{
              height: 4,
              background: "#f1f5f9",
              borderRadius: 99,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                background: "#10b981",
                borderRadius: 99,
                transition: "width 400ms ease",
              }}
            />
          </div>
        </Tooltip>
      </div>

      {/* Badge */}
      <div
        style={{
          background: "#ecfdf5",
          color: "#059669",
          borderRadius: 6,
          padding: "2px 8px",
          fontSize: "0.72rem",
          fontWeight: 700,
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}
      >
        {row.finalizados}
      </div>
    </div>
  );
}

export function BentoOperatorRankingCard({ rows }: Props) {
  const topRows = rows.slice(0, 8);

  return (
    <div
      className="flex h-full flex-col p-5"
      style={{
        background: "#ffffff",
        borderRadius: 20,
        boxShadow: "0 2px 12px rgb(0 0 0 / 0.06)",
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <Text
          size="xs"
          fw={700}
          c="#a1a1aa"
          tt="uppercase"
          style={{ letterSpacing: "0.06em" }}
        >
          Ranking de Operadores
        </Text>
        <Text size="xs" c="#cbd5e1">
          Finalizados
        </Text>
      </div>

      {topRows.length === 0 ? (
        <Text size="xs" c="#a1a1aa">
          Sem dados de responsáveis.
        </Text>
      ) : (
        <div
          className="flex flex-1 flex-col"
          style={{
            gap: 0,
            borderTop: "1px solid #f8fafc",
          }}
        >
          {topRows.map((row, i) => (
            <div
              key={row.nome}
              style={{
                borderBottom:
                  i < topRows.length - 1 ? "1px solid #f8fafc" : "none",
              }}
            >
              <OperatorRow row={row} rank={i} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
