import type { PagedResult } from "@/types/core.types";

export function paginate<T>(
  list: T[],
  params: { page: number; pageSize: number },
): PagedResult<T> {
  const start = (params.page - 1) * params.pageSize;
  return {
    data: list.slice(start, start + params.pageSize),
    total: list.length,
  };
}

export function inDateRange(
  value: Date | null,
  startDate?: string,
  endDate?: string,
) {
  if (!value) return false;
  const timestamp = value.getTime();
  const start = startDate
    ? new Date(startDate).getTime()
    : Number.NEGATIVE_INFINITY;
  const end = endDate ? new Date(endDate).getTime() : Number.POSITIVE_INFINITY;
  return timestamp >= start && timestamp <= end;
}

export function emptyToNull(value: string | null | undefined) {
  if (typeof value !== "string") return value ?? null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseDate(value: string | null) {
  return value ? new Date(value) : null;
}

export function toIsoDate(value: Date | null) {
  return value ? value.toISOString() : null;
}
