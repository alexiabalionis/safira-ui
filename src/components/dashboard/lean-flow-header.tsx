import { Badge, RingProgress, Text, Tooltip } from "@mantine/core";
import { useState, type ReactNode } from "react";

import type { LeanFlowMetrics } from "@/services/dashboard-lean-flow";
import type { DashboardErpFinishedSummary } from "@/types/core.types";

type LeanFlowCardKey = "finished" | "mti" | "efficiency";

type Props = {
  metrics: LeanFlowMetrics;
  activeCard: LeanFlowCardKey | null;
  onCardClick: (card: LeanFlowCardKey) => void;
};

const ERP_RING_COLORS = ["#01B075", "#0EA5E9", "#F59E0B", "#FF6B6B", "#7C6CF2"];

function buildErpRingSections(erpsFinalizados: DashboardErpFinishedSummary[]) {
  const topErps = erpsFinalizados.slice(0, 4);
  const othersTotal = erpsFinalizados
    .slice(4)
    .reduce((sum, item) => sum + item.total, 0);

  const rows =
    othersTotal > 0
      ? [...topErps, { nome: "Outros", total: othersTotal }]
      : topErps;

  const total = rows.reduce((sum, item) => sum + item.total, 0);

  return {
    total,
    rows: rows.map((item, index) => ({
      ...item,
      color: ERP_RING_COLORS[index % ERP_RING_COLORS.length],
      value: total > 0 ? (item.total / total) * 100 : 0,
    })),
  };
}

