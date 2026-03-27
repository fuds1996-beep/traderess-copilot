import AppShell from "@/components/AppShell";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <ErrorBoundary>{children}</ErrorBoundary>
    </AppShell>
  );
}
