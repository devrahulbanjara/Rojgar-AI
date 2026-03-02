import DashNavbar from "@/components/layout/DashNavbar";

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DashNavbar
        role="user"
        userName="Alex Chen"
        userRole="UI/UX Designer"
        userInitials="AC"
      />
      <main className="dash-page">{children}</main>
    </>
  );
}
