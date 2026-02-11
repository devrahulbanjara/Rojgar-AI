import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Container from './Container'
import { FooterContent } from '../../../content/landing-page'

interface FooterProps {
  content: FooterContent
}

export default function Footer({ content }: FooterProps) {
  return (
    <footer
      className="bg-[var(--color-primary-black)] text-white py-16 lg:py-20"
      role="contentinfo"
    >
      <Container>
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-10">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Image
              src={content.logo.src}
              alt={content.logo.alt}
              width={280}
              height={60}
              className="h-8 w-auto mb-4"
            />
            <p className="text-base leading-relaxed text-white/70 mb-6 max-w-xs">
              {content.description}
            </p>
            <a
              href={`mailto:${content.contact.email}`}
              className="text-base text-white hover:text-[var(--color-primary-purple)] transition-colors duration-200"
            >
              {content.contact.email}
            </a>
          </div>

          {/* Link Columns */}
          {content.columns.map((column, index) => (
            <div key={index}>
              <h3 className="text-base font-bold text-white mb-5">{column.title}</h3>
              <ul className="flex flex-col gap-3 list-none p-0 m-0">
                {column.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/70 hover:text-white hover:pl-2 transition-all duration-200"
                    >
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer Bottom */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <p className="text-sm text-white/50 text-center">{content.copyright}</p>
        </div>
      </Container>
    </footer>
  )
}
