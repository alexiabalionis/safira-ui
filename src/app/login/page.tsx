"use client";

import { Button, Paper, PasswordInput, Text, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { login } from "@/services/safira-api";

export default function LoginPage() {
  const { setSessionUser } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    if (!email || !senha) {
      notifications.show({
        color: "yellow",
        title: "Campos obrigatorios",
        message: "Preencha e-mail e senha para continuar.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const user = await login({ email, senha });
      setSessionUser(user);

      if (user.forcePasswordChange) {
        router.replace("/mudar-senha");
        return;
      }

      const redirect = new URLSearchParams(window.location.search).get(
        "redirect",
      );
      router.replace(redirect || "/dashboard");
    } catch (error) {
      notifications.show({
        color: "red",
        title: "Falha no login",
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel autenticar.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Paper
        p={20}
        radius={8}
        withBorder
        className="w-full max-w-sm border-gray-200 bg-white p-4"
      >
        <Text fw={700}>Acesso Safira</Text>
        <Text size="xs" c="dimmed" mb={12}>
          Entre com seu usuario e senha para acessar a plataforma
        </Text>
        <TextInput
          label="E-mail"
          size="xs"
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
          mb={8}
        />
        <PasswordInput
          label="Senha"
          size="xs"
          value={senha}
          onChange={(event) => setSenha(event.currentTarget.value)}
          mb={12}
        />
        <Button
          color="safira"
          fullWidth
          size="xs"
          onClick={handleLogin}
          loading={isLoading}
        >
          Entrar
        </Button>
      </Paper>
    </main>
  );
}
