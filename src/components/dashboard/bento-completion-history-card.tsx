"use client";

import { useState } from "react";
import { Text } from "@mantine/core";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  CompletionHistoryPoint,
  CompletionPeriod,
} from "@/services/dashboard-lean-flow";

type Props = {
  dayData: CompletionHistoryPoint[];
  weekData: CompletionHistoryPoint[];
  monthData: CompletionHistoryPoint[];
};

const PERIOD_LABELS: Record<CompletionPeriod, string> = {
  day: "Dia",
  week: "Semana",
  month: "Mês",
};

const PERIODS: CompletionPeriod[] = ["day", "week", "month"];

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: "8px 12px",
        boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
      }}
    >
      <Text size="xs" fw={600} c="#475569" mb={4}>
        {label}
      </Text>
      {payload.map((entry) => (
        <Text key={entry.name} size="xs" c={entry.color}>
          {entry.name}: {entry.value}
        </Text>
      ))}
    </div>
  );
}

export function BentoCompletionHistoryCard({
  dayData,
  weekData,
  monthData,
}: Props) {
  const [period, setPeriod] = useState<CompletionPeriod>("day");

  const dataMap: Record<CompletionPeriod, CompletionHistoryPoint[]> = {
    day: dayData,
    week: weekData,
    month: monthData,
  };

  const data = dataMap[period];

  return (
    <div
      className="flex h-full flex-col p-5"
      style={{
        background: "#ffffff",
        borderRadius: 20,
        boxShadow: "0 2px 12px rgb(0 0 0 / 0.06)",
      }}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <Text
          size="xs"
          fw={700}
          c="#a1a1aa"
          tt="uppercase"
          style={{ letterSpacing: "0.06em" }}
        >
          Histórico de Conclusões
        </Text>

        {/* Period tabs */}
        <div
          className="flex"
          style={{
            background: "#f1f5f9",
            borderRadius: 8,
            padding: 2,
            gap: 2,
          }}
        >
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: "3px 12px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                fontSize: "0.72rem",
                fontWeight: 600,
                transition: "background 150ms, color 150ms",
                background: period === p ? "#ffffff" : "transparent",
                color: period === p ? "#0f172a" : "#94a3b8",
                boxShadow:
                  period === p ? "0 1px 3px rgb(0 0 0 / 0.08)" : "none",
              }}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="#f1f5f9"
              strokeDasharray="4 4"
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="count"
              name="Finalizados"
              fill="#10b981"
              fillOpacity={0.8}
              radius={[4, 4, 0, 0]}
              maxBarSize={56}
            />
            <Line
              dataKey="avg"
              name="Média"
              type="monotone"
              stroke="#94a3b8"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 3"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
