'use client'

import Image from 'next/image'

import { BarChart3, Bell, BrainCircuit, Clock, Target } from 'lucide-react'

const BLOCKS = [
  {
    id: 'no-ghosting',
    color: 'secondary',
    image: '/homepage/whyPreferUs/image1.svg',
    imageAlt: 'Candidate working at laptop',
    title: 'We Never Ghost Candidates',
    body: "Every application you submit is tracked, and every candidate receives a response. We believe in transparent, respectful communication throughout your entire hiring journey — not just when it's convenient for us.",
    features: [
      {
        icon: 'clock',
        heading: 'Hear back within 48 hours',
        desc: 'Prompt responses at every stage of your application.',
      },
      {
        icon: 'bell',
        heading: 'Real-time status updates',
        desc: 'Know exactly where you stand — no more waiting in silence.',
      },
    ],
    reverse: false,
  },
  {
    id: 'salary-range',
    color: 'warning',
    image: '/homepage/whyPreferUs/image2.svg',
    imageAlt: 'Professional reviewing salary insights',
    title: 'Know Your Salary Range Before You Apply',
    body: "Stop wasting time on roles that don't match your worth. ConvexHire surfaces verified salary data for every listing so you can negotiate from a position of strength — not guesswork.",
    features: [
      {
        icon: 'chart',
        heading: 'Verified salary bands',
        desc: 'Sourced directly from employers, not scraped estimates.',
      },
      {
        icon: 'target',
        heading: 'Personalised market insights',
        desc: 'Salary benchmarks tailored to your skills and location.',
      },
    ],
    reverse: true,
  },
  {
    id: 'ai-tracking',
    color: 'accent',
    image: '/homepage/whyPreferUs/image3.svg',
    imageAlt: 'HR team reviewing AI analytics dashboard',
    title: 'AI-Powered Tracking for HR Teams',
    body: 'Track every applicant through your pipeline with AI-driven analytics that highlight top candidates, flag bottlenecks, and help your team make faster, fairer hiring decisions at scale.',
    features: [
      {
        icon: 'brain',
        heading: 'Intelligent candidate scoring',
        desc: 'Automated pipeline tracking with smart ranking built in.',
      },
      {
        icon: 'chart',
        heading: 'Data-driven HR dashboards',
        desc: 'Real-time insights built for modern hiring teams.',
      },
    ],
    reverse: false,
  },
]

const ICONS: Record<string, React.ReactNode> = {
  clock: <Clock aria-hidden="true" />,
  bell: <Bell aria-hidden="true" />,
  chart: <BarChart3 aria-hidden="true" />,
  target: <Target aria-hidden="true" />,
  brain: <BrainCircuit aria-hidden="true" />,
}

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
            <div className={`why-prefer__img-wrap why-prefer__img-wrap--${block.color}`}>
              <Image
                src={block.image}
                alt={block.imageAlt}
                fill
                className="why-prefer__img"
                sizes="(max-width: 768px) 100vw, 475px"
              />
            </div>
          )

          const textEl = (
            <div className="why-prefer__text">
              <h3 className="why-prefer__title">{block.title}</h3>
              <p className="why-prefer__body">{block.body}</p>
              <ul className="why-prefer__features">
                {block.features.map((f) => (
                  <li key={f.heading} className="why-prefer__feature">
                    <span className="why-prefer__feature-icon">{ICONS[f.icon]}</span>
                    <span className="why-prefer__feature-copy">
                      <strong className="why-prefer__feature-heading">{f.heading}</strong>
                      <span className="why-prefer__feature-desc">{f.desc}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )

          return (
            <div
              key={block.id}
              className={`why-prefer__block why-prefer__block--${block.color}${
                block.reverse ? ' why-prefer__block--reverse' : ''
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
          )
        })}
      </div>
    </section>
  )
}
