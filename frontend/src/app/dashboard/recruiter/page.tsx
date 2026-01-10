"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { WelcomeMessage, StatsGrid } from "../../../components/dashboard";
import { RecentActivity } from "../../../components/dashboard/RecentActivity";
import { AppShell } from "../../../components/layout/AppShell";
import {
  PageTransition,
  AnimatedContainer,
  LoadingSpinner,
} from "../../../components/common";
import { useDashboardStats } from "../../../hooks/useDashboardStats";
import { useAuth } from "../../../hooks/useAuth";

export default function RecruiterDashboard() {
  const { data: stats } = useDashboardStats();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [isAuthenticated, isAuthLoading]);

  if (isAuthLoading || !isAuthenticated) {
    return (
      <AppShell>
        <PageTransition className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </PageTransition>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageTransition
        className="min-h-screen"
        style={{ background: "#F9FAFB" }}
      >
        <div className="space-y-8 pb-12">
          {/* Header with Gradient Background */}
          <AnimatedContainer direction="up" delay={0.1}>
            <div className="relative py-12 bg-gradient-to-b from-indigo-50/50 to-white border-b border-indigo-50/50 mb-8 transition-all duration-300 ease-out">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ease-out">
                <WelcomeMessage firstName={user?.name} />
              </div>
            </div>
          </AnimatedContainer>

          {/* Main Content Container */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            {/* Stats Grid */}
            <AnimatedContainer direction="up" delay={0.2}>
              <StatsGrid stats={stats || {}} userType="recruiter" />
            </AnimatedContainer>

            {/* Recent Activity Section */}
            <AnimatedContainer direction="up" delay={0.3}>
              <RecentActivity />
            </AnimatedContainer>
          </div>
        </div>
      </PageTransition>
    </AppShell>
  );
}
