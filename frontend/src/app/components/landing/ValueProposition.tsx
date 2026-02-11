import React from 'react';
import Container from './Container';
import Card from './Card';
import { ValuePropositionContent } from '../../../content/landing-page';

interface ValuePropositionProps {
  content: ValuePropositionContent;
}

export default function ValueProposition({ content }: ValuePropositionProps) {
  return (
    <section className="pt-32 pb-36 lg:pt-36 lg:pb-40 bg-[var(--color-gray-100)]" id="value-proposition">
      <Container>
        {/* Section Header */}
        <div className="text-center mb-20">
          <p className="text-base text-[var(--color-gray-600)] mb-6">
            {content.subtitle}
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-[45px] leading-tight lg:leading-[56px] font-semibold text-[var(--color-primary-black)] whitespace-pre-line">
            {content.title}
          </h2>
        </div>

        {/* Value Props Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[1280px] mx-auto">
          {content.items.map((item, index) => (
            <Card
              key={index}
              icon={item.icon}
              iconAlt={item.iconAlt}
              title={item.title}
              description={item.description}
              variant="feature"
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
