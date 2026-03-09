"use client";

import { Button, Group, Modal, Select, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useMemo, useState } from "react";

import { ErpSelect } from "@/components/ui/erp-select";
import type { Posto } from "@/services/types";

type PostoFormInput = Omit<Posto, "id">;

type Props = {
  opened: boolean;
  title: string;
  initialValue: PostoFormInput;
  redeOptions: Array<{ value: string; label: string }>;
  erpOptions: string[];
  clienteOptions: Array<{
    id: string;
    cnpj: string;
    razaoSocial: string;
    nomeFantasia: string;
  }>;
  onClose: () => void;
  onSubmit: (payload: PostoFormInput) => Promise<void>;
};

const tipoOptions = ["AUTOMAÇÃO", "SEMI-AUTOMAÇÃO", "MANUAL"];
const etapaOptions = ["AGUARDANDO", "EM_ANDAMENTO", "FINALIZADO"];
const ufOptions = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

function toInputDate(value: Date | null) {
  if (!value) return "";
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromInputDate(value: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function PostoFormModal({
  opened,
  title,
  initialValue,
  redeOptions,
  erpOptions,
  clienteOptions,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<PostoFormInput>(initialValue);
  const [submitting, setSubmitting] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(
    null,
  );

  const clientesDoPosto = useMemo(
    () => form.clientesQueAbastecem ?? [],
    [form.clientesQueAbastecem],
  );

  useEffect(() => {
    setForm(initialValue);
    setSelectedClienteId(null);
  }, [initialValue, opened]);

  const clienteSelectData = useMemo(
    () =>
      clienteOptions.map((cliente) => ({
        value: cliente.id,
        label: `${cliente.razaoSocial} (${cliente.cnpj})`,
      })),
    [clienteOptions],
  );

  function handleVincularCliente() {
    if (!selectedClienteId) return;

    const clienteSelecionado = clienteOptions.find(
      (cliente) => cliente.id === selectedClienteId,
    );

    if (!clienteSelecionado) {
      notifications.show({
        color: "red",
        title: "Cliente não encontrado",
        message: "Não foi possível localizar o cliente selecionado.",
      });
      return;
    }

    const jaVinculado = form.clientesQueAbastecem.some(
      (cliente) => cliente.id === clienteSelecionado.id,
    );

    if (jaVinculado) {
      notifications.show({
        color: "yellow",
        title: "Cliente já vinculado",
        message: "Este cliente já está vinculado ao posto.",
      });
      return;
    }

    setForm((prev) => ({
      ...prev,
      clientesQueAbastecem: [
        ...prev.clientesQueAbastecem,
        {
          id: clienteSelecionado.id,
          cnpj: clienteSelecionado.cnpj,
          razaoSocial: clienteSelecionado.razaoSocial,
          nomeFantasia: clienteSelecionado.nomeFantasia,
        },
      ],
    }));

    setSelectedClienteId(null);
  }

  function handleDesvincularCliente(clienteId: string) {
    setForm((prev) => ({
      ...prev,
      clientesQueAbastecem: prev.clientesQueAbastecem.filter(
        (cliente) => cliente.id !== clienteId,
      ),
    }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (error) {
      notifications.show({
        color: "red",
        title: "Falha ao salvar posto",
        message:
          error instanceof Error && error.message.trim()
            ? error.message
            : "Nao foi possivel salvar as alteracoes.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title={title} centered size="xl">
      <div className="space-y-3">
        <div className="rounded-md border border-gray-200 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
            Identificação
          </p>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <TextInput
              size="xs"
              label="CNPJ EC"
              placeholder="00.000.000/0000-00"
              value={form.cnpjEc}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setForm((prev) => ({
                  ...prev,
                  cnpjEc: value,
                  cnpjEcDigits: value.replace(/\D/g, ""),
                }));
              }}
            />

            <TextInput
              size="xs"
              label="Razão Social"
              value={form.razaoSocial}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  razaoSocial: event.currentTarget.value,
                }))
              }
            />

            <TextInput
              size="xs"
              label="Nome Fantasia"
              value={form.nomeFantasia}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  nomeFantasia: event.currentTarget.value,
                }))
              }
            />
          </div>
        </div>

        <div className="rounded-md border border-gray-200 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
            Localização e Rede
          </p>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <TextInput
              size="xs"
              label="Cidade"
              value={form.cidade}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  cidade: event.currentTarget.value,
                }))
              }
            />

            <Select
              size="xs"
              label="UF"
              data={ufOptions}
              value={form.uf}
              onChange={(value) =>
                value && setForm((prev) => ({ ...prev, uf: value }))
              }
            />

            <Select
              size="xs"
              label="Rede"
              data={redeOptions}
              value={form.redeId}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, redeId: value ?? null }))
              }
              clearable
            />

            <ErpSelect
              label="ERP"
              value={form.erp ?? null}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  erp: value ?? null,
                }))
              }
              options={erpOptions}
              placeholder="Selecione"
            />
          </div>
        </div>

        <div className="rounded-md border border-gray-200 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
            Contato
          </p>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <TextInput
              size="xs"
              label="Responsável no Posto"
              value={form.responsavelPosto ?? ""}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  responsavelPosto: event.currentTarget.value,
                }))
              }
            />

            <TextInput
              size="xs"
              label="Telefone"
              value={form.telefone ?? ""}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  telefone: event.currentTarget.value,
                }))
              }
            />

            <TextInput
              size="xs"
              label="Email"
              value={form.email ?? ""}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  email: event.currentTarget.value,
                }))
              }
            />
          </div>
        </div>

        <div className="rounded-md border border-gray-200 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
            Automação
          </p>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <Select
              size="xs"
              label="Tipo de Automação"
              data={tipoOptions}
              value={form.automacao.tipo ?? null}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  automacao: {
                    ...prev.automacao,
                    tipo: (value as Posto["automacao"]["tipo"]) ?? undefined,
                  },
                }))
              }
              clearable
            />

            <Select
              size="xs"
              label="Etapa"
              data={etapaOptions}
              value={form.automacao.etapa ?? null}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  automacao: {
                    ...prev.automacao,
                    etapa: value ?? "AGUARDANDO",
                  },
                }))
              }
            />

            <TextInput
              size="xs"
              type="date"
              label="Data da Etapa"
              value={toInputDate(form.automacao.dataEtapa ?? null)}
              onChange={(event) => {
                const nextValue = fromInputDate(event.currentTarget.value);

                setForm((prev) => ({
                  ...prev,
                  automacao: {
                    ...prev.automacao,
                    dataEtapa: nextValue,
                  },
                }));
              }}
            />

            <TextInput
              size="xs"
              label="Analista Responsável"
              value={form.automacao.analistaResponsavel ?? ""}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  automacao: {
                    ...prev.automacao,
                    analistaResponsavel: event.currentTarget.value,
                  },
                }))
              }
            />
          </div>
        </div>

        <div className="rounded-md border border-gray-200 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
            Clientes do Posto
          </p>

          <Group mb={8} align="end" wrap="wrap">
            <Select
              size="xs"
              searchable
              clearable
              label="Vincular cliente cadastrado"
              placeholder="Selecione um cliente"
              data={clienteSelectData}
              value={selectedClienteId}
              onChange={setSelectedClienteId}
              w={420}
              nothingFoundMessage="Nenhum cliente encontrado"
            />
            <Button
              size="xs"
              color="safira"
              disabled={!selectedClienteId}
              onClick={handleVincularCliente}
            >
              Vincular
            </Button>
          </Group>

          {clientesDoPosto.length === 0 ? (
            <p className="text-xs text-gray-500">Nenhum cliente vinculado.</p>
          ) : (
            <div className="max-h-48 overflow-auto rounded-md border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1 text-left font-semibold text-gray-600">
                      CNPJ
                    </th>
                    <th className="px-2 py-1 text-left font-semibold text-gray-600">
                      Razão Social
                    </th>
                    <th className="px-2 py-1 text-left font-semibold text-gray-600">
                      Nome Fantasia
                    </th>
                    <th className="px-2 py-1 text-right font-semibold text-gray-600">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {clientesDoPosto.map((cliente, index) => (
                    <tr key={`${cliente.id}-${index}`}>
                      <td className="px-2 py-1">{cliente.cnpj}</td>
                      <td className="px-2 py-1">{cliente.razaoSocial}</td>
                      <td className="px-2 py-1">{cliente.nomeFantasia}</td>
                      <td className="px-2 py-1 text-right">
                        <Button
                          size="compact-xs"
                          variant="light"
                          color="red"
                          onClick={() => handleDesvincularCliente(cliente.id)}
                        >
                          Desvincular
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Group justify="flex-end" mt="md">
        <Button size="xs" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          size="xs"
          color="safira"
          loading={submitting}
          onClick={handleSubmit}
        >
          Salvar
        </Button>
      </Group>
    </Modal>
  );
}
