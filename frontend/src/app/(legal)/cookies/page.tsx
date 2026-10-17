import type { Metadata } from 'next'
import Link from 'next/link'

import { LegalPage } from '@/components/public/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Cookie Policy',
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

const RELATED = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/copyright', label: 'Copyright Notice' },
]

export default function CookiePolicyPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      meta={[
        { icon: 'calendar', label: 'Effective: 1 Falgun 2081 BS (13 February 2025)' },
        { icon: 'shield', label: 'Governed by Nepal Law' },
      ]}
      toc={TOC}
      related={RELATED}
      summary={
        <>
          <strong>Summary:</strong> We only use essential cookies that keep you signed in. We do not
          use analytics, advertising or tracking cookies.
        </>
      }
    >
      <section id="what-are-cookies">
        <h2>1. What Are Cookies?</h2>
        <p>
          Cookies are small text files placed on your device by a website when you visit it. They
          are widely used to make websites work, or work more efficiently, as well as to provide
          information to site operators. Similar technologies include web beacons, pixel tags, local
          storage, and session storage.
        </p>
        <p>
          The use of cookies in connection with electronic services in Nepal is regulated under the{' '}
          <strong>Electronic Transactions Act 2063 (2006)</strong> and the{' '}
          <strong>Information Technology Policy 2072 (2015)</strong> issued by the Ministry of
          Communication and Information Technology, Government of Nepal.
        </p>
      </section>

      <section id="cookies-we-use">
        <h2>2. Cookies We Use</h2>

        <h3>2.1 Strictly Necessary Cookies</h3>
        <p>
          These cookies are essential for the Service to function and cannot be switched off. No
          consent is required under Nepal law as they are necessary to deliver a service explicitly
          requested by you.
        </p>
        <ul>
          <li>
            <strong>refresh_token</strong>: Keeps you signed in. HttpOnly (not readable by scripts).
            Expires after 7 days, or when you log out.
          </li>
          <li>
            <strong>auth_present</strong>: Tells the site you have a session so it can restore it.
            Contains no personal data. Cleared on log out.
          </li>
          <li>
            <strong>oauth_state</strong>: Protects Google sign-in against forgery. Set only during
            Google sign-in and expires within minutes.
          </li>
          <li>
            <strong>cookie-consent</strong> (browser storage, not a cookie): Remembers that you
            dismissed the cookie notice.
          </li>
        </ul>

        <h3>2.2 Analytics, Marketing and Tracking Cookies</h3>
        <p>
          We do <strong>not</strong> use analytics, marketing or advertising cookies. If this
          changes, we will update this Policy and ask for your consent first.
        </p>
      </section>

      <section id="third-party">
        <h2>3. Third-Party Cookies</h2>
        <p>
          Some pages of our Service embed content or tools from third parties that may set their own
          cookies. These include:
        </p>
        <ul>
          <li>
            <strong>LinkedIn / Google OAuth</strong>: Only active if you choose to sign in with
            those services.
          </li>
        </ul>
        <p>
          Rojgar AI has no control over third-party cookies. Please refer to the respective
          third-party privacy and cookie policies.
        </p>
      </section>

      <section id="legal-basis">
        <h2>4. Legal Basis Under Nepal Law</h2>
        <p>
          The <strong>Electronic Transactions Act 2063 (2006)</strong> and the{' '}
          <strong>Privacy Act 2075 (2018)</strong> of Nepal provide the framework for the lawful use
          of electronic tracking technologies:
        </p>
        <ul>
          <li>
            <strong>Strictly necessary cookies</strong> are deployed on the basis of{' '}
            <em>contractual necessity</em>. They are required to deliver the electronic service you
            have requested.
          </li>
          <li>
            <strong>Analytics and functional cookies</strong> are deployed solely on the basis of
            your <em>explicit, informed consent</em>, which you provide through our cookie consent
            banner.
          </li>
          <li>Consent is freely given, specific, unambiguous, and revocable at any time.</li>
        </ul>
      </section>

      <section id="your-choices">
        <h2>5. Your Choices</h2>
        <p>You can manage your cookie preferences in the following ways:</p>
        <ul>
          <li>
            <strong>Cookie banner:</strong> When you first visit Rojgar AI you are presented with a
            consent banner. You may accept all cookies or only accept strictly necessary ones.
          </li>
          <li>
            <strong>Re-open preferences:</strong> You can withdraw or change your consent at any
            time by clicking the &quot;Cookie Preferences&quot; link in the footer.
          </li>
          <li>
            <strong>Browser settings:</strong> Most browsers allow you to refuse or delete cookies.
            Note that blocking strictly necessary cookies will prevent the Service from functioning
            correctly. Instruction for popular browsers:{' '}
            <Link
              href="https://support.google.com/chrome/answer/95647"
              target="_blank"
              rel="noreferrer"
            >
              Chrome
            </Link>
            ,{' '}
            <Link
              href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
              target="_blank"
              rel="noreferrer"
            >
              Firefox
            </Link>
            ,{' '}
            <Link
              href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac"
              target="_blank"
              rel="noreferrer"
            >
              Safari
            </Link>
            .
          </li>
        </ul>
      </section>

      <section id="do-not-track">
        <h2>6. Do Not Track</h2>
        <p>
          Some browsers transmit a &quot;Do Not Track&quot; (DNT) signal. There is currently no
          universally accepted standard for how websites should respond to DNT signals. Until such a
          standard is established, we do not alter our data collection practices in response to DNT
          signals. You can manage your preference directly through the cookie banner or your browser
          settings.
        </p>
      </section>

      <section id="changes">
        <h2>7. Changes to This Policy</h2>
        <p>
          We may update this Cookie Policy to reflect changes in the cookies we use or for
          operational, legal, or regulatory reasons. We will notify you of any material changes at
          least <strong>15 days</strong> before they take effect, by displaying a notice on the
          Service or by email. The date at the top of this page indicates when this Policy was last
          reviewed.
        </p>
      </section>

      <section id="contact">
        <h2>8. Contact Us</h2>
        <p>For questions about our use of cookies, please contact:</p>
        <ul>
          <li>
            <strong>Company:</strong> Rojgar AI
          </li>
          <li>
            <strong>Email:</strong> hello@rojgarai.app
          </li>
        </ul>
      </section>
    </LegalPage>
  )
}
