import React from 'react';
import Container from './Container';
import Card from './Card';
import { FeaturesContent } from '../../../content/landing-page';

interface FeaturesGridProps {
  content: FeaturesContent;
}

export default function FeaturesGrid({ content }: FeaturesGridProps) {
  return (
    <section className="py-20 lg:py-32 bg-white" id="features">
      <Container>
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-base text-[var(--color-gray-600)] mb-3">
            {content.subtitle}
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-[45px] leading-tight lg:leading-[56px] font-semibold text-[var(--color-primary-black)]">
            {content.title}
          </h2>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {content.features.map((feature, index) => (
            <Card
              key={index}
              icon={feature.icon}
              iconAlt={feature.iconAlt}
              title={feature.title}
              description={feature.description}
              variant="feature"
              data-testid="feature-card"
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
