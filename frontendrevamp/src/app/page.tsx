import MainLayout from "@/components/layout/MainLayout";
import Image from "next/image";
import ExploreCategories from "@/components/sections/ExploreCategories";

export default function Home() {
  return (
    <section className="homepage">
      <div className="heroSection">
        <Image
          src="/bg/bg-ui.svg"
          alt=""
          fill
          className="homepage__bg-top"
          aria-hidden="true"
        />
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
            Track Every Application,{" "}
            <span className="homepage__heading-primary">Land Faster</span> With
            AI
          </h1>
          {/* Subtitle */}
          <p className="homepage__subtitle">
            ConvexHire uses AI to organise your job search and keep every
            application moving — so you spend less time tracking and more time
            interviewing.
          </p>
          {/* Search bar */}
          <div className="homepage__search">
            <div className="homepage__search-field">
              <svg
                className="homepage__search-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                className="homepage__search-input"
                type="text"
                placeholder="Job title or keyword"
                aria-label="Job title or keyword"
              />
            </div>
            <div className="homepage__search-divider" aria-hidden="true" />
            <div className="homepage__search-field">
              <svg
                className="homepage__search-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <input
                className="homepage__search-input"
                type="text"
                placeholder="Location"
                aria-label="Location"
              />
            </div>
            <button
              className="homepage__search-btn"
              type="button"
              aria-label="Search jobs"
            >
              Search
            </button>
          </div>
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
              Trusted by <strong>12,000+</strong> job seekers &mdash; 3,400
              hired last month
            </p>
          </div>
        </div>
        <div className="homepage__bottomImg">
          <Image
            src="/homepage/promotion.svg"
            width={1200}
            height={600}
            alt="Promotion Img"
            style={{ width: "100%", height: "auto" }}
          />
        </div>
      </div>

      <div className="exploreMoreCategoriesSection">
        <ExploreCategories />
      </div>
    </section>
  );
}
