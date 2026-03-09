"use client";

import {
  Button,
  Grid,
  Group,
  Modal,
  Paper,
  PasswordInput,
  Progress,
  Select,
  Tabs,
  Text,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { FileUp } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { CrudSection } from "@/components/cadastros/crud-section";
import { DataTable } from "@/components/ui/data-table";
import { SectionHeader } from "@/components/ui/section-header";
import { usePagination } from "@/hooks/use-pagination";
import {
  useClientesQuery,
  useCreateClienteMutation,
  useCreateERPMutation,
  useCreateRedeMutation,
  useDeleteClienteMutation,
  useDeleteERPMutation,
  useDeleteRedeMutation,
  useERPsQuery,
  useCreateUserMutation,
  useImportWayCsvMutation,
  useResetUserTemporaryPasswordMutation,
  useRedesQuery,
  useUpdateERPMutation,
  useUpdateClienteMutation,
  useUpdateUserRoleMutation,
  useUpdateUserStatusMutation,
  useUsersQuery,
} from "@/hooks/use-safira-data";
import type { ManagedUser, UserRole } from "@/services/types";

type ImportFailureRow = {
  id: string;
  cnpjEc: string;
  motivo: string;
};

const IMPORT_PROGRESS_TICK_MS = 300;
const IMPORT_MS_PER_POSTO_ESTIMATE = 1300;

function estimateValidUniqueCnpjs(csvContent: string) {
  const lines = csvContent
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return 0;

  const digits = lines
    .slice(1)
    .map((line) => line.split(/[;,]/)[0]?.replace(/\D/g, "") ?? "")
    .filter((cnpj) => cnpj.length === 14)
    .slice(0, 50);

  return new Set(digits).size;
}

export default function CadastrosPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [clienteSearch, setClienteSearch] = useState("");
  const [clientePostoCnpjFilter, setClientePostoCnpjFilter] = useState("");
  const [erpSearch, setErpSearch] = useState("");
  const [redeSearch, setRedeSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<UserRole | null>(null);
  const [userStatusFilter, setUserStatusFilter] = useState<
    "ativo" | "inativo" | null
  >(null);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("operador");
  const [newUserTemporaryPassword, setNewUserTemporaryPassword] = useState("");
  const [resetTargetUser, setResetTargetUser] = useState<ManagedUser | null>(
    null,
  );
  const [resetTemporaryPassword, setResetTemporaryPassword] = useState("");
  const [importSummary, setImportSummary] = useState<{
    totalCnpjsCsv: number;
    totalCnpjsValidos: number;
    importados: number;
    ignoradosDuplicados: number;
  } | null>(null);
  const [importFailures, setImportFailures] = useState<ImportFailureRow[]>([]);
  const [importProgressPercent, setImportProgressPercent] = useState(0);
  const [importEstimatedTotal, setImportEstimatedTotal] = useState(0);
  const [importEstimatedProcessed, setImportEstimatedProcessed] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const importStartedAtRef = useRef<number | null>(null);
  const importTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clientesPagination = usePagination(1, 15);
  const erpsPagination = usePagination(1, 15);
  const redesPagination = usePagination(1, 15);
  const usersPagination = usePagination(1, 15);

  const clientes = useClientesQuery({
    page: clientesPagination.page,
    pageSize: clientesPagination.pageSize,
    search: clienteSearch,
    postoCnpj: clientePostoCnpjFilter || undefined,
  });
  const erps = useERPsQuery({
    page: erpsPagination.page,
    pageSize: erpsPagination.pageSize,
    search: erpSearch,
  });
  const redes = useRedesQuery({
    page: redesPagination.page,
    pageSize: redesPagination.pageSize,
    search: redeSearch,
  });
  const usersQuery = useUsersQuery({
    search: userSearch,
    role: userRoleFilter ?? undefined,
    ativo: userStatusFilter === null ? undefined : userStatusFilter === "ativo",
  });

  const createCliente = useCreateClienteMutation();
  const updateCliente = useUpdateClienteMutation();
  const createERP = useCreateERPMutation();
  const updateERP = useUpdateERPMutation();
  const createRede = useCreateRedeMutation();
  const deleteCliente = useDeleteClienteMutation();
  const deleteERP = useDeleteERPMutation();
  const deleteRede = useDeleteRedeMutation();
  const importWayCsvMutation = useImportWayCsvMutation();
  const createUserMutation = useCreateUserMutation();
  const updateUserRoleMutation = useUpdateUserRoleMutation();
  const updateUserStatusMutation = useUpdateUserStatusMutation();
  const resetUserTemporaryPasswordMutation =
    useResetUserTemporaryPasswordMutation();

  useEffect(() => {
    return () => {
      if (importTimerRef.current) {
        clearInterval(importTimerRef.current);
        importTimerRef.current = null;
      }
    };
  }, []);

  const pagedUsers = useMemo(() => {
    const users = usersQuery.data?.data ?? [];
    const start = (usersPagination.page - 1) * usersPagination.pageSize;

    return {
      total: users.length,
      data: users.slice(start, start + usersPagination.pageSize),
    };
  }, [usersPagination.page, usersPagination.pageSize, usersQuery.data?.data]);

  async function handleImportWayCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const estimatedTotal = estimateValidUniqueCnpjs(content);

      setImportEstimatedTotal(estimatedTotal);
      setImportEstimatedProcessed(estimatedTotal > 0 ? 1 : 0);
      setImportProgressPercent(estimatedTotal > 0 ? 2 : 5);

      importStartedAtRef.current = Date.now();
      if (importTimerRef.current) {
        clearInterval(importTimerRef.current);
      }

      importTimerRef.current = setInterval(() => {
        const startedAt = importStartedAtRef.current;
        if (!startedAt) return;

        const elapsed = Date.now() - startedAt;

        if (estimatedTotal > 0) {
          const estimatedProcessed = Math.max(
            1,
            Math.min(
              estimatedTotal,
              Math.floor(elapsed / IMPORT_MS_PER_POSTO_ESTIMATE) + 1,
            ),
          );

          setImportEstimatedProcessed(estimatedProcessed);

          const pct = Math.min(
            95,
            Math.max(2, Math.round((estimatedProcessed / estimatedTotal) * 95)),
          );
          setImportProgressPercent(pct);
          return;
        }

        setImportProgressPercent((current) => Math.min(95, current + 3));
      }, IMPORT_PROGRESS_TICK_MS);

      const result = await importWayCsvMutation.mutateAsync(content);

      setImportEstimatedTotal(result.totalCnpjsValidos);
      setImportEstimatedProcessed(result.totalCnpjsValidos);
      setImportProgressPercent(100);

      setImportSummary({
        totalCnpjsCsv: result.totalCnpjsCsv,
        totalCnpjsValidos: result.totalCnpjsValidos,
        importados: result.importados,
        ignoradosDuplicados: result.ignoradosDuplicados,
      });
      setImportFailures(
        result.falhas.map((item, index) => ({
          id: `${item.cnpjEc}-${index}`,
          cnpjEc: item.cnpjEc,
          motivo: item.motivo,
        })),
      );

      notifications.show({
        color: result.falhas.length > 0 ? "yellow" : "safira",
        title: "Importação finalizada",
        message: `${result.importados} importados, ${result.ignoradosDuplicados} ignorados por duplicidade e ${result.falhas.length} falhas.`,
      });
    } catch (error) {
      setImportProgressPercent(0);
      setImportEstimatedProcessed(0);
      setImportEstimatedTotal(0);

      notifications.show({
        color: "red",
        title: "Falha na importação",
        message:
          error instanceof Error
            ? error.message
            : "Erro ao processar CSV na importação Way.",
      });
    } finally {
      if (importTimerRef.current) {
        clearInterval(importTimerRef.current);
        importTimerRef.current = null;
      }
      importStartedAtRef.current = null;
      event.currentTarget.value = "";
    }
  }

  return (
    <Tabs defaultValue="clientes" variant="outline">
      <Tabs.List>
        <Tabs.Tab value="clientes">Clientes</Tabs.Tab>
        <Tabs.Tab value="erps">ERPs</Tabs.Tab>
        <Tabs.Tab value="redes">Redes</Tabs.Tab>
        {isAdmin ? <Tabs.Tab value="usuarios">Usuários</Tabs.Tab> : null}
        <Tabs.Tab value="importacao-way">Importação Way</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="clientes" pt={8}>
        <Grid gutter={8}>
          <Grid.Col span={12}>
            <Group mb={8} align="end" wrap="wrap">
              <TextInput
                size="xs"
                label="Filtrar por CNPJ do posto"
                placeholder="00.000.000/0000-00"
                value={clientePostoCnpjFilter}
                onChange={(event) => {
                  setClientePostoCnpjFilter(event.currentTarget.value);
                  clientesPagination.setPage(1);
                }}
                w={240}
              />
            </Group>

            <CrudSection
              title="Clientes"
              subtitle="CRUD com padrão unificado"
              rows={(clientes.data?.data ?? []).map((item) => ({
                id: item.id,
                nome: item.razaoSocial,
                referencia: item.cnpj,
              }))}
              total={clientes.data?.total ?? 0}
              page={clientesPagination.page}
              pageSize={clientesPagination.pageSize}
              onPageChange={clientesPagination.setPage}
              loading={clientes.isFetching}
              onSearchChange={setClienteSearch}
              onCreate={async (values) =>
                createCliente.mutateAsync({
                  razaoSocial: values.nome,
                  nomeFantasia: values.nome,
                  cnpj: values.referencia,
                  postosAbastece: [],
                })
              }
              onUpdate={async (id, values) =>
                updateCliente.mutateAsync({
                  id,
                  payload: {
                    razaoSocial: values.nome,
                    nomeFantasia: values.nome,
                    cnpj: values.referencia,
                  },
                })
              }
              onDelete={async (id) => deleteCliente.mutateAsync(id)}
            />
          </Grid.Col>
        </Grid>
      </Tabs.Panel>

      <Tabs.Panel value="erps" pt={8}>
        <CrudSection
          title="ERPs"
          subtitle=""
          referenciaLabel="Versão"
          rows={(erps.data?.data ?? []).map((item) => ({
            id: item.id,
            nome: item.nome,
            referencia: item.versao,
          }))}
          total={erps.data?.total ?? 0}
          page={erpsPagination.page}
          pageSize={erpsPagination.pageSize}
          onPageChange={erpsPagination.setPage}
          loading={erps.isFetching}
          onSearchChange={setErpSearch}
          onCreate={async (values) =>
            createERP.mutateAsync({
              nome: values.nome,
              versao: values.referencia,
              status: "Aguardando",
            })
          }
          onUpdate={async (id, values) =>
            updateERP.mutateAsync({
              id,
              payload: {
                nome: values.nome,
                versao: values.referencia,
              },
            })
          }
          onDelete={async (id) => deleteERP.mutateAsync(id)}
        />
      </Tabs.Panel>

      <Tabs.Panel value="redes" pt={8}>
        <CrudSection
          title="Redes"
          subtitle="CRUD com padrão unificado"
          referenciaLabel=""
          rows={(redes.data?.data ?? []).map((item) => ({
            id: item.id,
            nome: item.nome,
            referencia: "",
          }))}
          total={redes.data?.total ?? 0}
          page={redesPagination.page}
          pageSize={redesPagination.pageSize}
          onPageChange={redesPagination.setPage}
          loading={redes.isFetching}
          onSearchChange={setRedeSearch}
          onCreate={async (values) =>
            createRede.mutateAsync({
              nome: values.nome,
              cnpj: values.referencia,
              ativo: true,
            })
          }
          onDelete={async (id) => deleteRede.mutateAsync(id)}
        />
      </Tabs.Panel>

      <Tabs.Panel value="importacao-way" pt={8}>
        <Paper withBorder p={20} radius={8}>
          <SectionHeader title="Importação de CSV via Way API" />

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleImportWayCsv}
          />

          <Group mb={12}>
            <Button
              size="xs"
              color="safira"
              leftSection={<FileUp size={14} />}
              loading={importWayCsvMutation.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              Carregar CSV
            </Button>
          </Group>

          {(importWayCsvMutation.isPending || importProgressPercent > 0) && (
            <Paper withBorder p={10} radius={8} mb={12}>
              <Group justify="space-between" mb={6}>
                <Text size="sm" fw={500}>
                  Progresso da importação
                </Text>
                <Text size="sm" c="dimmed">
                  {importProgressPercent}%
                </Text>
              </Group>

              <Progress
                value={importProgressPercent}
                color="safira"
                radius="sm"
                size="md"
                animated={importWayCsvMutation.isPending}
              />

              <Text size="xs" c="dimmed" mt={6}>
                {importWayCsvMutation.isPending
                  ? `Processando postos (${importEstimatedProcessed}/${importEstimatedTotal || "?"}).`
                  : "Processamento concluído."}
              </Text>
            </Paper>
          )}

          {importSummary ? (
            <Group gap={16} mb={12}>
              <Text size="sm">Total CSV: {importSummary.totalCnpjsCsv}</Text>
              <Text size="sm">
                CNPJs válidos: {importSummary.totalCnpjsValidos}
              </Text>
              <Text size="sm">Importados: {importSummary.importados}</Text>
              <Text size="sm">
                Duplicados ignorados: {importSummary.ignoradosDuplicados}
              </Text>
            </Group>
          ) : null}

          <DataTable<ImportFailureRow>
            columns={[
              {
                key: "cnpjEc",
                header: "CNPJ EC",
                render: (row) => row.cnpjEc,
              },
              {
                key: "motivo",
                header: "Motivo da Falha",
                render: (row) => row.motivo,
              },
            ]}
            rows={importFailures}
            total={importFailures.length}
            page={1}
            pageSize={20}
            onPageChange={() => undefined}
            loading={importWayCsvMutation.isPending}
            rowKey={(row) => row.id}
          />
        </Paper>
      </Tabs.Panel>

      {isAdmin ? (
        <Tabs.Panel value="usuarios" pt={8}>
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
                data={[
                  { value: "admin", label: "Admin" },
                  { value: "operador", label: "Operador" },
                  { value: "visitante", label: "Visitante" },
                ]}
                w={170}
              />
              <Select
                size="xs"
                label="Filtrar por status"
                placeholder="Todos"
                value={userStatusFilter}
                onChange={(value) => {
                  setUserStatusFilter(
                    (value as "ativo" | "inativo" | null) ?? null,
                  );
                  usersPagination.setPage(1);
                }}
                clearable
                data={[
                  { value: "ativo", label: "Ativo" },
                  { value: "inativo", label: "Inativo" },
                ]}
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
                  setNewUserRole((value as UserRole) ?? "operador")
                }
                data={[
                  { value: "admin", label: "Admin" },
                  { value: "operador", label: "Operador" },
                  { value: "visitante", label: "Visitante" },
                ]}
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
                  if (
                    !newUserName ||
                    !newUserEmail ||
                    !newUserTemporaryPassword
                  ) {
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
                      data={[
                        { value: "admin", label: "Admin" },
                        { value: "operador", label: "Operador" },
                        { value: "visitante", label: "Visitante" },
                      ]}
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
                      await navigator.clipboard.writeText(
                        resetTemporaryPassword,
                      );
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
      ) : null}
    </Tabs>
  );
}
