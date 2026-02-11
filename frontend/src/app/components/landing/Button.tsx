import React from 'react';
import Link from 'next/link';

type ButtonVariant = 'primary' | 'secondary' | 'text';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  ariaLabel?: string;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'medium',
  href,
  onClick,
  className = '',
  type = 'button',
  disabled = false,
  ariaLabel,
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-purple)] disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: 'bg-[var(--color-primary-purple)] text-white border-none hover:bg-[#1d4ed8] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(37,99,235,0.15)] active:translate-y-0 active:shadow-[0_1px_3px_rgba(0,0,0,0.08)]',
    secondary: 'bg-white text-[var(--color-primary-purple)] border-2 border-[#1d4ed8] hover:bg-[var(--color-primary-purple)] hover:text-white hover:border-[var(--color-primary-purple)]',
    text: 'bg-transparent text-[var(--color-primary-purple)] border-none underline decoration-1 underline-offset-4 hover:text-[#1d4ed8] hover:decoration-2 p-0',
  };
  
  const sizeStyles = {
    small: 'px-5 py-2.5 text-sm rounded-[6px]',
    medium: 'px-7 py-3.5 text-base rounded-[6px]',
    large: 'px-10 py-[14px] text-lg rounded-[6px]',
  };
  
  const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${variant !== 'text' ? sizeStyles[size] : ''} ${className}`;
  
  if (href) {
    return (
      <Link 
        href={href} 
        className={combinedStyles}
        aria-label={ariaLabel}
      >
        {children}
      </Link>
    );
  }
  
  return (
    <button
      type={type}
      onClick={onClick}
      className={combinedStyles}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