function Sparkline({ values }: { values: number[] }) {
  const width = 180;
  const height = 44;
  const padding = 6;

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  const points = values
    .map((value, index) => {
      const x =
        padding +
        (index * (width - padding * 2)) / Math.max(values.length - 1, 1);
      const y =
        height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        fill="none"
        stroke="#01B075"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

function formatSignedPercent(value: number | null) {
  if (value === null) return "Sem base";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function EfficiencyGauge({ ratio }: { ratio: number }) {
  const clamped = Math.max(0, Math.min(ratio, 1));
  const color =
    clamped > 0.8 ? "#01B075" : clamped >= 0.5 ? "#F59E0B" : "#E03131";
  const circumference = 157;
  const dash = clamped * circumference;
  const angle = Math.PI * (1 - clamped);
  const pointerX = 60 + 43 * Math.cos(angle);
  const pointerY = 60 - 43 * Math.sin(angle);

  return (
    <svg width="100%" height="84" viewBox="0 0 120 84">
      <path
        d="M 10 60 A 50 50 0 0 1 110 60"
        fill="none"
        stroke="#E9ECEF"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d="M 10 60 A 50 50 0 0 1 110 60"
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference}`}
      />
      <line
        x1="60"
        y1="60"
        x2={pointerX}
        y2={pointerY}
        stroke="#464853"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="60" cy="60" r="3" fill="#464853" />
    </svg>
  );
}

function CardContainer({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`safira-card h-full w-full p-4 text-left transition-all ${
        active ? "ring-2 ring-[#01B075]" : "hover:-translate-y-px"
      }`}
    >
      {children}
    </button>
  );
}

export function LeanFlowHeader({ metrics, activeCard, onCardClick }: Props) {
  const variationIsImprovement =
    metrics.mtiVariation !== null && metrics.mtiVariation < 0;
  const finishedVariationPositive =
    metrics.finishedVariation !== null && metrics.finishedVariation >= 0;

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <CardContainer
        active={activeCard === "finished"}
        onClick={() => onCardClick("finished")}
      >
        <div className="flex h-full flex-col">
          <Text size="xs" c="#7A7A7A" fw={600} tt="uppercase">
            Finalizadas
          </Text>
          <Text fw={700} c="#01B075" size="48px" ta="center" mt={18}>
            {metrics.totalFinished}
          </Text>
          <div className="mt-auto flex justify-end pt-4">
            <Tooltip
              multiline
              w={260}
              label={
                metrics.finishedVariation === null
                  ? `Sem base para comparação: ontem houve ${metrics.finishedYesterday} finalização(ões).`
                  : `Comparativo entre hoje (${metrics.finishedToday}) e ontem (${metrics.finishedYesterday}) com base nas integrações finalizadas por dia.`
              }
            >
              <Badge
                color={
                  metrics.finishedVariation === null
                    ? "gray"
                    : finishedVariationPositive
                      ? "green"
                      : "red"
                }
                variant="light"
                size="lg"
              >
                {formatSignedPercent(metrics.finishedVariation)}
              </Badge>
            </Tooltip>
          </div>
        </div>
      </CardContainer>

      <CardContainer
        active={activeCard === "mti"}
        onClick={() => onCardClick("mti")}
      >
        <div className="flex h-full flex-col">
          <Text size="xs" c="#7A7A7A" fw={600} tt="uppercase">
            Tempo Medio de Integracao (MTI)
          </Text>
          <Text fw={700} c="#01B075" size="36px" ta="center" mt={4}>
            {metrics.mtiDays.toFixed(1)}d
          </Text>
          <Sparkline values={metrics.mtiTrend.map((point) => point.value)} />
          <div className="mt-2 flex items-center justify-between">
            <Text size="11px" c="#7A7A7A">
              Tendencia mensal
            </Text>
            <Badge
              color={
                metrics.mtiVariation === null
                  ? "gray"
                  : variationIsImprovement
                    ? "green"
                    : "red"
              }
              variant="light"
              size="sm"
            >
              {formatSignedPercent(metrics.mtiVariation)}
            </Badge>
          </div>
        </div>
      </CardContainer>

      <Tooltip
        multiline
        w={280}
        label={`Percentual de postos criados neste mês que já chegaram em finalizado. Hoje são ${metrics.conversionFinishedMonth} de ${metrics.conversionCreatedMonth}.`}
      >
        <div>
          <CardContainer
            active={activeCard === "efficiency"}
            onClick={() => onCardClick("efficiency")}
          >
            <Text size="xs" c="#7A7A7A" fw={600} tt="uppercase">
              Eficiencia Operacional
            </Text>
            <EfficiencyGauge ratio={metrics.conversionRatio} />
            <Text fw={700} c="#464853" size="24px" ta="center" mt={-6}>
              {(metrics.conversionRatio * 100).toFixed(0)}%
            </Text>
            <Text size="11px" c="#7A7A7A" ta="center">
              {metrics.conversionFinishedMonth}/{metrics.conversionCreatedMonth}{" "}
              no mes
            </Text>
          </CardContainer>
        </div>
      </Tooltip>
    </div>
  );
}

export function FinishedByErpPanel({
  erpsFinalizados,
}: {
  erpsFinalizados: DashboardErpFinishedSummary[];
}) {
  const erpRing = buildErpRingSections(erpsFinalizados);
  const [hovered, setHovered] = useState(-1);
  const reset = () => setHovered(-1);
  console.log("ERP Ring Data:", erpRing, hovered);
  return (
    <div className="safira-card h-full w-full p-4">
      <div className="flex items-center justify-between">
        <Text size="xs" c="#7A7A7A" fw={600} tt="uppercase">
          Finalizados por ERP
        </Text>
      </div>

      <div className="mt-4 flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:justify-between">
        <div className="w-full flex flex-col items-center">
          <RingProgress
            size={254}
            thickness={22}
            onMouseLeave={() => setHovered(-1)}
            roundCaps
            classNames={{
              root: "w-full flex self-center sm:self-auto",
            }}
            sections={
              erpRing.rows.length
                ? erpRing.rows.map((item, index) => ({
                    value: item.value,
                    color: item.color,
                    tooltip: `${item.nome}: ${item.total}`,
                    onMouseEnter: () => setHovered(index),
                    onMouseLeave: reset,
                  }))
                : [{ value: 100, color: "#E9ECEF", tooltip: "Sem dados" }]
            }
            label={
              <div className="text-center">
                <Text c="#464853" size="12px" lh={1}>
                  {hovered >= 0 && erpRing.rows[hovered]
                    ? erpRing.rows[hovered].nome
                    : "Total"}
                </Text>
                <Text fw={700} c="#464853" size="32px" lh={1}>
                  {hovered >= 0 && erpRing.rows[hovered]
                    ? erpRing.rows[hovered].total
                    : erpRing.total}
                </Text>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}

export type { LeanFlowCardKey };
