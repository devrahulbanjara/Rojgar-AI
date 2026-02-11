import React from 'react';
import Image from 'next/image';

interface CardProps {
  icon?: string;
  iconAlt?: string;
  title: string;
  description: string;
  variant?: 'feature' | 'benefit' | 'process';
  className?: string;
  stepNumber?: number;
}

export default function Card({
  icon,
  iconAlt = '',
  title,
  description,
  variant = 'feature',
  className = '',
  stepNumber,
}: CardProps) {
  return (
    <div 
      className={`flex flex-col p-9 bg-white border border-[var(--color-gray-200)] rounded-[14px] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:border-[var(--color-primary-light)] ${className}`}
      data-testid={`${variant}-card`}
    >
      {stepNumber && (
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-primary-purple)] text-white text-xl font-bold mb-7">
          {stepNumber}
        </div>
      )}
      
      {icon && (
        <div className="flex items-center justify-center w-12 h-12 p-3 bg-[var(--color-primary-light)] rounded-[6px] mb-7">
          <Image 
            src={icon} 
            alt={iconAlt} 
            width={24} 
            height={24}
            className="object-contain"
          />
        </div>
      )}
      
      <h3 className="text-xl font-bold text-[var(--color-primary-black)] mb-4">
        {title}
      </h3>
      
      <p className="text-base leading-6 text-[var(--color-gray-600)]">
        {description}
      </p>
    </div>
  );
}
