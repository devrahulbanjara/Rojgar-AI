import React from 'react'
import Container from './Container'
import Button from './Button'
import { CTAContent } from '../../../content/landing-page'

interface CTASectionProps {
  content: CTAContent
}

export default function CTASection({ content }: CTASectionProps) {
  return (
    <section className="py-16 lg:py-24 bg-[var(--color-primary-light)] relative overflow-hidden">
      <Container>
        <div className="max-w-[720px] text-center mx-auto relative z-10">
          {/* Title */}
          <h2 className="text-3xl sm:text-4xl lg:text-[45px] leading-tight lg:leading-[56px] font-semibold text-[var(--color-primary-black)] mb-6">
            {content.title}
          </h2>

          {/* Description */}
          <p className="text-lg leading-7 text-[var(--color-gray-600)] mb-8">
            {content.description}
          </p>

          {/* CTA Button */}
          <Button variant="primary" size="large" href={content.cta.href}>
            {content.cta.text}
          </Button>
        </div>

        {/* Decorative Spinning Icon */}
        <div className="absolute -top-10 -right-10 w-32 h-32 opacity-20 hidden lg:block animate-spin-slow">
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-[var(--color-primary-purple)]"
          >
            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="2" />
            <circle cx="50" cy="10" r="5" fill="currentColor" />
            <circle cx="90" cy="50" r="5" fill="currentColor" />
            <circle cx="50" cy="90" r="5" fill="currentColor" />
            <circle cx="10" cy="50" r="5" fill="currentColor" />
          </svg>
        </div>
      </Container>
    </section>
  )
}
