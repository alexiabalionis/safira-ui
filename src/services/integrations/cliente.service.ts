import { fetchJson } from "@/services/integrations/api-base";
import { paginate } from "@/services/integrations/common";
import type { Cliente, ListParams } from "@/types/core.types";

export async function listClientes(
  params: ListParams & {
    postoCnpj?: string;
  },
) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.postoCnpj) query.set("postoCnpj", params.postoCnpj);

  const path =
    query.size > 0 ? `/api/clientes?${query.toString()}` : "/api/clientes";
  const clientes = await fetchJson<Cliente[]>(path);

  const filtered = params.search
    ? clientes.filter((item) =>
        `${item.razaoSocial} ${item.nomeFantasia} ${item.cnpj}`
          .toLowerCase()
          .includes(params.search?.toLowerCase() ?? ""),
      )
    : clientes;

  return paginate(filtered, params);
}

export async function createCliente(payload: Omit<Cliente, "id">) {
  return fetchJson<Cliente>("/api/clientes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCliente(
  id: string,
  payload: Partial<Omit<Cliente, "id">>,
) {
  return fetchJson<Cliente>(`/api/clientes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteCliente(id: string) {
  await fetchJson<void>(`/api/clientes/${id}`, { method: "DELETE" });
}
