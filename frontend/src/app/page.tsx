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
  ManifestoSection,
  TestimonialsSection,
} from '../components/landing'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      <LandingNavbar />
      <main>
        <HeroSection />
        <BrandSection />
        <ManifestoSection />
        <RecruiterPlatformSection />
        <HowItWorksSection />
        <FeaturesSection />
        <CandidatePlatformSection />
        <TestimonialsSection />
        <PricingSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  )
}
