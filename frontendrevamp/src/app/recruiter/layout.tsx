import AuthGuard from "@/components/common/AuthGuard";
import DashNavbar from "@/components/layout/DashNavbar";

export default function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredRole="recruiter">
      <DashNavbar role="recruiter" />
      <main className="dash-page">{children}</main>
    </AuthGuard>
  );
}
