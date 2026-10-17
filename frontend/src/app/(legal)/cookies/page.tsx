import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { Calendar, ChevronRight, ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cookie Policy - Rojgar AI',
  description:
    'Understand how Rojgar AI uses cookies and similar technologies on its platform, in compliance with the Electronic Transactions Act 2063 of Nepal.',
}

const TOC = [
  { id: 'what-are-cookies', label: 'What Are Cookies?' },
  { id: 'cookies-we-use', label: 'Cookies We Use' },
  { id: 'third-party', label: 'Third-Party Cookies' },
  { id: 'legal-basis', label: 'Legal Basis (Nepal Law)' },
  { id: 'your-choices', label: 'Your Choices' },
  { id: 'do-not-track', label: 'Do Not Track' },
  { id: 'changes', label: 'Changes' },
  { id: 'contact', label: 'Contact Us' },
]

export default function CookiePolicyPage() {
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
          <h1 className="legal__title">Cookie Policy</h1>
          <div className="legal__meta">
            <span className="legal__meta-item">
              <Calendar aria-hidden="true" />
              Effective: 1 Falgun 2081 BS (13 February 2025)
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
              <strong>Summary:</strong> We only use essential cookies that keep you signed in. We do
              not use analytics, advertising or tracking cookies.
            </p>
          </div>

          <section className="legal__section" id="what-are-cookies">
            <h2 className="legal__section-title">1. What Are Cookies?</h2>
            <p className="legal__text">
              Cookies are small text files placed on your device by a website when you visit it.
              They are widely used to make websites work, or work more efficiently, as well as to
              provide information to site operators. Similar technologies include web beacons, pixel
              tags, local storage, and session storage.
            </p>
            <p className="legal__text">
              The use of cookies in connection with electronic services in Nepal is regulated under
              the <strong>Electronic Transactions Act 2063 (2006)</strong> and the{' '}
              <strong>Information Technology Policy 2072 (2015)</strong> issued by the Ministry of
              Communication and Information Technology, Government of Nepal.
            </p>
          </section>

          <section className="legal__section" id="cookies-we-use">
            <h2 className="legal__section-title">2. Cookies We Use</h2>

            <h3 className="legal__section-subtitle">2.1 Strictly Necessary Cookies</h3>
            <p className="legal__text">
              These cookies are essential for the Service to function and cannot be switched off. No
              consent is required under Nepal law as they are necessary to deliver a service
              explicitly requested by you.
            </p>
            <ul className="legal__list">
              <li>
                <strong>refresh_token</strong>: Keeps you signed in. HttpOnly (not readable by
                scripts). Expires after 7 days, or when you log out.
              </li>
              <li>
                <strong>auth_present</strong>: Tells the site you have a session so it can restore
                it. Contains no personal data. Cleared on log out.
              </li>
              <li>
                <strong>oauth_state</strong>: Protects Google sign-in against forgery. Set only
                during Google sign-in and expires within minutes.
              </li>
              <li>
                <strong>cookie-consent</strong> (browser storage, not a cookie): Remembers that you
                dismissed the cookie notice.
              </li>
            </ul>

            <h3 className="legal__section-subtitle">
              2.2 Analytics, Marketing and Tracking Cookies
            </h3>
            <p className="legal__text">
              We do <strong>not</strong> use analytics, marketing or advertising cookies. If this
              changes, we will update this Policy and ask for your consent first.
            </p>
          </section>

          <section className="legal__section" id="third-party">
            <h2 className="legal__section-title">3. Third-Party Cookies</h2>
            <p className="legal__text">
              Some pages of our Service embed content or tools from third parties that may set their
              own cookies. These include:
            </p>
            <ul className="legal__list">
              <li>
                <strong>LinkedIn / Google OAuth</strong>: Only active if you choose to sign in with
                those services.
              </li>
            </ul>
            <p className="legal__text">
              Rojgar AI has no control over third-party cookies. Please refer to the respective
              third-party privacy and cookie policies.
            </p>
          </section>

          <section className="legal__section" id="legal-basis">
            <h2 className="legal__section-title">4. Legal Basis Under Nepal Law</h2>
            <p className="legal__text">
              The <strong>Electronic Transactions Act 2063 (2006)</strong> and the{' '}
              <strong>Privacy Act 2075 (2018)</strong> of Nepal provide the framework for the lawful
              use of electronic tracking technologies:
            </p>
            <ul className="legal__list">
              <li>
                <strong>Strictly necessary cookies</strong> are deployed on the basis of{' '}
                <em>contractual necessity</em>. They are required to deliver the electronic service
                you have requested.
              </li>
              <li>
                <strong>Analytics and functional cookies</strong> are deployed solely on the basis
                of your <em>explicit, informed consent</em>, which you provide through our cookie
                consent banner.
              </li>
              <li>Consent is freely given, specific, unambiguous, and revocable at any time.</li>
            </ul>
          </section>

          <section className="legal__section" id="your-choices">
            <h2 className="legal__section-title">5. Your Choices</h2>
            <p className="legal__text">
              You can manage your cookie preferences in the following ways:
            </p>
            <ul className="legal__list">
              <li>
                <strong>Cookie banner:</strong> When you first visit Rojgar AI you are presented
                with a consent banner. You may accept all cookies or only accept strictly necessary
                ones.
              </li>
              <li>
                <strong>Re-open preferences:</strong> You can withdraw or change your consent at any
                time by clicking the &quot;Cookie Preferences&quot; link in the footer.
              </li>
              <li>
                <strong>Browser settings:</strong> Most browsers allow you to refuse or delete
                cookies. Note that blocking strictly necessary cookies will prevent the Service from
                functioning correctly. Instruction for popular browsers:{' '}
                <Link
                  href="https://support.google.com/chrome/answer/95647"
                  target="_blank"
                  rel="noreferrer"
                  className="legal__link"
                >
                  Chrome
                </Link>
                ,{' '}
                <Link
                  href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
                  target="_blank"
                  rel="noreferrer"
                  className="legal__link"
                >
                  Firefox
                </Link>
                ,{' '}
                <Link
                  href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac"
                  target="_blank"
                  rel="noreferrer"
                  className="legal__link"
                >
                  Safari
                </Link>
                .
              </li>
            </ul>
          </section>

          <section className="legal__section" id="do-not-track">
            <h2 className="legal__section-title">6. Do Not Track</h2>
            <p className="legal__text">
              Some browsers transmit a &quot;Do Not Track&quot; (DNT) signal. There is currently no
              universally accepted standard for how websites should respond to DNT signals. Until
              such a standard is established, we do not alter our data collection practices in
              response to DNT signals. You can manage your preference directly through the cookie
              banner or your browser settings.
            </p>
          </section>

          <section className="legal__section" id="changes">
            <h2 className="legal__section-title">7. Changes to This Policy</h2>
            <p className="legal__text">
              We may update this Cookie Policy to reflect changes in the cookies we use or for
              operational, legal, or regulatory reasons. We will notify you of any material changes
              at least <strong>15 days</strong> before they take effect, by displaying a notice on
              the Service or by email. The date at the top of this page indicates when this Policy
              was last reviewed.
            </p>
          </section>

          <section className="legal__section" id="contact">
            <h2 className="legal__section-title">8. Contact Us</h2>
            <p className="legal__text">For questions about our use of cookies, please contact:</p>
            <ul className="legal__list">
              <li>
                <strong>Company:</strong> Rojgar AI
              </li>
              <li>
                <strong>Email:</strong> hello@rojgarai.app
              </li>
            </ul>
          </section>

          <nav className="legal__related" aria-label="Related policies">
            <Link href="/privacy" className="legal__related-link">
              <ChevronRight aria-hidden="true" />
              Privacy Policy
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
