"use client";

import {
  Anchor,
  AppShell,
  Box,
  Group,
  Menu,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import { navItems } from "@/components/layout/nav-items";

export function MainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const visibleNavItems = navItems.filter((item) => {
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  return (
    <AppShell header={{ height: 93 }} padding={20}>
      <AppShell.Header>
        <Group justify="center" h="100%">
          <Box w="97%">
            <Group gap={2} justify="space-between" w="100%" align="center">
              <Box>
                <Text fw={700} fz={26}>
                  Safira
                </Text>
                <Text size="10px" c="dimmed">
                  Plataforma AILOG
                </Text>
              </Box>
              <Box>
                <Text size="10px" c="dimmed">
                  Bem vindo
                </Text>
                <Menu shadow="md" width={180} position="bottom-end">
                  <Menu.Target>
                    <UnstyledButton>
                      <Text size="sm" c="dark.5" fw={600}>
                        {user?.nome}
                      </Text>
                    </UnstyledButton>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Item
                      color="red"
                      leftSection={<LogOut size={14} />}
                      onClick={async () => {
                        try {
                          await logout();
                          router.replace("/login");
                        } catch {
                          notifications.show({
                            color: "red",
                            title: "Falha ao sair",
                            message: "Não foi possível encerrar a sessão.",
                          });
                        }
                      }}
                    >
                      Sair
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Box>
            </Group>

            <Group w="100%" justify="center" pt="6px">
              {visibleNavItems.map((item) => (
                <Anchor<"a">
                  href={item.href}
                  key={item.label}
                  className="mainLink"
                  c="black"
                  fw={600}
                  data-active={pathname.startsWith(item.href) || undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    router.push(item.href);
                  }}
                >
                  {item.label}
                </Anchor>
              ))}
            </Group>
          </Box>
        </Group>
      </AppShell.Header>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
