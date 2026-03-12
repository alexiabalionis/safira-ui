"use client";

import {
  ActionIcon,
  Button,
  Dialog,
  Group,
  Paper,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Pencil, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { PostoFormModal } from "@/components/postos/posto-form-modal";
import { DataTable } from "@/components/ui/data-table";
import { EditStatusModal } from "@/components/ui/edit-status-modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableFilters } from "@/components/ui/table-filters";
import { usePagination } from "@/hooks/use-pagination";
import {
  useClientesQuery,
  useCreatePostoMutation,
  useERPsQuery,
  usePostoRedesQuery,
  usePostosPageQuery,
  useUpdatePostoMutation,
} from "@/hooks/use-safira-data";
import {
  AUTOMACAO_ETAPA_OPTIONS,
  AUTOMACAO_TIPO_OPTIONS,
  AutomacaoEtapaKey,
  AutomacaoTipoKey,
  normalizeAutomacaoEtapaKey,
  normalizeAutomacaoTipoKey,
} from "@/services/automation";
import type { Posto } from "@/types/core.types";

export default function PostosPage() {
  const { page, pageSize, setPage, setPageSize } = usePagination(1, 25);
  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState<AutomacaoTipoKey | null>(null);
  const [erpFiltro, setErpFiltro] = useState<string | null>(null);
  const [redeIdFiltro, setRedeIdFiltro] = useState<string | null>(null);
  const [etapa, setEtapa] = useState<AutomacaoEtapaKey | null>(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Posto | null>(null);
  const [selectedPostoIds, setSelectedPostoIds] = useState<string[]>([]);
  const [batchPromptOpened, setBatchPromptOpened] = useState(false);
  const [batchEditOpened, setBatchEditOpened] = useState(false);
  const postoFormOpened = creating || Boolean(editing);

  const postoRedesQuery = usePostoRedesQuery();
  const erpsQuery = useERPsQuery({
    page: 1,
    pageSize: 5000,
  });
  const clientesQuery = useClientesQuery({
    page: 1,
    pageSize: 5000,
    enabled: postoFormOpened,
  });

  const query = usePostosPageQuery({
    page,
    pageSize,
    search,
    startDate: ultimaAtualizacao ? `${ultimaAtualizacao}T00:00:00` : undefined,
    endDate: ultimaAtualizacao ? `${ultimaAtualizacao}T23:59:59` : undefined,
    tipo: tipo ?? undefined,
    erp: erpFiltro ?? undefined,
    redeId: redeIdFiltro ?? undefined,
    etapa: etapa ?? undefined,
  });
  const updateMutation = useUpdatePostoMutation();
  const createMutation = useCreatePostoMutation();

  const redeOptions = useMemo(
    () =>
      ((postoRedesQuery.data ?? []) as Array<{ id: string; nome: string }>).map(
        (item) => ({ value: item.id, label: item.nome }),
      ),
    [postoRedesQuery.data],
  );

  const clienteOptions = useMemo(
    () =>
      (clientesQuery.data?.data ?? []).map((cliente) => ({
        id: cliente.id,
        cnpj: cliente.cnpj,
        razaoSocial: cliente.razaoSocial,
        nomeFantasia: cliente.nomeFantasia,
      })),
    [clientesQuery.data?.data],
  );

  const erpOptions = useMemo(
    () =>
      Array.from(
        new Set(
          (erpsQuery.data?.data ?? []).map((item) => item.nome).filter(Boolean),
        ),
      ),
    [erpsQuery.data?.data],
  );

  const currentRows = useMemo(() => query.data?.data ?? [], [query.data?.data]);

  useEffect(() => {
    const validIds = new Set(currentRows.map((row) => row.id));
    setSelectedPostoIds((prev) => prev.filter((id) => validIds.has(id)));
  }, [currentRows]);

  useEffect(() => {
    if (selectedPostoIds.length > 1) {
      setBatchPromptOpened(true);
      return;
    }

    setBatchPromptOpened(false);
    setBatchEditOpened(false);
  }, [selectedPostoIds.length]);

  const batchInitialTipo = undefined;
  const batchInitialEtapa = undefined;
  const batchInitialErp = undefined;

  const emptyPosto = useMemo<Omit<Posto, "id">>(
    () => ({
      cnpjEc: "",
      cnpjEcDigits: "",
      razaoSocial: "",
      nomeFantasia: "",
      cidade: "",
      uf: "SP",
      redeId: redeOptions[0]?.value ?? null,
      redeNome: redeOptions[0]?.label ?? null,
      erp: null,
      responsavelPosto: undefined,
      telefone: undefined,
      email: undefined,
      automacao: {
        tipo: undefined,
        etapa: AutomacaoEtapaKey.aguardando,
        dataEtapa: null,
        analistaResponsavel: undefined,
      },
      clientesQueAbastecem: [
        {
          id: "",
          cnpj: "",
          razaoSocial: "",
          nomeFantasia: "",
        },
      ],
    }),
    [redeOptions],
  );

  return (
    <Group w="100%">
      <Paper p={20} radius={12} w="100%">
        <TableFilters
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          searchLabel="Razão social / Nome fantasia / CNPJ"
          date={ultimaAtualizacao}
          dateLabel="Última atualização"
          onDateChange={(value) => {
            setUltimaAtualizacao(value);
            setPage(1);
          }}
          phase={tipo}
          onPhaseChange={(value) => {
            setTipo(normalizeAutomacaoTipoKey(value));
            setPage(1);
          }}
          phaseOptions={AUTOMACAO_TIPO_OPTIONS}
          phaseLabel="Tipo"
          erp={erpFiltro}
          onErpChange={(value) => {
            setErpFiltro(value);
            setPage(1);
          }}
          erpOptions={erpOptions}
          erpLabel="ERP"
          network={redeIdFiltro}
          onNetworkChange={(value) => {
            setRedeIdFiltro(value);
            setPage(1);
          }}
          networkOptions={redeOptions}
          networkLabel="Rede"
          status={etapa}
          onStatusChange={(value) => {
            setEtapa(value ? normalizeAutomacaoEtapaKey(value) : null);
            setPage(1);
          }}
          statusOptions={AUTOMACAO_ETAPA_OPTIONS}
          statusLabel="Status"
          actions={
            <Group gap={8}>
              <Button
                size="xs"
                leftSection={<Plus size={14} />}
                color="safira"
                onClick={() => setCreating(true)}
              >
                Novo Posto
              </Button>
            </Group>
          }
        />
      </Paper>

      <Paper p={20} radius={12} w="100%">
        <DataTable<Posto>
          columns={[
            {
              key: "cnpjEc",
              header: "CNPJ",
              sortable: true,
              sortAccessor: (row) => row.cnpjEc,
              render: (row) => row.cnpjEc,
            },
            {
              key: "razaoSocial",
              header: "Razão Social",
              sortable: true,
              sortAccessor: (row) => row.razaoSocial,
              render: (row) => row.razaoSocial,
            },
            {
              key: "nomeFantasia",
              header: "Nome Fantasia",
              sortable: true,
              sortAccessor: (row) => row.nomeFantasia,
              render: (row) => row.nomeFantasia,
            },
            {
              key: "rede",
              header: "Rede",
              sortable: true,
              sortAccessor: (row) => row.redeNome ?? "",
              render: (row) => row.redeNome ?? "-",
            },
            {
              key: "automacao",
              header: "Automação",
              render: (row) => {
                const tipoKey = normalizeAutomacaoTipoKey(row.automacao.tipo);
                if (!tipoKey) return "-";

                return (
                  AUTOMACAO_TIPO_OPTIONS.find(
                    (option) => option.value === tipoKey,
                  )?.label ?? "-"
                );
              },
            },

            {
              key: "dataEtapa",
              header: "Última atualização",
              sortable: true,
              sortAccessor: (row) => row.automacao.dataEtapa,
              render: (row) =>
                row.automacao.dataEtapa ? (
                  <Tooltip
                    label={row.automacao.dataEtapa.toLocaleDateString("pt-BR")}
                    withArrow
                  >
                    <span>
                      {row.automacao.dataEtapa.toLocaleDateString("pt-BR")}
                    </span>
                  </Tooltip>
                ) : (
                  "-"
                ),
            },
            {
              key: "status",
              header: "Status",
              render: (row) =>
                row.automacao.etapa ? (
                  <StatusBadge
                    status={
                      row.automacao.etapa as
                        | AutomacaoEtapaKey.aguardando
                        | AutomacaoEtapaKey.em_andamento
                        | AutomacaoEtapaKey.bloqueado
                        | AutomacaoEtapaKey.finalizado
                    }
                  />
                ) : (
                  "-"
                ),
            },
            {
              key: "acoes",
              header: "",
              align: "right",
              render: (row) => (
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={() => setEditing(row)}
                >
                  <Pencil size={14} />
                </ActionIcon>
              ),
            },
          ]}
          rows={currentRows}
          total={query.data?.total ?? 0}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[15, 25, 50, 100]}
          loading={query.isFetching}
          rowKey={(row) => row.id}
          selectableRows
          selectedRowKeys={selectedPostoIds}
          onSelectedRowKeysChange={setSelectedPostoIds}
        />

        <Dialog
          withCloseButton
          shadow="lg"
          withBorder
          opened={batchPromptOpened && selectedPostoIds.length > 1}
          onClose={() => setBatchPromptOpened(false)}
          title="Edição em lote"
        >
          <Group justify="space-between">
            {/* <Text size="sm" mb="md" fw={700}>
              Deseja editar {selectedPostoIds.length} postos selecionados?
            </Text> */}
            <Button
              size="sm"
              color="yellow"
              onClick={() => {
                setBatchPromptOpened(false);
                setBatchEditOpened(true);
              }}
            >
              Atualizar os postos selecionados
            </Button>
          </Group>
        </Dialog>

        <EditStatusModal
          opened={batchEditOpened && selectedPostoIds.length > 1}
          onClose={() => setBatchEditOpened(false)}
          initialFase={batchInitialTipo ?? AutomacaoTipoKey.automacao}
          initialErp={batchInitialErp}
          initialStatus={batchInitialEtapa}
          faseOptions={AUTOMACAO_TIPO_OPTIONS}
          erpOptions={erpOptions}
          faseLabel="Automação"
          statusOptions={AUTOMACAO_ETAPA_OPTIONS}
          onSave={async (value) => {
            if (selectedPostoIds.length < 2) return;

            if (!value.erp && !value.fase && !value.status) {
              notifications.show({
                color: "yellow",
                message: "Selecione ao menos um campo para atualizar.",
              });
              return;
            }

            await Promise.all(
              selectedPostoIds.map(async (id) => {
                const current = currentRows.find((row) => row.id === id);
                if (!current) return;

                const payload: Partial<Omit<Posto, "id">> = {
                  ...(value.erp !== undefined
                    ? { erp: value.erp || null }
                    : {}),
                  ...(value.fase || value.status
                    ? {
                        automacao: {
                          ...current.automacao,
                          tipo:
                            normalizeAutomacaoTipoKey(value.fase) ??
                            current.automacao.tipo,
                          etapa: value.status
                            ? normalizeAutomacaoEtapaKey(value.status)
                            : current.automacao.etapa,
                          dataEtapa: new Date(),
                        },
                      }
                    : {}),
                };

                await updateMutation.mutateAsync({
                  id,
                  payload,
                });
              }),
            );

            notifications.show({
              color: "safira",
              message: `${selectedPostoIds.length} postos atualizados em lote com sucesso`,
            });

            setSelectedPostoIds([]);
          }}
        />

        <PostoFormModal
          opened={creating}
          title="Novo Posto"
          initialValue={emptyPosto}
          redeOptions={redeOptions}
          erpOptions={erpOptions}
          clienteOptions={clienteOptions}
          onClose={() => setCreating(false)}
          onSubmit={async (values) => {
            await createMutation.mutateAsync(values);
            notifications.show({
              color: "safira",
              message: "Posto criado com sucesso",
            });
          }}
        />

        {editing ? (
          <PostoFormModal
            opened={Boolean(editing)}
            title="Editar Posto"
            initialValue={{
              cnpjEc: editing.cnpjEc,
              cnpjEcDigits: editing.cnpjEcDigits,
              razaoSocial: editing.razaoSocial,
              nomeFantasia: editing.nomeFantasia,
              cidade: editing.cidade,
              uf: editing.uf,
              redeId: editing.redeId,
              redeNome: editing.redeNome,
              erp: editing.erp,
              responsavelPosto: editing.responsavelPosto,
              telefone: editing.telefone,
              email: editing.email,
              automacao: editing.automacao,
              clientesQueAbastecem: editing.clientesQueAbastecem,
            }}
            redeOptions={redeOptions}
            erpOptions={erpOptions}
            clienteOptions={clienteOptions}
            onClose={() => setEditing(null)}
            onSubmit={async (values) => {
              await updateMutation.mutateAsync({
                id: editing.id,
                payload: values,
              });
              notifications.show({
                color: "safira",
                message: "Posto atualizado com sucesso",
              });
            }}
          />
        ) : null}
      </Paper>
    </Group>
  );
}
