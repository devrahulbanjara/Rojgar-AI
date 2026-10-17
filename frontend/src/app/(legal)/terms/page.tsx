import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { CalendarIcon, ChevronRightIcon, ShieldCheckIcon } from '@/components/icons'

export const metadata: Metadata = {
  title: 'Terms & Conditions - Rojgar AI',
  description:
    'Read the Terms and Conditions governing your use of Rojgar AI, drafted in accordance with the Nepal Contract Act 2056, Consumer Protection Act 2075, and Electronic Transactions Act 2063.',
}

const TOC = [
  { id: 'acceptance', label: 'Acceptance of Terms' },
  { id: 'eligibility', label: 'Eligibility' },
  { id: 'accounts', label: 'Accounts & Registration' },
  { id: 'services', label: 'Our Services' },
  { id: 'candidate-obligations', label: 'Candidate Obligations' },
  { id: 'employer-obligations', label: 'Employer Obligations' },
  { id: 'prohibited-conduct', label: 'Prohibited Conduct' },
  { id: 'intellectual-property', label: 'Intellectual Property' },
  { id: 'payments', label: 'Payments & Refunds' },
  { id: 'disclaimers', label: 'Disclaimers' },
  { id: 'liability', label: 'Limitation of Liability' },
  { id: 'indemnification', label: 'Indemnification' },
  { id: 'termination', label: 'Termination' },
  { id: 'governing-law', label: 'Governing Law & Disputes' },
  { id: 'changes', label: 'Changes to Terms' },
  { id: 'contact', label: 'Contact Us' },
]

