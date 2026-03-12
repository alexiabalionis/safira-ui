"use client";

import {
  Button,
  Group,
  Modal,
  Paper,
  PasswordInput,
  Select,
  Tabs,
  Text,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useMemo, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { CADASTROS_PANEL_VALUES } from "@/components/cadastros/types";
import { DataTable } from "@/components/ui/data-table";
import { SectionHeader } from "@/components/ui/section-header";
import { usePagination } from "@/hooks/use-pagination";
import {
  useCreateUserMutation,
  useResetUserTemporaryPasswordMutation,
  useUpdateUserRoleMutation,
  useUpdateUserStatusMutation,
  useUsersQuery,
} from "@/hooks/use-safira-data";
import type { ManagedUser, UserRole } from "@/types/core.types";

import {
  USER_ROLE_OPTIONS,
  USER_STATUS_OPTIONS,
  type UserStatusFilter,
  type UsersPageData,
} from "./types";

export function UsuariosPanel() {
  const { user } = useAuth();

  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<UserRole | null>(null);
  const [userStatusFilter, setUserStatusFilter] =
    useState<UserStatusFilter | null>(null);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("operador");
  const [newUserTemporaryPassword, setNewUserTemporaryPassword] = useState("");
  const [resetTargetUser, setResetTargetUser] = useState<ManagedUser | null>(
    null,
  );
  const [resetTemporaryPassword, setResetTemporaryPassword] = useState("");

  const usersPagination = usePagination(1, 15);

  const usersQuery = useUsersQuery({
    search: userSearch,
    role: userRoleFilter ?? undefined,
    ativo: userStatusFilter === null ? undefined : userStatusFilter === "ativo",
  });

  const createUserMutation = useCreateUserMutation();
  const updateUserRoleMutation = useUpdateUserRoleMutation();
  const updateUserStatusMutation = useUpdateUserStatusMutation();
  const resetUserTemporaryPasswordMutation =
    useResetUserTemporaryPasswordMutation();

  const pagedUsers: UsersPageData = useMemo(() => {
    const users = usersQuery.data?.data ?? [];
    const start = (usersPagination.page - 1) * usersPagination.pageSize;

    return {
      total: users.length,
      data: users.slice(start, start + usersPagination.pageSize),
    };
  }, [usersPagination.page, usersPagination.pageSize, usersQuery.data?.data]);

  return (
    <Tabs.Panel value={CADASTROS_PANEL_VALUES.USUARIOS} pt={8}>
      <Paper withBorder p={20} radius={8}>
        <SectionHeader
          title="Gestão de Usuários"
          subtitle="Listagem, cadastro e alteração de perfil"
        />

        <Group gap={8} mb={10} align="end" wrap="wrap">
          <TextInput
            size="xs"
            label="Buscar usuário"
            placeholder="Nome ou e-mail"
            value={userSearch}
            onChange={(event) => {
              setUserSearch(event.currentTarget.value);
              usersPagination.setPage(1);
            }}
            w={280}
          />
          <Select
            size="xs"
            label="Filtrar por perfil"
            placeholder="Todos"
            value={userRoleFilter}
            onChange={(value) => {
              setUserRoleFilter((value as UserRole | null) ?? null);
              usersPagination.setPage(1);
            }}
            clearable
            data={USER_ROLE_OPTIONS}
            w={170}
          />
          <Select
            size="xs"
            label="Filtrar por status"
            placeholder="Todos"
            value={userStatusFilter}
            onChange={(value) => {
              setUserStatusFilter((value as UserStatusFilter | null) ?? null);
              usersPagination.setPage(1);
            }}
            clearable
            data={USER_STATUS_OPTIONS}
            w={160}
          />
        </Group>

        <Group gap={8} mb={12} align="end" wrap="wrap">
          <TextInput
            size="xs"
            label="Nome"
            placeholder="Nome do usuário"
            value={newUserName}
            onChange={(event) => setNewUserName(event.currentTarget.value)}
            w={220}
          />
          <TextInput
            size="xs"
            label="E-mail"
            placeholder="usuario@empresa.com"
            value={newUserEmail}
            onChange={(event) => setNewUserEmail(event.currentTarget.value)}
            w={240}
          />
          <Select
            size="xs"
            label="Perfil"
            value={newUserRole}
            onChange={(value) =>
              setNewUserRole((value as UserRole | null) ?? "operador")
            }
            data={USER_ROLE_OPTIONS}
            w={140}
          />
          <PasswordInput
            size="xs"
            label="Senha temporária"
            placeholder="Mínimo 8 caracteres"
            value={newUserTemporaryPassword}
            onChange={(event) =>
              setNewUserTemporaryPassword(event.currentTarget.value)
            }
            w={220}
          />
          <Button
            size="xs"
            color="safira"
            loading={createUserMutation.isPending}
            onClick={async () => {
              if (!newUserName || !newUserEmail || !newUserTemporaryPassword) {
                notifications.show({
                  color: "yellow",
                  title: "Campos obrigatórios",
                  message: "Preencha nome, e-mail e senha temporária.",
                });
                return;
              }

              try {
                await createUserMutation.mutateAsync({
                  nome: newUserName,
                  email: newUserEmail,
                  role: newUserRole,
                  temporaryPassword: newUserTemporaryPassword,
                });

                notifications.show({
                  color: "safira",
                  title: "Usuário cadastrado",
                  message: "Cadastro realizado com senha temporária.",
                });

                setNewUserName("");
                setNewUserEmail("");
                setNewUserRole("operador");
                setNewUserTemporaryPassword("");
                usersPagination.setPage(1);
              } catch (error) {
                notifications.show({
                  color: "red",
                  title: "Falha no cadastro",
                  message:
                    error instanceof Error
                      ? error.message
                      : "Não foi possível cadastrar usuário.",
                });
              }
            }}
          >
            Cadastrar usuário
          </Button>
        </Group>

        <DataTable<ManagedUser>
          columns={[
            {
              key: "nome",
              header: "Nome",
              render: (row) => row.nome,
              sortable: true,
              sortAccessor: (row) => row.nome,
            },
            {
              key: "email",
              header: "E-mail",
              render: (row) => row.email,
              sortable: true,
              sortAccessor: (row) => row.email,
            },
            {
              key: "role",
              header: "Perfil",
              render: (row) => (
                <Select
                  size="xs"
                  value={row.role}
                  data={USER_ROLE_OPTIONS}
                  disabled={row.id === user?.id}
                  onChange={async (value) => {
                    if (!value || value === row.role) return;

                    try {
                      await updateUserRoleMutation.mutateAsync({
                        id: row.id,
                        role: value as UserRole,
                      });

                      notifications.show({
                        color: "safira",
                        message: "Perfil do usuário atualizado.",
                      });
                    } catch (error) {
                      notifications.show({
                        color: "red",
                        title: "Falha ao atualizar perfil",
                        message:
                          error instanceof Error
                            ? error.message
                            : "Não foi possível alterar o perfil.",
                      });
                    }
                  }}
                  w={140}
                />
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (row) => (row.ativo ? "Ativo" : "Inativo"),
            },
            {
              key: "firstAccess",
              header: "Troca de senha",
              render: (row) =>
                row.forcePasswordChange ? "Pendente" : "Concluída",
            },
            {
              key: "acoes",
              header: "Ações",
              align: "right",
              render: (row) => (
                <Group gap={6} justify="flex-end" wrap="nowrap">
                  <Button
                    size="compact-xs"
                    variant="light"
                    color={row.ativo ? "yellow" : "green"}
                    disabled={row.id === user?.id}
                    loading={updateUserStatusMutation.isPending}
                    onClick={async () => {
                      try {
                        await updateUserStatusMutation.mutateAsync({
                          id: row.id,
                          ativo: !row.ativo,
                        });

                        notifications.show({
                          color: "safira",
                          message: row.ativo
                            ? "Usuário desativado com sucesso."
                            : "Usuário ativado com sucesso.",
                        });
                      } catch (error) {
                        notifications.show({
                          color: "red",
                          title: "Falha ao atualizar status",
                          message:
                            error instanceof Error
                              ? error.message
                              : "Não foi possível atualizar o status.",
                        });
                      }
                    }}
                  >
                    {row.ativo ? "Desativar" : "Ativar"}
                  </Button>

                  <Button
                    size="compact-xs"
                    variant="light"
                    color="violet"
                    onClick={() => {
                      setResetTargetUser(row);
                      setResetTemporaryPassword("");
                    }}
                  >
                    Resetar senha
                  </Button>
                </Group>
              ),
            },
          ]}
          rows={pagedUsers.data}
          total={pagedUsers.total}
          page={usersPagination.page}
          pageSize={usersPagination.pageSize}
          onPageChange={usersPagination.setPage}
          loading={
            usersQuery.isFetching ||
            updateUserRoleMutation.isPending ||
            updateUserStatusMutation.isPending ||
            resetUserTemporaryPasswordMutation.isPending
          }
          rowKey={(row) => row.id}
        />

        <Modal
          opened={Boolean(resetTargetUser)}
          onClose={() => {
            setResetTargetUser(null);
            setResetTemporaryPassword("");
          }}
          title="Resetar senha temporária"
          centered
        >
          <Group mb={8}>
            <Text size="sm" c="dimmed">
              Usuário: {resetTargetUser?.nome}
            </Text>
          </Group>

          <PasswordInput
            size="xs"
            label="Nova senha temporária"
            placeholder="Mínimo 8 caracteres"
            value={resetTemporaryPassword}
            onChange={(event) =>
              setResetTemporaryPassword(event.currentTarget.value)
            }
            mb={12}
          />

          <Group justify="space-between" mb={12}>
            <Text size="xs" c="dimmed">
              Copie a senha para compartilhar com o usuário.
            </Text>
            <Button
              size="compact-xs"
              variant="light"
              onClick={async () => {
                if (!resetTemporaryPassword.trim()) {
                  notifications.show({
                    color: "yellow",
                    title: "Senha vazia",
                    message: "Digite uma senha temporária antes de copiar.",
                  });
                  return;
                }

                try {
                  await navigator.clipboard.writeText(resetTemporaryPassword);
                  notifications.show({
                    color: "safira",
                    message: "Senha temporária copiada.",
                  });
                } catch {
                  notifications.show({
                    color: "red",
                    title: "Falha ao copiar",
                    message:
                      "Não foi possível copiar para a área de transferência.",
                  });
                }
              }}
            >
              Copiar senha
            </Button>
          </Group>

          <Group justify="flex-end" gap={8}>
            <Button
              size="xs"
              variant="default"
              onClick={() => {
                setResetTargetUser(null);
                setResetTemporaryPassword("");
              }}
            >
              Cancelar
            </Button>
            <Button
              size="xs"
              color="violet"
              loading={resetUserTemporaryPasswordMutation.isPending}
              onClick={async () => {
                if (!resetTargetUser) return;

                if (resetTemporaryPassword.trim().length < 8) {
                  notifications.show({
                    color: "yellow",
                    title: "Senha inválida",
                    message:
                      "A senha temporária deve ter no mínimo 8 caracteres.",
                  });
                  return;
                }

                try {
                  await resetUserTemporaryPasswordMutation.mutateAsync({
                    id: resetTargetUser.id,
                    temporaryPassword: resetTemporaryPassword,
                  });

                  notifications.show({
                    color: "safira",
                    title: "Senha resetada",
                    message:
                      "No próximo login o usuário será obrigado a trocar a senha.",
                  });
                  setResetTargetUser(null);
                  setResetTemporaryPassword("");
                } catch (error) {
                  notifications.show({
                    color: "red",
                    title: "Falha ao resetar senha",
                    message:
                      error instanceof Error
                        ? error.message
                        : "Não foi possível resetar a senha do usuário.",
                  });
                }
              }}
            >
              Confirmar reset
            </Button>
          </Group>
        </Modal>
      </Paper>
    </Tabs.Panel>
  );
}
