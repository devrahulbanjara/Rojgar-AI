'use client'

import { useEffect, useRef, useState } from 'react'

import Image from 'next/image'

import { Minus, Plus } from 'lucide-react'

const FAQS = [
  {
    q: 'What is ConvexHire?',
    a: 'ConvexHire is an end-to-end AI recruitment platform that serves both sides of hiring. Candidates get AI resume coaching, gap analysis, auto-patching, and full pipeline visibility. Recruiters get automated evaluation, smart shortlisting, AI-drafted outreach, integrated interview scheduling, recording transcription, and a persistent AI chat assistant connected to live platform data.',
  },
  {
    q: 'How does AI resume gap analysis and patching work?',
    a: 'During the apply flow, select a saved resume and run Gap Analysis. The AI compares it to the job description and returns a score, critical gaps, preferred gaps, and specific suggestions. You can then run Auto-Patch, which rewrites your headline, summary, skills, and experience bullets to close those gaps. Frozen Facts like company names, job titles, dates, and certifications are never altered. You approve or reject every change individually before anything saves.',
  },
  {
    q: 'Can I see my AI score and feedback after applying?',
    a: 'Yes. Once evaluation runs on your application, your 0 to 100 score and a written explanation of what matched and what was missing are visible in your dashboard. Even rejected candidates receive specific, actionable feedback rather than a generic response.',
  },
  {
    q: 'How does AI shortlisting work?',
    a: 'After a job closes, the AI shortlisting pipeline runs in three steps. First, a machine learning model scores every resume in milliseconds and filters out weak fits. Then, for the top candidates, AI evaluates each resume from both a technical and cultural-fit perspective independently before producing a final merged assessment. Results are saved per-application with structured feedback explaining exactly why each candidate was shortlisted or rejected.',
  },
  {
    q: 'How does interview scheduling work?',
    a: 'When shortlisted, candidates receive an outreach email (reviewed and approved by the recruiter) containing a booking link. The candidate picks a slot, and ConvexHire auto-detects the booking. The application status updates to Interview Booked instantly with no manual back-and-forth.',
  },
  {
    q: 'What security and guardrails are in place?',
    a: 'Every AI interaction is protected by defense-in-depth guardrails. Input rails block prompt injection and role-hijack attempts before any AI model sees the input. PII redaction strips emails, URLs, and phone numbers from prompts. Frozen Facts prevent hallucination in resume patching. A strict allowlist restricts what the AI Chat can edit. Rate limits and duplicate-request protection prevent abuse and data corruption.',
  },
  {
    q: 'What does the Recruiter AI Chat do?',
    a: 'It is a persistent, multi-turn assistant exclusive to recruiters. It can search candidates semantically across all company applications, look up specific application details, research salaries from the web (cached for fast repeat queries), list and look up jobs by natural language, and edit jobs with a before/after preview that requires explicit confirmation. Sessions are saved and resumable across logins.',
  },
  {
    q: "What's included in the free plan?",
    a: 'Candidates can build a profile, import a resume with AI (1 use), create up to 2 resumes with PDF download, browse and search all jobs with semantic search, submit up to 5 applications, and track their pipeline in real time with AI score visibility. Recruiters can register a company, invite up to 2 team members, post 2 active jobs, use the AI Job Draft Assistant 3 times per month, and draft up to 10 outreach emails per month.',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const itemRefs = useRef<(HTMLLIElement | null)[]>([])

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = itemRefs.current.indexOf(entry.target as HTMLLIElement)
            if (idx !== -1) {
              setRevealed((prev) => new Set([...prev, idx]))
              observer.unobserve(entry.target)
            }
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -48px 0px' },
    )

    itemRefs.current.forEach((el) => {
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <section className="faq" id="faq">
      {/* Decorative bg */}
      <Image
        src="/bg/bg-ui-v4.webp"
        alt=""
        width={520}
        height={520}
        className="faq__bg"
        aria-hidden="true"
      />

      <div className="faq__inner container">
        {/* Heading */}
        <div className="faq__header">
          <h2 className="faq__heading" data-reveal>
            Frequently Asked Questions
          </h2>
          <p
            className="faq__subheading"
            data-reveal
            style={{ '--reveal-delay': '0.1s' } as React.CSSProperties}
          >
            Everything you need to know about ConvexHire. Can&apos;t find the answer? Reach out to
            our team.
          </p>
        </div>

        {/* Accordion - items stagger in as section enters viewport */}
        <ul className="faq__list">
          {FAQS.map((item, i) => {
            const isOpen = openIndex === i
            return (
              <li
                key={i}
                ref={(el) => {
                  itemRefs.current[i] = el
                }}
                className={`faq__item${isOpen ? ' faq__item--open' : ''}${revealed.has(i) ? ' is-revealed' : ''}`}
                data-faq-item
                style={{ '--reveal-delay': `${Math.min(i * 0.07, 0.35)}s` } as React.CSSProperties}
              >
                <button className="faq__trigger" onClick={() => toggle(i)} aria-expanded={isOpen}>
                  <span className="faq__question">{item.q}</span>
                  <span className="faq__icon" aria-hidden="true">
                    {isOpen ? <Minus aria-hidden="true" /> : <Plus aria-hidden="true" />}
                  </span>
                </button>

                {/* Animated answer panel - uses CSS grid-template-rows trick */}
                <div className="faq__panel">
                  <div className="faq__answer">
                    <p>{item.a}</p>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
