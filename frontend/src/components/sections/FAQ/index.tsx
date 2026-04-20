'use client'

import { useState } from 'react'

import Image from 'next/image'

import { Minus, Plus } from 'lucide-react'

const FAQS = [
  {
    q: 'How do I apply for a job on ConvexHire?',
    a: "Sign up for a free account and complete your profile with your skills, experience, and preferences. Browse curated listings matched to your background, then hit Apply — your profile is sent instantly. You'll also get AI-powered job alerts delivered to your dashboard so you never miss a match.",
  },
  {
    q: 'What is ConvexHire?',
    a: "ConvexHire is an AI-first job platform built for transparency. We connect candidates with companies that are serious about hiring — listing real salary ranges, committing to response timelines, and giving you a full view of every application's status. No black holes, no guesswork.",
  },
  {
    q: 'How can I get better job matches?',
    a: 'The more complete your profile, the smarter our matching becomes. Add your skills, preferred role types, salary expectations, and location preferences. Our AI analyses your profile against every active listing and surfaces the roles most likely to convert — not just the ones with matching keywords.',
  },
  {
    q: 'How often are new jobs posted on ConvexHire?',
    a: "New roles are added daily. We partner directly with employers who post exclusively on ConvexHire, so you'll find listings here before they appear anywhere else. Enable real-time alerts to get notified within minutes of a relevant role going live.",
  },
  {
    q: 'Can I save job listings for later?',
    a: 'Yes — bookmark any listing to your saved jobs board with a single click. You can organise saved roles into custom lists, set reminders to follow up, and track their status alongside your active applications all from your dashboard.',
  },
  {
    q: 'Do employers see my full profile before I apply?',
    a: "Only when you choose. You control exactly what's visible — you can apply fully anonymously and only reveal contact details when you're ready. We built our privacy controls around candidate trust, not employer convenience.",
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i)

  return (
    <section className="faq">
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
                className={`faq__item${isOpen ? ' faq__item--open' : ''}`}
                data-reveal
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
