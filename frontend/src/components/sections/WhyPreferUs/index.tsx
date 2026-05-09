'use client'

import Image from 'next/image'

import { BarChart3, Bell, BrainCircuit, Target, Zap } from 'lucide-react'

const BLOCKS = [
  {
    id: 'resume-ai',
    color: 'secondary',
    image: 'https://stories.freepiklabs.com/storage/36733/Online-Resume_Artboard-1.svg',
    imageAlt: 'AI analyzing and improving a digital resume',
    title: 'AI Resume Coaching That Lands Interviews',
    body: 'Upload any PDF and AI extracts your entire profile. Before you apply, run a gap analysis against the job description, then let AI patch your resume to close those gaps. You approve every edit individually before anything saves.',
    features: [
      {
        icon: 'brain',
        heading: 'Gap Analysis + AI Auto-Patch',
        desc: 'Get a score, critical gaps, and concrete suggestions. AI rewrites your headline, summary, skills, and bullet points to match the role. Frozen Facts like company names, dates, and certifications are never altered.',
      },
      {
        icon: 'target',
        heading: 'Multiple Resumes, One Profile',
        desc: 'Build targeted resumes for different roles. Live preview, PDF download, and seamless selection during the apply flow.',
      },
    ],
    reverse: false,
  },
  {
    id: 'pipeline-clarity',
    color: 'warning',
    image: 'https://stories.freepiklabs.com/storage/2013/179-People-search_Artboard-1.svg',
    imageAlt: 'Matching candidates to the right job opportunities',
    title: 'Smart Job Matching + Full Pipeline Visibility',
    body: 'Semantic search understands what you mean, not just what you type. Search "Python backend" and find roles that match by meaning. Track every application from Applied through Interview to Offer, with your AI score and written feedback visible at each step.',
    features: [
      {
        icon: 'target',
        heading: 'Jobs Matched to Your Profile',
        desc: 'Our search understands natural language. Describe what you want in plain words and find roles that actually fit your skills, experience, and goals.',
      },
      {
        icon: 'chart',
        heading: 'Transparent AI Scoring + Feedback',
        desc: 'After evaluation, your 0 to 100 score and the reasoning behind it are visible in your dashboard. Even rejections include specific, actionable feedback so you know exactly what to improve.',
      },
    ],
    reverse: true,
  },
  {
    id: 'ai-hiring',
    color: 'accent',
    image: 'https://stories.freepiklabs.com/storage/40608/Profiling-(1)_Artboard-1-copy.svg',
    imageAlt: 'AI evaluating and scoring candidate profiles',
    title: 'AI Evaluates, Shortlists, and Drafts Outreach for You',
    body: 'A machine learning model scores every resume in milliseconds to filter weak fits. The top candidates then go through a multi-perspective AI review where technical and cultural fit are assessed independently before a final score is produced.',
    features: [
      {
        icon: 'brain',
        heading: 'AI Evaluation + Cohort Shortlisting',
        desc: 'Auto-score every applicant on arrival or run batch evaluation. Set a threshold and shortlist your entire cohort in one action. AI drafts personalized outreach for every shortlisted candidate.',
      },
      {
        icon: 'zap',
        heading: 'Recruiter AI Chat Assistant',
        desc: 'A persistent chat assistant that can search candidates semantically, research salaries from the web, look up and edit jobs with a preview-and-confirm flow, and remember your full conversation history.',
      },
    ],
    reverse: false,
  },
  {
    id: 'security',
    color: 'secondary',
    image: 'https://stories.freepiklabs.com/storage/1520/34-Security-on_Artboard-1.svg',
    imageAlt: 'Security shield protecting data and AI interactions',
    title: 'Enterprise-Grade Security at Every Layer',
    body: 'Defense-in-depth guardrails protect every AI interaction. Input rails block prompt injection and role-hijack attempts before they reach any AI model. PII redaction strips personal data from prompts. Human confirmation gates every consequential action.',
    features: [
      {
        icon: 'target',
        heading: 'Guardrails Against Misuse',
        desc: 'Prompt injection detection on all user-controlled inputs. PII redaction removes sensitive data before it reaches AI. Frozen Facts prevent hallucination. Rate limits and duplicate-request protection prevent abuse.',
      },
      {
        icon: 'bell',
        heading: 'Human-in-the-Loop by Design',
        desc: 'No emails send without recruiter approval. No job edits save without a before/after preview and explicit confirm. No shortlist decision is final until a human signs off.',
      },
    ],
    reverse: true,
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
                unoptimized
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
