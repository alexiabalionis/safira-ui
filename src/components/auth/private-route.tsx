"use client";

import { Center, Loader } from "@mantine/core";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { canAccessPath } from "@/components/auth/permissions";

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (user.forcePasswordChange && pathname !== "/mudar-senha") {
      router.replace("/mudar-senha");
      return;
    }

    if (!user.forcePasswordChange && pathname === "/mudar-senha") {
      router.replace("/dashboard");
      return;
    }

    if (pathname !== "/mudar-senha" && !canAccessPath(user.role, pathname)) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, pathname, router, user]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <Center className="min-h-screen w-full">
        <Loader size="sm" color="safira" />
      </Center>
    );
  }

  if (user.forcePasswordChange && pathname !== "/mudar-senha") {
    return (
      <Center className="min-h-screen w-full">
        <Loader size="sm" color="safira" />
      </Center>
    );
  }

  if (pathname !== "/mudar-senha" && !canAccessPath(user.role, pathname)) {
    return (
      <Center className="min-h-screen w-full">
        <Loader size="sm" color="safira" />
      </Center>
    );
  }

  return <>{children}</>;
}
