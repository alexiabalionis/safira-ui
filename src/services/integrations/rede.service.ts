import { fetchJson } from "@/services/integrations/api-base";
import { paginate } from "@/services/integrations/common";
import type { ListParams, Network } from "@/types/core.types";

export async function listRedes(params: ListParams) {
  const redes =
    await fetchJson<Array<{ id: string; nome: string }>>("/api/redes");

  const mapped: Network[] = redes.map((item) => ({
    id: item.id,
    nome: item.nome,
    cnpj: "-",
    ativo: true,
  }));

  const filtered = params.search
    ? mapped.filter((item) =>
        item.nome.toLowerCase().includes(params.search?.toLowerCase() ?? ""),
      )
    : mapped;

  return paginate(filtered, params);
}

export async function createRede(payload: Omit<Network, "id">) {
  const created = await fetchJson<{ id: string; nome: string }>("/api/redes", {
    method: "POST",
    body: JSON.stringify({ nome: payload.nome }),
  });

  return {
    id: created.id,
    nome: created.nome,
    cnpj: payload.cnpj || "-",
    ativo: true,
  } satisfies Network;
}

export async function updateRede(
  id: string,
  payload: Partial<Omit<Network, "id">>,
) {
  const updated = await fetchJson<{ id: string; nome: string }>(
    `/api/redes/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({ nome: payload.nome }),
    },
  );

  return {
    id: updated.id,
    nome: updated.nome,
    cnpj: payload.cnpj || "-",
    ativo: payload.ativo ?? true,
  } satisfies Network;
}

export async function deleteRede(id: string) {
  await fetchJson<void>(`/api/redes/${id}`, { method: "DELETE" });
}
