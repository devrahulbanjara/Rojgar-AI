'use client'

import Image from 'next/image'

import { BarChart3, Bell, BrainCircuit, Target, Zap } from 'lucide-react'

const BLOCKS = [
  {
    id: 'resume-ai',
    color: 'secondary',
    image: '/homepage/whyPreferUs/image1.svg',
    imageAlt: 'Candidate comparing resume to job requirements',
    title: 'AI Closes Your Resume Gaps Before You Apply',
    body: "Run a gap analysis against any job. See exactly what's missing — then let AI patch your resume. You approve every edit before anything saves.",
    features: [
      {
        icon: 'brain',
        heading: 'Resume Gap Analysis',
        desc: "Compare your resume to any job's requirements. Get a precise gap report before you hit Apply.",
      },
      {
        icon: 'target',
        heading: 'AI Resume Patching',
        desc: 'Accept or reject every AI suggestion individually. Nothing changes without your explicit approval.',
      },
    ],
    reverse: false,
  },
  {
    id: 'pipeline-clarity',
    color: 'warning',
    image: '/homepage/whyPreferUs/image2.svg',
    imageAlt: 'Application pipeline status dashboard',
    title: 'Know Exactly Where You Stand — Every Step',
    body: 'Live pipeline tracking from Applied to Offer. See your AI score out of 100 and written feedback — even after a rejection.',
    features: [
      {
        icon: 'bell',
        heading: 'Live Application Pipeline',
        desc: 'Track every stage in real time: Applied → Evaluated → Shortlisted → Interview → Offer.',
      },
      {
        icon: 'chart',
        heading: 'Your AI Score & Feedback Visible',
        desc: "After evaluation, see your 0–100 score and the AI's written reasoning — not a generic rejection.",
      },
    ],
    reverse: true,
  },
  {
    id: 'ai-hiring',
    color: 'accent',
    image: '/homepage/whyPreferUs/image3.svg',
    imageAlt: 'Recruiter AI dashboard showing candidate pipeline',
    title: 'One Platform Runs Your Entire Hiring Pipeline',
    body: 'AI creates jobs, scores applicants, drafts outreach, and syncs interview bookings — with human approval at every decision point.',
    features: [
      {
        icon: 'brain',
        heading: 'AI Evaluation + Smart Shortlisting',
        desc: 'Auto-score every applicant on arrival. Set a threshold and shortlist your entire cohort in one action.',
      },
      {
        icon: 'zap',
        heading: 'AI Outreach + Cal.com Interviews',
        desc: 'AI drafts personalized emails. Candidates book via Cal.com. Status updates automatically.',
      },
    ],
    reverse: false,
  },
]

const ICONS: Record<string, React.ReactNode> = {
  bell: <Bell aria-hidden="true" />,
  chart: <BarChart3 aria-hidden="true" />,
  target: <Target aria-hidden="true" />,
  brain: <BrainCircuit aria-hidden="true" />,
  zap: <Zap aria-hidden="true" />,
}

export default function WhyPreferUs() {
  return (
    <section className="why-prefer">
      <div className="why-prefer__header container">
        <p className="why-prefer__label" data-reveal>
          Why ConvexHire
        </p>
        <h2
          className="why-prefer__heading"
          data-reveal
          style={{ '--reveal-delay': '0.1s' } as React.CSSProperties}
        >
          Built for both sides
          <br />
          of the hiring equation
        </h2>
        <p
          className="why-prefer__subheading"
          data-reveal
          style={{ '--reveal-delay': '0.2s' } as React.CSSProperties}
        >
          Candidates apply smarter. Recruiters hire faster. AI does the heavy lifting for both.
        </p>
      </div>

      <div className="why-prefer__blocks container">
        {BLOCKS.map((block) => {
          // Image slides in from its visual side; text slides from the opposite side.
          const imgReveal = block.reverse ? 'right' : 'left'
          const textReveal = block.reverse ? 'left' : 'right'

          const imgEl = (
            <div
              className={`why-prefer__img-wrap why-prefer__img-wrap--${block.color}`}
              data-reveal={imgReveal}
            >
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
            <div
              className="why-prefer__text"
              data-reveal={textReveal}
              style={{ '--reveal-delay': '0.12s' } as React.CSSProperties}
            >
              <h3 className="why-prefer__title">{block.title}</h3>
              <p className="why-prefer__body">{block.body}</p>
              <ul className="why-prefer__features">
                {block.features.map((f, fi) => (
                  <li
                    key={f.heading}
                    className="why-prefer__feature"
                    data-reveal
                    style={{ '--reveal-delay': `${fi * 0.1 + 0.22}s` } as React.CSSProperties}
                  >
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
