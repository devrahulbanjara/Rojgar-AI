import DashNavbar from "@/components/layout/DashNavbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DashNavbar
        role="admin"
        userName="Rahul Banjara"
        userRole="Super Admin"
        userInitials="RB"
      />
      <main className="dash-page">{children}</main>
    </>
  );
}
