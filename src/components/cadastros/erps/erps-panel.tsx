"use client";

import { Tabs } from "@mantine/core";
import { useState } from "react";

import { CrudSection } from "@/components/cadastros/crud-section";
import { CADASTROS_PANEL_VALUES } from "@/components/cadastros/types";
import { usePagination } from "@/hooks/use-pagination";
import {
  useCreateERPMutation,
  useDeleteERPMutation,
  useERPsQuery,
  useUpdateERPMutation,
} from "@/hooks/use-safira-data";

import type { ErpCrudRow } from "./types";

export function ErpsPanel() {
  const [erpSearch, setErpSearch] = useState("");
  const erpsPagination = usePagination(1, 15);

  const erps = useERPsQuery({
    page: erpsPagination.page,
    pageSize: erpsPagination.pageSize,
    search: erpSearch,
  });

  const createERP = useCreateERPMutation();
  const updateERP = useUpdateERPMutation();
  const deleteERP = useDeleteERPMutation();

  const rows: ErpCrudRow[] = (erps.data?.data ?? []).map((item) => ({
    id: item.id,
    nome: item.nome,
    referencia: item.versao,
  }));

  return (
    <Tabs.Panel value={CADASTROS_PANEL_VALUES.ERPS} pt={8}>
      <CrudSection
        title="ERPs"
        subtitle=""
        referenciaLabel="Versão"
        rows={rows}
        total={erps.data?.total ?? 0}
        page={erpsPagination.page}
        pageSize={erpsPagination.pageSize}
        onPageChange={erpsPagination.setPage}
        loading={erps.isFetching}
        onSearchChange={setErpSearch}
        onCreate={async (values) =>
          createERP.mutateAsync({
            nome: values.nome,
            versao: values.referencia,
            status: "Aguardando",
          })
        }
        onUpdate={async (id, values) =>
          updateERP.mutateAsync({
            id,
            payload: {
              nome: values.nome,
              versao: values.referencia,
            },
          })
        }
        onDelete={async (id) => deleteERP.mutateAsync(id)}
      />
    </Tabs.Panel>
  );
}
