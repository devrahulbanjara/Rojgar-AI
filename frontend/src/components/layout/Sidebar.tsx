import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../../lib/utils";
import type { UserType } from "../../types/index";
import {
  LayoutDashboard,
  BriefcaseIcon,
  Users,
  Search,
  FileText,
  Calendar,
  BarChart3,
  MessageSquare,
  User,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  role: UserType;
  disableAnimation?: boolean;
}

export function Sidebar({
  isCollapsed,
  onToggle,
  role,
  disableAnimation = false,
}: SidebarProps) {
  const pathname = usePathname();
  const [showPulse, setShowPulse] = useState(true);

  // Remove pulse animation after initial load
  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const recruiterItems = [
    { title: "Dashboard", path: "/dashboard/recruiter", icon: LayoutDashboard },
    { title: "Jobs", path: "/recruiter/jobs", icon: BriefcaseIcon },
    { title: "Shortlist", path: "/recruiter/shortlist", icon: Users },
    { title: "Interviews", path: "/recruiter/interviews", icon: Calendar },
    {
      title: "Final Selection",
      path: "/recruiter/final-selection",
      icon: BarChart3,
    },
    {
      title: "Candidate Pool",
      path: "/recruiter/candidate-pool",
      icon: MessageSquare,
    },
  ];

  const candidateItems = [
    { title: "Dashboard", path: "/dashboard/candidate", icon: LayoutDashboard },
    { title: "Jobs", path: "/candidate/browse-jobs", icon: Search },
    { title: "Resumes", path: "/candidate/resumes", icon: FileText },
    { title: "Profile", path: "/candidate/profile", icon: User },
  ];

  const items = role === "recruiter" ? recruiterItems : candidateItems;
  const toggleAriaLabel = isCollapsed ? "Expand sidebar" : "Collapse sidebar";
  const ToggleIcon = isCollapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <aside
      className={cn(
        "fixed left-0 top-[72px] z-40 flex h-[calc(100vh-72px)] flex-col",
        "bg-gradient-to-b from-white via-white to-[#F8FAFC]",
        "border-r border-[#E2E8F0] shadow-sm",
        !disableAnimation && "transition-all duration-500 ease-in-out",
        isCollapsed ? "w-16" : "w-[260px]",
        "max-lg:w-[260px] max-lg:transition-transform max-lg:duration-300 max-lg:shadow-xl",
        isCollapsed
          ? "max-lg:-translate-x-full max-lg:pointer-events-none"
          : "max-lg:translate-x-0 max-lg:pointer-events-auto",
      )}
      style={{
        transitionDuration: disableAnimation ? "0ms" : "500ms",
        transitionTimingFunction: disableAnimation
          ? undefined
          : "ease-in-out",
      }}
    >
      {/* Toggle Button - Edge when expanded, Bottom when collapsed */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "group absolute z-50 hidden h-9 w-9 items-center justify-center rounded-full",
          "border-2 border-[#E2E8F0] bg-white text-[#64748B]",
          "shadow-md hover:shadow-lg transition-all duration-200 ease-in-out lg:flex cursor-pointer",
          "hover:border-[#3056F5] hover:bg-[#3056F5] hover:text-white",
          "active:scale-95 active:shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-[#3056F5] focus:ring-offset-2",
          isCollapsed
            ? "bottom-6 left-1/2 -translate-x-1/2"
            : "bottom-6 -right-4",
        )}
        aria-label={toggleAriaLabel}
        aria-expanded={!isCollapsed}
        title={toggleAriaLabel}
        style={{
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Pulse Ring Animation */}
        {showPulse && (
          <div className="absolute inset-0 z-40">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3056F5] opacity-20" />
            <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-[#3056F5] opacity-10" />
          </div>
        )}

        {/* Tooltip - Only show when expanded */}
        {!isCollapsed && (
          <span className="pointer-events-none absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-[#0F172A] px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2">
            {toggleAriaLabel}
            <span className="absolute left-full top-1/2 -translate-y-1/2 -ml-1 border-4 border-transparent border-l-[#0F172A]" />
          </span>
        )}

        <ToggleIcon
          className={cn(
            "h-[16px] w-[16px] transition-all duration-500 ease-in-out relative z-10",
            "group-hover:scale-110",
          )}
          style={{
            transform: isCollapsed ? "rotateY(0deg)" : "rotateY(180deg)",
          }}
        />
      </button>

      <nav
        className={cn(
          "pt-6 flex flex-col space-y-1 transition-all duration-500 max-lg:pt-6 max-lg:space-y-2 overflow-y-auto",
          isCollapsed ? "items-center px-2" : "px-3",
          "max-lg:px-6",
        )}
      >
        {items.map((item) => {
          const isActive =
            pathname === item.path || pathname.startsWith(item.path + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              href={item.path}
              aria-label={item.title}
              title={item.title}
              className={cn(
                "group relative flex h-11 w-full items-center rounded-xl transition-all duration-200 gap-3 px-4 cursor-pointer",
                isCollapsed && "justify-center gap-0 px-0",
                isActive
                  ? "bg-gradient-to-r from-[#3056F5]/10 to-[#3056F5]/5 text-[#3056F5] shadow-sm"
                  : "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B] active:bg-[#E2E8F0]",
              )}
            >
              {isActive && !isCollapsed && (
                <div className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-[#3056F5] to-[#3B82F6] shadow-sm" />
              )}
              <Icon
                className={cn(
                  "h-6 w-6 flex-shrink-0 transition-all duration-200",
                  isActive
                    ? "text-[#3056F5] drop-shadow-sm"
                    : "text-[#64748B] group-hover:text-[#475569] group-hover:scale-105",
                )}
              />
              <span
                className={cn(
                  "text-base font-semibold whitespace-nowrap block",
                  isCollapsed
                    ? "pointer-events-none opacity-0 -translate-x-32"
                    : "pointer-events-auto translate-x-0 opacity-100",
                  isActive ? "text-[#3056F5]" : "text-[#1E293B]",
                )}
                style={{
                  overflow: "hidden",
                  width: isCollapsed ? "0px" : "180px",
                  transitionProperty: disableAnimation
                    ? "none"
                    : "width, opacity, transform",
                  transitionDuration: disableAnimation
                    ? "0ms"
                    : isCollapsed
                      ? "500ms, 350ms, 250ms"
                      : "500ms, 350ms, 250ms",
                  transitionDelay: disableAnimation
                    ? "0ms"
                    : isCollapsed
                      ? "0ms, 300ms, 500ms"
                      : "0ms, 100ms, 0ms",
                  transitionTimingFunction: disableAnimation
                    ? undefined
                    : isCollapsed
                      ? "cubic-bezier(0.4, 0, 0.2, 1), ease-out, ease-out"
                      : "cubic-bezier(0.4, 0, 0.2, 1), ease-out, ease-out",
                }}
              >
                {item.title}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
