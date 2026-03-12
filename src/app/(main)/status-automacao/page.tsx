"use client";

import {
  Avatar,
  Badge,
  Button,
  Box,
  FloatingIndicator,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Search, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { PostoFormModal } from "@/components/postos/posto-form-modal";
import { ErpSelect } from "@/components/ui/erp-select";
import {
  useClientesQuery,
  useERPsQuery,
  useInfinitePostosPageQuery,
  usePostoRedesQuery,
  useUpdatePostoMutation,
} from "@/hooks/use-safira-data";
import { getStatusPalette } from "@/lib/status-colors";
import {
  AUTOMACAO_TIPO_LABEL,
  AutomacaoEtapaKey,
  AutomacaoTipoKey,
  normalizeAutomacaoEtapaKey,
} from "@/services/automation";
import type { Posto } from "@/types/core.types";

type KanbanStatus = AutomacaoEtapaKey;
type TipoFilter = "all" | AutomacaoTipoKey;

type KanbanColumn = {
  status: KanbanStatus;
  title: string;
  subtitle: string;
};

const COLUMNS: KanbanColumn[] = [
  {
    status: AutomacaoEtapaKey.aguardando,
    title: "Aguardando",
    subtitle: "Pendentes de início",
  },
  {
    status: AutomacaoEtapaKey.em_andamento,
    title: "Em andamento",
    subtitle: "Integrações em progresso",
  },
  {
    status: AutomacaoEtapaKey.bloqueado,
    title: "Bloqueado",
    subtitle: "Dependências e impedimentos",
  },
  {
    status: AutomacaoEtapaKey.finalizado,
    title: "Finalizado",
    subtitle: "Concluídos",
  },
];

function normalizeStatus(value: string | null | undefined): KanbanStatus {
  return normalizeAutomacaoEtapaKey(value);
}

function formatStatusLabel(status: KanbanStatus) {
  if (status === AutomacaoEtapaKey.em_andamento) return "Em andamento";
  if (status === AutomacaoEtapaKey.bloqueado) return "Bloqueado";
  if (status === AutomacaoEtapaKey.finalizado) return "Finalizado";
  return "Aguardando";
}

function getDaysInColumn(posto: Posto) {
  const base = posto.automacao.dataEtapa;
  if (!base) return 0;

  const diffMs = Date.now() - base.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function getAnalystInitials(name: string | null | undefined) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 2);

  if (parts.length === 0) return "?";
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export default function StatusAutomacaoPage() {
  const [search, setSearch] = useState("");
  const [redeFilter, setRedeFilter] = useState<string | null>(null);
  const [erpFilter, setErpFilter] = useState<string | null>(null);
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>("all");
  const [editing, setEditing] = useState<Posto | null>(null);
  const tipoRefs = useRef<Record<TipoFilter, HTMLButtonElement | null>>({
    all: null,
    [AutomacaoTipoKey.automacao]: null,
    [AutomacaoTipoKey.semi_automacao]: null,
    [AutomacaoTipoKey.manual]: null,
  });

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<KanbanStatus | null>(null);
  const [requiredModalOpened, setRequiredModalOpened] = useState(false);
  const [pendingMove, setPendingMove] = useState<{
    posto: Posto;
    targetStatus: KanbanStatus;
  } | null>(null);
  const [requiredTipo, setRequiredTipo] =
    useState<Posto["automacao"]["tipo"]>(undefined);
  const [requiredRedeId, setRequiredRedeId] = useState<string | null>(null);
  const [requiredErp, setRequiredErp] = useState("");
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const editingOpened = Boolean(editing);

  const redesQuery = usePostoRedesQuery();
  const clientesQuery = useClientesQuery({
    page: 1,
    pageSize: 5000,
    enabled: editingOpened,
  });
  const erpsQuery = useERPsQuery({
    page: 1,
    pageSize: 5000,
  });

  const postosQuery = useInfinitePostosPageQuery({
    pageSize: 100,
    search: search.trim() || undefined,
    redeId: redeFilter ?? undefined,
    erp: erpFilter ?? undefined,
    tipo: tipoFilter === "all" ? undefined : tipoFilter,
  });
  const {
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingPostos,
  } = postosQuery;

  const updatePostoMutation = useUpdatePostoMutation();

  const rows = useMemo(() => {
    return (postosQuery.data?.pages ?? []).flatMap((page) => page.data);
  }, [postosQuery.data?.pages]);

  useEffect(() => {
    const node = loadMoreRef.current;

    if (!node || !hasNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (!entry?.isIntersecting || isFetchingNextPage) {
          return;
        }

        void fetchNextPage();
      },
      {
        rootMargin: "400px 0px",
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const redeSelectOptions = useMemo(
    () =>
      ((redesQuery.data ?? []) as Array<{ id: string; nome: string }>).map(
        (item) => ({ value: item.id, label: item.nome }),
      ),
    [redesQuery.data],
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

  const erpOptions = useMemo(() => {
    const registeredErps = (erpsQuery.data?.data ?? [])
      .map((item) => item.nome)
      .filter(Boolean);

    const fallbackFromRows = rows
      .map((row) => row.erp)
      .filter((value): value is string => Boolean(value));

    return Array.from(new Set([...registeredErps, ...fallbackFromRows])).sort(
      (a, b) => a.localeCompare(b),
    );
  }, [erpsQuery.data?.data, rows]);

  const tipoOptions: Array<{ value: TipoFilter; label: string }> = [
    { value: "all", label: "Todos" },
    {
      value: AutomacaoTipoKey.automacao,
      label: AUTOMACAO_TIPO_LABEL[AutomacaoTipoKey.automacao],
    },
    {
      value: AutomacaoTipoKey.semi_automacao,
      label: AUTOMACAO_TIPO_LABEL[AutomacaoTipoKey.semi_automacao],
    },
    {
      value: AutomacaoTipoKey.manual,
      label: AUTOMACAO_TIPO_LABEL[AutomacaoTipoKey.manual],
    },
  ];

  const grouped = useMemo(() => {
    const initial: Record<KanbanStatus, Posto[]> = {
      [AutomacaoEtapaKey.aguardando]: [],
      [AutomacaoEtapaKey.em_andamento]: [],
      [AutomacaoEtapaKey.bloqueado]: [],
      [AutomacaoEtapaKey.finalizado]: [],
    };

    rows.forEach((item) => {
      initial[normalizeStatus(item.automacao.etapa)].push(item);
    });

    (Object.keys(initial) as KanbanStatus[]).forEach((status) => {
      initial[status].sort((a, b) => getDaysInColumn(b) - getDaysInColumn(a));
    });

    return initial;
  }, [rows]);

  async function persistDropStatus(
    posto: Posto,
    targetStatus: KanbanStatus,
    options?: {
      tipo?: Posto["automacao"]["tipo"];
      redeId?: string | null;
      erp?: string;
    },
  ) {
    await updatePostoMutation.mutateAsync({
      id: posto.id,
      payload: {
        redeId: options?.redeId ?? posto.redeId,
        erp: options?.erp ?? posto.erp,
        automacao: {
          ...posto.automacao,
          tipo: options?.tipo ?? posto.automacao.tipo,
          etapa: targetStatus,
          dataEtapa: new Date(),
        },
      },
    });
  }

  function hasMissingRequiredFields(posto: Posto) {
    return (
      !posto.automacao.tipo ||
      !posto.redeId ||
      !(posto.erp && posto.erp.trim().length > 0)
    );
  }

  async function handleDrop(targetStatus: KanbanStatus, droppedId?: string) {
    const movedId = droppedId || draggingId;
    setDropTarget(null);

    if (!movedId) return;

    const moved = rows.find((item) => item.id === movedId);
    setDraggingId(null);

    if (!moved) return;

    const currentStatus = normalizeStatus(moved.automacao.etapa);
    if (currentStatus === targetStatus) return;

    if (hasMissingRequiredFields(moved)) {
      setPendingMove({ posto: moved, targetStatus });
      setRequiredTipo(moved.automacao.tipo ?? undefined);
      setRequiredRedeId(moved.redeId ?? null);
      setRequiredErp(moved.erp ?? "");
      setRequiredModalOpened(true);
      return;
    }

    try {
      await persistDropStatus(moved, targetStatus);

      notifications.show({
        color: "safira",
        message: `Status atualizado para ${formatStatusLabel(targetStatus)}`,
      });
    } catch (error) {
      notifications.show({
        color: "red",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar o status.",
      });
    }
  }

  async function handleSaveRequiredFields() {
    if (!pendingMove) return;

    const erpTrimmed = requiredErp.trim();
    if (!requiredTipo || !requiredRedeId || !erpTrimmed) {
      notifications.show({
        color: "yellow",
        message: "Preencha tipo, rede e ERP antes de mover o card.",
      });
      return;
    }

    try {
      await persistDropStatus(pendingMove.posto, pendingMove.targetStatus, {
        tipo: requiredTipo,
        redeId: requiredRedeId,
        erp: erpTrimmed,
      });

      notifications.show({
        color: "safira",
        message: `Status atualizado para ${formatStatusLabel(
          pendingMove.targetStatus,
        )}`,
      });

      setRequiredModalOpened(false);
      setPendingMove(null);
      setRequiredTipo(undefined);
      setRequiredRedeId(null);
      setRequiredErp("");
    } catch (error) {
      notifications.show({
        color: "red",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar o status.",
      });
    }
  }

  return (
    <Stack gap={12}>
      <Paper p={20} radius={12}>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(240px,1.4fr)_180px_180px_minmax(320px,1fr)]">
          <TextInput
            size="xs"
            label="Buscar posto"
            placeholder="Nome fantasia, razão social, CNPJ..."
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            leftSection={<Search size={14} />}
            w="100%"
          />

          <Select
            size="xs"
            label="Rede"
            placeholder="Todas"
            data={redeSelectOptions}
            value={redeFilter}
            onChange={setRedeFilter}
            clearable
            searchable
            w="100%"
          />

          <ErpSelect
            label="ERP"
            placeholder="Todos"
            options={erpOptions}
            value={erpFilter}
            onChange={setErpFilter}
            w="100%"
          />

          <Box>
            <Text size="xs" c="#7A7A7A" mb={6}>
              Tipo de automação
            </Text>
            <Box
              pos="relative"
              className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1"
            >
              {tipoOptions.map((option) => (
                <Button
                  key={option.value}
                  ref={(node) => {
                    tipoRefs.current[option.value] = node;
                  }}
                  onClick={() => setTipoFilter(option.value)}
                  variant="subtle"
                  color={tipoFilter === option.value ? "white" : "gray"}
                  size="compact-sm"
                  className="relative z-1 rounded-md px-3 py-1.5 text-xs font-medium text-gray-700"
                >
                  {option.label}
                </Button>
              ))}

              <FloatingIndicator
                target={tipoRefs.current[tipoFilter]}
                parent={tipoRefs.current.all?.parentElement ?? null}
                className="rounded-md border border-emerald-200 bg-emerald-700 text-white shadow-sm"
              />
            </Box>
          </Box>
        </div>
      </Paper>

      {postosQuery.isError ? (
        <Paper p={16} radius={12}>
          <Text size="sm" c="red">
            Não foi possível carregar os postos para o board.
          </Text>
          <Text size="xs" c="#7A7A7A" mt={4}>
            {postosQuery.error instanceof Error
              ? postosQuery.error.message
              : "Erro desconhecido."}
          </Text>
        </Paper>
      ) : null}

      <Group justify="space-between" px={4}>
        <Text size="xs" c="#7A7A7A">
          {isLoadingPostos
            ? "Carregando postos..."
            : `${rows.length} de ${postosQuery.data?.pages[0]?.total ?? 0} posto(s) carregados`}
        </Text>
        {isFetchingNextPage ? (
          <Text size="xs" c="#7A7A7A">
            Carregando próxima página...
          </Text>
        ) : null}
      </Group>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((column) => {
          const items = grouped[column.status] ?? [];
          const highlighted = dropTarget === column.status;

          return (
            <Paper
              key={column.status}
              p={16}
              radius={12}
              className={
                highlighted
                  ? "border-2 border-dashed border-emerald-400"
                  : "border border-gray-100"
              }
              onDragOver={(event) => {
                event.preventDefault();
                setDropTarget(column.status);
              }}
              onDragLeave={() => {
                if (dropTarget === column.status) setDropTarget(null);
              }}
              onDrop={(event) => {
                event.preventDefault();
                const droppedId = event.dataTransfer.getData("text/plain");
                void handleDrop(column.status, droppedId);
              }}
            >
              <Group justify="space-between" mb={10}>
                <div>
                  <Text fw={700} c="#333333" size="sm">
                    {column.title}
                  </Text>
                  <Text size="xs" c="#7A7A7A">
                    {column.subtitle}
                  </Text>
                </div>
                <Badge color="gray" variant="light">
                  {isLoadingPostos && rows.length === 0 ? "..." : items.length}
                </Badge>
              </Group>

              <Stack gap={8}>
                {items.map((item) => {
                  const days = getDaysInColumn(item);
                  const status = normalizeStatus(item.automacao.etapa);
                  const palette = getStatusPalette(status);
                  const analystName =
                    item.automacao.analistaResponsavel?.trim();

                  return (
                    <button
                      type="button"
                      key={item.id}
                      draggable
                      onClick={() => setEditing(item)}
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", item.id);
                        setDraggingId(item.id);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDropTarget(null);
                      }}
                      className="relative w-full cursor-pointer overflow-hidden rounded-[10px] border border-gray-200 bg-white text-left shadow-sm transition hover:border-gray-300 hover:shadow-md"
                      style={{
                        opacity:
                          updatePostoMutation.isPending &&
                          draggingId === item.id
                            ? 0.6
                            : 1,
                      }}
                    >
                      <div
                        className="absolute inset-y-0 left-0 w-1.5"
                        style={{ backgroundColor: palette.solid }}
                      />

                      <Stack gap={8} className="relative p-3 pl-4">
                        <Box className="self-start">
                          <Tooltip
                            label={`ERP: ${item.erp ?? "Não informado"}`}
                            withArrow
                          >
                            <Badge
                              color="gray"
                              variant="light"
                              radius="sm"
                              size="sm"
                            >
                              {item.erp ?? "Sem ERP"}
                            </Badge>
                          </Tooltip>
                        </Box>

                        <Stack gap={2} className="min-w-0">
                          <Tooltip
                            label={item.nomeFantasia}
                            withArrow
                            multiline
                            maw={260}
                          >
                            <Text fw={700} size="sm" c="#2F2F2F" lineClamp={1}>
                              {item.nomeFantasia}
                            </Text>
                          </Tooltip>
                          <Tooltip
                            label={item.razaoSocial}
                            withArrow
                            multiline
                            maw={260}
                          >
                            <Text size="xs" c="#6B7280" lineClamp={1}>
                              {item.razaoSocial}
                            </Text>
                          </Tooltip>
                        </Stack>

                        <Group gap={6} wrap="wrap">
                          <Tooltip
                            label={`Rede: ${item.redeNome ?? "Sem rede"}`}
                            withArrow
                          >
                            <Badge
                              color="indigo"
                              variant="light"
                              radius="sm"
                              size="xs"
                            >
                              {item.redeNome ?? "Sem rede"}
                            </Badge>
                          </Tooltip>

                          {item.automacao.tipo ? (
                            <Tooltip
                              label={`Tipo: ${item.automacao.tipo}`}
                              withArrow
                            >
                              <Badge
                                color="teal"
                                variant="light"
                                radius="sm"
                                size="xs"
                              >
                                {item.automacao.tipo}
                              </Badge>
                            </Tooltip>
                          ) : null}
                        </Group>

                        <Group
                          justify="space-between"
                          align="end"
                          wrap="nowrap"
                        >
                          <Group gap={12} wrap="nowrap">
                            <Tooltip
                              label={`${item.clientesQueAbastecem.length} cliente(s) que abastecem`}
                              withArrow
                            >
                              <Group gap={4} wrap="nowrap">
                                <Users size={14} className="text-gray-500" />
                                <Text size="xs" c="#4B5563" fw={600}>
                                  {item.clientesQueAbastecem.length}
                                </Text>
                              </Group>
                            </Tooltip>

                            <Tooltip
                              label={`Há ${days} dia(s) nesta etapa`}
                              withArrow
                            >
                              <Text size="xs" c="#92400E" fw={500}>
                                Há {days} dia{days === 1 ? "" : "s"}
                              </Text>
                            </Tooltip>
                          </Group>

                          <Tooltip
                            label={analystName || "Sem analista responsável"}
                            withArrow
                          >
                            <Avatar
                              size={28}
                              radius="xl"
                              color={analystName ? "safira" : "gray"}
                              variant={analystName ? "filled" : "light"}
                            >
                              {getAnalystInitials(analystName)}
                            </Avatar>
                          </Tooltip>
                        </Group>
                      </Stack>
                    </button>
                  );
                })}

                {items.length === 0 ? (
                  <Text size="xs" c="#9CA3AF">
                    Nenhum posto nesta etapa com os filtros atuais.
                  </Text>
                ) : null}
              </Stack>
            </Paper>
          );
        })}
      </div>

      <Box ref={loadMoreRef} h={1} />

      {!isLoadingPostos && rows.length === 0 && !postosQuery.isError ? (
        <Paper p={16} radius={12}>
          <Text size="sm" c="#6B7280">
            Nenhum posto encontrado com os filtros atuais.
          </Text>
        </Paper>
      ) : null}

      {!postosQuery.hasNextPage && rows.length > 0 ? (
        <Text size="xs" c="#9CA3AF" ta="center">
          Todos os postos disponíveis para este filtro já foram carregados.
        </Text>
      ) : null}

      <Modal
        opened={requiredModalOpened}
        onClose={() => {
          if (updatePostoMutation.isPending) return;
          setRequiredModalOpened(false);
          setPendingMove(null);
        }}
        title="Completar dados obrigatórios"
        centered
      >
        <Stack gap={10}>
          <Text size="sm" c="#4B5563">
            Para mover este card, preencha os campos faltantes de automação.
          </Text>

          <Select
            size="xs"
            label="Tipo de automação"
            data={["AUTOMAÇÃO", "SEMI-AUTOMAÇÃO", "MANUAL"]}
            value={requiredTipo ?? null}
            onChange={(value) =>
              setRequiredTipo(
                (value as Posto["automacao"]["tipo"]) ?? undefined,
              )
            }
            clearable={false}
          />

          <Select
            size="xs"
            label="Rede"
            data={redeSelectOptions}
            value={requiredRedeId}
            onChange={setRequiredRedeId}
            searchable
            clearable={false}
          />

          <ErpSelect
            label="ERP"
            options={erpOptions}
            value={requiredErp || null}
            onChange={(value) => setRequiredErp(value ?? "")}
            clearable={false}
            placeholder="Selecione"
          />

          <Group justify="flex-end" mt={4}>
            <Button
              variant="default"
              size="xs"
              onClick={() => {
                setRequiredModalOpened(false);
                setPendingMove(null);
              }}
              disabled={updatePostoMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              size="xs"
              color="safira"
              onClick={() => {
                void handleSaveRequiredFields();
              }}
              loading={updatePostoMutation.isPending}
            >
              Salvar e mover
            </Button>
          </Group>
        </Stack>
      </Modal>

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
          redeOptions={redeSelectOptions}
          erpOptions={erpOptions}
          clienteOptions={clienteOptions}
          onClose={() => setEditing(null)}
          onSubmit={async (values) => {
            await updatePostoMutation.mutateAsync({
              id: editing.id,
              payload: values,
            });

            notifications.show({
              color: "safira",
              message: "Posto atualizado com sucesso",
            });

            setEditing(null);
          }}
        />
      ) : null}
    </Stack>
  );
}
