"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
};

export type NavGroup = {
  groupLabel?: string;
  items: NavItem[];
};

type DashSidebarProps = {
  role: "candidate" | "recruiter_admin" | "recruiter";
  navGroups: NavGroup[];
  userName?: string;
  userRole?: string;
  userInitials?: string;
  companySlug?: string;
};

export default function DashSidebar({
  navGroups,
  userName = "User",
  userRole = "Member",
  userInitials = "U",
}: DashSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="dash-sidebar">
      {/* Logo */}
      <Link href="/" className="dash-sidebar__logo">
        <div className="dash-sidebar__logo-icon">CH</div>
        <span className="dash-sidebar__logo-text">ConvexHire</span>
      </Link>

      {/* User info */}
      <div className="dash-sidebar__user">
        <div className="dash-sidebar__user-avatar">{userInitials}</div>
        <div className="dash-sidebar__user-info">
          <div className="dash-sidebar__user-name">{userName}</div>
          <div className="dash-sidebar__user-role">{userRole}</div>
        </div>
        <div className="dash-sidebar__user-status" />
      </div>

      {/* Nav */}
      <nav className="dash-sidebar__nav">
        {navGroups.map((group, gi) => (
          <div key={gi} className="dash-sidebar__nav-group">
            {group.groupLabel && (
              <div className="dash-sidebar__nav-group-label">
                {group.groupLabel}
              </div>
            )}
            {group.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`dash-sidebar__nav-item${active ? " dash-sidebar__nav-item--active" : ""}`}
                >
                  <span className="dash-sidebar__nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge ? (
                    <span className="dash-sidebar__nav-badge">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="dash-sidebar__footer">
        <Link
          href="/login"
          className="dash-sidebar__nav-item dash-sidebar__nav-item--danger"
        >
          <span className="dash-sidebar__nav-icon">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </span>
          <span>Log Out</span>
        </Link>
      </div>
    </aside>
  );
}
