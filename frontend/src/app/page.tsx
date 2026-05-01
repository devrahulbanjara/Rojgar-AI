'use client'
import { useEffect, useState } from 'react'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { useReveal } from '@/hooks/useReveal'
import { ROLE_DASHBOARDS } from '@/lib/roleRoutes'
import { useAppSelector } from '@/store/hooks'
import { ArrowRight, MapPin, Search } from 'lucide-react'

import ExploreCategories from '@/components/sections/ExploreCategories'
import FAQ from '@/components/sections/FAQ'
import FeaturedJobs from '@/components/sections/FeaturedJobs'
import HeroAnimations from '@/components/sections/HeroAnimations'
import Pricing from '@/components/sections/Pricing'
import WhyPreferUs from '@/components/sections/WhyPreferUs'

export default function Home() {
  const { user, isAuthenticated } = useAppSelector((s) => s.auth)
  const router = useRouter()
  const [heroQuery, setHeroQuery] = useState('')
  const [heroLocation, setHeroLocation] = useState('')
  useReveal()

  useEffect(() => {
    if (isAuthenticated && user) {
      const dest = ROLE_DASHBOARDS[user.primary_role]
      if (dest) {
        router.replace(dest)
      }
    }
  }, [isAuthenticated, user, router])

  function handleHeroSearch(e: React.FormEvent) {
    e.preventDefault()
    const sp = new URLSearchParams()
    if (heroQuery.trim()) sp.set('q', heroQuery.trim())
    if (heroLocation.trim()) sp.set('location', heroLocation.trim())
    const qs = sp.toString()
    router.push(qs ? `/jobs?${qs}` : '/jobs')
  }

  return (
    <section className="homepage">
      <div className="heroSection">
        <HeroAnimations />
        <Image src="/bg/bg-ui.svg" alt="" fill className="homepage__bg-top" aria-hidden="true" />
        <Image
          src="/bg/bg-ui-v2.svg"
          alt=""
          width={200}
          height={200}
          className="homepage__bg-bottom"
          aria-hidden="true"
        />
        <div className="container homepage__inner">
          {/* Heading */}
          <h1 className="homepage__heading">
            Track Every Application, <span className="homepage__heading-primary">Land Faster</span>{' '}
            With AI
          </h1>
          {/* Subtitle */}
          <p className="homepage__subtitle">
            ConvexHire uses AI to organise your job search and keep every application moving — so
            you spend less time tracking and more time interviewing.
          </p>
          {/* Search bar */}
          <form className="homepage__search" onSubmit={handleHeroSearch}>
            <div className="homepage__search-field">
              <Search className="homepage__search-icon" aria-hidden="true" />
              <input
                className="homepage__search-input"
                type="text"
                placeholder="Search job title, skills, or company"
                aria-label="Search job title, skills, or company"
                value={heroQuery}
                onChange={(e) => setHeroQuery(e.target.value)}
              />
            </div>
            <div className="homepage__search-divider" aria-hidden="true" />
            <div className="homepage__search-field">
              <MapPin className="homepage__search-icon" aria-hidden="true" />
              <input
                className="homepage__search-input"
                type="text"
                placeholder="City or remote"
                aria-label="City or remote"
                value={heroLocation}
                onChange={(e) => setHeroLocation(e.target.value)}
              />
            </div>
            <button className="btn btn--primary btn--lg" type="submit" aria-label="Search jobs">
              <Search size={16} aria-hidden="true" />
              Search
            </button>
          </form>
          {/* Social proof */}
          <div className="homepage__proof-container">
            <Image
              src="/homepage/testimonial.svg"
              width={100}
              height={50}
              className="homepage__proofImg"
              alt="Testimonials Image"
            />
            <p className="homepage__proof">
              Trusted by <strong>12,000+</strong> job seekers &mdash; 3,400 hired last month
            </p>
          </div>
        </div>
        <div className="homepage__bottomImg">
          <Image
            src="/homepage/promotion.svg"
            width={1200}
            height={600}
            alt="Promotion Img"
            style={{ width: '100%', height: 'auto' }}
          />
        </div>
      </div>

      <ExploreCategories />

      <FeaturedJobs />

      {/* Mid-page CTA */}
      <section className="mid-cta" data-reveal>
        <div className="container mid-cta__inner">
          <h2 className="mid-cta__heading">Ready to take the next step?</h2>
          <p className="mid-cta__sub">
            Whether you&apos;re hiring or job hunting, ConvexHire gets you there faster.
          </p>
          <div className="mid-cta__actions">
            <Link href="/signup" className="mid-cta__btn mid-cta__btn--primary">
              Sign Up Free
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/jobs" className="mid-cta__btn mid-cta__btn--outline">
              Browse Jobs
            </Link>
          </div>
        </div>
      </section>

      <WhyPreferUs />

      <Pricing />

      <FAQ />

      {/* Closing CTA */}
      <section className="closing-cta" data-reveal>
        <Image
          src="/bg/bg-ui.svg"
          alt=""
          width={400}
          height={400}
          className="closing-cta__bg-left"
          aria-hidden="true"
          priority={false}
        />
        <Image
          src="/bg/bg-ui-v2.svg"
          alt=""
          width={400}
          height={400}
          className="closing-cta__bg-right"
          aria-hidden="true"
          priority={false}
        />
        <div className="container closing-cta__inner">
          <h2 className="closing-cta__heading">Still have questions?</h2>
          <p className="closing-cta__sub">
            Our team is here to help. Or jump in and see for yourself.
          </p>
          <div className="closing-cta__actions">
            <Link href="/signup" className="closing-cta__btn closing-cta__btn--primary">
              Get Started Free
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href="https://wa.me/9779866121812"
              className="closing-cta__btn closing-cta__btn--outline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Talk to Us
            </Link>
          </div>
        </div>
      </section>
    </section>
  )
}
