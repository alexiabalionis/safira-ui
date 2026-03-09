import { PrivateRoute } from "@/components/auth/private-route";
import { MainShell } from "@/components/layout/main-shell";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PrivateRoute>
      <MainShell>{children}</MainShell>
    </PrivateRoute>
  );
}
