'use client'

import { useEffect, useRef, useState } from 'react'

import Image from 'next/image'

import { Minus, Plus } from 'lucide-react'

const FAQS = [
  {
    q: 'What is ConvexHire?',
    a: 'ConvexHire is an end-to-end AI recruitment platform. Candidates apply smarter with resume gap analysis, AI patching, and live pipeline tracking. Recruiters hire faster with automated screening, smart shortlisting, AI outreach drafting, and Cal.com-integrated interview ops — all in one place.',
  },
  {
    q: 'How does the AI resume gap analysis work?',
    a: "Before submitting, run Gap Analysis on your selected resume. The AI compares it to the job's requirements and identifies what's missing. You can then patch your resume — the AI suggests specific edits, and you approve or reject each one before anything saves.",
  },
  {
    q: 'Can I see my AI score and feedback after applying?',
    a: 'Yes. Once a recruiter runs AI screening on your application, you can see your score out of 100 and a written explanation of what matched and what was missing. Even rejected candidates get specific, actionable feedback — not a generic response.',
  },
  {
    q: 'How does interview scheduling work?',
    a: 'When shortlisted, you receive an email with a Cal.com booking link. Pick a slot, confirm your time, and ConvexHire auto-detects the booking via webhook — your application status updates to Interview Booked instantly, with no manual back-and-forth.',
  },
  {
    q: 'How does AI screening work for recruiters?',
    a: "Enable auto-screening on a job and every application is scored the moment it arrives. Or run manual batch screening whenever you're ready. Each candidate gets a 0–100 score with a plain-English paragraph explaining what aligned and what was missing. Scores can be edited manually too.",
  },
  {
    q: "What's included in the free plan?",
    a: 'Candidates get full access: build a profile, create multiple resumes, run AI gap analysis, apply to jobs, and track applications in real time. Recruiters can register a company, post and manage jobs, and review applications. AI screening and outreach tools require an upgrade.',
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
        src="/bg/bg-ui-v4.svg"
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

        {/* Accordion — items stagger in as section enters viewport */}
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

                {/* Animated answer panel — uses CSS grid-template-rows trick */}
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
