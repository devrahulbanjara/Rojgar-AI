import DashNavbar from "@/components/layout/DashNavbar";

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DashNavbar
        role="company"
        userName="Pickolab Studio"
        userRole="Company Account"
        userInitials="PS"
      />
      <main className="dash-page">{children}</main>
    </>
  );
}
