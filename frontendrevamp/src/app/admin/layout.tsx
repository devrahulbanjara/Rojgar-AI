import AuthGuard from "@/components/common/AuthGuard";
import DashNavbar from "@/components/layout/DashNavbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredRole="admin">
      <DashNavbar role="admin" />
      <main className="dash-page">{children}</main>
    </AuthGuard>
  );
}
