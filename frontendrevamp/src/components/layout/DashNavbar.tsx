"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAppSelector } from "@/store/hooks";

// DashRole only includes the three layouts that actually instantiate DashNavbar.
// "hr" and "recruiter" were removed — both those users are served by the "company" layout.
export type DashRole = "user" | "admin" | "company";

type NavItem = { label: string; href: string };

type DashNavbarProps = {
  role: DashRole;
  userName?: string;
  userRole?: string;
  userInitials?: string;
};

function buildNavItems(role: DashRole, isCompanyAdmin?: boolean): NavItem[] {
  if (role === "user") {
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Jobs", href: "/dashboard/jobs" },
      { label: "Applications", href: "/dashboard/applications" },
      { label: "Resumes", href: "/dashboard/resume" },
      { label: "Profile", href: "/dashboard/profile" },
    ];
  }
  if (role === "admin") {
    return [
      { label: "Dashboard", href: "/admin" },
      { label: "Jobs", href: "/admin/jobs" },
      { label: "Applications", href: "/admin/applications" },
      { label: "Users", href: "/admin/users" },
    ];
  }
  // "company" — shared by both company admins and approved recruiters
  const items: NavItem[] = [
    { label: "Dashboard", href: "/company" },
    { label: "My Jobs", href: "/company/jobs" },
    { label: "Applications", href: "/company/applications" },
    { label: "Candidates", href: "/company/candidates" },
  ];
  if (isCompanyAdmin) {
    items.push({ label: "Recruiters", href: "/company/recruiters" });
  }
  return items;
}

export default function DashNavbar({
  role,
  userName = "User",
  userRole = "Member",
  userInitials = "U",
}: DashNavbarProps) {
  const pathname = usePathname();
  const { user } = useAppSelector((s) => s.auth);
  const isCompanyAdmin = user?.primary_role === "company";
  const navItems = buildNavItems(role, isCompanyAdmin);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  function isActive(href: string) {
    if (href === "/") return pathname === href;
    // match exact for dashboard root (e.g. /admin or /dashboard)
    const isRoot =
      href === "/dashboard" ||
      href === "/admin" ||
      href === "/company" ||
      href.endsWith("/hr");
    if (isRoot) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <nav className="dash-navbar">
      <div className="dash-navbar__inner container">
        {/* Logo — links to the role's dashboard root */}
        <Link href={navItems[0].href} className="dash-navbar__logo">
          <Image
            src="/logo/logo.png"
            alt="ConvexHire"
            width={140}
            height={30}
            className="dash-navbar__logo-image"
            priority
          />
        </Link>

        {/* Nav links — centred via grid */}
        <nav className="dash-navbar__nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`dash-navbar__nav-link${isActive(item.href) ? " dash-navbar__nav-link--active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="dash-navbar__right">
          {/* Expandable search */}
          <div
            ref={searchRef}
            className={`dash-navbar__search${searchOpen ? " dash-navbar__search--open" : ""}`}
          >
            <button
              className="dash-navbar__search-btn"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Toggle search"
            >
              {searchOpen ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              )}
            </button>
            <input
              ref={searchInputRef}
              className="dash-navbar__search-input"
              placeholder="Search jobs, candidates…"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
          </div>

          {/* Notifications */}
          <button className="dash-navbar__icon-btn" title="Notifications">
            <div className="dash-navbar__notif-dot" />
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
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>

          {/* Profile dropdown */}
          <div ref={dropdownRef} className="dash-navbar__profile">
            <button
              className="dash-navbar__avatar-btn"
              onClick={() => setDropdownOpen((v) => !v)}
              aria-label="Open profile menu"
              aria-expanded={dropdownOpen}
            >
              <div className="dash-navbar__avatar">{userInitials}</div>
              <svg
                className={`dash-navbar__avatar-chevron${dropdownOpen ? " dash-navbar__avatar-chevron--open" : ""}`}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="dash-navbar__dropdown">
                {/* User info block */}
                <div className="dash-navbar__dropdown-user">
                  <div className="dash-navbar__dropdown-avatar">
                    {userInitials}
                  </div>
                  <div className="dash-navbar__dropdown-info">
                    <div className="dash-navbar__dropdown-name">{userName}</div>
                    <div className="dash-navbar__dropdown-role">{userRole}</div>
                  </div>
                </div>

                <div className="dash-navbar__dropdown-divider" />

                <Link
                  href={
                    role === "user"
                      ? "/dashboard/profile"
                      : role === "admin"
                        ? "/admin/profile"
                        : "/company/settings"
                  }
                  className="dash-navbar__dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  View Profile
                </Link>

                <Link
                  href={
                    role === "user"
                      ? "/dashboard"
                      : role === "admin"
                        ? "/admin"
                        : "/company"
                  }
                  className="dash-navbar__dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                  Dashboard
                </Link>

                <Link
                  href="/dashboard/resume"
                  className="dash-navbar__dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  My Resume
                </Link>

                <div className="dash-navbar__dropdown-divider" />

                <Link
                  href="/login"
                  className="dash-navbar__dropdown-item dash-navbar__dropdown-item--danger"
                  onClick={() => setDropdownOpen(false)}
                >
                  <svg
                    width="15"
                    height="15"
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
                  Log Out
                </Link>
              </div>
            )}
          </div>
          {/* /__profile */}
        </div>
        {/* /__right */}
      </div>
      {/* /__inner */}
    </nav>
  );
}
