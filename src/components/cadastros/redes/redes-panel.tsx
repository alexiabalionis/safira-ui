"use client";

import { Tabs } from "@mantine/core";
import { useState } from "react";

import { CrudSection } from "@/components/cadastros/crud-section";
import { CADASTROS_PANEL_VALUES } from "@/components/cadastros/types";
import { usePagination } from "@/hooks/use-pagination";
import {
  useCreateRedeMutation,
  useDeleteRedeMutation,
  useRedesQuery,
  useUpdateRedeMutation,
} from "@/hooks/use-safira-data";

import type { RedeCrudRow } from "./types";

export function RedesPanel() {
  const [redeSearch, setRedeSearch] = useState("");
  const redesPagination = usePagination(1, 15);

  const redes = useRedesQuery({
    page: redesPagination.page,
    pageSize: redesPagination.pageSize,
    search: redeSearch,
  });

  const createRede = useCreateRedeMutation();
  const updateRede = useUpdateRedeMutation();
  const deleteRede = useDeleteRedeMutation();

  const rows: RedeCrudRow[] = (redes.data?.data ?? []).map((item) => ({
    id: item.id,
    nome: item.nome,
    referencia: "",
  }));

  return (
    <Tabs.Panel value={CADASTROS_PANEL_VALUES.REDES} pt={8}>
      <CrudSection
        title="Redes"
        subtitle="CRUD com padrão unificado"
        referenciaLabel=""
        rows={rows}
        total={redes.data?.total ?? 0}
        page={redesPagination.page}
        pageSize={redesPagination.pageSize}
        onPageChange={redesPagination.setPage}
        loading={redes.isFetching}
        onSearchChange={setRedeSearch}
        onCreate={async (values) =>
          createRede.mutateAsync({
            nome: values.nome,
            cnpj: values.referencia,
            ativo: true,
          })
        }
        onUpdate={async (id, values) =>
          updateRede.mutateAsync({
            id,
            payload: {
              nome: values.nome,
              cnpj: values.referencia,
              ativo: true,
            },
          })
        }
        onDelete={async (id) => deleteRede.mutateAsync(id)}
      />
    </Tabs.Panel>
  );
}
