import { Group, Text } from "@mantine/core";

export function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <Group justify="space-between" mb={8}>
      <div>
        <Text fw={600} size="lg" c="#333333">
          {title}
        </Text>
        {subtitle ? (
          <Text size="xs" c="#7A7A7A">
            {subtitle}
          </Text>
        ) : null}
      </div>
    </Group>
  );
}
