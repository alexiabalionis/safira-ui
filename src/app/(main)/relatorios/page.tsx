"use client";

import { Badge, Button, Group, Paper, Select, Tabs } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Download } from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
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
import {
  AUTOMACAO_ETAPA_OPTIONS,
  AUTOMACAO_TIPO_OPTIONS,
  AutomacaoEtapaKey,
  AutomacaoTipoKey,
  normalizeAutomacaoEtapaKey,
  normalizeAutomacaoTipoKey,
} from "@/services/automation";
import type { IntegrationStatus, UserRole } from "@/types/core.types";
import type { ReportFilters, ReportRow } from "@/types/report.types";

type ReportTab = "postos" | "redes" | "erps" | "usuarios";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

export default function RelatoriosPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [activeTab, setActiveTab] = useState<ReportTab>("postos");

  const postosPagination = usePagination(1, 30);
  const redesPagination = usePagination(1, 30);
  const erpsPagination = usePagination(1, 30);
  const usersPagination = usePagination(1, 30);

  const [postoSearch, setPostoSearch] = useState("");
  const [postoDate, setPostoDate] = useState("");
  const [postoTipo, setPostoTipo] = useState<AutomacaoTipoKey | null>(null);
  const [postoErp, setPostoErp] = useState<string | null>(null);
  const [postoRedeId, setPostoRedeId] = useState<string | null>(null);
  const [postoEtapa, setPostoEtapa] = useState<AutomacaoEtapaKey | null>(null);

  const [redeSearch, setRedeSearch] = useState("");
  const [redeDate, setRedeDate] = useState("");

  const [erpSearch, setErpSearch] = useState("");
  const [erpDate, setErpDate] = useState("");
  const [erpStatus, setErpStatus] = useState<string | null>(null);

  const [userSearch, setUserSearch] = useState("");
  const [userDate, setUserDate] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<UserRole | null>(null);
  const [userStatusFilter, setUserStatusFilter] = useState<
    "ativo" | "inativo" | null
  >(null);
  const [passwordStateFilter, setPasswordStateFilter] = useState<
    "PENDENTE" | "CONCLUIDA" | null
  >(null);

  const [exporting, setExporting] = useState(false);

  const redesQuery = usePostoRedesQuery();
  const erpsQuery = useERPsQuery({
    page: 1,
    pageSize: 5000,
  });

  const selectedRedeId = postoRedeId ?? undefined;

  const erpOptions = Array.from(
    new Set(
      (erpsQuery.data?.data ?? []).map((item) => item.nome).filter(Boolean),
    ),
  );

  const redeOptions = (
    (redesQuery.data ?? []) as Array<{ id: string; nome: string }>
  ).map((item) => ({ value: item.id, label: item.nome }));

  const postosQuery = useReportsQuery({
    page: postosPagination.page,
    pageSize: postosPagination.pageSize,
    search: postoSearch,
    startDate: postoDate ? `${postoDate}T00:00:00` : undefined,
    endDate: postoDate ? `${postoDate}T23:59:59` : undefined,
    category: "Posto",
    tipo: postoTipo ?? undefined,
    erp: postoErp ?? undefined,
    redeId: selectedRedeId,
    etapa: postoEtapa ?? undefined,
    enabled: activeTab === "postos",
  });

  const redesReportQuery = useReportsQuery({
    page: redesPagination.page,
    pageSize: redesPagination.pageSize,
    search: redeSearch,
    startDate: redeDate ? `${redeDate}T00:00:00` : undefined,
    endDate: redeDate ? `${redeDate}T23:59:59` : undefined,
    category: "Rede",
    enabled: activeTab === "redes",
  });

  const erpsReportQuery = useReportsQuery({
    page: erpsPagination.page,
    pageSize: erpsPagination.pageSize,
    search: erpSearch,
    startDate: erpDate ? `${erpDate}T00:00:00` : undefined,
    endDate: erpDate ? `${erpDate}T23:59:59` : undefined,
    category: "ERP",
    erpStatus:
      (erpStatus as
        | "Aguardando"
        | "em_andamento"
        | "Bloqueado"
        | "Finalizado"
        | null) ?? undefined,
    enabled: activeTab === "erps",
  });

  const usersReportQuery = useReportsQuery({
    page: usersPagination.page,
    pageSize: usersPagination.pageSize,
    search: userSearch,
    startDate: userDate ? `${userDate}T00:00:00` : undefined,
    endDate: userDate ? `${userDate}T23:59:59` : undefined,
    category: "Usuário",
    userRole: userRoleFilter ?? undefined,
    userStatus: userStatusFilter ?? undefined,
    passwordState: passwordStateFilter ?? undefined,
    enabled: isAdmin && activeTab === "usuarios",
  });

  function buildExportFilters(): {
    filename: string;
    filters: ReportFilters;
    mapRows: (rows: ReportRow[]) => Array<Record<string, unknown>>;
  } {
    if (activeTab === "postos") {
      return {
        filename: `relatorio-postos-${Date.now()}.csv`,
        filters: {
          search: postoSearch,
          startDate: postoDate ? `${postoDate}T00:00:00` : undefined,
          endDate: postoDate ? `${postoDate}T23:59:59` : undefined,
          category: "Posto",
          tipo: postoTipo ?? undefined,
          erp: postoErp ?? undefined,
          redeId: selectedRedeId,
          etapa: postoEtapa ?? undefined,
        },
        mapRows: (rows) =>
          rows.map((row) => ({
            nome: row.nome,
            razaoSocial: row.referencia,
            cnpjEc: row.cnpjEc ?? "",
            cidade: row.cidade ?? "",
            uf: row.uf ?? "",
            rede: row.rede ?? "",
            erp: row.erp ?? "",
            tipoAutomacao: row.tipoAutomacao ?? "",
            status: row.status,
            atualizadoEm: formatDateTime(row.atualizadoEm),
          })),
      };
    }

    if (activeTab === "redes") {
      return {
        filename: `relatorio-redes-${Date.now()}.csv`,
        filters: {
          search: redeSearch,
          startDate: redeDate ? `${redeDate}T00:00:00` : undefined,
          endDate: redeDate ? `${redeDate}T23:59:59` : undefined,
          category: "Rede",
        },
        mapRows: (rows) =>
          rows.map((row) => ({
            nome: row.nome,
            atualizadoEm: formatDateTime(row.atualizadoEm),
          })),
      };
    }

    if (activeTab === "erps") {
      return {
        filename: `relatorio-erps-${Date.now()}.csv`,
        filters: {
          search: erpSearch,
          startDate: erpDate ? `${erpDate}T00:00:00` : undefined,
          endDate: erpDate ? `${erpDate}T23:59:59` : undefined,
          category: "ERP",
          erpStatus:
            (erpStatus as
              | "Aguardando"
              | "em_andamento"
              | "Finalizado"
              | null) ?? undefined,
        },
        mapRows: (rows) =>
          rows.map((row) => ({
            nome: row.nome,
            versao: row.referencia,
            status: row.status,
            atualizadoEm: formatDateTime(row.atualizadoEm),
          })),
      };
    }

    return {
      filename: `relatorio-usuarios-${Date.now()}.csv`,
      filters: {
        search: userSearch,
        startDate: userDate ? `${userDate}T00:00:00` : undefined,
        endDate: userDate ? `${userDate}T23:59:59` : undefined,
        category: "Usuário",
        userRole: userRoleFilter ?? undefined,
        userStatus: userStatusFilter ?? undefined,
        passwordState: passwordStateFilter ?? undefined,
      },
      mapRows: (rows) =>
        rows.map((row) => ({
          nome: row.nome,
          email: row.referencia,
          perfil: row.perfilUsuario ?? "",
          status: row.usuarioAtivo ? "Ativo" : "Inativo",
          trocaSenha: row.trocaSenhaPendente ? "Pendente" : "Concluída",
          atualizadoEm: formatDateTime(row.atualizadoEm),
        })),
    };
  }

  async function handleExportCsv() {
    if (activeTab === "usuarios" && !isAdmin) return;

    setExporting(true);
    try {
      const { filename, filters, mapRows } = buildExportFilters();
      const rows = await listReportsForExport(filters);

      if (rows.length === 0) {
        notifications.show({
          color: "yellow",
          title: "Sem dados para exportar",
          message: "Ajuste os filtros ou selecione outra entidade.",
        });
        return;
      }

      exportToCsv(filename, mapRows(rows));
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

      <Tabs
        value={activeTab}
        onChange={(value) => setActiveTab((value as ReportTab) ?? "postos")}
        variant="outline"
      >
        <Tabs.List>
          <Tabs.Tab value="postos">Postos</Tabs.Tab>
          <Tabs.Tab value="redes">Redes</Tabs.Tab>
          <Tabs.Tab value="erps">ERPs</Tabs.Tab>
          {isAdmin ? <Tabs.Tab value="usuarios">Usuários</Tabs.Tab> : null}
        </Tabs.List>

        <Tabs.Panel value="postos" pt={8}>
          <TableFilters
            search={postoSearch}
            onSearchChange={(value) => {
              setPostoSearch(value);
              postosPagination.setPage(1);
            }}
            searchLabel="Razão social / Nome fantasia"
            date={postoDate}
            dateLabel="Última atualização"
            onDateChange={(value) => {
              setPostoDate(value);
              postosPagination.setPage(1);
            }}
            phase={postoTipo}
            onPhaseChange={(value) => {
              setPostoTipo(normalizeAutomacaoTipoKey(value));
              postosPagination.setPage(1);
            }}
            phaseOptions={AUTOMACAO_TIPO_OPTIONS}
            phaseLabel="Tipo"
            erp={postoErp}
            onErpChange={(value) => {
              setPostoErp(value);
              postosPagination.setPage(1);
            }}
            erpOptions={erpOptions}
            erpLabel="ERP"
            network={postoRedeId}
            onNetworkChange={(value) => {
              setPostoRedeId(value);
              postosPagination.setPage(1);
            }}
            networkOptions={redeOptions}
            networkLabel="Rede"
            status={postoEtapa}
            onStatusChange={(value) => {
              setPostoEtapa(value ? normalizeAutomacaoEtapaKey(value) : null);
              postosPagination.setPage(1);
            }}
            statusOptions={AUTOMACAO_ETAPA_OPTIONS}
            statusLabel="Status"
          />

          <DataTable<ReportRow>
            columns={[
              {
                key: "nome",
                header: "Nome fantasia",
                render: (row) => row.nome,
              },
              {
                key: "referencia",
                header: "Razão social",
                render: (row) => row.referencia,
              },
              {
                key: "cnpj",
                header: "CNPJ",
                render: (row) => row.cnpjEc ?? "-",
              },
              {
                key: "rede",
                header: "Rede",
                render: (row) => row.rede ?? "SEM REDE",
              },
              {
                key: "erp",
                header: "ERP",
                render: (row) => row.erp ?? "SEM ERP",
              },
              {
                key: "tipo",
                header: "Tipo",
                render: (row) => row.tipoAutomacao ?? "-",
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
                render: (row) => formatDateTime(row.atualizadoEm),
              },
            ]}
            rows={postosQuery.data?.data ?? []}
            total={postosQuery.data?.total ?? 0}
            page={postosPagination.page}
            pageSize={postosPagination.pageSize}
            onPageChange={postosPagination.setPage}
            loading={postosQuery.isFetching}
            rowKey={(row) => row.id}
          />
        </Tabs.Panel>

        <Tabs.Panel value="redes" pt={8}>
          <TableFilters
            search={redeSearch}
            onSearchChange={(value) => {
              setRedeSearch(value);
              redesPagination.setPage(1);
            }}
            searchLabel="Nome da rede"
            date={redeDate}
            dateLabel="Última atualização"
            onDateChange={(value) => {
              setRedeDate(value);
              redesPagination.setPage(1);
            }}
          />

          <DataTable<ReportRow>
            columns={[
              {
                key: "nome",
                header: "Nome",
                render: (row) => row.nome,
              },
              {
                key: "atualizadoEm",
                header: "Atualizado em",
                render: (row) => formatDateTime(row.atualizadoEm),
              },
            ]}
            rows={redesReportQuery.data?.data ?? []}
            total={redesReportQuery.data?.total ?? 0}
            page={redesPagination.page}
            pageSize={redesPagination.pageSize}
            onPageChange={redesPagination.setPage}
            loading={redesReportQuery.isFetching}
            rowKey={(row) => row.id}
          />
        </Tabs.Panel>

        <Tabs.Panel value="erps" pt={8}>
          <TableFilters
            search={erpSearch}
            onSearchChange={(value) => {
              setErpSearch(value);
              erpsPagination.setPage(1);
            }}
            searchLabel="Nome / versão"
            date={erpDate}
            dateLabel="Última atualização"
            onDateChange={(value) => {
              setErpDate(value);
              erpsPagination.setPage(1);
            }}
            status={erpStatus}
            onStatusChange={(value) => {
              setErpStatus(value);
              erpsPagination.setPage(1);
            }}
            statusOptions={["Aguardando", "em_andamento", "Finalizado"]}
            statusLabel="Status"
          />

          <DataTable<ReportRow>
            columns={[
              {
                key: "nome",
                header: "Nome",
                render: (row) => row.nome,
              },
              {
                key: "versao",
                header: "Versão",
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
                render: (row) => formatDateTime(row.atualizadoEm),
              },
            ]}
            rows={erpsReportQuery.data?.data ?? []}
            total={erpsReportQuery.data?.total ?? 0}
            page={erpsPagination.page}
            pageSize={erpsPagination.pageSize}
            onPageChange={erpsPagination.setPage}
            loading={erpsReportQuery.isFetching}
            rowKey={(row) => row.id}
          />
        </Tabs.Panel>

        {isAdmin ? (
          <Tabs.Panel value="usuarios" pt={8}>
            <TableFilters
              search={userSearch}
              onSearchChange={(value) => {
                setUserSearch(value);
                usersPagination.setPage(1);
              }}
              searchLabel="Nome / e-mail"
              date={userDate}
              dateLabel="Última atualização"
              onDateChange={(value) => {
                setUserDate(value);
                usersPagination.setPage(1);
              }}
              actions={
                <Group gap={8} align="end">
                  <Select
                    size="xs"
                    label="Perfil"
                    value={userRoleFilter}
                    onChange={(value) => {
                      setUserRoleFilter((value as UserRole | null) ?? null);
                      usersPagination.setPage(1);
                    }}
                    clearable
                    data={[
                      { value: "admin", label: "Admin" },
                      { value: "operador", label: "Operador" },
                      { value: "visitante", label: "Visitante" },
                    ]}
                    w={140}
                  />
                  <Select
                    size="xs"
                    label="Status"
                    value={userStatusFilter}
                    onChange={(value) => {
                      setUserStatusFilter(
                        (value as "ativo" | "inativo" | null) ?? null,
                      );
                      usersPagination.setPage(1);
                    }}
                    clearable
                    data={[
                      { value: "ativo", label: "Ativo" },
                      { value: "inativo", label: "Inativo" },
                    ]}
                    w={140}
                  />
                  <Select
                    size="xs"
                    label="Troca de senha"
                    value={passwordStateFilter}
                    onChange={(value) => {
                      setPasswordStateFilter(
                        (value as "PENDENTE" | "CONCLUIDA" | null) ?? null,
                      );
                      usersPagination.setPage(1);
                    }}
                    clearable
                    data={[
                      { value: "PENDENTE", label: "Pendente" },
                      { value: "CONCLUIDA", label: "Concluída" },
                    ]}
                    w={170}
                  />
                </Group>
              }
            />

            <DataTable<ReportRow>
              columns={[
                {
                  key: "nome",
                  header: "Nome",
                  render: (row) => row.nome,
                },
                {
                  key: "email",
                  header: "E-mail",
                  render: (row) => row.referencia,
                },
                {
                  key: "perfil",
                  header: "Perfil",
                  render: (row) => row.perfilUsuario ?? "-",
                },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => (
                    <Badge color={row.usuarioAtivo ? "green" : "red"}>
                      {row.usuarioAtivo ? "Ativo" : "Inativo"}
                    </Badge>
                  ),
                },
                {
                  key: "trocaSenha",
                  header: "Troca de senha",
                  render: (row) =>
                    row.trocaSenhaPendente ? "Pendente" : "Concluída",
                },
                {
                  key: "atualizadoEm",
                  header: "Atualizado em",
                  render: (row) => formatDateTime(row.atualizadoEm),
                },
              ]}
              rows={usersReportQuery.data?.data ?? []}
              total={usersReportQuery.data?.total ?? 0}
              page={usersPagination.page}
              pageSize={usersPagination.pageSize}
              onPageChange={usersPagination.setPage}
              loading={usersReportQuery.isFetching}
              rowKey={(row) => row.id}
            />
          </Tabs.Panel>
        ) : null}
      </Tabs>
    </Paper>
  );
}
