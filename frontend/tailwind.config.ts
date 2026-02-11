import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-manrope)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        manrope: ['var(--font-manrope)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.02em',
      },
      colors: {
        background: {
          DEFAULT: 'hsl(var(--background))',
          base: 'hsl(var(--background-base))',
          surface: 'hsl(var(--background-surface))',
          subtle: 'hsl(var(--background-subtle))',
          muted: 'hsl(var(--background-muted))',
          elevated: 'hsl(var(--background-elevated))',
        },
        foreground: 'hsl(var(--foreground))',
        text: {
          primary: 'hsl(var(--text-primary))',
          secondary: 'hsl(var(--text-secondary))',
          tertiary: 'hsl(var(--text-tertiary))',
          muted: 'hsl(var(--text-muted))',
          inverse: 'hsl(var(--text-inverse))',
        },
        border: {
          DEFAULT: 'hsl(var(--border))',
          subtle: 'hsl(var(--border-subtle))',
          default: 'hsl(var(--border-default))',
          strong: 'hsl(var(--border-strong))',
        },
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        brand: {
          DEFAULT: 'hsl(var(--brand))',
          dark: 'hsl(var(--brand-dark))',
          light: 'hsl(var(--brand-light))',
          foreground: 'hsl(var(--brand-foreground))',
        },
        primary: {
          '50': 'hsl(var(--primary-50))',
          '100': 'hsl(var(--primary-100))',
          '200': 'hsl(var(--primary-200))',
          '300': 'hsl(var(--primary-300))',
          '400': 'hsl(var(--primary-400))',
          '500': 'hsl(var(--primary-500))',
          '600': 'hsl(var(--primary-600))',
          '700': 'hsl(var(--primary-700))',
          '800': 'hsl(var(--primary-800))',
          '900': 'hsl(var(--primary-900))',
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          hover: 'hsl(var(--primary-hover))',
        },
        ai: {
          '50': 'hsl(var(--ai-50))',
          '100': 'hsl(var(--ai-100))',
          '200': 'hsl(var(--ai-200))',
          '300': 'hsl(var(--ai-300))',
          '400': 'hsl(var(--ai-400))',
          '500': 'hsl(var(--ai-500))',
          '600': 'hsl(var(--ai-600))',
          '700': 'hsl(var(--ai-700))',
          '800': 'hsl(var(--ai-800))',
          '900': 'hsl(var(--ai-900))',
          DEFAULT: 'hsl(var(--ai))',
          foreground: 'hsl(var(--ai-foreground))',
        },
        success: {
          '50': 'hsl(var(--success-50))',
          '100': 'hsl(var(--success-100))',
          '200': 'hsl(var(--success-200))',
          '300': 'hsl(var(--success-300))',
          '400': 'hsl(var(--success-400))',
          '500': 'hsl(var(--success-500))',
          '600': 'hsl(var(--success-600))',
          '700': 'hsl(var(--success-700))',
          '800': 'hsl(var(--success-800))',
          '900': 'hsl(var(--success-900))',
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          '50': 'hsl(var(--warning-50))',
          '100': 'hsl(var(--warning-100))',
          '200': 'hsl(var(--warning-200))',
          '300': 'hsl(var(--warning-300))',
          '400': 'hsl(var(--warning-400))',
          '500': 'hsl(var(--warning-500))',
          '600': 'hsl(var(--warning-600))',
          '700': 'hsl(var(--warning-700))',
          '800': 'hsl(var(--warning-800))',
          '900': 'hsl(var(--warning-900))',
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        error: {
          '50': 'hsl(var(--error-50))',
          '100': 'hsl(var(--error-100))',
          '200': 'hsl(var(--error-200))',
          '300': 'hsl(var(--error-300))',
          '400': 'hsl(var(--error-400))',
          '500': 'hsl(var(--error-500))',
          '600': 'hsl(var(--error-600))',
          '700': 'hsl(var(--error-700))',
          '800': 'hsl(var(--error-800))',
          '900': 'hsl(var(--error-900))',
          DEFAULT: 'hsl(var(--error))',
        },
        info: {
          '50': 'hsl(var(--info-50))',
          '100': 'hsl(var(--info-100))',
          '200': 'hsl(var(--info-200))',
          '300': 'hsl(var(--info-300))',
          '400': 'hsl(var(--info-400))',
          '500': 'hsl(var(--info-500))',
          '600': 'hsl(var(--info-600))',
          '700': 'hsl(var(--info-700))',
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
          hover: 'hsl(var(--card-hover))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          hover: 'hsl(var(--secondary-hover))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          hover: 'hsl(var(--accent-hover))',
        },
        social: {
          linkedin: '#0A66C2',
          github: '#24292e',
          twitter: '#1DA1F2',
          facebook: '#1877F2',
          youtube: '#FF0000',
          dribbble: '#EA4C89',
          behance: '#1769FF',
        },
        'color-primary-black': 'var(--color-primary-black)',
        'color-primary-purple': 'var(--color-primary-purple)',
        'color-primary-light': 'var(--color-primary-light)',
        'color-white': 'var(--color-white)',
        'color-gray-100': 'var(--color-gray-100)',
        'color-gray-200': 'var(--color-gray-200)',
        'color-gray-400': 'var(--color-gray-400)',
        'color-gray-600': 'var(--color-gray-600)',
        'color-gray-900': 'var(--color-gray-900)',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      backgroundImage: {
        'gradient-brand': 'var(--gradient-brand)',
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-primary-hover': 'var(--gradient-primary-hover)',
        'gradient-ai': 'var(--gradient-ai)',
        'gradient-ai-hover': 'var(--gradient-ai-hover)',
        'gradient-success': 'var(--gradient-success)',
        'gradient-subtle': 'var(--gradient-subtle)',
        'gradient-hero': 'var(--gradient-hero)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'var(--radius-xl)',
        '2xl': '5px',
        '3xl': '5px',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        primary: 'var(--shadow-primary)',
        ai: 'var(--shadow-ai)',
        success: 'var(--shadow-success)',
        'focus-primary': 'var(--focus-ring-primary)',
        'focus-ai': 'var(--focus-ring-ai)',
        'focus-success': 'var(--focus-ring-success)',
        'focus-error': 'var(--focus-ring-error)',
      },
      transitionDuration: {
        fast: 'var(--transition-fast)',
        base: 'var(--transition-base)',
        slow: 'var(--transition-slow)',
      },
      keyframes: {
        fadeIn: {
          '0%': {
            opacity: '0',
            transform: 'translateY(8px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(16px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideInRight: {
          '0%': {
            opacity: '0',
            transform: 'translateX(16px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        slideInLeft: {
          '0%': {
            opacity: '0',
            transform: 'translateX(-16px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        scaleIn: {
          '0%': {
            opacity: '0',
            transform: 'scale(0.96)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        scaleOut: {
          '0%': {
            opacity: '1',
            transform: 'scale(1)',
          },
          '100%': {
            opacity: '0',
            transform: 'scale(0.96)',
          },
        },
        bounceIn: {
          '0%': {
            opacity: '0',
            transform: 'scale(0.8)',
          },
          '50%': {
            opacity: '1',
            transform: 'scale(1.02)',
          },
          '70%': {
            transform: 'scale(0.98)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        slideDown: {
          '0%': {
            opacity: '0',
            transform: 'translateY(-16px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        fadeInDown: {
          '0%': {
            opacity: '0',
            transform: 'translateY(-20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        fadeInLeft: {
          '0%': {
            opacity: '0',
            transform: 'translateX(-20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        fadeInRight: {
          '0%': {
            opacity: '0',
            transform: 'translateX(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        zoomIn: {
          '0%': {
            opacity: '0',
            transform: 'scale(0.9)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        zoomOut: {
          '0%': {
            opacity: '1',
            transform: 'scale(1)',
          },
          '100%': {
            opacity: '0',
            transform: 'scale(0.9)',
          },
        },
        pulse: {
          '0%, 100%': {
            opacity: '1',
          },
          '50%': {
            opacity: '0.5',
          },
        },
        wiggle: {
          '0%, 100%': {
            transform: 'rotate(-3deg)',
          },
          '50%': {
            transform: 'rotate(3deg)',
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
        shimmer: {
          '0%': {
            backgroundPosition: '-200px 0',
          },
          '100%': {
            backgroundPosition: 'calc(200px + 100%) 0',
          },
        },
        gradient: {
          '0%, 100%': {
            backgroundPosition: '0% 50%',
          },
          '50%': {
            backgroundPosition: '100% 50%',
          },
        },
        typing: {
          '0%': {
            width: '0',
          },
          '100%': {
            width: '100%',
          },
        },
        blink: {
          '0%, 50%': {
            opacity: '1',
          },
          '51%, 100%': {
            opacity: '0',
          },
        },
        'ai-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 0 4px rgba(168, 85, 247, 0.15)',
          },
          '50%': {
            boxShadow: '0 0 0 8px rgba(168, 85, 247, 0.05)',
          },
        },
        'spin-slow': {
          '0%': {
            transform: 'rotate(0deg)',
          },
          '100%': {
            transform: 'rotate(360deg)',
          },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-up': 'slideUp 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-down': 'slideDown 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-right': 'slideInRight 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-left': 'slideInLeft 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scaleIn 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'scale-out': 'scaleOut 0.12s cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-in': 'bounceIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'fade-in-up': 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in-down': 'fadeInDown 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in-left': 'fadeInLeft 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in-right': 'fadeInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'zoom-in': 'zoomIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'zoom-out': 'zoomOut 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        wiggle: 'wiggle 1s ease-in-out infinite',
        float: 'float 4s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite',
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        gradient: 'gradient 4s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite',
        typing: 'typing 3.5s steps(40, end)',
        blink: 'blink 1s step-end infinite',
        'ai-pulse': 'ai-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin-slow 20s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
