import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { Calendar, ChevronRight, ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Copyright Notice - ConvexHire',
  description:
    'ConvexHire copyright notice: all original content on this platform is protected under the Copyright Act 2059 (2002) of Nepal.',
}

const TOC = [
  { id: 'ownership', label: 'Ownership of Content' },
  { id: 'protected-works', label: 'Protected Works' },
  { id: 'permitted-use', label: 'Permitted Use' },
  { id: 'prohibited-use', label: 'Prohibited Use' },
  { id: 'user-content', label: 'User-Submitted Content' },
  { id: 'third-party', label: 'Third-Party Content' },
  { id: 'takedown', label: 'Copyright Takedown (DMCA / Nepal)' },
  { id: 'trademarks', label: 'Trademarks' },
  { id: 'contact', label: 'Contact Us' },
]

export default function CopyrightPage() {
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
          <h1 className="legal__title">Copyright Notice</h1>
          <div className="legal__meta">
            <span className="legal__meta-item">
              <Calendar aria-hidden="true" />
              Effective: 1 Falgun 2081 BS (13 February 2025)
            </span>
            <span className="legal__meta-sep" aria-hidden="true" />
            <span className="legal__meta-item">
              <ShieldCheck aria-hidden="true" />
              Copyright Act 2059 (Nepal)
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
              <strong>© {new Date().getFullYear()} Convex Technologies Pvt. Ltd.</strong> All rights
              reserved. All original content on this platform is protected under the{' '}
              <strong>Copyright Act 2059 (2002)</strong> of Nepal and applicable international
              copyright conventions, including the <strong>Berne Convention</strong> to which Nepal
              is a signatory.
            </p>
          </div>

          <section className="legal__section" id="ownership">
            <h2 className="legal__section-title">1. Ownership of Content</h2>
            <p className="legal__text">
              The ConvexHire platform, including its original design, user interface, graphics,
              text, code, databases, logos, and all other original content (&quot;Platform
              Content&quot;), is owned by or exclusively licensed to{' '}
              <strong>Convex Technologies Pvt. Ltd.</strong> and is protected as an original work
              under:
            </p>
            <ul className="legal__list">
              <li>
                <strong>Copyright Act 2059 (2002) of Nepal</strong>, which provides copyright
                protection for literary, artistic, and computer program works
              </li>
              <li>
                <strong>Electronic Transactions Act 2063 (2006) of Nepal</strong>, which recognises
                the legal status of digital works and electronic records
              </li>
              <li>
                The{' '}
                <strong>Berne Convention for the Protection of Literary and Artistic Works</strong>{' '}
                . Nepal acceded in 1967, providing automatic protection in all 181 member countries
                without registration
              </li>
              <li>
                The{' '}
                <strong>
                  Agreement on Trade-Related Aspects of Intellectual Property Rights (TRIPS)
                </strong>{' '}
                under the WTO, to which Nepal is party
              </li>
            </ul>
            <p className="legal__text">
              Copyright protection subsists from the moment of creation. The copyright in Platform
              Content lasts for the <strong>lifetime of the author plus 50 years</strong> from the
              end of the calendar year of death, as specified in Section 25 of the Copyright Act
              2059.
            </p>
          </section>

          <section className="legal__section" id="protected-works">
            <h2 className="legal__section-title">2. Protected Works</h2>
            <p className="legal__text">
              The following categories of works are protected under this Copyright Notice:
            </p>
            <ul className="legal__list">
              <li>
                <strong>Software and source code:</strong> All proprietary source code, algorithms,
                and software components of the ConvexHire platform
              </li>
              <li>
                <strong>Visual design:</strong> The graphical user interface, layouts, colour
                schemes, typography choices, icons, and illustrations created by ConvexHire
              </li>
              <li>
                <strong>Written content:</strong> All original articles, help documentation,
                marketing copy, and blog posts published on convexhire.com
              </li>
              <li>
                <strong>Database rights:</strong> The compilation, structure, and selection of data
                within the ConvexHire jobs database constitute a protected database under Section 4
                of the Copyright Act 2059
              </li>
              <li>
                <strong>Brand assets:</strong> The ConvexHire logo, wordmark, and brand identity
                materials
              </li>
              <li>
                <strong>Audiovisual content:</strong> Any video, animations, or multimedia content
                produced by ConvexHire
              </li>
            </ul>
          </section>

          <section className="legal__section" id="permitted-use">
            <h2 className="legal__section-title">3. Permitted Use</h2>
            <p className="legal__text">
              Subject to these Terms and the{' '}
              <strong>Copyright Act 2059, Section 18 (Fair Use)</strong>, the following uses of
              Platform Content are permitted without prior written consent:
            </p>
            <ul className="legal__list">
              <li>
                <strong>Personal use:</strong> Viewing, printing, or downloading a single copy of
                pages for your own personal, non-commercial use
              </li>
              <li>
                <strong>Research and education:</strong> Quotation or reproduction of limited
                extracts for purposes of criticism, review, reporting, or teaching, provided{' '}
                <strong>ConvexHire is clearly attributed</strong> as the source
              </li>
              <li>
                <strong>Sharing links:</strong> Sharing hyperlinks to any page on convexhire.com on
                social media or other platforms, so long as ConvexHire is not misrepresented
              </li>
              <li>
                <strong>Media coverage:</strong> Journalists and publishers may refer to and quote
                Platform Content for legitimate news reporting, with attribution
              </li>
            </ul>
            <p className="legal__text">
              Any use beyond what is expressly permitted above requires prior written permission
              from <strong>copyright@convexhire.com</strong>.
            </p>
          </section>

          <section className="legal__section" id="prohibited-use">
            <h2 className="legal__section-title">4. Prohibited Use</h2>
            <p className="legal__text">
              The following acts are <strong>strictly prohibited</strong> and constitute copyright
              infringement under the Copyright Act 2059:
            </p>
            <ul className="legal__list">
              <li>
                Reproducing, copying, or duplicating any Platform Content for commercial purposes
                without authorisation
              </li>
              <li>
                Creating derivative works from Platform Content without explicit written permission
              </li>
              <li>
                Selling, licensing, or otherwise exploiting Platform Content for financial gain
              </li>
              <li>
                Removing, altering, or obscuring any copyright, trademark, or proprietary notices
              </li>
              <li>
                Using automated tools (bots, scrapers, crawlers) to extract data or content from the
                platform
              </li>
              <li>
                Reverse-engineering, decompiling, or disassembling the platform&apos;s source code
              </li>
              <li>
                Republishing Platform Content on other websites or applications without
                authorisation
              </li>
            </ul>
            <p className="legal__text">
              Infringement of copyright under the Copyright Act 2059 may result in civil remedies
              including injunctions and damages, as well as criminal penalties under Section 68 of
              that Act, which provides for fines and imprisonment.
            </p>
          </section>

          <section className="legal__section" id="user-content">
            <h2 className="legal__section-title">5. User-Submitted Content</h2>
            <p className="legal__text">
              You retain full copyright ownership of any original content you submit to ConvexHire,
              including your CV, cover letters, profile descriptions, and portfolio items
              (&quot;User Content&quot;).
            </p>
            <p className="legal__text">
              By submitting User Content, you grant Convex Technologies Pvt. Ltd. a{' '}
              <strong>non-exclusive, royalty-free, worldwide, sublicensable licence</strong> to use,
              host, store, reproduce, publish, and display your User Content solely for the purposes
              of operating and improving the Service.
            </p>
            <p className="legal__text">You warrant that:</p>
            <ul className="legal__list">
              <li>
                You own or have the necessary rights and permissions to submit the User Content
              </li>
              <li>
                The User Content does not infringe the copyright, trademark, or other intellectual
                property rights of any third party
              </li>
              <li>The User Content does not contain any unlawful material under Nepal law</li>
            </ul>
            <p className="legal__text">
              We reserve the right to remove User Content that infringes third-party intellectual
              property rights upon receiving a valid takedown notice.
            </p>
          </section>

          <section className="legal__section" id="third-party">
            <h2 className="legal__section-title">6. Third-Party Content</h2>
            <p className="legal__text">
              The Service may display content from third parties, including company logos submitted
              by Employers, job descriptions, and links to external websites. Such content remains
              the intellectual property of the respective third parties. ConvexHire does not claim
              ownership of third-party content and is not responsible for its accuracy or legality.
            </p>
            <p className="legal__text">
              Company logos are displayed with the implied consent of the respective organisations
              for the purpose of identifying them as hiring partners. If you are a rights holder who
              objects to the display of your content, please contact us using the details in Section
              8.
            </p>
          </section>

          <section className="legal__section" id="takedown">
            <h2 className="legal__section-title">7. Copyright Takedown Procedure</h2>
            <p className="legal__text">
              If you believe that content on ConvexHire infringes your copyright, please submit a
              written notice to copyright@convexhire.com containing all of the following
              information, as required under the <strong>Copyright Act 2059</strong> and
              international best practice:
            </p>
            <ul className="legal__list">
              <li>Your full name, address, telephone number, and email address</li>
              <li>A description of the copyrighted work you claim has been infringed</li>
              <li>
                The exact URL(s) on convexhire.com where the allegedly infringing content appears
              </li>
              <li>
                A statement that you have a good-faith belief that the use is not authorised by the
                copyright owner, its agent, or the law
              </li>
              <li>
                A statement that the information in the notice is accurate and that you are the
                copyright owner or authorised to act on behalf of the owner
              </li>
              <li>Your physical or electronic signature</li>
            </ul>
            <p className="legal__text">
              We will investigate all valid notices and aim to take appropriate action within{' '}
              <strong>5 business days</strong>. Submitting a false takedown notice may expose you to
              liability for misrepresentation under Nepal law.
            </p>
          </section>

          <section className="legal__section" id="trademarks">
            <h2 className="legal__section-title">8. Trademarks</h2>
            <p className="legal__text">
              &quot;ConvexHire&quot;, the ConvexHire logo, and all related marks, logos, and service
              names are trademarks or service marks of Convex Technologies Pvt. Ltd., registered or
              applied for under the <strong>Trademark Act 2022 BS</strong> of Nepal.
            </p>
            <p className="legal__text">
              You may not use ConvexHire trademarks, logos, or brand assets without prior written
              consent, except as expressly permitted by these Terms. Unauthorised use may constitute
              trademark infringement or passing off under Nepal law.
            </p>
          </section>

          <section className="legal__section" id="contact">
            <h2 className="legal__section-title">9. Contact for Copyright Matters</h2>
            <p className="legal__text">
              For all copyright-related enquiries, permissions, and takedown requests:
            </p>
            <ul className="legal__list">
              <li>
                <strong>Company:</strong> Convex Technologies Pvt. Ltd., Kathmandu, Nepal
              </li>
              <li>
                <strong>Email:</strong> copyright@convexhire.com
              </li>
              <li>
                <strong>Response time:</strong> Within 5 business days for takedown requests; within
                15 business days for permission requests
              </li>
            </ul>
          </section>

          <nav className="legal__related" aria-label="Related policies">
            <Link href="/privacy" className="legal__related-link">
              <ChevronRight aria-hidden="true" />
              Privacy Policy
            </Link>
            <Link href="/cookies" className="legal__related-link">
              <ChevronRight aria-hidden="true" />
              Cookie Policy
            </Link>
            <Link href="/terms" className="legal__related-link">
              <ChevronRight aria-hidden="true" />
              Terms &amp; Conditions
            </Link>
          </nav>
        </main>
      </div>
    </div>
  )
}
