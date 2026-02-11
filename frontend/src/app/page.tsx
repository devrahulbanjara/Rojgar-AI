import Navigation from './components/landing/Navigation'
import Hero from './components/landing/Hero'
import ValueProposition from './components/landing/ValueProposition'
import FeaturesGrid from './components/landing/FeaturesGrid'
import HowItWorks from './components/landing/HowItWorks'
import Benefits from './components/landing/Benefits'
import Testimonials from './components/landing/Testimonials'
import Pricing from './components/landing/Pricing'
import CTASection from './components/landing/CTASection'
import Footer from './components/landing/Footer'
import { landingPageContent } from '../content/landing-page'
import { ForceLightMode } from '../components/common/ForceLightMode'

export default function Home() {
  return (
    <ForceLightMode>
      <Navigation content={landingPageContent.navigation} />
      <main id="main-content" role="main">
        <Hero content={landingPageContent.hero} />
        <ValueProposition content={landingPageContent.valueProposition} />
        <FeaturesGrid content={landingPageContent.features} />
        <HowItWorks content={landingPageContent.howItWorks} />
        <Benefits content={landingPageContent.benefits} />
        <Testimonials content={landingPageContent.testimonials} />
        <Pricing content={landingPageContent.pricing} />
        <CTASection content={landingPageContent.cta} />
      </main>
      <Footer content={landingPageContent.footer} />
    </ForceLightMode>
  )
}
