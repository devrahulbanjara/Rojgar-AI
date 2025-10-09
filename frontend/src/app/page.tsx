'use client';

import {
  LandingNavbar,
  HeroSection,
  RecruiterPlatformSection,
  CandidatePlatformSection,
  InsightsSection,
  NeuralIntelligenceSection,
  PricingSection,
  LandingFooter,
} from '../components/landing';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />
      <main>
        <HeroSection />
        <RecruiterPlatformSection />
        <CandidatePlatformSection />
        <InsightsSection />
        <NeuralIntelligenceSection />
        <PricingSection />
      </main>
      <LandingFooter />
    </div>
  );
}
