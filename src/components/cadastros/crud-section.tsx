"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Group, Modal, Paper, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { DataTable } from "@/components/ui/data-table";
import { SectionHeader } from "@/components/ui/section-header";

const schema = z.object({
  nome: z.string().min(2, "Informe o nome"),
  referencia: z.string().min(2, "Informe referência"),
});

type FormData = z.infer<typeof schema>;

type Row = {
  id: string;
  nome: string;
  referencia: string;
};

type Props = {
  title: string;
  subtitle: string;
  loading?: boolean;
  rows: Row[];
  referenciaLabel?: string;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onCreate: (data: FormData) => Promise<unknown>;
  onUpdate?: (id: string, data: FormData) => Promise<unknown>;
  onDelete: (id: string) => Promise<void>;
  onSearchChange: (search: string) => void;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Nao foi possivel concluir a operacao.";
}

export function CrudSection({
  title,
  loading,
  rows,
  referenciaLabel = "CNPJ",
  total,
  page,
  pageSize,
  onPageChange,
  onCreate,
  onUpdate,
  onDelete,
  onSearchChange,
}: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<Row | null>(null);
  const [createOpened, setCreateOpened] = useState(false);
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", referencia: "" },
  });

  const editForm = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", referencia: "" },
  });

  return (
    <Paper withBorder p={20} radius={8}>
      <SectionHeader title={title} />

      <Group gap={8} mb={10} align="end" justify="space-between" wrap="wrap">
        <TextInput
          size="xs"
          placeholder="Buscar por nome"
          onChange={(event) => {
            onSearchChange(event.currentTarget.value);
            onPageChange(1);
          }}
          w={220}
        />
        <Button
          size="xs"
          color="safira"
          onClick={() => {
            form.reset({ nome: "", referencia: "" });
            setCreateOpened(true);
          }}
        >
          Adicionar
        </Button>
      </Group>

      <DataTable<Row>
        columns={[
          {
            key: "referencia",
            header: referenciaLabel,
            render: (row) => row.referencia,
          },
          { key: "nome", header: "Nome", render: (row) => row.nome },
          {
            key: "acoes",
            header: "",
            align: "right",
            render: (row) => (
              <Group justify="flex-end" gap={6} wrap="nowrap">
                {onUpdate ? (
                  <Button
                    size="compact-xs"
                    variant="light"
                    onClick={() => {
                      setEditingRow(row);
                      editForm.reset({
                        nome: row.nome,
                        referencia: row.referencia,
                      });
                    }}
                  >
                    Editar
                  </Button>
                ) : null}
                <Button
                  size="compact-xs"
                  variant="light"
                  color="red"
                  onClick={() => setConfirmId(row.id)}
                >
                  Excluir
                </Button>
              </Group>
            ),
          },
        ]}
        rows={rows}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={onPageChange}
        loading={loading}
        rowKey={(row) => row.id}
      />

      <Modal
        opened={Boolean(confirmId)}
        onClose={() => setConfirmId(null)}
        title="Confirmar exclusão"
        centered
      >
        <Group justify="flex-end">
          <Button
            size="xs"
            variant="default"
            onClick={() => setConfirmId(null)}
          >
            Cancelar
          </Button>
          <Button
            size="xs"
            color="red"
            onClick={async () => {
              if (!confirmId) return;
              try {
                await onDelete(confirmId);
                notifications.show({
                  color: "safira",
                  message: "Registro removido",
                });
                setConfirmId(null);
              } catch (error) {
                notifications.show({
                  color: "red",
                  title: "Falha ao excluir",
                  message: getErrorMessage(error),
                });
              }
            }}
          >
            Confirmar
          </Button>
        </Group>
      </Modal>

      <Modal
        opened={createOpened}
        onClose={() => setCreateOpened(false)}
        title={`Adicionar ${title.slice(0, -1) || "registro"}`}
        centered
      >
        <Group gap={8} mb={12} wrap="nowrap" align="end">
          <Controller
            control={form.control}
            name="nome"
            render={({ field, fieldState }) => (
              <TextInput
                {...field}
                label="Nome"
                size="xs"
                error={fieldState.error?.message}
                w={220}
              />
            )}
          />

          <Controller
            control={form.control}
            name="referencia"
            render={({ field, fieldState }) => (
              <TextInput
                {...field}
                label={referenciaLabel}
                size="xs"
                error={fieldState.error?.message}
                w={220}
              />
            )}
          />
        </Group>

        <Group justify="flex-end">
          <Button
            size="xs"
            variant="default"
            onClick={() => setCreateOpened(false)}
          >
            Cancelar
          </Button>
          <Button
            size="xs"
            color="safira"
            onClick={form.handleSubmit(async (values) => {
              try {
                await onCreate(values);
                notifications.show({
                  color: "safira",
                  message: `${title} cadastrado com sucesso`,
                });
                form.reset();
                setCreateOpened(false);
              } catch (error) {
                notifications.show({
                  color: "red",
                  title: "Falha ao cadastrar",
                  message: getErrorMessage(error),
                });
              }
            })}
          >
            Salvar
          </Button>
        </Group>
      </Modal>

      <Modal
        opened={Boolean(editingRow)}
        onClose={() => setEditingRow(null)}
        title="Editar registro"
        centered
      >
        <Group gap={8} mb={12} wrap="nowrap" align="end">
          <Controller
            control={editForm.control}
            name="nome"
            render={({ field, fieldState }) => (
              <TextInput
                {...field}
                label="Nome"
                size="xs"
                error={fieldState.error?.message}
                w={220}
              />
            )}
          />

          <Controller
            control={editForm.control}
            name="referencia"
            render={({ field, fieldState }) => (
              <TextInput
                {...field}
                label={referenciaLabel}
                size="xs"
                error={fieldState.error?.message}
                w={220}
              />
            )}
          />
        </Group>

        <Group justify="flex-end">
          <Button
            size="xs"
            variant="default"
            onClick={() => setEditingRow(null)}
          >
            Cancelar
          </Button>
          <Button
            size="xs"
            color="safira"
            onClick={editForm.handleSubmit(async (values) => {
              if (!editingRow || !onUpdate) return;
              try {
                await onUpdate(editingRow.id, values);
                notifications.show({
                  color: "safira",
                  message: `${title} atualizado com sucesso`,
                });
                setEditingRow(null);
              } catch (error) {
                notifications.show({
                  color: "red",
                  title: "Falha ao atualizar",
                  message: getErrorMessage(error),
                });
              }
            })}
          >
            Salvar
          </Button>
        </Group>
      </Modal>
    </Paper>
  );
}
