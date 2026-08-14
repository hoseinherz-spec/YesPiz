import type { ReactNode } from 'react';
import { AuthGate } from '@/components/AuthGate';
import { ProviderShell } from '@/components/ProviderShell';

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <ProviderShell>{children}</ProviderShell>
    </AuthGate>
  );
}
