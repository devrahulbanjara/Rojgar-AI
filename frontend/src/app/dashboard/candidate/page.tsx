"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import CandidateDashboardComponent from "../../../components/dashboard/CandidateDashboard";
import { WelcomeMessage } from "../../../components/dashboard";
import {
  PageTransition,
  AnimatedContainer,
  LoadingSpinner,
} from "../../../components/common";
import { AppShell } from "../../../components/layout/AppShell";
import { useAuth } from "../../../hooks/useAuth";

export default function CandidateDashboardPage() {
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

  // Get first name from user's full name
  const firstName = user?.name?.split(" ")[0];

  return (
    <AppShell>
      <PageTransition
        className="min-h-screen"
        style={{ background: "#F9FAFB" }}
      >
        <div className="space-y-8 pb-12">
          {/* Welcome Message with Gradient Background */}
          <AnimatedContainer direction="up" delay={0.1}>
            <div className="relative py-12 bg-gradient-to-b from-indigo-50/50 to-white border-b border-indigo-50/50 mb-8 transition-all duration-300 ease-out">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ease-out">
                <WelcomeMessage firstName={firstName} />
              </div>
            </div>
          </AnimatedContainer>

          {/* New Kanban Dashboard */}
          <AnimatedContainer direction="up" delay={0.3}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <CandidateDashboardComponent />
            </div>
          </AnimatedContainer>
        </div>
      </PageTransition>
    </AppShell>
  );
}
