import { fetchJson } from "@/services/integrations/api-base";
import type { DashboardOverview, ListParams } from "@/types/core.types";
import type { ReportFilters, ReportRow } from "@/types/report.types";

function appendReportFilters(query: URLSearchParams, filters: ReportFilters) {
  if (filters.search) query.set("search", filters.search);
  if (filters.startDate) query.set("startDate", filters.startDate);
  if (filters.endDate) query.set("endDate", filters.endDate);
  if (filters.category) query.set("category", filters.category);
  if (filters.tipo) query.set("tipo", filters.tipo);
  if (filters.erp) query.set("erp", filters.erp);
  if (filters.erpStatus) query.set("erpStatus", filters.erpStatus);
  if (filters.redeId) query.set("redeId", filters.redeId);
  if (filters.etapa) query.set("etapa", filters.etapa);
  if (filters.userRole) query.set("userRole", filters.userRole);
  if (filters.userStatus) query.set("userStatus", filters.userStatus);
  if (filters.passwordState) query.set("passwordState", filters.passwordState);
}

export async function getDashboard() {
  return fetchJson<DashboardOverview>("/api/dashboard/overview");
}

export async function listReports(params: ListParams & ReportFilters) {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  });

  appendReportFilters(query, params);

  return fetchJson<{ data: ReportRow[]; total: number }>(
    `/api/dashboard/reports?${query.toString()}`,
  );
}

export async function listReportsForExport(filters: ReportFilters) {
  const query = new URLSearchParams({
    page: "1",
    pageSize: "1000",
  });

  appendReportFilters(query, filters);

  const response = await fetchJson<{ data: ReportRow[]; total: number }>(
    `/api/dashboard/reports/export?${query.toString()}`,
  );

  return response.data;
}
