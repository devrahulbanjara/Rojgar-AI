import { SettingsShell } from '@/components/screens/settings/SettingsShell'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <SettingsShell>{children}</SettingsShell>
}
