import {
  Box,
  Button,
  FloatingIndicator,
  Group,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useMemo, useRef } from "react";
import type { ReactNode } from "react";

import { ErpSelect } from "@/components/ui/erp-select";

type Option = string | { value: string; label: string };

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  searchLabel?: string;
  startDate?: string;
  endDate?: string;
  startDateLabel?: string;
  endDateLabel?: string;
  date?: string;
  dateLabel?: string;
  onDateChange?: (value: string) => void;
  onStartDateChange?: (value: string) => void;
  onEndDateChange?: (value: string) => void;
  phase?: string | null;
  onPhaseChange?: (value: string | null) => void;
  phaseOptions?: Option[];
  phaseLabel?: string;
  erp?: string | null;
  onErpChange?: (value: string | null) => void;
  erpOptions?: Option[];
  erpLabel?: string;
  network?: string | null;
  onNetworkChange?: (value: string | null) => void;
  networkOptions?: Option[];
  networkLabel?: string;
  status?: string | null;
  onStatusChange?: (value: string | null) => void;
  statusOptions?: Option[];
  statusLabel?: string;
  actions?: ReactNode;
};

type SegmentOption = {
  value: string;
  label: string;
};

function toSegmentOptions(options: Option[]) {
  return options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option,
  );
}

function SegmentedFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null | undefined;
  options: SegmentOption[];
  onChange: (value: string | null) => void;
}) {
  const allOptions = useMemo<SegmentOption[]>(
    () => [{ value: "ALL", label: "Todos" }, ...options],
    [options],
  );

  const selectedValue = value ?? "ALL";
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  return (
    <Box>
      <Text size="xs" c="#7A7A7A" mb={6}>
        {label}
      </Text>
      <Box
        pos="relative"
        className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1"
      >
        {allOptions.map((option) => (
          <Button
            key={option.value}
            ref={(node) => {
              refs.current[option.value] = node;
            }}
            onClick={() =>
              onChange(option.value === "ALL" ? null : option.value)
            }
            variant="subtle"
            color={selectedValue === option.value ? "white" : "gray"}
            size="compact-sm"
            className="relative z-1 rounded-md px-3 py-1.5 text-xs font-medium text-gray-700"
          >
            {option.label}
          </Button>
        ))}

        <FloatingIndicator
          target={refs.current[selectedValue]}
          parent={refs.current.ALL?.parentElement ?? null}
          className="rounded-md border border-emerald-200 bg-emerald-700 text-white shadow-sm"
        />
      </Box>
    </Box>
  );
}

export function TableFilters({
  search,
  onSearchChange,
  searchLabel,
  startDate,
  endDate,
  startDateLabel,
  endDateLabel,
  date,
  dateLabel,
  onDateChange,
  onStartDateChange,
  onEndDateChange,
  phase,
  onPhaseChange,
  phaseOptions,
  phaseLabel,
  erp,
  onErpChange,
  erpOptions,
  erpLabel,
  network,
  onNetworkChange,
  networkOptions,
  networkLabel,
  status,
  onStatusChange,
  statusOptions,
  statusLabel,
  actions,
}: Props) {
  const phaseSegmentOptions = useMemo(
    () => toSegmentOptions(phaseOptions ?? []),
    [phaseOptions],
  );

  const statusSegmentOptions = useMemo(
    () => toSegmentOptions(statusOptions ?? []),
    [statusOptions],
  );

  return (
    <Stack gap={10} mb={18}>
      <Box className="overflow-x-auto">
        <Group gap={8} align="end" wrap="nowrap" className="min-w-max">
          <TextInput
            size="xs"
            label={searchLabel ?? "Nome / CNPJ"}
            placeholder="Buscar"
            value={search}
            onChange={(event) => onSearchChange(event.currentTarget.value)}
            w={220}
          />

          {onDateChange ? (
            <TextInput
              size="xs"
              label={dateLabel ?? "Data"}
              type="date"
              value={date ?? ""}
              onChange={(event) => onDateChange(event.currentTarget.value)}
              w={170}
            />
          ) : null}

          {onStartDateChange && !onDateChange ? (
            <TextInput
              size="xs"
              label={startDateLabel ?? "Data inicial"}
              type="date"
              value={startDate ?? ""}
              onChange={(event) => onStartDateChange(event.currentTarget.value)}
              w={150}
            />
          ) : null}

          {onEndDateChange && !onDateChange ? (
            <TextInput
              size="xs"
              label={endDateLabel ?? "Data final"}
              type="date"
              value={endDate ?? ""}
              onChange={(event) => onEndDateChange(event.currentTarget.value)}
              w={150}
            />
          ) : null}

          {onErpChange ? (
            <ErpSelect
              label={erpLabel ?? "ERP"}
              value={erp ?? null}
              onChange={onErpChange}
              options={erpOptions ?? []}
              w={140}
            />
          ) : null}

          {onNetworkChange ? (
            <ErpSelect
              label={networkLabel ?? "Rede"}
              value={network ?? null}
              onChange={onNetworkChange}
              options={networkOptions ?? []}
              size="xs"
              w={140}
            />
          ) : null}
          {actions ?? null}
        </Group>
        <Group>
          {onPhaseChange && phaseSegmentOptions.length ? (
            <SegmentedFilter
              label={phaseLabel ?? "Fase"}
              value={phase}
              options={phaseSegmentOptions}
              onChange={onPhaseChange}
            />
          ) : null}

          {onStatusChange && statusSegmentOptions.length ? (
            <SegmentedFilter
              label={statusLabel ?? "Status"}
              value={status}
              options={statusSegmentOptions}
              onChange={onStatusChange}
            />
          ) : null}
        </Group>
      </Box>
    </Stack>
  );
}
