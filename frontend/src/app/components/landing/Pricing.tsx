import React from 'react'
import Container from './Container'
import Button from './Button'
import { PricingContent } from '../../../content/landing-page'
import { ShineBorder } from '../../../components/ui/shine-border'

interface PricingProps {
  content: PricingContent
}

export default function Pricing({ content }: PricingProps) {
  return (
    <section className="py-20 lg:py-32" id="pricing">
      <Container>
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-base text-[var(--color-gray-600)] mb-3">{content.subtitle}</p>
          <h2 className="text-3xl sm:text-4xl lg:text-[45px] leading-tight lg:leading-[56px] font-semibold text-[var(--color-primary-black)]">
            {content.title}
          </h2>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-6">
          {content.plans.map((plan, index) => (
            <div
              key={index}
              className={`relative flex flex-col p-10 bg-white rounded-[14px] transition-all duration-300 ${
                plan.featured
                  ? 'border-[3px] border-transparent shadow-[0_8px_16px_rgba(37,99,235,0.12)]'
                  : 'border-[1.5px] border-[var(--color-gray-200)] hover:border-[var(--color-primary-purple)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]'
              }`}
            >
              {/* Shine Border for Featured Plan */}
              {plan.featured && (
                <ShineBorder
                  borderWidth={3}
                  duration={14}
                  shineColor={['#2563eb', '#3b82f6', '#60a5fa', '#3b82f6', '#2563eb']}
                  className="rounded-[14px]"
                />
              )}
              {/* Featured Badge */}
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="px-4 py-2 bg-[var(--color-primary-purple)] text-white text-xs font-bold uppercase tracking-wider rounded-full">
                    Recommended
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center pb-6 border-b border-[var(--color-gray-200)]">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-gray-600)] mb-3">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-2 mb-4">
                  <span className="text-5xl font-bold text-[var(--color-primary-black)]">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-lg text-[var(--color-gray-600)]">{plan.period}</span>
                  )}
                </div>
                <p className="text-base text-[var(--color-gray-600)]">{plan.description}</p>
              </div>

              {/* Features List */}
              <ul className="flex-grow py-6 space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3 text-base">
                    {feature.included ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="flex-shrink-0 mt-0.5"
                      >
                        <circle cx="10" cy="10" r="10" fill="#28a745" />
                        <path
                          d="M6 10L9 13L14 7"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="flex-shrink-0 mt-0.5"
                      >
                        <circle cx="10" cy="10" r="10" fill="#E9ECEF" />
                        <path d="M7 10H13" stroke="#ADB5BD" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    )}
                    <span
                      className={
                        feature.included
                          ? 'text-[var(--color-gray-900)]'
                          : 'text-[var(--color-gray-400)]'
                      }
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <div className="mt-auto">
                <Button
                  variant={plan.featured ? 'primary' : 'secondary'}
                  size="large"
                  href={plan.cta.href}
                  className="w-full"
                >
                  {plan.cta.text}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
