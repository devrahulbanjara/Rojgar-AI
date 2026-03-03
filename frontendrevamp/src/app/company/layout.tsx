import AuthGuard from "@/components/common/AuthGuard";
import DashNavbar from "@/components/layout/DashNavbar";

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredRole="company">
      <DashNavbar role="company" />
      <main className="dash-page">{children}</main>
    </AuthGuard>
  );
}