export default function TermsPage() {
  return (
    <div className="legal">
      <Image
        src="/bg/bg-ui-v4.webp"
        alt=""
        width={700}
        height={700}
        className="legal__bg-top"
        aria-hidden="true"
      />
      <Image
        src="/bg/bg-ui-v3.webp"
        alt=""
        width={640}
        height={640}
        className="legal__bg-bottom"
        aria-hidden="true"
      />

      {/* Hero */}
      <div className="legal__hero">
        <div className="container">
          <h1 className="legal__title">Terms &amp; Conditions</h1>
          <div className="legal__meta">
            <span className="legal__meta-item">
              <CalendarIcon aria-hidden="true" />
              Effective: 1 Falgun 2081 BS (13 February 2025)
            </span>
            <span className="legal__meta-sep" aria-hidden="true" />
            <span className="legal__meta-item">
              <ShieldCheckIcon aria-hidden="true" />
              Governed by Nepal Law
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="legal__body container">
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

        <main className="legal__content">
          <div className="legal__callout">
            <p>
              <strong>Please read carefully.</strong> These Terms constitute a legally binding
              agreement between you and Rojgar AI under the{' '}
              <strong>Nepal Contract Act 2056 (2000)</strong>. By using Rojgar AI you agree to these
              Terms. If you do not agree, do not use the Service.
            </p>
          </div>

          <section className="legal__section" id="acceptance">
            <h2 className="legal__section-title">1. Acceptance of Terms</h2>
            <p className="legal__text">
              These Terms and Conditions (&quot;Terms&quot;) govern your access to and use of the
              Rojgar AI platform and related services operated by <strong>Rojgar AI</strong>{' '}
              (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;), a private limited company
              incorporated under the <strong>Companies Act 2063 (2006)</strong> of Nepal.
            </p>
            <p className="legal__text">
              By clicking &quot;Accept&quot;, registering an account, accessing the website at
              rojgarai.app, or otherwise using any part of the Service, you agree to be bound by
              these Terms. These Terms form a valid legal contract enforceable under the{' '}
              <strong>Nepal Contract Act 2056 (2000)</strong>.
            </p>
          </section>

          <section className="legal__section" id="eligibility">
            <h2 className="legal__section-title">2. Eligibility</h2>
            <p className="legal__text">To use the Service, you must:</p>
            <ul className="legal__list">
              <li>
                Be at least <strong>16 years of age</strong>. Users between 16 and 18 years must
                have verifiable parental or guardian consent, in accordance with the{' '}
                <strong>Children&apos;s Act 2075 (2018)</strong>.
              </li>
              <li>
                Have the legal capacity to enter into a binding contract under the Nepal Contract
                Act 2056.
              </li>
              <li>
                Not be prohibited from using the Service under any applicable Nepal law or
                regulation.
              </li>
            </ul>
            <p className="legal__text">
              By registering, you represent and warrant that you meet all eligibility requirements.
            </p>
          </section>

          <section className="legal__section" id="accounts">
            <h2 className="legal__section-title">3. Accounts &amp; Registration</h2>
            <p className="legal__text">
              You must create an account to access most features of the Service. When registering,
              you agree to:
            </p>
            <ul className="legal__list">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and promptly update your account information to keep it accurate</li>
              <li>Keep your password secure and confidential</li>
              <li>
                Notify us immediately at support@rojgarai.app of any unauthorised use of your
                account
              </li>
              <li>Accept full responsibility for all activities conducted through your account</li>
            </ul>
            <p className="legal__text">
              We reserve the right to suspend or terminate accounts that contain false, misleading,
              or impersonating information, in accordance with Section 47 of the{' '}
              <strong>Electronic Transactions Act 2063 (2006)</strong>.
            </p>
          </section>

          <section className="legal__section" id="services">
            <h2 className="legal__section-title">4. Our Services</h2>
            <p className="legal__text">
              Rojgar AI provides an online platform connecting job seekers (&quot;Candidates&quot;)
              with hiring organisations (&quot;Employers&quot;). Our core services include:
            </p>
            <ul className="legal__list">
              <li>Job pages with a shareable apply link and an apply form that needs no account</li>
              <li>A status link and email updates for every application</li>
              <li>
                Tools for employers to post jobs, review each application against their criteria,
                decide with one click, book interviews and record scorecards (paid plans)
              </li>
            </ul>
            <p className="legal__text">
              We act as an intermediary platform. We do not guarantee employment, a specific number
              of applications, or particular hiring outcomes. Employment relationships are solely
              between Candidates and Employers.
            </p>
          </section>

          <section className="legal__section" id="candidate-obligations">
            <h2 className="legal__section-title">5. Candidate Obligations</h2>
            <p className="legal__text">As a Candidate, you agree to:</p>
            <ul className="legal__list">
              <li>
                Provide truthful and accurate information in your profile, CV, and all job
                applications
              </li>
              <li>Not misrepresent your qualifications, experience, or identity</li>
              <li>
                Apply only for positions for which you are genuinely interested and reasonably
                qualified
              </li>
              <li>Respond to employer communications in a timely and professional manner</li>
              <li>
                Not use the platform to solicit business, advertise services, or recruit for
                competing platforms
              </li>
              <li>Comply with the terms and conditions of any employer to whom you apply</li>
            </ul>
            <p className="legal__text">
              Submitting false or fraudulent application materials may constitute an offence under{' '}
              <strong>Section 47 of the Electronic Transactions Act 2063</strong> and may be
              reported to the relevant authorities.
            </p>
          </section>

          <section className="legal__section" id="employer-obligations">
            <h2 className="legal__section-title">6. Employer Obligations</h2>
            <p className="legal__text">As an Employer or recruiter, you agree to:</p>
            <ul className="legal__list">
              <li>Post only genuine, lawful job vacancies that exist within your organisation</li>
              <li>
                Comply with the <strong>Labour Act 2074 (2017)</strong> of Nepal, including
                provisions on equal opportunity, non-discrimination, and minimum wage
              </li>
              <li>
                Not use candidate data for any purpose other than evaluating their application for
                the specific role advertised
              </li>
              <li>
                Provide a response to every applicant, in keeping with Rojgar AI&apos;s no-ghosting
                commitment
              </li>
              <li>
                Not post misleading job descriptions, inflated salaries, or multi-level marketing
                (MLM) positions
              </li>
              <li>
                Maintain candidate data in accordance with the{' '}
                <strong>Privacy Act 2075 (2018)</strong>
              </li>
            </ul>
          </section>

          <section className="legal__section" id="prohibited-conduct">
            <h2 className="legal__section-title">7. Prohibited Conduct</h2>
            <p className="legal__text">You must not use the Service to:</p>
            <ul className="legal__list">
              <li>
                Post or transmit any content that is false, defamatory, obscene, or in violation of
                any Nepal law
              </li>
              <li>Infringe the intellectual property rights of Rojgar AI or any third party</li>
              <li>
                Engage in scraping, crawling, or automated data extraction without prior written
                consent
              </li>
              <li>
                Introduce viruses, malware, or other harmful code in violation of the Electronic
                Transactions Act 2063
              </li>
              <li>Attempt to gain unauthorised access to any part of the Service or our systems</li>
              <li>
                Harass, threaten, or discriminate against any user on the basis of race, gender,
                religion, caste, disability, or any other protected characteristic under Nepal law
              </li>
              <li>
                Circumvent, disable, or otherwise interfere with security features of the Service
              </li>
              <li>Use the Service for any unlawful purpose or in violation of these Terms</li>
            </ul>
          </section>

          <section className="legal__section" id="intellectual-property">
            <h2 className="legal__section-title">8. Intellectual Property</h2>
            <p className="legal__text">
              All content on the Service, including but not limited to text, graphics, logos, icons,
              images, audio, video, data compilations, and software, is the property of Rojgar AI or
              its licensors and is protected under the <strong>Copyright Act 2059 (2002)</strong> of
              Nepal. Refer to our{' '}
              <Link href="/copyright" className="legal__link">
                Copyright Notice
              </Link>{' '}
              for full details.
            </p>
            <p className="legal__text">
              You retain ownership of the content you submit (CVs, cover letters, etc.). By
              submitting content, you grant us a non-exclusive, royalty-free, worldwide licence to
              use, store, and display that content solely as necessary to provide the Service.
            </p>
          </section>

          <section className="legal__section" id="payments">
            <h2 className="legal__section-title">9. Payments &amp; Refunds</h2>
            <p className="legal__text">
              Rojgar AI is free for Candidates. Employer subscription plans are offered on a monthly
              or annual basis. By subscribing, you agree to the following:
            </p>
            <ul className="legal__list">
              <li>
                All fees are stated in Nepalese Rupees (NPR) and are inclusive of applicable{' '}
                <strong>Value Added Tax (VAT) at 13%</strong> as required by the{' '}
                <strong>Value Added Tax Act 2052 (1995)</strong>
              </li>
              <li>
                Paid plans are not yet self-serve. Until online payments launch, plans are arranged
                directly with our team and invoiced with VAT
              </li>
              <li>
                Subscriptions auto-renew unless cancelled at least <strong>24 hours</strong> before
                the renewal date
              </li>
              <li>
                Refunds for unused subscription periods are provided within <strong>7 days</strong>{' '}
                of purchase if no job postings have been made, in accordance with the{' '}
                <strong>Consumer Protection Act 2075 (2018)</strong>
              </li>
              <li>
                After 7 days or after a job posting has been published, no refund is available
              </li>
            </ul>
          </section>

          <section className="legal__section" id="disclaimers">
            <h2 className="legal__section-title">10. Disclaimers</h2>
            <p className="legal__text">
              The Service is provided on an <strong>&quot;as is&quot;</strong> and{' '}
              <strong>&quot;as available&quot;</strong> basis. To the maximum extent permitted under
              Nepal law:
            </p>
            <ul className="legal__list">
              <li>
                We do not warrant that the Service will be uninterrupted, error-free, or secure at
                all times
              </li>
              <li>
                We do not guarantee the accuracy, completeness, or quality of any job listing posted
                by Employers
              </li>
              <li>
                We are not responsible for the hiring decisions of Employers or for the outcome of
                any job application
              </li>
              <li>
                We do not verify the credentials or background of any Employer or Candidate,
                although we reserve the right to do so
              </li>
            </ul>
          </section>

          <section className="legal__section" id="liability">
            <h2 className="legal__section-title">11. Limitation of Liability</h2>
            <p className="legal__text">
              To the fullest extent permitted by the <strong>Nepal Contract Act 2056</strong> and
              other applicable law, in no event shall Rojgar AI, its directors, employees, or agents
              be liable for any indirect, incidental, special, consequential, or punitive damages
              arising from your use of or inability to use the Service.
            </p>
            <p className="legal__text">
              Our total aggregate liability to you for any claim arising out of or related to these
              Terms or the Service shall not exceed the total fees paid by you to Rojgar AI in the{' '}
              <strong>3 months preceding</strong> the event giving rise to the claim, or{' '}
              <strong>NPR 5,000</strong>, whichever is greater.
            </p>
            <p className="legal__text">
              Nothing in these Terms limits our liability for death, personal injury, or fraud
              caused by our negligence, or any other liability that cannot be excluded under Nepal
              law.
            </p>
          </section>

          <section className="legal__section" id="indemnification">
            <h2 className="legal__section-title">12. Indemnification</h2>
            <p className="legal__text">
              You agree to defend, indemnify, and hold harmless Rojgar AI and its officers,
              directors, employees, and agents from and against any claims, damages, obligations,
              losses, liabilities, costs, or debt, and expenses (including reasonable legal fees)
              arising from:
            </p>
            <ul className="legal__list">
              <li>Your use of the Service in violation of these Terms</li>
              <li>
                Your violation of any third-party right, including any intellectual property or
                privacy right
              </li>
              <li>Any content you submit that causes damage to a third party</li>
              <li>Your violation of any applicable Nepal law or regulation</li>
            </ul>
          </section>

          <section className="legal__section" id="termination">
            <h2 className="legal__section-title">13. Termination</h2>
            <p className="legal__text">
              You may close your account at any time by visiting your account settings or contacting
              support@rojgarai.app.
            </p>
            <p className="legal__text">
              We reserve the right to suspend or permanently terminate your access to the Service,
              without prior notice, if:
            </p>
            <ul className="legal__list">
              <li>You breach any provision of these Terms</li>
              <li>There are reasonable grounds to suspect fraudulent or unlawful activity</li>
              <li>Required by a court order or competent authority under Nepal law</li>
            </ul>
            <p className="legal__text">
              Upon termination, your right to use the Service ceases immediately. Provisions of
              these Terms that by their nature should survive termination (including intellectual
              property, disclaimers, and limitation of liability) will continue to apply.
            </p>
          </section>

          <section className="legal__section" id="governing-law">
            <h2 className="legal__section-title">14. Governing Law &amp; Dispute Resolution</h2>
            <p className="legal__text">
              These Terms are governed by and construed in accordance with the laws of{' '}
              <strong>Nepal</strong>, including but not limited to:
            </p>
            <ul className="legal__list">
              <li>Nepal Contract Act 2056 (2000)</li>
              <li>Electronic Transactions Act 2063 (2006)</li>
              <li>Consumer Protection Act 2075 (2018)</li>
              <li>Labour Act 2074 (2017)</li>
            </ul>
            <p className="legal__text">
              Any dispute arising out of or in connection with these Terms shall first be resolved
              through good-faith negotiation. If unresolved within <strong>30 days</strong>, the
              dispute shall be submitted to <strong>mediation or arbitration</strong> under the{' '}
              <strong>Arbitration Act 2055 (1999)</strong> of Nepal. The seat of arbitration shall
              be Kathmandu, Nepal, and proceedings shall be conducted in Nepali or English.
            </p>
            <p className="legal__text">
              If arbitration is not agreed upon, the dispute shall be subject to the exclusive
              jurisdiction of the courts of <strong>Kathmandu District</strong>, Nepal.
            </p>
          </section>

          <section className="legal__section" id="changes">
            <h2 className="legal__section-title">15. Changes to These Terms</h2>
            <p className="legal__text">
              We may revise these Terms from time to time. We will provide at least{' '}
              <strong>15 days&apos; notice</strong> of material changes by email or a prominent
              notice on the Service. Continued use of the Service after the effective date is your
              acceptance of the revised Terms.
            </p>
          </section>

          <section className="legal__section" id="contact">
            <h2 className="legal__section-title">16. Contact Us</h2>
            <p className="legal__text">For questions about these Terms, contact:</p>
            <ul className="legal__list">
              <li>
                <strong>Legal Team:</strong> Rojgar AI, Kathmandu, Nepal
              </li>
              <li>
                <strong>Email:</strong> legal@rojgarai.app
              </li>
            </ul>
          </section>

          <nav className="legal__related" aria-label="Related policies">
            <Link href="/privacy" className="legal__related-link">
              <ChevronRightIcon aria-hidden="true" />
              Privacy Policy
            </Link>
            <Link href="/cookies" className="legal__related-link">
              <ChevronRightIcon aria-hidden="true" />
              Cookie Policy
            </Link>
            <Link href="/copyright" className="legal__related-link">
              <ChevronRightIcon aria-hidden="true" />
              Copyright Notice
            </Link>
          </nav>
        </main>
      </div>
    </div>
  )
}
