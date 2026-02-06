'use client'

import {
  LandingNavbar,
  HeroSection,
  FeaturesSection,
  BrandSection,
  RecruiterPlatformSection,
  CandidatePlatformSection,
  HowItWorksSection,
  PricingSection,
  CTASection,
  LandingFooter,
} from '../components/landing'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <BrandSection />
        <RecruiterPlatformSection />
        <CandidatePlatformSection />
        <HowItWorksSection />
        <PricingSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  )
}
