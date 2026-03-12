"use client";

import { Button, Group, Paper, Progress, Tabs, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { FileUp } from "lucide-react";
import { ChangeEvent, useEffect, useRef, useState } from "react";

import { CADASTROS_PANEL_VALUES } from "@/components/cadastros/types";
import { DataTable } from "@/components/ui/data-table";
import { SectionHeader } from "@/components/ui/section-header";
import { useImportWayCsvMutation } from "@/hooks/use-safira-data";

import type { ImportFailureRow, ImportWaySummary } from "./types";

const IMPORT_PROGRESS_TICK_MS = 300;
const IMPORT_MS_PER_POSTO_ESTIMATE = 1300;

function estimateValidUniqueCnpjs(csvContent: string) {
  const lines = csvContent
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return 0;

  const digits = lines
    .slice(1)
    .map((line) => line.split(/[;,]/)[0]?.replace(/\D/g, "") ?? "")
    .filter((cnpj) => cnpj.length === 14)
    .slice(0, 50);

  return new Set(digits).size;
}

export function ImportacaoWayPanel() {
  const [importSummary, setImportSummary] = useState<ImportWaySummary | null>(
    null,
  );
  const [importFailures, setImportFailures] = useState<ImportFailureRow[]>([]);
  const [importProgressPercent, setImportProgressPercent] = useState(0);
  const [importEstimatedTotal, setImportEstimatedTotal] = useState(0);
  const [importEstimatedProcessed, setImportEstimatedProcessed] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const importStartedAtRef = useRef<number | null>(null);
  const importTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const importWayCsvMutation = useImportWayCsvMutation();

  useEffect(() => {
    return () => {
      if (importTimerRef.current) {
        clearInterval(importTimerRef.current);
        importTimerRef.current = null;
      }
    };
  }, []);

  async function handleImportWayCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const estimatedTotal = estimateValidUniqueCnpjs(content);

      setImportEstimatedTotal(estimatedTotal);
      setImportEstimatedProcessed(estimatedTotal > 0 ? 1 : 0);
      setImportProgressPercent(estimatedTotal > 0 ? 2 : 5);

      importStartedAtRef.current = Date.now();
      if (importTimerRef.current) {
        clearInterval(importTimerRef.current);
      }

      importTimerRef.current = setInterval(() => {
        const startedAt = importStartedAtRef.current;
        if (!startedAt) return;

        const elapsed = Date.now() - startedAt;

        if (estimatedTotal > 0) {
          const estimatedProcessed = Math.max(
            1,
            Math.min(
              estimatedTotal,
              Math.floor(elapsed / IMPORT_MS_PER_POSTO_ESTIMATE) + 1,
            ),
          );

          setImportEstimatedProcessed(estimatedProcessed);

          const pct = Math.min(
            95,
            Math.max(2, Math.round((estimatedProcessed / estimatedTotal) * 95)),
          );
          setImportProgressPercent(pct);
          return;
        }

        setImportProgressPercent((current) => Math.min(95, current + 3));
      }, IMPORT_PROGRESS_TICK_MS);

      const result = await importWayCsvMutation.mutateAsync(content);

      setImportEstimatedTotal(result.totalCnpjsValidos);
      setImportEstimatedProcessed(result.totalCnpjsValidos);
      setImportProgressPercent(100);

      setImportSummary({
        totalCnpjsCsv: result.totalCnpjsCsv,
        totalCnpjsValidos: result.totalCnpjsValidos,
        importados: result.importados,
        ignoradosDuplicados: result.ignoradosDuplicados,
      });
      setImportFailures(
        result.falhas.map((item, index) => ({
          id: `${item.cnpjEc}-${index}`,
          cnpjEc: item.cnpjEc,
          motivo: item.motivo,
        })),
      );

      notifications.show({
        color: result.falhas.length > 0 ? "yellow" : "safira",
        title: "Importação finalizada",
        message: `${result.importados} importados, ${result.ignoradosDuplicados} ignorados por duplicidade e ${result.falhas.length} falhas.`,
      });
    } catch (error) {
      setImportProgressPercent(0);
      setImportEstimatedProcessed(0);
      setImportEstimatedTotal(0);

      notifications.show({
        color: "red",
        title: "Falha na importação",
        message:
          error instanceof Error
            ? error.message
            : "Erro ao processar CSV na importação Way.",
      });
    } finally {
      if (importTimerRef.current) {
        clearInterval(importTimerRef.current);
        importTimerRef.current = null;
      }
      importStartedAtRef.current = null;
      event.currentTarget.value = "";
    }
  }

  return (
    <Tabs.Panel value={CADASTROS_PANEL_VALUES.IMPORTACAO_WAY} pt={8}>
      <Paper withBorder p={20} radius={8}>
        <SectionHeader title="Importação de CSV via Way API" />

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleImportWayCsv}
        />

        <Group mb={12}>
          <Button
            size="xs"
            color="safira"
            leftSection={<FileUp size={14} />}
            loading={importWayCsvMutation.isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            Carregar CSV
          </Button>
        </Group>

        {(importWayCsvMutation.isPending || importProgressPercent > 0) && (
          <Paper withBorder p={10} radius={8} mb={12}>
            <Group justify="space-between" mb={6}>
              <Text size="sm" fw={500}>
                Progresso da importação
              </Text>
              <Text size="sm" c="dimmed">
                {importProgressPercent}%
              </Text>
            </Group>

            <Progress
              value={importProgressPercent}
              color="safira"
              radius="sm"
              size="md"
              animated={importWayCsvMutation.isPending}
            />

            <Text size="xs" c="dimmed" mt={6}>
              {importWayCsvMutation.isPending
                ? `Processando postos (${importEstimatedProcessed}/${importEstimatedTotal || "?"}).`
                : "Processamento concluído."}
            </Text>
          </Paper>
        )}

        {importSummary ? (
          <Group gap={16} mb={12}>
            <Text size="sm">Total CSV: {importSummary.totalCnpjsCsv}</Text>
            <Text size="sm">
              CNPJs válidos: {importSummary.totalCnpjsValidos}
            </Text>
            <Text size="sm">Importados: {importSummary.importados}</Text>
            <Text size="sm">
              Duplicados ignorados: {importSummary.ignoradosDuplicados}
            </Text>
          </Group>
        ) : null}

        <DataTable<ImportFailureRow>
          columns={[
            {
              key: "cnpjEc",
              header: "CNPJ EC",
              render: (row) => row.cnpjEc,
            },
            {
              key: "motivo",
              header: "Motivo da Falha",
              render: (row) => row.motivo,
            },
          ]}
          rows={importFailures}
          total={importFailures.length}
          page={1}
          pageSize={20}
          onPageChange={() => undefined}
          loading={importWayCsvMutation.isPending}
          rowKey={(row) => row.id}
        />
      </Paper>
    </Tabs.Panel>
  );
}
