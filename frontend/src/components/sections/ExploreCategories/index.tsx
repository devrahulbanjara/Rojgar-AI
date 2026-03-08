'use client'

import Image from 'next/image'
import Link from 'next/link'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import 'swiper/css'
import { Navigation } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

const LOGOS = [
  { src: '/homepage/logoMarquee/google.png', alt: 'Google' },
  { src: '/homepage/logoMarquee/fusemachines.png', alt: 'Fusemachines' },
  { src: '/homepage/logoMarquee/leapfrog.png', alt: 'Leapfrog' },
  { src: '/homepage/logoMarquee/cotiviti.webp', alt: 'Cotiviti' },
  { src: '/homepage/logoMarquee/f1soft.png', alt: 'F1Soft' },
  { src: '/homepage/logoMarquee/logpoint.webp', alt: 'Logpoint' },
  { src: '/homepage/logoMarquee/ingtech.svg', alt: 'Ingtech' },
  { src: '/homepage/logoMarquee/innovateTech.svg', alt: 'Innovate Tech' },
  { src: '/homepage/logoMarquee/LISNepal.webp', alt: 'LIS Nepal' },
  { src: '/homepage/logoMarquee/adexLtd.webp', alt: 'Adex Ltd' },
  { src: '/homepage/logoMarquee/cedargate.png', alt: 'Cedargate' },
  { src: '/homepage/logoMarquee/clocoNepal.webp', alt: 'Cloco Nepal' },
  { src: '/homepage/logoMarquee/ebPearls.jpg', alt: 'EB Pearls' },
  { src: '/homepage/logoMarquee/infoDevelopers.webp', alt: 'Info Developers' },
  { src: '/homepage/logoMarquee/softbenzinfosys.png', alt: 'Softbenz Infosys' },
  { src: '/homepage/logoMarquee/vairavTech.png', alt: 'Vairav Tech' },
  { src: '/homepage/logoMarquee/ycotek.jpg', alt: 'Ycotek' },
]

const CATEGORIES = [
  {
    src: '/homepage/exploreSection/cards/graphicDesign.png',
    label: 'Graphic Design',
  },
  {
    src: '/homepage/exploreSection/cards/uiuxDesign.png',
    label: 'UI/UX Design',
  },
  {
    src: '/homepage/exploreSection/cards/videoEditing.png',
    label: 'Video Editing',
  },
  {
    src: '/homepage/exploreSection/cards/development.png',
    label: 'Development',
  },
  {
    src: '/homepage/exploreSection/cards/contentWriting.png',
    label: 'Content Writing',
  },
  { src: '/homepage/exploreSection/cards/seo.png', label: 'SEO' },
  {
    src: '/homepage/exploreSection/cards/3dAnimation.png',
    label: '3D Animation',
  },
  {
    src: '/homepage/exploreSection/cards/visualAssistant.png',
    label: 'Virtual Assistant',
  },
]

export default function ExploreCategories() {
  return (
    <section className="explore">
      {/* Right side bg decoration */}
      <Image
        src="/bg/bg-ui-v3.svg"
        alt=""
        width={600}
        height={800}
        className="explore__bg"
        aria-hidden="true"
      />

      {/* Logos marquee */}
      <div className="explore__logos">
        <div className="explore__marquee-track">
          {/* Duplicate for seamless loop */}
          {[...LOGOS, ...LOGOS].map((logo, i) => (
            <div key={i} className="explore__logo">
              <Image src={logo.src} alt={logo.alt} width={120} height={36} />
            </div>
          ))}
        </div>
      </div>

      {/* Main split */}
      <div className="container explore__main">
        {/* Left */}
        <div className="explore__left">
          <h2 className="explore__heading">
            Explore Top Job <span className="explore__heading-accent">Categories</span>
          </h2>
          <p className="explore__subtitle">
            Discover the most in-demand roles and start finding opportunities that match your
            expertise.
          </p>
          <Link href="/jobs" className="btn btn--primary explore__cta">
            See All Jobs
          </Link>
        </div>

        {/* Right — Swiper */}
        <div className="explore__carousel">
          <button className="explore__nav explore__nav--prev" aria-label="Previous">
            <ChevronLeft aria-hidden="true" />
          </button>

          <Swiper
            modules={[Navigation]}
            navigation={{
              prevEl: '.explore__nav--prev',
              nextEl: '.explore__nav--next',
            }}
            slidesPerView={1.3}
            spaceBetween={16}
            breakpoints={{
              640: { slidesPerView: 2.2, spaceBetween: 16 },
              1024: { slidesPerView: 3.2, spaceBetween: 20 },
              1280: { slidesPerView: 3.4, spaceBetween: 20 },
            }}
            loop
            className="explore__swiper"
          >
            {CATEGORIES.map((cat) => (
              <SwiperSlide key={cat.label}>
                <div className="explore__card">
                  <Image
                    src={cat.src}
                    alt={cat.label}
                    fill
                    sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 280px"
                    className="explore__card-img"
                  />
                  <div className="explore__card-overlay" />
                  <span className="explore__card-label">{cat.label}</span>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          <button className="explore__nav explore__nav--next" aria-label="Next">
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="container explore__stats">
        <div className="explore__stat">
          <span className="explore__stat-number">50+</span>
          <span className="explore__stat-desc">Job Categories</span>
        </div>
        <div className="explore__stat">
          <span className="explore__stat-number">12k+</span>
          <span className="explore__stat-desc">Active Listings</span>
        </div>
        <div className="explore__stat">
          <span className="explore__stat-number">500+</span>
          <span className="explore__stat-desc">Partner Companies</span>
        </div>
        <div className="explore__stat">
          <span className="explore__stat-number">3,400+</span>
          <span className="explore__stat-desc">Candidates Hired</span>
        </div>
      </div>
    </section>
  )
}
