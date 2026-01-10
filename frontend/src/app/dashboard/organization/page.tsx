"use client";

import React from "react";
import { Users, Briefcase, FileText } from "lucide-react";
import { AppShell } from "../../../components/layout/AppShell";
import {
  PageTransition,
  AnimatedContainer,
  StatCard,
} from "../../../components/common";

export default function OrganizationDashboard() {
  return (
    <AppShell>
      <PageTransition
        className="min-h-screen"
        style={{ background: "#F9FAFB" }}
      >
        <div className="space-y-8 pb-12">
          <AnimatedContainer direction="up" delay={0.1}>
            <div className="relative py-12 bg-gradient-to-b from-indigo-50/50 to-white border-b border-indigo-50/50 mb-8 transition-all duration-300 ease-out">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ease-out">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-4xl max-lg:text-3xl font-bold text-[#0F172A] leading-tight tracking-tight">
                      Welcome, TechCorp Inc.
                    </h1>
                    <p className="text-lg text-[#475569] mt-2 max-w-2xl">
                      Here&apos;s what&apos;s happening across your organization
                      today.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedContainer>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <AnimatedContainer direction="up" delay={0.2}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                  title="Total Recruiters"
                  value="12"
                  icon={<Users />}
                  description="Active team members"
                  trend={{ value: 8, isPositive: true }}
                />
                <StatCard
                  title="Active Jobs"
                  value="45"
                  icon={<Briefcase />}
                  description="Open positions"
                  trend={{ value: 12, isPositive: true }}
                />
                <StatCard
                  title="Total Applicants"
                  value="1,284"
                  icon={<FileText />}
                  description="Across all jobs"
                  trend={{ value: 24, isPositive: true }}
                />
              </div>
            </AnimatedContainer>
          </div>
        </div>
      </PageTransition>
    </AppShell>
  );
}
