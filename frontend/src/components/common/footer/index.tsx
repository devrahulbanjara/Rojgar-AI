import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container footer__inner">
        {/* Brand */}
        <div className="footer__brand">
          <Link href="/" className="footer__logo">
            <Image src="/logo/logo.png" alt="ConvexHire Logo" width={120} height={26} />
          </Link>
          <p className="footer__tagline">Find your next engineering role — fast.</p>
        </div>

        {/* Link columns */}
        <nav className="footer__nav" aria-label="Footer navigation">
          <div className="footer__nav-col">
            <h3 className="footer__nav-heading">Platform</h3>
            <ul className="footer__nav-list">
              <li className="footer__nav-item">
                <Link href="/jobs" className="footer__nav-link">
                  Browse Jobs
                </Link>
              </li>
              <li className="footer__nav-item">
                <Link href="/candidate" className="footer__nav-link">
                  Dashboard
                </Link>
              </li>
              <li className="footer__nav-item">
                <Link href="/career" className="footer__nav-link">
                  Resume Tracking
                </Link>
              </li>
              <li className="footer__nav-item">
                <Link href="/companies" className="footer__nav-link">
                  Companies
                </Link>
              </li>
              <li className="footer__nav-item">
                <Link href="/employers" className="footer__nav-link">
                  For Employers
                </Link>
              </li>
            </ul>
          </div>

          <div className="footer__nav-col">
            <h3 className="footer__nav-heading">Account</h3>
            <ul className="footer__nav-list">
              <li className="footer__nav-item">
                <Link href="/login" className="footer__nav-link">
                  Sign In
                </Link>
              </li>
              <li className="footer__nav-item">
                <Link href="/signup" className="footer__nav-link">
                  Create Account
                </Link>
              </li>
              <li className="footer__nav-item">
                <Link href="/forgot-password" className="footer__nav-link">
                  Forgot Password
                </Link>
              </li>
            </ul>
          </div>

          <div className="footer__nav-col">
            <h3 className="footer__nav-heading">Legal</h3>
            <ul className="footer__nav-list">
              <li className="footer__nav-item">
                <Link href="/privacy" className="footer__nav-link">
                  Privacy Policy
                </Link>
              </li>
              <li className="footer__nav-item">
                <Link href="/cookies" className="footer__nav-link">
                  Cookie Policy
                </Link>
              </li>
              <li className="footer__nav-item">
                <Link href="/terms" className="footer__nav-link">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li className="footer__nav-item">
                <Link href="/copyright" className="footer__nav-link">
                  Copyright Notice
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      {/* Bottom bar */}
      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <p className="footer__copy">&copy; {currentYear} ConvexHire. All rights reserved.</p>
          <div className="footer__socials">
            <Link
              href="https://twitter.com"
              className="footer__social-link"
              aria-label="Twitter"
              target="_blank"
              rel="noreferrer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L2.25 2.25h6.893l4.255 5.623zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </Link>
            <Link
              href="https://linkedin.com"
              className="footer__social-link"
              aria-label="LinkedIn"
              target="_blank"
              rel="noreferrer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </Link>
            <Link
              href="https://github.com"
              className="footer__social-link"
              aria-label="GitHub"
              target="_blank"
              rel="noreferrer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
