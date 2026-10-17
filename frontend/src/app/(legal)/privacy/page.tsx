import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { Calendar, ChevronRight, Clock, ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy - ConvexHire',
  description:
    'Learn how ConvexHire collects, uses, and protects your personal data in accordance with the Privacy Act 2075 (2018) and the Electronic Transactions Act 2063 of Nepal.',
}

const TOC = [
  { id: 'about', label: 'About This Policy' },
  { id: 'data-we-collect', label: 'Data We Collect' },
  { id: 'how-we-use', label: 'How We Use Your Data' },
  { id: 'legal-basis', label: 'Legal Basis (Nepal Law)' },
  { id: 'sharing', label: 'Sharing Your Data' },
  { id: 'retention', label: 'Data Retention' },
  { id: 'your-rights', label: 'Your Rights' },
  { id: 'security', label: 'Security Measures' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'children', label: "Children's Privacy" },
  { id: 'changes', label: 'Changes to This Policy' },
  { id: 'contact', label: 'Contact Us' },
]

export default function PrivacyPolicyPage() {
  return (
    <div className="legal">
      {/* Background decorations */}
      <Image
        src="/bg/bg-ui-v4.svg"
        alt=""
        width={700}
        height={700}
        className="legal__bg-top"
        aria-hidden="true"
      />
      <Image
        src="/bg/bg-ui-v3.svg"
        alt=""
        width={640}
        height={640}
        className="legal__bg-bottom"
        aria-hidden="true"
      />

      {/* Hero */}
      <div className="legal__hero">
        <div className="container">
          <h1 className="legal__title">Privacy Policy</h1>
          <div className="legal__meta">
            <span className="legal__meta-item">
              <Calendar aria-hidden="true" />
              Effective: 1 Falgun 2081 BS (13 February 2025)
            </span>
            <span className="legal__meta-sep" aria-hidden="true" />
            <span className="legal__meta-item">
              <Clock aria-hidden="true" />
              Last updated: 1 Falgun 2081 BS
            </span>
            <span className="legal__meta-sep" aria-hidden="true" />
            <span className="legal__meta-item">
              <ShieldCheck aria-hidden="true" />
              Governed by Nepal Law
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="legal__body container">
        {/* Table of contents */}
        <aside className="legal__toc" aria-label="Table of contents">
          <p className="legal__toc-title">On this page</p>
          <ul className="legal__toc-list">
            {TOC.map((item) => (
              <li key={item.id}>
                <Link href={`#${item.id}`} className="legal__toc-link">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        {/* Content */}
        <main className="legal__content">
          {/* Callout */}
          <div className="legal__callout">
            <p>
              <strong>Summary:</strong> ConvexHire is operated by Convex Technologies Pvt. Ltd.,
              registered in Nepal. We collect only the personal data necessary to provide our
              job-board services and do so in compliance with the{' '}
              <strong>Privacy Act 2075 (2018)</strong> and the{' '}
              <strong>Electronic Transactions Act 2063 (2006)</strong> of Nepal. We never sell your
              data.
            </p>
          </div>

          <section className="legal__section" id="about">
            <h2 className="legal__section-title">1. About This Policy</h2>
            <p className="legal__text">
              This Privacy Policy describes how Convex Technologies Pvt. Ltd.
              (&quot;ConvexHire&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;) collects,
              uses, stores, and discloses information about you when you use our website at{' '}
              <strong>convexhire.com</strong> and the services we provide (collectively, the
              &quot;Service&quot;).
            </p>
            <p className="legal__text">
              By accessing or using our Service, you acknowledge that you have read, understood, and
              agreed to this Privacy Policy. If you do not agree, please discontinue use of the
              Service.
            </p>
            <p className="legal__text">
              This Policy is governed by and construed in accordance with the laws of Nepal,
              including the <strong>Privacy Act 2075 (2018)</strong>, the{' '}
              <strong>Electronic Transactions Act 2063 (2006)</strong>, and any applicable
              regulations issued thereunder.
            </p>
          </section>

          <section className="legal__section" id="data-we-collect">
            <h2 className="legal__section-title">2. Data We Collect</h2>
            <h3 className="legal__section-subtitle">2.1 Information you provide directly</h3>
            <ul className="legal__list">
              <li>Full name, email address, and password when you register an account</li>
              <li>
                Professional information including your resume, work history, skills, and education
              </li>
              <li>Profile photo (optional)</li>
              <li>Contact details such as phone number and location</li>
              <li>Job applications and any content you submit during the apply flow</li>
              <li>
                Interview recordings uploaded by recruiters (audio files stored securely with
                presigned access)
              </li>
              <li>Payment and billing details if you subscribe to a paid plan</li>
              <li>Communications you send to us via contact forms, email, or support tickets</li>
            </ul>
            <h3 className="legal__section-subtitle">2.2 Information generated by AI</h3>
            <ul className="legal__list">
              <li>
                Resume gap analysis results (score, identified gaps, suggestions) generated when you
                initiate the feature
              </li>
              <li>
                AI evaluation scores and feedback paragraphs generated when a recruiter runs
                evaluation
              </li>
              <li>
                AI shortlisting decisions and structured feedback (strengths, concerns, evidence)
              </li>
              <li>Interview transcriptions and AI evaluation results</li>
              <li>AI-drafted outreach emails (subject to recruiter review before sending)</li>
            </ul>
            <h3 className="legal__section-subtitle">2.3 Information collected automatically</h3>
            <ul className="legal__list">
              <li>IP address and approximate geolocation (country/city)</li>
              <li>Browser type, operating system, and device information</li>
              <li>
                Pages visited, time spent, and click-stream data via cookies and similar
                technologies
              </li>
              <li>Referring URLs and search queries that led you to our site</li>
              <li>Job search queries and saved listings</li>
            </ul>
            <h3 className="legal__section-subtitle">2.4 Information from third parties</h3>
            <ul className="legal__list">
              <li>Profile data from LinkedIn or Google if you choose to sign up via OAuth</li>
              <li>
                Publicly available professional information you have made visible on other platforms
              </li>
            </ul>
          </section>

          <section className="legal__section" id="how-we-use">
            <h2 className="legal__section-title">3. How We Use Your Data</h2>
            <p className="legal__text">
              We use your personal data strictly for the following purposes:
            </p>
            <ul className="legal__list">
              <li>To create and manage your account and deliver the Service</li>
              <li>To match your profile with relevant job listings via semantic search</li>
              <li>To forward your application materials to prospective employers on your behalf</li>
              <li>
                To run AI-powered resume gap analysis and auto-patching when you initiate these
                features during the application flow
              </li>
              <li>
                To generate AI evaluation scores and feedback on your application when requested by
                the recruiting company
              </li>
              <li>
                To assist recruiters with AI-powered shortlisting, outreach drafting, salary
                research, and candidate search
              </li>
              <li>To transcribe and evaluate interview recordings uploaded by recruiters</li>
              <li>To process payments for subscriptions</li>
              <li>
                To send you transactional notifications (application updates, password resets)
              </li>
              <li>To send you optional job-alert emails where you have opted in</li>
              <li>To improve and personalise the Service through analytics</li>
              <li>To prevent fraud, abuse, and security incidents</li>
              <li>To comply with legal obligations under Nepal law</li>
            </ul>
            <p className="legal__text">
              <strong>AI processing:</strong> Your resume and application data may be processed by
              AI models to generate scores, feedback, and suggestions. Contact details (email,
              phone, links) are removed before your resume reaches screening models. AI output is a{' '}
              <strong>recommendation only</strong>: a recruiter reviews and confirms every
              shortlisting or rejection decision, and every outreach email and job edit, before it
              takes effect.
            </p>
            <p className="legal__text">
              We do <strong>not</strong> make solely automated decisions about your application. You
              can ask the hiring company for a human review of any decision by replying to their
              email or contacting us.
            </p>
          </section>

          <section className="legal__section" id="legal-basis">
            <h2 className="legal__section-title">4. Legal Basis Under Nepal Law</h2>
            <p className="legal__text">
              Under the <strong>Privacy Act 2075 (2018)</strong> of Nepal, we rely on the following
              lawful grounds to process your personal data:
            </p>
            <ul className="legal__list">
              <li>
                <strong>Consent:</strong> For optional communications such as marketing emails and
                push notifications. You may withdraw consent at any time.
              </li>
              <li>
                <strong>Contractual necessity:</strong> To perform the agreement between you and
                ConvexHire when you register and use the Service.
              </li>
              <li>
                <strong>Legitimate interest:</strong> For fraud prevention, security monitoring, and
                improving the Service, provided these interests do not override your fundamental
                rights.
              </li>
              <li>
                <strong>Legal obligation:</strong> Where processing is required to comply with
                applicable Nepal legislation or a lawful order of a competent authority.
              </li>
            </ul>
            <p className="legal__text">
              The Electronic Transactions Act 2063 (2006) further governs the legal validity of
              electronic records, digital signatures, and online transactions conducted through the
              Service.
            </p>
          </section>

          <section className="legal__section" id="sharing">
            <h2 className="legal__section-title">5. Sharing Your Data</h2>
            <p className="legal__text">
              We share your personal data with third parties only in the following circumstances:
            </p>
            <ul className="legal__list">
              <li>
                <strong>Employers / Hirers:</strong> Your application materials are shared with the
                employer to whom you apply. Employers are bound by their own privacy policies; we
                recommend reviewing them before applying.
              </li>
              <li>
                <strong>Service providers:</strong> Trusted sub-processors (hosting, email delivery,
                payment gateway, analytics) under strict data-processing agreements.
              </li>
              <li>
                <strong>Legal requirements:</strong> When required by a court order, regulatory
                authority, or law enforcement agency in Nepal acting under lawful authority.
              </li>
              <li>
                <strong>Business transfers:</strong> In the event of a merger, acquisition, or sale
                of all or substantially all of our assets, we will notify you before your data is
                transferred and becomes subject to a new privacy policy.
              </li>
            </ul>
            <p className="legal__text">
              We <strong>never sell, rent, or trade</strong> your personal information to any third
              party.
            </p>
          </section>

          <section className="legal__section" id="retention">
            <h2 className="legal__section-title">6. Data Retention</h2>
            <p className="legal__text">
              We retain your personal data for as long as your account remains active or as
              necessary to provide the Service. Specifically:
            </p>
            <ul className="legal__list">
              <li>
                Account data is retained for the duration of your account and for up to{' '}
                <strong>2 years</strong> after account deletion for legal and dispute-resolution
                purposes.
              </li>
              <li>
                Application records may be retained for up to <strong>1 year</strong> after the
                closure of a job listing to allow employers to respond to regulatory enquiries.
              </li>
              <li>
                Financial records are retained for <strong>5 years</strong> as required by the{' '}
                <strong>Income Tax Act 2058 (2002)</strong> and the{' '}
                <strong>Value Added Tax Act 2052 (1995)</strong> of Nepal.
              </li>
              <li>
                Server logs and analytics data are retained for no more than{' '}
                <strong>90 days</strong> in anonymised or aggregated form.
              </li>
            </ul>
          </section>

          <section className="legal__section" id="your-rights">
            <h2 className="legal__section-title">7. Your Rights</h2>
            <p className="legal__text">
              Under the <strong>Privacy Act 2075 (2018)</strong> and the Constitution of Nepal
              (Article 28, Right to Privacy), you have the following rights in relation to your
              personal data:
            </p>
            <ul className="legal__list">
              <li>
                <strong>Right to access:</strong> Request a copy of the personal data we hold about
                you.
              </li>
              <li>
                <strong>Right to rectification:</strong> Request correction of inaccurate or
                incomplete data.
              </li>
              <li>
                <strong>Right to erasure:</strong> Request deletion of your personal data, subject
                to our legal retention obligations.
              </li>
              <li>
                <strong>Right to restrict processing:</strong> Ask us to limit how we use your data
                in certain circumstances.
              </li>
              <li>
                <strong>Right to data portability:</strong> Receive your account data in a
                structured, machine-readable format.
              </li>
              <li>
                <strong>Right to object:</strong> Object to processing based on legitimate interests
                or direct marketing.
              </li>
              <li>
                <strong>Right to withdraw consent:</strong> Withdraw consent at any time without
                affecting the lawfulness of prior processing.
              </li>
            </ul>
            <p className="legal__text">
              To exercise any of these rights, email us at <strong>privacy@convexhire.com</strong>.
              We will respond within <strong>30 days</strong> as required under Nepal law. You also
              have the right to lodge a complaint with the{' '}
              <strong>
                Department of Information Technology, Ministry of Communication and Information
                Technology, Government of Nepal
              </strong>
              .
            </p>
          </section>

          <section className="legal__section" id="security">
            <h2 className="legal__section-title">8. Security Measures</h2>
            <p className="legal__text">
              We implement industry-standard technical and organisational measures to protect your
              personal data against unauthorised access, disclosure, alteration, or destruction,
              including:
            </p>
            <ul className="legal__list">
              <li>TLS 1.3 encryption for all data in transit</li>
              <li>AES-256 encryption for data at rest</li>
              <li>Argon2 password hashing</li>
              <li>Role-based access controls limiting employee access to personal data</li>
              <li>
                AI guardrails including prompt injection detection, PII redaction before AI
                processing, and hallucination prevention via Frozen Facts
              </li>
              <li>Rate limiting and duplicate-request protection on all API endpoints</li>
              <li>Regular security audits and penetration testing</li>
              <li>Multi-factor authentication for all administrative accounts</li>
            </ul>
            <p className="legal__text">
              In the event of a personal data breach that is likely to result in a risk to your
              rights and freedoms, we will notify you and the competent authority within{' '}
              <strong>72 hours</strong> of becoming aware of the breach.
            </p>
          </section>

          <section className="legal__section" id="cookies">
            <h2 className="legal__section-title">9. Cookies</h2>
            <p className="legal__text">
              We use cookies and similar tracking technologies to operate and improve the Service.
              Please refer to our{' '}
              <Link href="/cookies" className="legal__link">
                Cookie Policy
              </Link>{' '}
              for full details on the cookies we use, their purpose, and how to manage your
              preferences.
            </p>
          </section>

          <section className="legal__section" id="children">
            <h2 className="legal__section-title">10. Children&apos;s Privacy</h2>
            <p className="legal__text">
              The Service is not directed to individuals under the age of <strong>16 years</strong>,
              and we do not knowingly collect personal data from children. Under the{' '}
              <strong>Children&apos;s Act 2075 (2018)</strong> of Nepal, if we become aware that a
              child under 16 has provided us personal data without verifiable parental consent, we
              will promptly delete it. If you believe a child has submitted information to us,
              please contact privacy@convexhire.com.
            </p>
          </section>

          <section className="legal__section" id="changes">
            <h2 className="legal__section-title">11. Changes to This Policy</h2>
            <p className="legal__text">
              We may update this Privacy Policy from time to time to reflect changes in our
              practices or applicable Nepal law. When we make material changes, we will notify you
              by email (to the address on file) or by posting a prominent notice on the Service at
              least <strong>15 days</strong> before the changes take effect. The &quot;Last
              updated&quot; date at the top of this page will always reflect the most recent
              revision.
            </p>
            <p className="legal__text">
              Your continued use of the Service after the effective date constitutes acceptance of
              the revised Policy.
            </p>
          </section>

          <section className="legal__section" id="contact">
            <h2 className="legal__section-title">12. Contact Us</h2>
            <p className="legal__text">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our
              data practices, please contact our Data Protection Officer:
            </p>
            <ul className="legal__list">
              <li>
                <strong>Company:</strong> Convex Technologies Pvt. Ltd.
              </li>
              <li>
                <strong>Registration:</strong> Registered under the Companies Act 2063 (2006), Nepal
              </li>
              <li>
                <strong>Address:</strong> Kathmandu, Bagmati Province, Nepal
              </li>
              <li>
                <strong>Email:</strong> privacy@convexhire.com
              </li>
              <li>
                <strong>Phone:</strong> +977-1-XXXXXXX
              </li>
            </ul>
          </section>

          {/* Related policies */}
          <nav className="legal__related" aria-label="Related policies">
            <Link href="/cookies" className="legal__related-link">
              <ChevronRight aria-hidden="true" />
              Cookie Policy
            </Link>
            <Link href="/terms" className="legal__related-link">
              <ChevronRight aria-hidden="true" />
              Terms &amp; Conditions
            </Link>
            <Link href="/copyright" className="legal__related-link">
              <ChevronRight aria-hidden="true" />
              Copyright Notice
            </Link>
          </nav>
        </main>
      </div>
    </div>
  )
}
