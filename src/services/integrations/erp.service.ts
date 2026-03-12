import { fetchJson } from "@/services/integrations/api-base";
import { paginate } from "@/services/integrations/common";
import type { ERP, ListParams } from "@/types/core.types";

export async function listERPs(params: ListParams) {
  const erps = await fetchJson<ERP[]>("/api/erps");

  const filtered = params.search
    ? erps.filter((item) =>
        `${item.nome} ${item.versao}`
          .toLowerCase()
          .includes(params.search?.toLowerCase() ?? ""),
      )
    : erps;

  return paginate(filtered, params);
}

export async function createERP(payload: Omit<ERP, "id">) {
  return fetchJson<ERP>("/api/erps", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateERP(id: string, payload: Partial<Omit<ERP, "id">>) {
  return fetchJson<ERP>(`/api/erps/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteERP(id: string) {
  await fetchJson<void>(`/api/erps/${id}`, { method: "DELETE" });
}
