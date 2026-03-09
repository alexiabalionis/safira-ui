import { Badge, Group } from "@mantine/core";

type Option<T extends string> = {
  value: T;
  label: string;
  activeColor?: string;
};

type Props<T extends string> = {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  mb?: number;
};

export function ChipFilterGroup<T extends string>({
  value,
  options,
  onChange,
  mb = 8,
}: Props<T>) {
  return (
    <Group gap={6} mb={mb} wrap="wrap">
      {options.map((option) => (
        <Badge
          key={option.value}
          variant={value === option.value ? "filled" : "light"}
          color={
            value === option.value ? (option.activeColor ?? "safira") : "gray"
          }
          style={{ cursor: "pointer" }}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Badge>
      ))}
    </Group>
  );
}
