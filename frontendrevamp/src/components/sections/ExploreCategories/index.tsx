"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";

const LOGOS = [
  { src: "/homepage/exploreSection/google.svg", alt: "Google" },
  { src: "/homepage/exploreSection/notion.svg", alt: "Notion" },
  { src: "/homepage/exploreSection/shopify.svg", alt: "Shopify" },
  { src: "/homepage/exploreSection/spotify.svg", alt: "Spotify" },
  { src: "/homepage/exploreSection/stripe.svg", alt: "Stripe" },
];

const CATEGORIES = [
  {
    src: "/homepage/exploreSection/cards/graphicDesign.png",
    label: "Graphic Design",
  },
  {
    src: "/homepage/exploreSection/cards/uiuxDesign.png",
    label: "UI/UX Design",
  },
  {
    src: "/homepage/exploreSection/cards/videoEditing.png",
    label: "Video Editing",
  },
  {
    src: "/homepage/exploreSection/cards/development.png",
    label: "Development",
  },
  {
    src: "/homepage/exploreSection/cards/contentWriting.png",
    label: "Content Writing",
  },
  { src: "/homepage/exploreSection/cards/seo.png", label: "SEO" },
  {
    src: "/homepage/exploreSection/cards/3dAnimation.png",
    label: "3D Animation",
  },
  {
    src: "/homepage/exploreSection/cards/visualAssistant.png",
    label: "Virtual Assistant",
  },
];

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
      {/* Logos bar */}
      <div className="explore__logos">
        <div className="container explore__logos-inner">
          {LOGOS.map((logo) => (
            <div key={logo.alt} className="explore__logo">
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
            Explore Top Job{" "}
            <span className="explore__heading-accent">Categories</span>
          </h2>
          <p className="explore__subtitle">
            Discover the most in-demand roles and start finding opportunities
            that match your expertise.
          </p>
          <a href="/jobs" className="btn btn--primary explore__cta">
            See All Jobs
          </a>
        </div>

        {/* Right — Swiper */}
        <div className="explore__carousel">
          <button
            className="explore__nav explore__nav--prev"
            aria-label="Previous"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <Swiper
            modules={[Navigation]}
            navigation={{
              prevEl: ".explore__nav--prev",
              nextEl: ".explore__nav--next",
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
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
