'use client'
import { useEffect, useState } from 'react'

import Image from 'next/image'
import { useRouter } from 'next/navigation'

import { useReveal } from '@/hooks/useReveal'
import { ROLE_DASHBOARDS } from '@/lib/roleRoutes'
import { useAppSelector } from '@/store/hooks'
import { MapPin, Search } from 'lucide-react'

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

  // While redirecting, show nothing to avoid flash of landing page
  if (isAuthenticated) return null

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
                placeholder="Job title or keyword"
                aria-label="Job title or keyword"
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
                placeholder="Location"
                aria-label="Location"
                value={heroLocation}
                onChange={(e) => setHeroLocation(e.target.value)}
              />
            </div>
            <button className="homepage__search-btn" type="submit" aria-label="Search jobs">
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

      <WhyPreferUs />

      <Pricing />

      <FAQ />
    </section>
  )
}
