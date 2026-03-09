import { Badge, Group, Select, Stack, Text, TextInput } from "@mantine/core";

import { ErpSelect } from "@/components/ui/erp-select";
import { getStatusPalette } from "@/lib/status-colors";

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
  phaseOptions?: string[];
  phaseLabel?: string;
  erp?: string | null;
  onErpChange?: (value: string | null) => void;
  erpOptions?: string[];
  erpLabel?: string;
  network?: string | null;
  onNetworkChange?: (value: string | null) => void;
  networkOptions?: string[];
  networkLabel?: string;
  status?: string | null;
  onStatusChange?: (value: string | null) => void;
  statusOptions?: string[];
  statusLabel?: string;
  actions?: React.ReactNode;
};

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
  return (
    <Stack gap={10} mb={18}>
      <Group gap={8} align="end" wrap="wrap">
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
          <Select
            size="xs"
            label={networkLabel ?? "Rede"}
            value={network}
            onChange={onNetworkChange}
            data={networkOptions ?? []}
            clearable
            w={140}
          />
        ) : null}

        {actions ?? null}
      </Group>

      <Group gap={12} align="start" wrap="wrap">
        {onPhaseChange && phaseOptions?.length ? (
          <Stack gap={4}>
            <Text size="xs" c="#7A7A7A">
              {phaseLabel ?? "Fase"}
            </Text>
            <Group gap={6} wrap="wrap">
              <Badge
                variant={!phase ? "filled" : "light"}
                color={!phase ? "safira" : "gray"}
                style={{ cursor: "pointer" }}
                onClick={() => onPhaseChange(null)}
              >
                Todos
              </Badge>
              {phaseOptions.map((option) => (
                <Badge
                  key={option}
                  variant={phase === option ? "filled" : "light"}
                  color={phase === option ? "safira" : "gray"}
                  style={{ cursor: "pointer" }}
                  onClick={() => onPhaseChange(option)}
                >
                  {option}
                </Badge>
              ))}
            </Group>
          </Stack>
        ) : null}

        {onStatusChange && statusOptions?.length ? (
          <Stack gap={4}>
            <Text size="xs" c="#7A7A7A">
              {statusLabel ?? "Status"}
            </Text>
            <Group gap={6} wrap="wrap">
              <Badge
                variant={!status ? "filled" : "light"}
                color={!status ? "safira" : "gray"}
                style={{ cursor: "pointer" }}
                onClick={() => onStatusChange(null)}
              >
                Todos
              </Badge>
              {statusOptions.map((option) => {
                const palette = getStatusPalette(option);
                return (
                  <Badge
                    key={option}
                    variant={status === option ? "filled" : "light"}
                    color={status === option ? undefined : "gray"}
                    styles={
                      status === option
                        ? {
                            root: {
                              backgroundColor: palette.solid,
                              color: "#FFFFFF",
                              borderColor: palette.solid,
                            },
                          }
                        : undefined
                    }
                    style={{ cursor: "pointer" }}
                    onClick={() => onStatusChange(option)}
                  >
                    {option}
                  </Badge>
                );
              })}
            </Group>
          </Stack>
        ) : null}
      </Group>
    </Stack>
  );
}
