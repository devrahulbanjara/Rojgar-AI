"use client";

import Image from "next/image";

const BLOCKS = [
  {
    id: "no-ghosting",
    color: "secondary",
    image: "/homepage/whyPreferUs/image1.svg",
    imageAlt: "Candidate working at laptop",
    title: "We Never Ghost Candidates",
    body: "Every application you submit is tracked, and every candidate receives a response. We believe in transparent, respectful communication throughout your entire hiring journey — not just when it's convenient for us.",
    features: [
      {
        icon: "clock",
        heading: "Hear back within 48 hours",
        desc: "Prompt responses at every stage of your application.",
      },
      {
        icon: "bell",
        heading: "Real-time status updates",
        desc: "Know exactly where you stand — no more waiting in silence.",
      },
    ],
    reverse: false,
  },
  {
    id: "salary-range",
    color: "warning",
    image: "/homepage/whyPreferUs/image2.svg",
    imageAlt: "Professional reviewing salary insights",
    title: "Know Your Salary Range Before You Apply",
    body: "Stop wasting time on roles that don't match your worth. ConvexHire surfaces verified salary data for every listing so you can negotiate from a position of strength — not guesswork.",
    features: [
      {
        icon: "chart",
        heading: "Verified salary bands",
        desc: "Sourced directly from employers, not scraped estimates.",
      },
      {
        icon: "target",
        heading: "Personalised market insights",
        desc: "Salary benchmarks tailored to your skills and location.",
      },
    ],
    reverse: true,
  },
  {
    id: "ai-tracking",
    color: "accent",
    image: "/homepage/whyPreferUs/image3.svg",
    imageAlt: "HR team reviewing AI analytics dashboard",
    title: "AI-Powered Tracking for HR Teams",
    body: "Track every applicant through your pipeline with AI-driven analytics that highlight top candidates, flag bottlenecks, and help your team make faster, fairer hiring decisions at scale.",
    features: [
      {
        icon: "brain",
        heading: "Intelligent candidate scoring",
        desc: "Automated pipeline tracking with smart ranking built in.",
      },
      {
        icon: "chart",
        heading: "Data-driven HR dashboards",
        desc: "Real-time insights built for modern hiring teams.",
      },
    ],
    reverse: false,
  },
];

const ICONS: Record<string, React.ReactNode> = {
  clock: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  bell: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  chart: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  target: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  brain: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
      <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
      <path d="M6 18a4 4 0 0 1-1.967-.516" />
      <path d="M19.967 17.484A4 4 0 0 1 18 18" />
    </svg>
  ),
};

export default function WhyPreferUs() {
  return (
    <section className="why-prefer">
      <div className="why-prefer__header container">
        <p className="why-prefer__label">Why ConvexHire</p>
        <h2 className="why-prefer__heading">
          Built differently,
          <br />
          for people who care about their career
        </h2>
        <p className="why-prefer__subheading">
          Most job platforms treat candidates as data points. We don&apos;t.
        </p>
      </div>

      <div className="why-prefer__blocks container">
        {BLOCKS.map((block) => {
          const imgEl = (
            <div
              className={`why-prefer__img-wrap why-prefer__img-wrap--${block.color}`}
            >
              <Image
                src={block.image}
                alt={block.imageAlt}
                fill
                className="why-prefer__img"
                sizes="(max-width: 768px) 100vw, 475px"
              />
            </div>
          );

          const textEl = (
            <div className="why-prefer__text">
              <h3 className="why-prefer__title">{block.title}</h3>
              <p className="why-prefer__body">{block.body}</p>
              <ul className="why-prefer__features">
                {block.features.map((f) => (
                  <li key={f.heading} className="why-prefer__feature">
                    <span className="why-prefer__feature-icon">
                      {ICONS[f.icon]}
                    </span>
                    <span className="why-prefer__feature-copy">
                      <strong className="why-prefer__feature-heading">
                        {f.heading}
                      </strong>
                      <span className="why-prefer__feature-desc">{f.desc}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );

          return (
            <div
              key={block.id}
              className={`why-prefer__block why-prefer__block--${block.color}${
                block.reverse ? " why-prefer__block--reverse" : ""
              }`}
            >
              {/* Reverse: text left, image right — swap DOM order to match grid columns */}
              {block.reverse ? (
                <>
                  {textEl}
                  {imgEl}
                </>
              ) : (
                <>
                  {imgEl}
                  {textEl}
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
