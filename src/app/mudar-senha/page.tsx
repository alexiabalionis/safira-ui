"use client";

import { Button, Paper, PasswordInput, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PrivateRoute } from "@/components/auth/private-route";
import { useAuth } from "@/components/auth/auth-provider";
import { changePassword } from "@/services/integrations/auth.service";

export default function MudarSenhaPage() {
  const router = useRouter();
  const { setSessionUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      notifications.show({
        color: "yellow",
        title: "Campos obrigatorios",
        message: "Preencha todos os campos para continuar.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      notifications.show({
        color: "red",
        title: "Senhas diferentes",
        message: "A confirmacao da nova senha nao confere.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await changePassword({ currentPassword, newPassword });
      setSessionUser(user);
      notifications.show({
        color: "green",
        title: "Senha alterada",
        message: "Voce ja pode acessar o sistema normalmente.",
      });
      router.replace("/dashboard");
    } catch (error) {
      notifications.show({
        color: "red",
        title: "Erro ao alterar senha",
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel atualizar a senha.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PrivateRoute>
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Paper
          p={20}
          radius={8}
          withBorder
          className="w-full max-w-sm border-gray-200 bg-white p-4"
        >
          <Text fw={700}>Troca obrigatoria de senha</Text>
          <Text size="xs" c="dimmed" mb={12}>
            No primeiro acesso, defina uma nova senha para continuar.
          </Text>

          <PasswordInput
            label="Senha temporaria"
            size="xs"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.currentTarget.value)}
            mb={8}
          />
          <PasswordInput
            label="Nova senha"
            size="xs"
            value={newPassword}
            onChange={(event) => setNewPassword(event.currentTarget.value)}
            mb={8}
          />
          <PasswordInput
            label="Confirmar nova senha"
            size="xs"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.currentTarget.value)}
            mb={12}
          />

          <Button
            color="safira"
            fullWidth
            size="xs"
            onClick={handleSubmit}
            loading={isSubmitting}
          >
            Atualizar senha
          </Button>
        </Paper>
      </main>
    </PrivateRoute>
  );
}
