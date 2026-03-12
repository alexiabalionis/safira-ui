import { Select } from "@mantine/core";

type SelectOption = { value: string; label: string };

type Props = {
  label?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  options: Array<string | SelectOption>;
  placeholder?: string;
  clearable?: boolean;
  searchable?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  w?: number | string;
  mb?: number;
  nullOptionLabel?: string;
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
  nullOptionLabel,
  nothingFoundMessage = "Nenhum ERP encontrado",
}: Props) {
  const mappedOptions = options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option,
  );

  const data = nullOptionLabel
    ? [{ value: "", label: nullOptionLabel }, ...mappedOptions]
    : mappedOptions;

  return (
    <Select
      size={size}
      label={label}
      value={value}
      onChange={(nextValue) => {
        if (nextValue === "") {
          onChange(null);
          return;
        }

        onChange(nextValue);
      }}
      data={data}
      placeholder={placeholder}
      clearable={clearable}
      searchable={searchable}
      nothingFoundMessage={nothingFoundMessage}
      w={w}
      mb={mb}
    />
  );
}
