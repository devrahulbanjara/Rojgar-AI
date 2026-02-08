'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { Button } from '../ui/button'
import Link from 'next/link'
import {
  ArrowRight,
  Brain,
  Network,
  FileSearch,
  ShieldCheck,
  BriefcaseIcon,
  Users,
  Target,
  Search,
  FileText,
  CheckCircle,
  Zap,
  BarChart3,
  Handshake,
  Star,
  Calendar,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface FloatingIconConfig {
  Icon: LucideIcon
  position: { x: string; y: string }
  size: number
  opacity: number
  delay: number
  duration: number
  layer: 'background' | 'middle' | 'foreground'
  hideOnMobile?: boolean
  hideOnTablet?: boolean
}

const floatingIcons: FloatingIconConfig[] = [
  {
    Icon: BriefcaseIcon,
    position: { x: '8%', y: '15%' },
    size: 32,
    opacity: 0.15,
    delay: 0,
    duration: 12,
    layer: 'background',
  },
  {
    Icon: FileText,
    position: { x: '12%', y: '35%' },
    size: 28,
    opacity: 0.25,
    delay: 1.5,
    duration: 10,
    layer: 'middle',
  },
  {
    Icon: Search,
    position: { x: '6%', y: '55%' },
    size: 24,
    opacity: 0.2,
    delay: 0.8,
    duration: 14,
    layer: 'background',
    hideOnMobile: true,
  },
  {
    Icon: Target,
    position: { x: '15%', y: '72%' },
    size: 36,
    opacity: 0.18,
    delay: 2.2,
    duration: 11,
    layer: 'middle',
    hideOnTablet: true,
  },
  {
    Icon: Brain,
    position: { x: '10%', y: '88%' },
    size: 30,
    opacity: 0.22,
    delay: 3.5,
    duration: 9,
    layer: 'foreground',
    hideOnMobile: true,
  },

  {
    Icon: Handshake,
    position: { x: '88%', y: '12%' },
    size: 34,
    opacity: 0.16,
    delay: 0.5,
    duration: 13,
    layer: 'background',
  },
  {
    Icon: Star,
    position: { x: '92%', y: '30%' },
    size: 26,
    opacity: 0.28,
    delay: 1.8,
    duration: 9,
    layer: 'foreground',
    hideOnMobile: true,
  },
  {
    Icon: CheckCircle,
    position: { x: '85%', y: '48%' },
    size: 28,
    opacity: 0.2,
    delay: 2.8,
    duration: 11,
    layer: 'middle',
  },
  {
    Icon: BarChart3,
    position: { x: '90%', y: '65%' },
    size: 32,
    opacity: 0.18,
    delay: 0.3,
    duration: 12,
    layer: 'background',
    hideOnTablet: true,
  },
  {
    Icon: Zap,
    position: { x: '86%', y: '82%' },
    size: 24,
    opacity: 0.24,
    delay: 4,
    duration: 10,
    layer: 'foreground',
    hideOnMobile: true,
  },
  {
    Icon: Calendar,
    position: { x: '82%', y: '92%' },
    size: 28,
    opacity: 0.14,
    delay: 1.2,
    duration: 14,
    layer: 'background',
    hideOnMobile: true,
  },
  {
    Icon: Users,
    position: { x: '94%', y: '78%' },
    size: 30,
    opacity: 0.2,
    delay: 2.5,
    duration: 11,
    layer: 'middle',
    hideOnTablet: true,
  },
]

const layerConfig = {
  background: { moveRange: 25, rotateRange: 3 },
  middle: { moveRange: 35, rotateRange: 4 },
  foreground: { moveRange: 45, rotateRange: 5 },
}

export function HeroSection() {
  const { scrollY } = useScroll()
  const yRange = useTransform(scrollY, [0, 500], [0, 100])
  const opacityRange = useTransform(scrollY, [0, 400], [1, 0])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      { }
      <div className="absolute inset-0 bg-gradient-to-b from-background-subtle via-background-surface to-primary-50 dark:to-primary-950/30" />

      { }
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232563EB' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      { }
      <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
        {floatingIcons.map((config, index) => {
          const {
            Icon,
            position,
            size,
            opacity,
            delay,
            duration,
            layer,
            hideOnMobile,
            hideOnTablet,
          } = config
          const { moveRange, rotateRange } = layerConfig[layer]

          let visibilityClass = ''
          if (hideOnMobile && hideOnTablet) {
            visibilityClass = 'hidden lg:block'
          } else if (hideOnMobile) {
            visibilityClass = 'hidden md:block'
          } else if (hideOnTablet) {
            visibilityClass = 'hidden lg:block'
          }

          return (
            <motion.div
              key={index}
              className={`absolute ${visibilityClass}`}
              style={{
                left: position.x,
                top: position.y,
                willChange: 'transform',
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity,
                scale: 1,
              }}
              transition={{
                delay: delay * 0.3 + 0.5,
                duration: 0.8,
                ease: 'easeOut',
              }}
            >
              <motion.div
                animate={{
                  y: [0, -moveRange * 0.5, -moveRange, -moveRange * 0.5, 0],
                  x: [0, moveRange * 0.3, 0, -moveRange * 0.3, 0],
                  rotate: [0, rotateRange, 0, -rotateRange, 0],
                }}
                transition={{
                  duration,
                  delay,
                  repeat: Infinity,
                  ease: [0.4, 0.0, 0.6, 1],
                }}
                className="motion-reduce:animate-none"
              >
                <Icon
                  className={`text-primary dark:text-primary-400 ${layer === 'foreground' ? 'drop-shadow-sm' : ''}`}
                  style={{
                    width: size,
                    height: size,
                  }}
                  strokeWidth={1.5}
                />
              </motion.div>
            </motion.div>
          )
        })}
      </div>

      { }
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/15 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: '1s' }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />

      <div className="relative w-full max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-32">
        {/* Left-aligned content for asymmetry */}
        <div className="text-left max-w-4xl lg:ml-[8%]">
          {/* Headline - no badge, straight to the point */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-text-primary leading-[1.05] tracking-tightest mb-8"
          >
            <span className="relative">
              <span className="bg-gradient-to-r from-primary via-primary to-primary-600 bg-clip-text text-transparent">
                Hire people,
              </span>
              {/* Hand-drawn style underline */}
              <svg className="absolute -bottom-2 left-0 w-full h-3 opacity-40" viewBox="0 0 200 12" preserveAspectRatio="none">
                <path d="M2 8 Q50 2, 100 7 T198 5" stroke="currentColor" strokeWidth="3" fill="none" className="text-primary" />
              </svg>
            </span>
            <br />
            not keywords.
          </motion.h1>

          {/* Specific, opinionated subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-lg sm:text-xl lg:text-2xl text-text-secondary mb-12 max-w-xl leading-relaxed font-sans"
          >
            Your ATS is rejecting qualified engineers over typos. We built something that{' '}
            <em className="text-text-primary font-medium not-italic">actually reads</em> resumes.
          </motion.p>

          {/* Left-aligned CTA with specific text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex justify-start mb-16"
          >
            <Link href="/signup">
              <Button
                size="lg"
                className="btn-primary-gradient text-base font-semibold rounded-xl px-10 py-6 h-auto transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
              >
                Show me how it works
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>

          {/* Trust indicators - asymmetric layout with varied spacing */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="flex flex-wrap items-center gap-x-6 gap-y-4 mt-12 pt-8 border-t border-border-subtle"
          >
            {[
              {
                icon: Network,
                label: 'Multi-Agent AI',
                aside: '(yes, actually)',
                iconColor: 'text-primary',
                bgGradient: 'from-primary-100 to-primary-50',
              },
              {
                icon: FileSearch,
                label: 'Semantic Resume Analysis',
                aside: '',
                iconColor: 'text-primary',
                bgGradient: 'from-primary-100 to-primary-50',
              },
              {
                icon: ShieldCheck,
                label: 'Explainable Decisions',
                aside: '',
                iconColor: 'text-success',
                bgGradient: 'from-success-100 to-success-50',
              },
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 + index * 0.15 }}
                  className="relative flex items-center gap-3 px-4 py-2 rounded-lg bg-gradient-to-br from-background-subtle/50 dark:from-background-surface/50 to-transparent"
                  style={{ transform: index === 1 ? 'translateY(-4px)' : 'none' }}
                >
                  <div
                    className={`relative w-8 h-8 rounded-lg bg-gradient-to-br ${item.bgGradient} flex items-center justify-center`}
                    style={{ borderRadius: index === 0 ? '10px' : index === 1 ? '8px' : '12px' }}
                  >
                    <Icon className={`w-4 h-4 ${item.iconColor} relative z-10`} />
                  </div>
                  <span className="text-sm font-medium text-text-secondary tracking-wide">
                    {item.label}
                    {item.aside && (
                      <span className="ml-1 text-xs text-text-tertiary italic">{item.aside}</span>
                    )}
                  </span>
                </motion.div>
              )
            })}
          </motion.div>
        </div>

        {/* Dashboard Preview removed as per user request */}
      </div>
    </section>
  )
}
