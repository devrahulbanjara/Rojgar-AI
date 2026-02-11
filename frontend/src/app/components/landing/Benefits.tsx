import React from 'react';
import Container from './Container';
import Card from './Card';
import { BenefitsContent } from '../../../content/landing-page';

interface BenefitsProps {
  content: BenefitsContent;
}

export default function Benefits({ content }: BenefitsProps) {
  return (
    <section className="py-20 lg:py-32 bg-white" id="benefits">
      <Container>
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-[45px] leading-tight lg:leading-[56px] font-semibold text-[var(--color-primary-black)]">
            {content.title}
          </h2>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Recruiter Benefits */}
          <div>
            <h3 className="text-2xl font-bold text-[var(--color-primary-black)] mb-8">
              {content.recruiterBenefits.subtitle}
            </h3>
            <div className="flex flex-col gap-6">
              {content.recruiterBenefits.items.map((item, index) => (
                <Card
                  key={index}
                  icon={item.icon}
                  iconAlt={item.iconAlt}
                  title={item.title}
                  description={item.description}
                  variant="benefit"
                />
              ))}
            </div>
          </div>

          {/* Candidate Benefits */}
          <div>
            <h3 className="text-2xl font-bold text-[var(--color-primary-black)] mb-8">
              {content.candidateBenefits.subtitle}
            </h3>
            <div className="flex flex-col gap-6">
              {content.candidateBenefits.items.map((item, index) => (
                <Card
                  key={index}
                  icon={item.icon}
                  iconAlt={item.iconAlt}
                  title={item.title}
                  description={item.description}
                  variant="benefit"
                />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
