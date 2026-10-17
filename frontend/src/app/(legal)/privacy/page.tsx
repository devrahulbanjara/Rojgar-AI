import type { Metadata } from 'next'
import Link from 'next/link'

import { BRAND } from '@/lib/brand'

import { LegalPage } from '@/components/public/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Privacy',
  description: `What ${BRAND.name} collects when you apply for a job or hire, who sees it, and how to delete it.`,
}

const TOC = [
  { id: 'collect', label: 'What we collect' },
  { id: 'use', label: 'How we use it' },
  { id: 'who-sees', label: 'Who sees it' },
  { id: 'keep', label: 'How long we keep it' },
  { id: 'choices', label: 'Your choices' },
  { id: 'safety', label: 'Keeping it safe' },
  { id: 'children', label: 'Age' },
  { id: 'changes', label: 'Changes' },
  { id: 'contact', label: 'Contact' },
]

const RELATED = [
  { href: '/terms', label: 'Terms' },
  { href: '/cookies', label: 'Cookies' },
]

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      updated="Updated 17 October 2026"
      toc={TOC}
      related={RELATED}
      summary={
        <ul className="flex list-disc flex-col gap-1 pl-5">
          <li>Your application goes only to the business you applied to.</li>
          <li>AI helps the business review it, but it never decides alone.</li>
          <li>You can withdraw and delete your application from your status link at any time.</li>
          <li>We never sell your information or use it for ads.</li>
        </ul>
      }
    >
      <section id="collect">
        <h2>What we collect</h2>
        <p>
          {BRAND.name} helps businesses in Nepal hire. A business posts a job and shares one link;
          people apply through that link.
        </p>
        <h3>When you apply for a job</h3>
        <ul>
          <li>Your name and mobile number</li>
          <li>Your email, if you give it</li>
          <li>Your CV or a photo of it, if you add one</li>
          <li>Your answers to the job&apos;s questions</li>
          <li>Where you found the job (for example Facebook), and who shared the link with you</li>
        </ul>
        <h3>When someone suggests you for a job</h3>
        <p>Your name and mobile number, their name, and the note they wrote about you.</p>
        <h3>When you hire with {BRAND.name}</h3>
        <ul>
          <li>Your name, mobile number and email</li>
          <li>
            Your business&apos;s name, type, district and phone, and its PAN or registration
            certificate if you add it
          </li>
          <li>Your team, jobs, notes, interviews and decisions</li>
          <li>What you bought and your bank transfer reference</li>
        </ul>
        <h3>When you use the website</h3>
        <p>
          Your IP address and browser details go into our server logs. We use them only to keep the
          service working and safe.
        </p>
      </section>

      <section id="use">
        <h2>How we use it</h2>
        <ul>
          <li>To send your application to the business you applied to.</li>
          <li>
            To read your CV and answers with AI and compare them with what the job needs, so the
            business sees a short reason next to each application. AI helps the business review
            every application, but it never decides alone. Every hiring decision is made by a
            person.
          </li>
          <li>
            To email you about your application (received, interview, decision), if you gave an
            email.
          </li>
          <li>To stop fake jobs, spam and misuse.</li>
          <li>To bill businesses.</li>
        </ul>
        <p>
          We <strong>never sell</strong> your information and never use it for advertising.
        </p>
      </section>

      <section id="who-sees">
        <h2>Who sees it</h2>
        <ul>
          <li>
            <strong>The business you applied to</strong> and the people in its team. Other
            businesses don&apos;t see your application.
          </li>
          <li>
            <strong>Services that run {BRAND.name} for us:</strong> Amazon Web Services (file
            storage and AI), Google Gemini and Groq (AI), LlamaIndex (reading CVs), Qdrant (search)
            and our email provider. Some of them are outside Nepal. They may use your information
            only to provide their service to us.
          </li>
          <li>
            <strong>Courts or police</strong>, only when Nepal law requires us to share it.
          </li>
        </ul>
      </section>

      <section id="keep">
        <h2>How long we keep it</h2>
        <ul>
          <li>
            An application stays until you withdraw it, you ask us to delete it, or the business
            deletes it. When you withdraw, we delete your CV and details for that job straight away.
          </li>
          <li>Server logs are deleted after 30 days.</li>
          <li>Payment records are kept as long as Nepal&apos;s tax law requires.</li>
        </ul>
      </section>

      <section id="choices">
        <h2>Your choices</h2>
        <ul>
          <li>
            <strong>See your applications:</strong> open the status link you saved after applying or
            the one in your email, or <Link href="/login">sign in with your email</Link>.
          </li>
          <li>
            <strong>Withdraw and delete:</strong> use &quot;Withdraw application&quot; on the status
            page.
          </li>
          <li>
            <strong>Get a copy, fix a mistake or delete everything:</strong> email{' '}
            <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>. We reply within 30 days.
          </li>
        </ul>
        <p>
          These rights come from Nepal&apos;s <strong>Privacy Act 2075 (2018)</strong>.
        </p>
      </section>

      <section id="safety">
        <h2>Keeping it safe</h2>
        <ul>
          <li>Every page and file is sent over an encrypted connection (HTTPS).</li>
          <li>Passwords are stored only as a secure hash, never as plain text.</li>
          <li>A business can see only the applications for its own jobs.</li>
          <li>
            CVs are checked for hidden instructions meant to trick the AI, and flagged for a person
            to look at.
          </li>
        </ul>
        <p>If your information is ever exposed, we will tell you as soon as we know.</p>
      </section>

      <section id="children">
        <h2>Age</h2>
        <p>
          {BRAND.name} is for people aged 16 and over. If we learn that someone younger has applied,
          we delete their application.
        </p>
      </section>

      <section id="changes">
        <h2>Changes</h2>
        <p>
          When we change this page we update the date at the top. If a change affects how we use
          your information, we tell signed-in users by email first.
        </p>
      </section>

      <section id="contact">
        <h2>Contact</h2>
        <p>
          Questions or requests: <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>. {BRAND.name}{' '}
          is based in Kathmandu, Nepal.
        </p>
      </section>
    </LegalPage>
  )
}
