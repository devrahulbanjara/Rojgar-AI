import type { Metadata } from 'next'
import Link from 'next/link'

import { BRAND } from '@/lib/brand'

import { LegalPage } from '@/components/public/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Terms',
  description: `The rules for hiring and applying for jobs with ${BRAND.name}.`,
}

const TOC = [
  { id: 'about', label: 'About these terms' },
  { id: 'applying', label: 'Applying for a job' },
  { id: 'hiring', label: 'Hiring with us' },
  { id: 'not-allowed', label: 'Not allowed' },
  { id: 'ai', label: 'AI' },
  { id: 'payments', label: 'Plans and payment' },
  { id: 'content', label: 'Your content and our name' },
  { id: 'removal', label: 'Reports and removal' },
  { id: 'responsibility', label: 'What we are responsible for' },
  { id: 'law', label: 'Law' },
  { id: 'contact', label: 'Contact' },
]

const RELATED = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/cookies', label: 'Cookies' },
]

export default function TermsPage() {
  return (
    <LegalPage title="Terms" updated="Updated 17 October 2026" toc={TOC} related={RELATED}>
      <section id="about">
        <h2>About these terms</h2>
        <p>
          These terms are an agreement between you and {BRAND.name}, a service based in Kathmandu,
          Nepal, that helps businesses hire through one apply link. By using {BRAND.name} you agree
          to them. How we handle your information is on the <Link href="/privacy">Privacy</Link>{' '}
          page.
        </p>
      </section>

      <section id="applying">
        <h2>Applying for a job</h2>
        <ul>
          <li>
            Applying is always free. No business may ask you for money to apply or to be hired.
          </li>
          <li>You don&apos;t need an account. Give your real name, mobile number and details.</li>
          <li>
            Apply only for yourself. When you suggest someone, they must be happy to be contacted.
          </li>
          <li>You can withdraw an application at any time from your status link.</li>
        </ul>
      </section>

      <section id="hiring">
        <h2>Hiring with us</h2>
        <ul>
          <li>
            A business must be real and must be run by the person who creates it. Our staff check
            each business before its jobs go public, and verified businesses show a badge on their
            job pages.
          </li>
          <li>Post only real jobs that are open, with honest pay and place.</li>
          <li>Use applicants&apos; details only to hire for the job they applied to.</li>
          <li>Answer every applicant. {BRAND.name} sends the message for you when you decide.</li>
          <li>
            Keep your login safe. The owner of a business is responsible for the people they invite
            to its team.
          </li>
        </ul>
      </section>

      <section id="not-allowed">
        <h2>Not allowed</h2>
        <ul>
          <li>Asking applicants for any fee, deposit or payment</li>
          <li>Fake jobs, or jobs used to collect people&apos;s details</li>
          <li>
            Requirements about caste, religion, gender, marital status or disability, unless the law
            allows them for that job
          </li>
          <li>Hiding instructions in a CV or job post to trick the AI</li>
          <li>Copying applicants&apos; details out to sell or spam them</li>
          <li>Trying to break, overload or get around the security of the service</li>
        </ul>
      </section>

      <section id="ai">
        <h2>AI</h2>
        <p>
          AI reads each application and shows the business who fits the job and why. It can be
          wrong. AI helps you review every application, but it never decides alone. Every hiring
          decision is made by a person, and the business is responsible for its decisions.
        </p>
      </section>

      <section id="payments">
        <h2>Plans and payment</h2>
        <ul>
          <li>
            Prices are on the <Link href="/#pricing">pricing</Link> section, in Nepali rupees, plus
            13% VAT. You get a VAT bill.
          </li>
          <li>A business&apos;s first job is free.</li>
          <li>
            A Job Pass covers one job for the days shown on the pricing section. Team and Business
            plans are paid monthly.
          </li>
          <li>Pay by bank transfer for now. We add your plan once the transfer arrives.</li>
          <li>
            You can get a refund within 7 days of paying if you haven&apos;t published a job with
            it. Email us.
          </li>
        </ul>
      </section>

      <section id="content">
        <h2>Your content and our name</h2>
        <p>
          Your job posts, CVs and notes stay yours. You let us store them and show them to the
          people who need them to run the service. The name {BRAND.name}, its logo and the website
          are ours; don&apos;t copy them or use them to look like us.
        </p>
      </section>

      <section id="removal">
        <h2>Reports and removal</h2>
        <p>
          Anyone can report a job from its page. Our staff look at every report. We may take down a
          job, or suspend a business or an account, that breaks these terms, and we may tell the
          police about fraud.
        </p>
      </section>

      <section id="responsibility">
        <h2>What we are responsible for</h2>
        <p>
          We work hard to keep {BRAND.name} running and honest, but we can&apos;t promise it will
          never stop or that every job and applicant is genuine. As far as Nepal law allows, we
          aren&apos;t responsible for hiring decisions or for what businesses and applicants do.
          Never pay anyone to get a job.
        </p>
      </section>

      <section id="law">
        <h2>Law</h2>
        <p>
          These terms follow the law of Nepal. If we can&apos;t settle a problem by talking, it goes
          to the courts in Kathmandu. When we change these terms we update the date at the top.
        </p>
      </section>

      <section id="contact">
        <h2>Contact</h2>
        <p>
          <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>
        </p>
      </section>
    </LegalPage>
  )
}
