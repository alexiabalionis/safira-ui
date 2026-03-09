import { Paper, Text } from "@mantine/core";

export function StatusCard({
  label,
  total,
  active,
}: {
  label: string;
  total: number;
  active: number;
}) {
  return (
    <Paper p={16} radius={12}>
      <Text fw={700} c="#01b075" size="40px" ta="center">
        {active}
      </Text>
      <Text size="xs" c="#7A7A7A" ta="center">
        {label}
      </Text>
      <Text size="10px" c="#7A7A7A" ta="center">
        {`${active} de ${total}`}
      </Text>
    </Paper>
  );
}
