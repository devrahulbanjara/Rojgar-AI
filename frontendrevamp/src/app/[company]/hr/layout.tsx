"use client";

import { useParams } from "next/navigation";
import DashNavbar from "@/components/layout/DashNavbar";

export default function HRLayout({ children }: { children: React.ReactNode }) {
  const { company } = useParams<{ company: string }>();
  return (
    <>
      <DashNavbar
        role="hr"
        companySlug={company}
        userName="Priya Mehta"
        userRole="HR Manager"
        userInitials="PM"
      />
      <main className="dash-page">{children}</main>
    </>
  );
}
