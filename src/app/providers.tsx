"use client";

import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { AuthProvider } from "@/components/auth/auth-provider";
import { safiraTheme } from "@/lib/theme";

type Props = {
  children: React.ReactNode;
};

export default function Providers({ children }: Props) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            gcTime: 10 * 60_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={safiraTheme}>
        <AuthProvider>
          <Notifications position="top-right" />
          {children}
        </AuthProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
}
