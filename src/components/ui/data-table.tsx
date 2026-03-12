import {
  ActionIcon,
  Checkbox,
  Group,
  Menu,
  Pagination,
  Select,
  Table,
  Text,
} from "@mantine/core";
import { ArrowDownAZ, ArrowUpAZ, ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";

type Column<T> = {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  render: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortAccessor?: (row: T) => string | number | Date | null | undefined;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  loading?: boolean;
  rowKey: (row: T) => string;
  selectableRows?: boolean;
  selectedRowKeys?: string[];
  onSelectedRowKeysChange?: (keys: string[]) => void;
};

export function DataTable<T>({
  columns,
  rows,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [15, 25, 50, 100],
  loading,
  rowKey,
  selectableRows = false,
  selectedRowKeys = [],
  onSelectedRowKeysChange,
}: Props<T>) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const [sort, setSort] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;

    const column = columns.find((item) => item.key === sort.key);
    if (!column?.sortable || !column.sortAccessor) {
      return rows;
    }

    const normalizeValue = (
      value: string | number | Date | null | undefined,
    ) => {
      if (value === null || value === undefined) return "";
      if (value instanceof Date) return value.getTime();
      if (typeof value === "number") return value;
      return String(value).toLowerCase();
    };

    return [...rows].sort((left, right) => {
      const leftValue = normalizeValue(column.sortAccessor?.(left));
      const rightValue = normalizeValue(column.sortAccessor?.(right));

      if (leftValue < rightValue) return sort.direction === "asc" ? -1 : 1;
      if (leftValue > rightValue) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [columns, rows, sort]);

  const selectedSet = useMemo(
    () => new Set(selectedRowKeys),
    [selectedRowKeys],
  );
  const visibleKeys = useMemo(
    () => sortedRows.map((row) => rowKey(row)),
    [rowKey, sortedRows],
  );
  const allVisibleSelected =
    visibleKeys.length > 0 && visibleKeys.every((key) => selectedSet.has(key));
  const someVisibleSelected =
    visibleKeys.length > 0 && visibleKeys.some((key) => selectedSet.has(key));

  function toggleRowSelection(key: string, checked: boolean) {
    if (!onSelectedRowKeysChange) return;
    const next = new Set(selectedRowKeys);
    if (checked) {
      next.add(key);
    } else {
      next.delete(key);
    }
    onSelectedRowKeysChange(Array.from(next));
  }

  function toggleSelectVisible(checked: boolean) {
    if (!onSelectedRowKeysChange) return;
    const next = new Set(selectedRowKeys);

    for (const key of visibleKeys) {
      if (checked) {
        next.add(key);
      } else {
        next.delete(key);
      }
    }

    onSelectedRowKeysChange(Array.from(next));
  }

  return (
    <div>
      <Table
        className="safira-data-table"
        highlightOnHover
        horizontalSpacing="md"
        verticalSpacing="md"
        stickyHeader
        stickyHeaderOffset={60}
      >
        <Table.Thead>
          <Table.Tr>
            {selectableRows ? (
              <Table.Th ta="center" w={10}>
                <Checkbox
                  radius={4}
                  size="xs"
                  checked={allVisibleSelected}
                  indeterminate={!allVisibleSelected && someVisibleSelected}
                  onChange={(event) =>
                    toggleSelectVisible(event.currentTarget.checked)
                  }
                  aria-label="Selecionar linhas visiveis"
                />
              </Table.Th>
            ) : null}
            {columns.map((column) => (
              <Table.Th key={column.key} ta={column.align ?? "left"}>
                {column.sortable ? (
                  <Group justify="flex-start" wrap="nowrap" gap={6}>
                    <span>{column.header}</span>
                    <Menu position="bottom-end" shadow="sm">
                      <Menu.Target>
                        <ActionIcon size="xs" variant="subtle" color="gray">
                          <ArrowUpDown size={14} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<ArrowUpAZ size={14} />}
                          onClick={() =>
                            setSort({ key: column.key, direction: "asc" })
                          }
                        >
                          A-Z
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<ArrowDownAZ size={14} />}
                          onClick={() =>
                            setSort({ key: column.key, direction: "desc" })
                          }
                        >
                          Z-A
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item onClick={() => setSort(null)}>
                          Limpar
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                ) : (
                  column.header
                )}
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {sortedRows.map((row) => (
            <Table.Tr key={rowKey(row)}>
              {selectableRows ? (
                <Table.Td ta="center">
                  <Checkbox
                    radius={4}
                    size="xs"
                    checked={selectedSet.has(rowKey(row))}
                    onChange={(event) =>
                      toggleRowSelection(
                        rowKey(row),
                        event.currentTarget.checked,
                      )
                    }
                    aria-label={`Selecionar linha ${rowKey(row)}`}
                  />
                </Table.Td>
              ) : null}
              {columns.map((column) => (
                <Table.Td key={column.key} ta={column.align ?? "left"}>
                  {column.render(row)}
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
          {rows.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={columns.length + (selectableRows ? 1 : 0)}>
                <Text size="xs" c="dimmed" ta="center" py={12}>
                  {loading
                    ? "Carregando dados..."
                    : "Nenhum registro encontrado"}
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : null}
        </Table.Tbody>
      </Table>

      <div className="mt-2 flex items-center justify-between">
        <Group gap={8}>
          <Text size="xs" c="dimmed">
            Total: {total}
          </Text>
          {onPageSizeChange ? (
            <Select
              size="xs"
              value={String(pageSize)}
              onChange={(value) => {
                if (!value) return;
                onPageSizeChange(Number(value));
              }}
              data={pageSizeOptions.map((option) => ({
                value: String(option),
                label: `${option} por página`,
              }))}
              allowDeselect={false}
              w={130}
            />
          ) : null}
        </Group>
        <Pagination
          total={totalPages}
          value={page}
          onChange={onPageChange}
          size="sm"
        />
      </div>
    </div>
  );
}
