import type { CSSProperties } from 'react'

/**
 * ConvexHire Design System - Social Media Brand Colors
 *
 * Exact brand colors for social media platforms.
 * Use these for social login buttons, share buttons, and portfolio links.
 *
 * Note: Always ensure sufficient contrast when placing social icons on backgrounds.
 * Use white backgrounds for colored social icons, or white icons on colored backgrounds.
 */

export interface SocialColorConfig {
  bg: string
  text: string
  hover: string
  icon: string
}

export const SOCIAL_COLORS = {
  linkedin: {
    bg: '#0A66C2',
    text: '#FFFFFF',
    hover: '#004182',
    icon: 'linkedin',
  },
  github: {
    bg: '#24292e',
    text: '#FFFFFF',
    hover: '#1b1f23',
    icon: 'github',
  },
  twitter: {
    bg: '#1DA1F2',
    text: '#FFFFFF',
    hover: '#0c85d0',
    icon: 'twitter',
  },
  x: {
    // Twitter rebrand
    bg: '#000000',
    text: '#FFFFFF',
    hover: '#333333',
    icon: 'x',
  },
  facebook: {
    bg: '#1877F2',
    text: '#FFFFFF',
    hover: '#0c5dc7',
    icon: 'facebook',
  },
  instagram: {
    // Gradient background - use as radial gradient
    bg: '#E4405F',
    text: '#FFFFFF',
    hover: '#c32a43',
    icon: 'instagram',
  },
  youtube: {
    bg: '#FF0000',
    text: '#FFFFFF',
    hover: '#cc0000',
    icon: 'youtube',
  },
  dribbble: {
    bg: '#EA4C89',
    text: '#FFFFFF',
    hover: '#c32f6b',
    icon: 'dribbble',
  },
  behance: {
    bg: '#1769FF',
    text: '#FFFFFF',
    hover: '#0050cc',
    icon: 'behance',
  },
  medium: {
    bg: '#00AB6C',
    text: '#FFFFFF',
    hover: '#008a57',
    icon: 'medium',
  },
  stackoverflow: {
    bg: '#F48024',
    text: '#FFFFFF',
    hover: '#d96a13',
    icon: 'stackoverflow',
  },
  discord: {
    bg: '#5865F2',
    text: '#FFFFFF',
    hover: '#4752c4',
    icon: 'discord',
  },
  slack: {
    bg: '#4A154B',
    text: '#FFFFFF',
    hover: '#360d36',
    icon: 'slack',
  },
  figma: {
    bg: '#F24E1E',
    text: '#FFFFFF',
    hover: '#c73d14',
    icon: 'figma',
  },
  notion: {
    bg: '#000000',
    text: '#FFFFFF',
    hover: '#333333',
    icon: 'notion',
  },
  email: {
    bg: '#64748B', // Slate-500
    text: '#FFFFFF',
    hover: '#475569',
    icon: 'mail',
  },
  website: {
    bg: '#3B82F6', // Blue-500
    text: '#FFFFFF',
    hover: '#2563EB',
    icon: 'globe',
  },
} as const

export type SocialPlatform = keyof typeof SOCIAL_COLORS

/**
 * Get social color config
 */
export function getSocialColor(platform: string): SocialColorConfig {
  const normalizedPlatform = platform.toLowerCase() as SocialPlatform
  return SOCIAL_COLORS[normalizedPlatform] ?? SOCIAL_COLORS.website
}

/**
 * Get Tailwind-compatible inline styles for social button
 */
export function getSocialButtonStyles(platform: string): CSSProperties {
  const colors = getSocialColor(platform)
  return {
    backgroundColor: colors.bg,
    color: colors.text,
  }
}

/**
 * Get Instagram gradient (special case)
 */
export function getInstagramGradient(): string {
  return 'linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4)'
}

/**
 * Check if a platform has a gradient background
 */
export function hasGradientBackground(platform: string): boolean {
  return platform.toLowerCase() === 'instagram'
}

export default SOCIAL_COLORS
