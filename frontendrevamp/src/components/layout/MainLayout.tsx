"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/common/header";
import Footer from "@/components/common/footer";
import CookieBanner from "@/components/common/CookieBanner";

const DASHBOARD_PREFIXES = ["/dashboard", "/admin", "/company"];

function isDashboardPath(pathname: string) {
  // Also handle /[company]/hr pattern
  if (pathname.split("/").length >= 3 && pathname.includes("/hr")) return true;
  return DASHBOARD_PREFIXES.some((p) => pathname.startsWith(p));
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (isDashboardPath(pathname)) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="page">{children}</main>
      <Footer />
      <CookieBanner />
    </>
  );
}
