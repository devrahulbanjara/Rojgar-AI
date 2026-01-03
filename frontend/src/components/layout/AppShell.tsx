"use client";

import React from "react";
import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";
import { MainContentContainer } from "../common/MainContentContainer";
import { useAuth } from "../../hooks/useAuth";

interface AppShellProps {
  children: React.ReactNode;
  hideSidebar?: boolean;
}

export function AppShell({ children, hideSidebar = false }: AppShellProps) {
  const { user } = useAuth();

  // Track if component has hydrated to prevent animation flash
  const [isHydrated, setIsHydrated] = React.useState(false);
  
  // Track previous collapsed state to determine transition direction
  const prevCollapsedRef = React.useRef<boolean | null>(null);

  // Initialize state with consistent default to prevent hydration mismatch
  // Will be updated in useEffect after hydration
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  // Initialize sidebar state from localStorage after hydration (only if sidebar is shown)
  React.useEffect(() => {
    if (hideSidebar) {
      setIsHydrated(true);
      return;
    }

    // Read from localStorage and set initial state
    try {
      const storedPreference = window.localStorage.getItem("sidebarCollapsed");
      if (storedPreference !== null) {
        const collapsed = storedPreference === "true";
        setIsSidebarCollapsed(collapsed);
        prevCollapsedRef.current = collapsed;
      } else {
        // Default based on screen size
        const collapsed = window.innerWidth < 1024;
        setIsSidebarCollapsed(collapsed);
        prevCollapsedRef.current = collapsed;
      }
    } catch {
      // ignore read errors, use default based on screen size
      const collapsed = window.innerWidth < 1024;
      setIsSidebarCollapsed(collapsed);
      prevCollapsedRef.current = collapsed;
    }
    
    // Delay enabling animations to allow initial state to render first
    // This prevents the sidebar from animating on page load
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, [hideSidebar]);

  // Track previous state to determine transition direction
  React.useEffect(() => {
    prevCollapsedRef.current = isSidebarCollapsed;
  }, [isSidebarCollapsed]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        return;
      }
      setIsSidebarCollapsed(true);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSidebarToggle = React.useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const nextState = !prev;
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem("sidebarCollapsed", String(nextState));
        } catch {
          // ignore write errors
        }
      }
      return nextState;
    });
  }, []);

  const sidebarMarginClass = React.useMemo(
    () => {
      if (hideSidebar) return "";
      return isSidebarCollapsed ? "lg:ml-16" : "lg:ml-[260px]";
    },
    [isSidebarCollapsed, hideSidebar],
  );

  // Determine transition duration and easing based on direction
  // When collapsing (sidebar closing): content expands → slower (700ms), smooth
  // When expanding (sidebar opening): content shrinks → faster (350ms), smooth (no bounce)
  const getTransitionDuration = React.useCallback(() => {
    if (!isHydrated) {
      return "0ms";
    }
    
    // On initial render, prevCollapsedRef.current is null, so use default
    if (prevCollapsedRef.current === null) {
      return "500ms";
    }
    
    // Compare current state with previous state to determine direction
    // If transitioning from expanded (false) to collapsed (true): collapsing → slower
    // If transitioning from collapsed (true) to expanded (false): expanding → faster
    const isCollapsing = !prevCollapsedRef.current && isSidebarCollapsed;
    const isExpanding = prevCollapsedRef.current && !isSidebarCollapsed;
    
    if (isCollapsing) {
      return "700ms"; // Slower when collapsing (content expanding)
    } else if (isExpanding) {
      return "350ms"; // Faster when expanding (content shrinking)
    }
    
    // No transition (same state)
    return "500ms";
  }, [isSidebarCollapsed, isHydrated]);

  return (
    <div className="min-h-screen" style={{ background: "#F9FAFB" }}>
      <Topbar onMenuClick={hideSidebar ? () => {} : handleSidebarToggle} user={user} />

      <div className="flex min-h-[calc(100vh-72px)] pt-[72px]">
        {!hideSidebar && (
          <>
            <Sidebar
              isCollapsed={isSidebarCollapsed}
              onToggle={handleSidebarToggle}
              role={user?.role || "candidate"}
              disableAnimation={!isHydrated}
            />

            {!isSidebarCollapsed && (
              <div
                className="fixed inset-0 z-30 bg-black/40 lg:hidden"
                onClick={handleSidebarToggle}
                aria-hidden="true"
              />
            )}
          </>
        )}

        <main
          className={`flex-1 ${isHydrated ? "transition-all" : ""} ${sidebarMarginClass} max-lg:ml-0 px-6 lg:px-8`}
          style={{
            transitionDuration: getTransitionDuration(),
            transitionTimingFunction: "ease-in-out",
          }}
        >
          <MainContentContainer maxWidth="full" padding="none">
            {children}
          </MainContentContainer>
        </main>
      </div>
    </div>
  );
}
