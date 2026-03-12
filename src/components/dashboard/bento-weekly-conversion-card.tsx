import { Text } from "@mantine/core";

import type { LeanFlowMetrics } from "@/services/dashboard-lean-flow";

type Props = Pick<
  LeanFlowMetrics,
  "throughputGoalRatio" | "throughput7d" | "throughputGoal"
>;

export function BentoWeeklyConversionCard({
  throughputGoalRatio,
  throughput7d,
  throughputGoal,
}: Props) {
  const pct = Math.round(throughputGoalRatio * 100);
  const hasData = throughputGoal > 0;
  const barColor = pct >= 100 ? "#10b981" : pct >= 60 ? "#3b82f6" : "#f59e0b";

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
        Conversão Semanal
      </Text>
      <div className="flex flex-1 flex-col items-center justify-center">
        <Text
          fw={800}
          ta="center"
          style={{ fontSize: "3rem", color: barColor, lineHeight: 1 }}
        >
          {hasData ? `${pct}%` : "--"}
        </Text>
        <Text size="xs" c="#a1a1aa" mt={6}>
          {throughput7d} de {throughputGoal} nesta semana
        </Text>
      </div>
      {hasData && (
        <div className="mt-4">
          <div
            className="relative h-2 overflow-hidden rounded-full"
            style={{ background: "#f4f4f5" }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(throughputGoalRatio * 100, 100)}%`,
                background: barColor,
              }}
            />
            {/* Marcador da meta em 100% */}
            <div
              className="absolute inset-y-0"
              style={{ right: 0, width: 2, background: "#3f3f46" }}
            />
          </div>
          <div className="mt-1 flex justify-between">
            <Text size="xs" c="#a1a1aa">
              0%
            </Text>
            <Text size="xs" c="#3f3f46" fw={600}>
              Meta: {throughputGoal}
            </Text>
          </div>
        </div>
      )}
    </div>
  );
}
