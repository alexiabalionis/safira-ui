"use client";

import {
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
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Search } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ErpSelect } from "@/components/ui/erp-select";
import {
  useERPsQuery,
  usePostoRedesQuery,
  usePostosQuery,
  useUpdatePostoMutation,
} from "@/hooks/use-safira-data";
import type { Posto } from "@/services/types";

type KanbanStatus = "AGUARDANDO" | "EM_ANDAMENTO" | "FINALIZADO";
type TipoFilter = "ALL" | "AUTOMAÇÃO" | "SEMI-AUTOMAÇÃO" | "MANUAL";

type KanbanColumn = {
  status: KanbanStatus;
  title: string;
  subtitle: string;
};

const COLUMNS: KanbanColumn[] = [
  {
    status: "AGUARDANDO",
    title: "Aguardando",
    subtitle: "Pendentes de início",
  },
  {
    status: "EM_ANDAMENTO",
    title: "Em andamento",
    subtitle: "Integrações em progresso",
  },
  {
    status: "FINALIZADO",
    title: "Finalizado",
    subtitle: "Concluídos",
  },
];

function normalizeStatus(value: string | null | undefined): KanbanStatus {
  if (value === "FINALIZADO") return "FINALIZADO";
  if (value === "EM_ANDAMENTO") return "EM_ANDAMENTO";
  return "AGUARDANDO";
}

function getDaysInColumn(posto: Posto) {
  const base = posto.automacao.dataEtapa;
  if (!base) return 0;

  const diffMs = Date.now() - base.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export default function StatusAutomacaoPage() {
  const [search, setSearch] = useState("");
  const [redeNomeFiltro, setRedeNomeFiltro] = useState<string | null>(null);
  const [erpFilter, setErpFilter] = useState<string | null>(null);
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>("ALL");
  const tipoRefs = useRef<Record<TipoFilter, HTMLButtonElement | null>>({
    ALL: null,
    AUTOMAÇÃO: null,
    "SEMI-AUTOMAÇÃO": null,
    MANUAL: null,
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

  const postosQuery = usePostosQuery({
    page: 1,
    pageSize: 500,
    search,
    redeId: selectedRedeId,
    tipo: tipoFilter === "ALL" ? undefined : tipoFilter,
  });

  const updatePostoMutation = useUpdatePostoMutation();

  const rows = useMemo(() => {
    const baseRows = postosQuery.data?.data ?? [];

    return baseRows.filter((item) => {
      if (erpFilter && (item.erp ?? "Não informado") !== erpFilter) {
        return false;
      }
      return true;
    });
  }, [postosQuery.data?.data, erpFilter]);

  const redeOptions = useMemo(
    () =>
      ((redesQuery.data ?? []) as Array<{ id: string; nome: string }>).map(
        (item) => item.nome,
      ),
    [redesQuery.data],
  );

  const redeSelectOptions = useMemo(
    () =>
      ((redesQuery.data ?? []) as Array<{ id: string; nome: string }>).map(
        (item) => ({ value: item.id, label: item.nome }),
      ),
    [redesQuery.data],
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
    { value: "ALL", label: "Todos" },
    { value: "AUTOMAÇÃO", label: "Automação" },
    { value: "SEMI-AUTOMAÇÃO", label: "Semi-automação" },
    { value: "MANUAL", label: "Manual" },
  ];

  const grouped = useMemo(() => {
    const initial: Record<KanbanStatus, Posto[]> = {
      AGUARDANDO: [],
      EM_ANDAMENTO: [],
      FINALIZADO: [],
    };

    rows.forEach((item) => {
      initial[normalizeStatus(item.automacao.etapa)].push(item);
    });

    (Object.keys(initial) as KanbanStatus[]).forEach((status) => {
      initial[status].sort((a, b) => {
        return getDaysInColumn(b) - getDaysInColumn(a);
      });
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
        message: `Status atualizado para ${targetStatus.replace("_", " ")}`,
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
        message: `Status atualizado para ${pendingMove.targetStatus.replace("_", " ")}`,
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
        <SectionHeader
          title="Status de Automação"
          subtitle="Board Kanban por etapa da automação"
        />

        <Group gap={8} align="end" wrap="wrap">
          <TextInput
            size="xs"
            label="Buscar posto"
            placeholder="Nome fantasia, razão social..."
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            leftSection={<Search size={14} />}
            w={250}
          />

          <Select
            size="xs"
            label="Rede"
            placeholder="Todas"
            data={redeOptions}
            value={redeNomeFiltro}
            onChange={setRedeNomeFiltro}
            clearable
            w={190}
          />

          <ErpSelect
            label="ERP"
            placeholder="Todos"
            options={erpOptions}
            value={erpFilter}
            onChange={setErpFilter}
            w={160}
          />
        </Group>

        <Box mt={12}>
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
                color="gray"
                size="compact-sm"
                className="relative z-1 rounded-md px-3 py-1.5 text-xs font-medium text-gray-700"
              >
                {option.label}
              </Button>
            ))}

            <FloatingIndicator
              target={tipoRefs.current[tipoFilter]}
              parent={tipoRefs.current.ALL?.parentElement ?? null}
              className="rounded-md border border-emerald-200 bg-white shadow-sm"
            />
          </Box>
        </Box>
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

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
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
                  {postosQuery.isLoading ? "..." : items.length}
                </Badge>
              </Group>

              <Stack gap={8}>
                {items.map((item) => {
                  const days = getDaysInColumn(item);

                  return (
                    <Paper
                      key={item.id}
                      p={12}
                      radius={10}
                      withBorder
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", item.id);
                        setDraggingId(item.id);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDropTarget(null);
                      }}
                      style={{
                        cursor: "grab",
                        opacity:
                          updatePostoMutation.isPending &&
                          draggingId === item.id
                            ? 0.6
                            : 1,
                      }}
                    >
                      <Stack gap={4}>
                        <Group
                          justify="space-between"
                          align="start"
                          wrap="nowrap"
                        >
                          <Text fw={600} size="sm" c="#2F2F2F" lineClamp={1}>
                            {item.nomeFantasia}
                          </Text>
                          <StatusBadge
                            status={normalizeStatus(item.automacao.etapa)}
                          />
                        </Group>

                        <Text size="xs" c="#6B7280" lineClamp={1}>
                          {item.razaoSocial}
                        </Text>

                        <Text size="xs" c="#6B7280" lineClamp={1}>
                          Rede: {item.redeNome ?? "Sem rede"}
                        </Text>

                        <Text size="xs" c="#6B7280" lineClamp={1}>
                          ERP: {item.erp ?? "Não informado"}
                        </Text>

                        <Text
                          size="xs"
                          c="#92400E"
                          fw={500}
                          ta="right"
                          className="self-end"
                        >
                          Há {days} dia{days === 1 ? "" : "s"} nesta coluna
                        </Text>
                      </Stack>
                    </Paper>
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
    </Stack>
  );
}
