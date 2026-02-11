import React from 'react'
import Container from './Container'
import Card from './Card'
import { HowItWorksContent } from '../../../content/landing-page'

interface HowItWorksProps {
  content: HowItWorksContent
}

export default function HowItWorks({ content }: HowItWorksProps) {
  return (
    <section className="py-20 lg:py-32 bg-[var(--color-gray-100)]" id="how-it-works">
      <Container>
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-base text-[var(--color-gray-600)] mb-3">{content.subtitle}</p>
          <h2 className="text-3xl sm:text-4xl lg:text-[45px] leading-tight lg:leading-[56px] font-semibold text-[var(--color-primary-black)]">
            {content.title}
          </h2>
        </div>

        {/* Process Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
          {content.steps.map((step, index) => (
            <div key={index} className="relative">
              <Card
                icon={step.icon}
                iconAlt={step.iconAlt}
                title={step.title}
                description={step.description}
                variant="process"
              />

              {/* Connecting Arrow (Desktop only) */}
              {index < content.steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-10">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-[var(--color-primary-purple)]"
                  >
                    <path
                      d="M5 12H19M19 12L12 5M19 12L12 19"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
