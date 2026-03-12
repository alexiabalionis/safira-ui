import { Badge, Text } from "@mantine/core";

import type { LeanFlowMetrics } from "@/services/dashboard-lean-flow";

type Props = Pick<LeanFlowMetrics, "mtiDays" | "mtiTrend" | "mtiVariation">;

function BentoSparkline({ values }: { values: number[] }) {
  const width = 240;
  const height = 48;
  const padding = 4;

  if (values.length < 2) return null;

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 0.01);

  const points = values
    .map((v, i) => {
      const x =
        padding + (i * (width - padding * 2)) / Math.max(values.length - 1, 1);
      const y = height - padding - ((v - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <polyline
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export function BentoMtiCard({ mtiDays, mtiTrend, mtiVariation }: Props) {
  const hasData = mtiDays > 0;
  const isImprovement = mtiVariation !== null && mtiVariation < 0;
  const badgeColor =
    mtiVariation === null ? "gray" : isImprovement ? "green" : "red";
  const badgeLabel =
    mtiVariation === null
      ? "Sem base"
      : `${isImprovement ? "↓" : "↑"} ${Math.abs(mtiVariation).toFixed(0)}%`;

  return (
    <div
      className="flex h-full flex-col p-5"
      style={{
        background: "#ffffff",
        borderRadius: 16,
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
      }}
    >
      <div className="mb-1 flex items-start justify-between">
        <Text
          size="xs"
          fw={700}
          c="#a1a1aa"
          tt="uppercase"
          style={{ letterSpacing: "0.06em" }}
        >
          Tempo Médio (MTI)
        </Text>
        <Badge color={badgeColor} variant="light" size="sm">
          {badgeLabel}
        </Badge>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <Text
          fw={800}
          ta="center"
          style={{ fontSize: "3rem", color: "#3b82f6", lineHeight: 1 }}
        >
          {hasData ? `${mtiDays.toFixed(1)}d` : "--"}
        </Text>
      </div>
      <div className="mt-2">
        <BentoSparkline values={mtiTrend.map((p) => p.value)} />
        <div className="mt-1 flex justify-between">
          {mtiTrend.length > 0 && (
            <>
              <Text size="xs" c="#a1a1aa" style={{ fontSize: "0.65rem" }}>
                {mtiTrend[0]?.label}
              </Text>
              <Text size="xs" c="#a1a1aa" style={{ fontSize: "0.65rem" }}>
                {mtiTrend[mtiTrend.length - 1]?.label}
              </Text>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
