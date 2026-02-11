import React from 'react';
import Image from 'next/image';
import Container from './Container';
import { TestimonialsContent } from '../../../content/landing-page';

interface TestimonialsProps {
  content: TestimonialsContent;
}

export default function Testimonials({ content }: TestimonialsProps) {
  return (
    <section className="py-20 lg:py-32 bg-[var(--color-gray-100)]" id="testimonials">
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

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {content.testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="flex flex-col gap-5 p-8 bg-white border border-[var(--color-gray-200)] rounded-[14px]"
            >
              {/* Rating Stars */}
              <div className="flex gap-1">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg
                    key={i}
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10 2L12.5 7.5L18 8.5L14 13L15 18.5L10 15.5L5 18.5L6 13L2 8.5L7.5 7.5L10 2Z"
                      fill="#FFC107"
                    />
                  </svg>
                ))}
              </div>

              {/* Testimonial Content */}
              <p className="text-base leading-relaxed text-[var(--color-gray-900)] italic">
                "{testimonial.content}"
              </p>

              {/* Author Info */}
              <div className="flex items-center gap-4 mt-auto">
                <div className="w-12 h-12 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary-purple)] font-bold text-lg">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p className="text-base font-bold text-[var(--color-primary-black)] m-0">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-[var(--color-gray-600)] m-0">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
