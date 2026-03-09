"use client";

import { Button, Group, Paper, Select } from "@mantine/core";
import { Download } from "lucide-react";
import { useState } from "react";

import { DataTable } from "@/components/ui/data-table";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableFilters } from "@/components/ui/table-filters";
import { usePagination } from "@/hooks/use-pagination";
import {
  listReportsForExport,
  useERPsQuery,
  usePostoRedesQuery,
  useReportsQuery,
} from "@/hooks/use-safira-data";
import { exportToCsv } from "@/services/export";
import type { IntegrationStatus } from "@/services/types";

export default function RelatoriosPage() {
  const { page, pageSize, setPage } = usePagination(1, 30);
  const [search, setSearch] = useState("");
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState("");
  const [tipo, setTipo] = useState<string | null>(null);
  const [erpFiltro, setErpFiltro] = useState<string | null>(null);
  const [redeNomeFiltro, setRedeNomeFiltro] = useState<string | null>(null);
  const [etapa, setEtapa] = useState<string | null>(null);
  const [category, setCategory] = useState<"Posto" | "Rede" | "ERP" | null>(
    null,
  );
  const [exporting, setExporting] = useState(false);

  const redesQuery = usePostoRedesQuery();
  const erpsQuery = useERPsQuery({
    page: 1,
    pageSize: 5000,
  });

  const selectedRedeId =
    redeNomeFiltro && redesQuery.data
      ? ((redesQuery.data as Array<{ id: string; nome: string }>).find(
          (item) => item.nome === redeNomeFiltro,
        )?.id ?? undefined)
      : undefined;

  const erpOptions = Array.from(
    new Set(
      (erpsQuery.data?.data ?? []).map((item) => item.nome).filter(Boolean),
    ),
  );

  const redeOptions = (
    (redesQuery.data ?? []) as Array<{ id: string; nome: string }>
  ).map((item) => item.nome);

  const query = useReportsQuery({
    page,
    pageSize,
    search,
    startDate: ultimaAtualizacao ? `${ultimaAtualizacao}T00:00:00` : undefined,
    endDate: ultimaAtualizacao ? `${ultimaAtualizacao}T23:59:59` : undefined,
    category: category ?? undefined,
    tipo: tipo ?? undefined,
    erp: erpFiltro ?? undefined,
    redeId: selectedRedeId,
    etapa: etapa ?? undefined,
  });

  async function handleExportCsv() {
    setExporting(true);
    try {
      const rows = await listReportsForExport({
        search,
        startDate: ultimaAtualizacao
          ? `${ultimaAtualizacao}T00:00:00`
          : undefined,
        endDate: ultimaAtualizacao
          ? `${ultimaAtualizacao}T23:59:59`
          : undefined,
        category: category ?? undefined,
        tipo: tipo ?? undefined,
        erp: erpFiltro ?? undefined,
        redeId: selectedRedeId,
        etapa: etapa ?? undefined,
      });

      exportToCsv(`relatorio-safira-${Date.now()}.csv`, rows);
    } finally {
      setExporting(false);
    }
  }

  return (
    <Paper withBorder p={20} radius={12}>
      <Group justify="space-between" mb={8}>
        <SectionHeader title="Relatórios" />
        <Button
          size="xs"
          leftSection={<Download size={14} />}
          color="safira"
          loading={exporting}
          onClick={() => {
            void handleExportCsv();
          }}
        >
          Exportar CSV
        </Button>
      </Group>

      <Group mb={8}>
        <Select
          size="xs"
          value={category}
          onChange={(value) => {
            setCategory((value as "Posto" | "Rede" | "ERP" | null) ?? null);
            setPage(1);
          }}
          data={["Posto", "Rede", "ERP"]}
          clearable
          placeholder="Categoria"
          w={150}
        />
      </Group>

      <TableFilters
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchLabel="Razão social / Nome fantasia"
        date={ultimaAtualizacao}
        dateLabel="Última atualização"
        onDateChange={(value) => {
          setUltimaAtualizacao(value);
          setPage(1);
        }}
        phase={tipo}
        onPhaseChange={(value) => {
          setTipo(value);
          setPage(1);
        }}
        phaseOptions={["AUTOMAÇÃO", "SEMI-AUTOMAÇÃO", "MANUAL"]}
        phaseLabel="Tipo"
        erp={erpFiltro}
        onErpChange={(value) => {
          setErpFiltro(value);
          setPage(1);
        }}
        erpOptions={erpOptions}
        erpLabel="ERP"
        network={redeNomeFiltro}
        onNetworkChange={(value) => {
          setRedeNomeFiltro(value);
          setPage(1);
        }}
        networkOptions={redeOptions}
        networkLabel="Rede"
        status={etapa}
        onStatusChange={(value) => {
          setEtapa(value);
          setPage(1);
        }}
        statusOptions={["AGUARDANDO", "EM_ANDAMENTO", "FINALIZADO"]}
        statusLabel="Status"
      />

      <DataTable
        columns={[
          {
            key: "categoria",
            header: "Categoria",
            render: (row) => row.categoria,
          },
          { key: "nome", header: "Nome", render: (row) => row.nome },
          {
            key: "referencia",
            header: "Referência",
            render: (row) => row.referencia,
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <StatusBadge status={row.status as IntegrationStatus} />
            ),
          },
          {
            key: "atualizadoEm",
            header: "Atualizado em",
            render: (row) => new Date(row.atualizadoEm).toLocaleString("pt-BR"),
          },
        ]}
        rows={query.data?.data ?? []}
        total={query.data?.total ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        loading={query.isFetching}
        rowKey={(row) => row.id}
      />
    </Paper>
  );
}
