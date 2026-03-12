"use client";

import { BentoBaseCompositionCard } from "@/components/dashboard/bento-base-composition-card";
import { BentoCompletionHistoryCard } from "@/components/dashboard/bento-completion-history-card";
import { BentoErpPerformanceCard } from "@/components/dashboard/bento-erp-performance-card";
import { BentoMtiCard } from "@/components/dashboard/bento-mti-card";
import { BentoOperatorRankingCard } from "@/components/dashboard/bento-operator-ranking-card";
import { BentoWeeklyConversionCard } from "@/components/dashboard/bento-weekly-conversion-card";
import { useDashboardQuery } from "@/hooks/use-safira-data";

export default function DashboardPage() {
  const dashboard = useDashboardQuery();
  const leanFlow = dashboard.data?.leanFlow;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 24,
        padding: 24,
        background: "#F1F5F9",
        minHeight: "100%",
      }}
    >
      {/* Linha 1 */}
      <BentoBaseCompositionCard
        integrationStatus={dashboard.data?.integrationStatus}
        totals={dashboard.data?.totals}
      />
      <BentoMtiCard
        mtiDays={leanFlow?.mtiDays ?? 0}
        mtiTrend={leanFlow?.mtiTrend ?? []}
        mtiVariation={leanFlow?.mtiVariation ?? null}
      />
      <BentoWeeklyConversionCard
        throughputGoalRatio={leanFlow?.throughputGoalRatio ?? 0}
        throughput7d={leanFlow?.throughput7d ?? 0}
        throughputGoal={leanFlow?.throughputGoal ?? 0}
      />

      {/* Linha 2 */}
      <div style={{ gridColumn: "span 2", minHeight: 260 }}>
        <BentoCompletionHistoryCard
          dayData={leanFlow?.completionHistory.day ?? []}
          weekData={leanFlow?.completionHistory.week ?? []}
          monthData={leanFlow?.completionHistory.month ?? []}
        />
      </div>

      <BentoOperatorRankingCard rows={leanFlow?.operatorRanking ?? []} />

      {/* Linha 3 */}
      <div style={{ gridColumn: "span 2" }}>
        <BentoErpPerformanceCard
          rows={dashboard.data?.erps ?? []}
          mtiPerErp={leanFlow?.mtiPerErp ?? {}}
        />
      </div>
    </div>
  );
}
