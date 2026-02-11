import React from 'react';
import Container from './Container';
import Button from './Button';
import { HeroContent } from '../../../content/landing-page';

interface HeroProps {
  content: HeroContent;
}

export default function Hero({ content }: HeroProps) {
  return (
    <section className="pt-32 pb-20 lg:pt-36 lg:pb-32 relative bg-white">
      <Container>
        {/* Hero Content */}
        <div className="max-w-[720px] text-center mx-auto">
          {/* Subtitle Badge */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 20 20" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="text-[var(--color-primary-purple)]"
            >
              <path 
                d="M10 2L12.5 7.5L18 8.5L14 13L15 18.5L10 15.5L5 18.5L6 13L2 8.5L7.5 7.5L10 2Z" 
                fill="currentColor"
              />
            </svg>
            <span className="text-base text-[var(--color-gray-600)]">
              {content.subtitle}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-[76px] leading-tight lg:leading-[96px] font-semibold tracking-tight text-[var(--color-primary-black)] mb-8">
            {content.title}
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl leading-relaxed text-[#6B7280] mb-12 max-w-[720px] mx-auto">
            {content.description}
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <Button variant="primary" size="large" href={content.primaryCTA.href}>
              {content.primaryCTA.text}
            </Button>
            <Button variant="secondary" size="large" href={content.secondaryCTA.href}>
              {content.secondaryCTA.text}
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
