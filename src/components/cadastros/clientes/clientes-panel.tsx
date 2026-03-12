"use client";

import { Grid, Group, Tabs, TextInput } from "@mantine/core";
import { useState } from "react";

import { CrudSection } from "@/components/cadastros/crud-section";
import { CADASTROS_PANEL_VALUES } from "@/components/cadastros/types";
import { usePagination } from "@/hooks/use-pagination";
import {
  useClientesQuery,
  useCreateClienteMutation,
  useDeleteClienteMutation,
  useUpdateClienteMutation,
} from "@/hooks/use-safira-data";

import type { ClienteCrudRow } from "./types";

export function ClientesPanel() {
  const [clienteSearch, setClienteSearch] = useState("");
  const [clientePostoCnpjFilter, setClientePostoCnpjFilter] = useState("");
  const clientesPagination = usePagination(1, 15);

  const clientes = useClientesQuery({
    page: clientesPagination.page,
    pageSize: clientesPagination.pageSize,
    search: clienteSearch,
    postoCnpj: clientePostoCnpjFilter || undefined,
  });

  const createCliente = useCreateClienteMutation();
  const updateCliente = useUpdateClienteMutation();
  const deleteCliente = useDeleteClienteMutation();

  const rows: ClienteCrudRow[] = (clientes.data?.data ?? []).map((item) => ({
    id: item.id,
    nome: item.razaoSocial,
    referencia: item.cnpj,
  }));

  return (
    <Tabs.Panel value={CADASTROS_PANEL_VALUES.CLIENTES} pt={8}>
      <Grid gutter={8}>
        <Grid.Col span={12}>
          <Group mb={8} align="end" wrap="wrap">
            <TextInput
              size="xs"
              label="Filtrar por CNPJ do posto"
              placeholder="00.000.000/0000-00"
              value={clientePostoCnpjFilter}
              onChange={(event) => {
                setClientePostoCnpjFilter(event.currentTarget.value);
                clientesPagination.setPage(1);
              }}
              w={240}
            />
          </Group>

          <CrudSection
            title="Clientes"
            subtitle="CRUD com padrão unificado"
            rows={rows}
            total={clientes.data?.total ?? 0}
            page={clientesPagination.page}
            pageSize={clientesPagination.pageSize}
            onPageChange={clientesPagination.setPage}
            loading={clientes.isFetching}
            onSearchChange={setClienteSearch}
            onCreate={async (values) =>
              createCliente.mutateAsync({
                razaoSocial: values.nome,
                nomeFantasia: values.nome,
                cnpj: values.referencia,
                postosAbastece: [],
              })
            }
            onUpdate={async (id, values) =>
              updateCliente.mutateAsync({
                id,
                payload: {
                  razaoSocial: values.nome,
                  nomeFantasia: values.nome,
                  cnpj: values.referencia,
                },
              })
            }
            onDelete={async (id) => deleteCliente.mutateAsync(id)}
          />
        </Grid.Col>
      </Grid>
    </Tabs.Panel>
  );
}
