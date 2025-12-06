'use client';

import Link from 'next/link';

interface LogoProps {
  variant?: 'full' | 'icon' | 'monochrome-dark' | 'monochrome-white';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showWordmark?: boolean;
}

export function Logo({
  variant = 'full',
  size = 'md',
  className = '',
  showWordmark = true
}: LogoProps) {
  // Size configurations
  const sizes = {
    sm: {
      icon: 20,
      text: 'text-lg',
    },
    md: {
      icon: 28,
      text: 'text-xl',
    },
    lg: {
      icon: 32,
      text: 'text-2xl',
    },
  };

  const config = sizes[size];

  // Color configurations based on variant
  const getColors = () => {
    switch (variant) {
      case 'icon':
        return {
          icon: '#3056F5',
          convex: '#0F172A',
          hire: '#3056F5',
        };
      case 'monochrome-dark':
        return {
          icon: '#0F172A',
          convex: '#0F172A',
          hire: '#0F172A',
        };
      case 'monochrome-white':
        return {
          icon: '#FFFFFF',
          convex: '#FFFFFF',
          hire: '#FFFFFF',
        };
      default: // 'full'
        return {
          icon: '#3056F5',
          convex: '#0F172A',
          hire: '#3056F5',
        };
    }
  };

  const colors = getColors();

  // Neural Node Icon (Option B - Connected Neural Network)
  const NeuralIcon = () => (
    <svg
      width={config.icon}
      height={config.icon}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      {/* Connection Lines */}
      <line x1="16" y1="6" x2="8" y2="16" stroke={colors.icon} strokeWidth="1.5" opacity="0.6" />
      <line x1="16" y1="6" x2="24" y2="16" stroke={colors.icon} strokeWidth="1.5" opacity="0.6" />
      <line x1="8" y1="16" x2="16" y2="26" stroke={colors.icon} strokeWidth="1.5" opacity="0.6" />
      <line x1="24" y1="16" x2="16" y2="26" stroke={colors.icon} strokeWidth="1.5" opacity="0.6" />

      {/* Top Node */}
      <circle cx="16" cy="6" r="3" fill={colors.icon} opacity="0.2" />
      <circle cx="16" cy="6" r="3" stroke={colors.icon} strokeWidth="1.5" fill="none" />

      {/* Left Node */}
      <circle cx="8" cy="16" r="3" fill={colors.icon} opacity="0.2" />
      <circle cx="8" cy="16" r="3" stroke={colors.icon} strokeWidth="1.5" fill="none" />

      {/* Right Node */}
      <circle cx="24" cy="16" r="3" fill={colors.icon} opacity="0.2" />
      <circle cx="24" cy="16" r="3" stroke={colors.icon} strokeWidth="1.5" fill="none" />

      {/* Bottom Node */}
      <circle cx="16" cy="26" r="3" fill={colors.icon} opacity="0.2" />
      <circle cx="16" cy="26" r="3" stroke={colors.icon} strokeWidth="1.5" fill="none" />
    </svg>
  );

  if (!showWordmark) {
    return (
      <div className={className}>
        <NeuralIcon />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <NeuralIcon />
      <span className={`${config.text} font-bold tracking-tight`}>
        <span style={{ color: colors.convex }}>Convex</span>
        <span style={{ color: colors.hire }}>Hire</span>
      </span>
    </div>
  );
}

// Convenience component for linking logo to home
export function LogoLink({
  variant = 'full',
  size = 'md',
  className = '',
  showWordmark = true
}: LogoProps) {
  return (
    <Link href="/" className={`inline-flex ${className}`}>
      <Logo variant={variant} size={size} showWordmark={showWordmark} />
    </Link>
  );
}
