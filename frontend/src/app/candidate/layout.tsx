import AuthGuard from '@/components/common/AuthGuard'
import DashNavbar from '@/components/layout/DashNavbar'

export default function UserDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="candidate">
      <DashNavbar role="candidate" />
      <main className="dash-page">{children}</main>
    </AuthGuard>
  )
}
