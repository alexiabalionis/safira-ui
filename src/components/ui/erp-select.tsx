import { Select } from "@mantine/core";

type Props = {
  label?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  options: string[];
  placeholder?: string;
  clearable?: boolean;
  searchable?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  w?: number | string;
  mb?: number;
  nothingFoundMessage?: string;
};

export function ErpSelect({
  label = "ERP",
  value,
  onChange,
  options,
  placeholder,
  clearable = true,
  searchable = true,
  size = "xs",
  w,
  mb,
  nothingFoundMessage = "Nenhum ERP encontrado",
}: Props) {
  return (
    <Select
      size={size}
      label={label}
      value={value}
      onChange={onChange}
      data={options}
      placeholder={placeholder}
      clearable={clearable}
      searchable={searchable}
      nothingFoundMessage={nothingFoundMessage}
      w={w}
      mb={mb}
    />
  );
}
