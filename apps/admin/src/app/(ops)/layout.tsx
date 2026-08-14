import type { ReactNode } from 'react';
import { AuthGate } from '@/components/AuthGate';
import { OpsShell } from '@/components/OpsShell';

export default function OpsLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <OpsShell>{children}</OpsShell>
    </AuthGate>
  );
}
