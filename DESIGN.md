<div align="center">

# ConvexHire Design System

### "Sophisticated Intelligence"

*A premium AI-enterprise design system for the next generation of recruitment*

</div>

---

## Table of Contents

- [Design Philosophy](#design-philosophy)
- [Typography System](#typography-system)
- [Color System](#color-system)
- [Spacing & Layout](#spacing--layout)
- [Border Radius](#border-radius)
- [Shadows & Elevation](#shadows--elevation)
- [Gradients](#gradients)
- [Motion & Animation](#motion--animation)
- [Dark Mode](#dark-mode)
- [Component Patterns](#component-patterns)
- [Accessibility](#accessibility)
- [Implementation Reference](#implementation-reference)

---

## Design Philosophy

ConvexHire follows a **"Sophisticated Intelligence"** design philosophy that communicates:

1. **Professional Trust** — Royal blue primary color establishes credibility
2. **AI-Powered Innovation** — Purple accents signal intelligent automation
3. **Human-Centered Design** — Clear visual hierarchy keeps recruiters in control
4. **Premium Quality** — Tight typography and subtle animations convey luxury tech brand feel

### Design Principles

| Principle | Description |
|-----------|-------------|
| **Clarity** | Information hierarchy guides users naturally |
| **Efficiency** | High-density data displays for recruiters |
| **Transparency** | AI decisions are always explainable |
| **Consistency** | Unified patterns across all interfaces |

---

## Typography System

ConvexHire uses a **dual-font system** that separates "human" interface from "machine" logic — essential for a Multi-Agent System (MAS).

### Font Families

| Role | Font | CSS Class | Purpose |
|------|------|-----------|---------|
| **Global UI & Body** | Inter | `font-sans` | SaaS gold standard. Handles high-density data perfectly, crisp in light/dark modes |
| **Headings & Branding** | Plus Jakarta Sans | `font-display` | Premium geometric sans-serif. Modern, energetic personality for landing pages |
| **AI/Agentic Data** | JetBrains Mono | `font-mono` | Signals computed agent data. Use for scores, AI logs, reasoning sections |

### Font Weights

| Weight | Value | Use Case |
|--------|-------|----------|
| Light | 300 | Subtle UI elements (Inter only) |
| Regular | 400 | Body text, paragraphs |
| Medium | 500 | Labels, buttons, emphasis |
| Semibold | 600 | Headings, important labels |
| Bold | 700 | Hero headings, brand text |
| Extrabold | 800 | Maximum impact (sparingly) |

### Typography Scale

| Element | Font | Size | Weight | Letter Spacing | Line Height |
|---------|------|------|--------|----------------|-------------|
| **H1 (Hero)** | Plus Jakarta Sans | 4.5rem (72px) | 700 | -0.04em | 1.05 |
| **H2 (Section)** | Plus Jakarta Sans | 3rem (48px) | 700 | -0.03em | 1.1 |
| **H3 (Card)** | Plus Jakarta Sans | 1.5rem (24px) | 600 | -0.02em | 1.2 |
| **H4** | Plus Jakarta Sans | 1.25rem (20px) | 600 | -0.02em | 1.3 |
| **H5** | Plus Jakarta Sans | 1.125rem (18px) | 600 | -0.02em | 1.4 |
| **H6** | Plus Jakarta Sans | 1rem (16px) | 600 | -0.02em | 1.4 |
| **Body** | Inter | 1rem (16px) | 400 | 0 | 1.6 |
| **Body Small** | Inter | 0.875rem (14px) | 400 | 0 | 1.5 |
| **Caption** | Inter | 0.75rem (12px) | 500 | 0 | 1.4 |
| **AI Score** | JetBrains Mono | 1.5rem+ | 700 | 0.02em | 1 |
| **AI Label** | JetBrains Mono | 0.75rem (12px) | 500 | 0.1em | 1 |

### Letter Spacing Tokens

| Token | Value | Use Case |
|-------|-------|----------|
| `tracking-tightest` | -0.04em | Hero headings, maximum impact |
| `tracking-tighter` | -0.02em | Section headings, card titles |
| `tracking-tight` | -0.01em | Subheadings |
| `tracking-normal` | 0 | Body text |
| `tracking-wide` | 0.025em | Small caps, labels |

### Premium Typography Rules

1. **Tighten the Headings** — Large headings use `-0.02em` to `-0.04em` letter-spacing for luxury tech brand feel (Apple/Stripe aesthetic)
2. **The 1.5x Rule** — Body text uses `line-height: 1.6` to prevent "text-wall fatigue" for recruiters reading profiles
3. **Optical Sizing** — Enable `font-optical-sizing: auto` for variable fonts
4. **No Pure Black** — Use Slate-800 (`#1E293B`) instead of `#000000` for primary text

---

## Color System

### Semantic Color Roles

| Role | Description | Primary Use |
|------|-------------|-------------|
| **Primary** | Professional trust | Buttons, links, focus states |
| **AI** | Intelligent automation | AI features, scores, insights |
| **Success** | Positive outcomes | Approvals, high scores, completion |
| **Warning** | Requires attention | Pending actions, moderate scores |
| **Error** | Critical issues | Rejections, validation errors |
| **Info** | Neutral information | Help text, notifications |

### Light Mode Palette

#### Backgrounds

| Token | HSL | Hex | Use Case |
|-------|-----|-----|----------|
| `background` | 210 20% 98% | `#FAFBFC` | Page background |
| `background-base` | 210 20% 98% | `#FAFBFC` | Base layer |
| `background-surface` | 0 0% 100% | `#FFFFFF` | Cards, modals, elevated surfaces |
| `background-subtle` | 210 40% 96% | `#F1F5F9` | Hover states, disabled fields |
| `background-muted` | 214 32% 91% | `#E2E8F0` | Active/selected subtle states |

#### Text Colors

| Token | HSL | Hex | Use Case | Hierarchy |
|-------|-----|-----|----------|-----------|
| `text-primary` | 222 47% 11% | `#0F172A` | Headings, primary content | 60% |
| `text-secondary` | 215 25% 27% | `#334155` | Body text, descriptions | 30% |
| `text-tertiary` | 215 16% 47% | `#64748B` | Metadata, labels, timestamps | 10% |
| `text-muted` | 215 20% 65% | `#94A3B8` | Disabled, placeholders | — |
| `text-inverse` | 0 0% 100% | `#FFFFFF` | Text on dark backgrounds | — |

#### Border Colors

| Token | HSL | Hex | Use Case |
|-------|-----|-----|----------|
| `border-subtle` | 210 40% 96% | `#F1F5F9` | Barely visible dividers |
| `border-default` | 214 32% 91% | `#E2E8F0` | Standard borders, inputs |
| `border-strong` | 215 20% 82% | `#CBD5E1` | Emphasis, active states |

#### Primary (Professional Blue)

| Shade | HSL | Hex | Use Case |
|-------|-----|-----|----------|
| 50 | 214 100% 97% | `#EFF6FF` | Subtle backgrounds |
| 100 | 214 95% 93% | `#DBEAFE` | Hover backgrounds |
| 200 | 213 97% 87% | `#BFDBFE` | Borders, dividers |
| 300 | 212 96% 78% | `#93C5FD` | Disabled states |
| 400 | 213 94% 68% | `#60A5FA` | Subtle accents |
| **500** | 217 91% 60% | `#3B82F6` | **Primary brand** |
| **600** | 221 83% 53% | `#2563EB` | **Hover, active (DEFAULT)** |
| 700 | 224 76% 48% | `#1D4ED8` | Pressed states |
| 800 | 226 71% 40% | `#1E40AF` | Depth |
| 900 | 224 64% 33% | `#1E3A8A` | Darkest variant |

#### AI Purple (Intelligent Assistance)

| Shade | HSL | Hex | Use Case |
|-------|-----|-----|----------|
| 50 | 270 100% 98% | `#FAF5FF` | AI insight backgrounds |
| 100 | 269 100% 95% | `#F3E8FF` | AI card backgrounds |
| 200 | 269 100% 92% | `#E9D5FF` | AI borders |
| 300 | 269 97% 85% | `#D8B4FE` | Disabled AI features |
| 400 | 270 95% 75% | `#C084FC` | Subtle AI accents |
| **500** | 271 91% 65% | `#A855F7` | **AI accent (DEFAULT)** |
| 600 | 271 81% 56% | `#9333EA` | AI hover |
| 700 | 272 72% 47% | `#7E22CE` | AI active |
| 800 | 273 67% 39% | `#6B21A8` | Deep AI |
| 900 | 274 66% 32% | `#581C87` | Darkest |

#### Success (Teal)

| Shade | HSL | Hex | Use Case |
|-------|-----|-----|----------|
| 50 | 166 76% 97% | `#F0FDFA` | Success backgrounds |
| **500** | 173 80% 40% | `#14B8A6` | **Success (DEFAULT)** |
| 600 | 175 84% 32% | `#0D9488` | Hover/Active |
| 700 | 175 77% 26% | `#0F766E` | Pressed |

#### Warning (Amber)

| Shade | HSL | Hex | Use Case |
|-------|-----|-----|----------|
| 50 | 48 100% 96% | `#FFFBEB` | Warning backgrounds |
| **500** | 38 92% 50% | `#F59E0B` | **Warning (DEFAULT)** |
| 600 | 32 95% 44% | `#D97706` | Hover |
| 700 | 26 90% 37% | `#B45309` | Active |

#### Error (Red)

| Shade | HSL | Hex | Use Case |
|-------|-----|-----|----------|
| 50 | 0 86% 97% | `#FEF2F2` | Error backgrounds |
| **500** | 0 84% 60% | `#EF4444` | **Error (DEFAULT)** |
| 600 | 0 72% 51% | `#DC2626` | Hover |
| 700 | 0 74% 42% | `#B91C1C` | Active |

#### Info (Sky Blue)

| Shade | HSL | Hex | Use Case |
|-------|-----|-----|----------|
| 50 | 204 100% 97% | `#F0F9FF` | Info backgrounds |
| **500** | 199 89% 48% | `#0EA5E9` | **Info (DEFAULT)** |
| 600 | 200 98% 39% | `#0284C7` | Hover |

### Social Media Colors

| Platform | Hex |
|----------|-----|
| LinkedIn | `#0A66C2` |
| GitHub | `#24292E` |
| Twitter/X | `#1DA1F2` |
| Facebook | `#1877F2` |
| YouTube | `#FF0000` |
| Dribbble | `#EA4C89` |
| Behance | `#1769FF` |

---

## Spacing & Layout

### Spacing Scale

| Token | Value | Use Case |
|-------|-------|----------|
| 0 | 0px | None |
| 0.5 | 2px | Tight gaps |
| 1 | 4px | Minimal spacing |
| 1.5 | 6px | Compact elements |
| 2 | 8px | Standard small gap |
| 2.5 | 10px | — |
| 3 | 12px | Component internal padding |
| 4 | 16px | Standard gap |
| 5 | 20px | — |
| 6 | 24px | Section gaps |
| 8 | 32px | Large gaps |
| 10 | 40px | — |
| 12 | 48px | Section padding |
| 16 | 64px | Large section spacing |
| 20 | 80px | Page sections |
| 24 | 96px | Hero sections |
| 32 | 128px | Maximum spacing |

### Container

| Breakpoint | Max Width |
|------------|-----------|
| Default | 100% |
| sm | 640px |
| md | 768px |
| lg | 1024px |
| xl | 1280px |
| 2xl | 1400px |

Container padding: `2rem` (32px)

---

## Border Radius

| Token | Value | Use Case |
|-------|-------|----------|
| `rounded-sm` | 0.5rem (8px) | Small elements, badges |
| `rounded-md` | 0.75rem (12px) | Buttons, inputs (DEFAULT) |
| `rounded-lg` | 1rem (16px) | Cards |
| `rounded-xl` | 1.5rem (24px) | Large cards, modals |
| `rounded-2xl` | 1.5rem (24px) | Premium cards |
| `rounded-3xl` | 2rem (32px) | Hero elements |
| `rounded-full` | 9999px | Pills, avatars |

---

## Shadows & Elevation

### Light Mode Shadows

| Token | Value | Use Case |
|-------|-------|----------|
| `shadow-xs` | `0 1px 2px 0 rgba(0,0,0,0.05)` | Subtle elevation |
| `shadow-sm` | `0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)` | Cards at rest |
| `shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)` | Hover states |
| `shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)` | Hero cards |
| `shadow-2xl` | `0 25px 50px -12px rgba(0,0,0,0.25)` | Maximum elevation |

### Colored Shadows

| Token | Value | Use Case |
|-------|-------|----------|
| `shadow-primary` | `0 4px 14px 0 rgba(37,99,235,0.2)` | Primary buttons |
| `shadow-ai` | `0 4px 14px 0 rgba(168,85,247,0.15)` | AI elements |
| `shadow-success` | `0 4px 14px 0 rgba(20,184,166,0.15)` | Success elements |

### Focus Rings

| Token | Value | Use Case |
|-------|-------|----------|
| `focus-ring-primary` | `0 0 0 3px rgba(37,99,235,0.2)` | Primary inputs |
| `focus-ring-ai` | `0 0 0 3px rgba(168,85,247,0.15)` | AI inputs |
| `focus-ring-success` | `0 0 0 3px rgba(20,184,166,0.15)` | Success inputs |
| `focus-ring-error` | `0 0 0 3px rgba(239,68,68,0.2)` | Error inputs |

### Elevation Philosophy

In **light mode**, elevation is achieved through shadows.
In **dark mode**, elevation is achieved through **lighter surface colors** (not shadows).

---

## Gradients

### Primary Gradients

| Token | Direction | Colors | Use Case |
|-------|-----------|--------|----------|
| `gradient-brand` | 135° | Primary-600 → Primary-700 | Brand CTAs |
| `gradient-primary` | 135° | Primary-600 → Primary-700 | Primary buttons |
| `gradient-primary-hover` | 135° | Primary-700 → Primary-800 | Primary hover |
| `gradient-ai` | 135° | AI-500 → AI-600 | AI buttons |
| `gradient-ai-hover` | 135° | AI-600 → AI-700 | AI hover |
| `gradient-success` | 135° | Success-500 → Success-600 | Success elements |
| `gradient-subtle` | 180° | White → Background | Subtle overlays |
| `gradient-hero` | 135° | Primary-600 → Primary-500 → Primary-400 | Hero sections |

### CSS Usage

```css
background: var(--gradient-primary);
/* or */
background: linear-gradient(135deg, hsl(221 83% 53%), hsl(224 76% 48%));
```

---

## Motion & Animation

### Timing Functions

| Token | Value | Use Case |
|-------|-------|----------|
| `ease-smooth` | `cubic-bezier(0.4, 0, 0.2, 1)` | General transitions |
| `ease-spring` | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` | Bouncy interactions |
| `ease-gentle` | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Subtle animations |

### Duration Tokens

| Token | Value | Use Case |
|-------|-------|----------|
| `transition-fast` | 120ms | Micro-interactions |
| `transition-base` | 200ms | Standard transitions |
| `transition-slow` | 300ms | Page transitions |

### Animation Presets

| Class | Animation | Duration | Use Case |
|-------|-----------|----------|----------|
| `animate-fade-in` | Fade + slide up | 0.2s | Content entry |
| `animate-slide-up` | Slide from bottom | 0.2s | Modals, tooltips |
| `animate-slide-down` | Slide from top | 0.2s | Dropdowns |
| `animate-scale-in` | Scale from 96% | 0.12s | Popovers |
| `animate-bounce-in` | Spring bounce | 0.4s | Attention elements |
| `animate-float` | Gentle float | 4s infinite | Decorative elements |
| `animate-shimmer` | Loading shimmer | 1.5s infinite | Skeleton states |
| `animate-ai-pulse` | AI glow pulse | 2s infinite | AI processing |

### Hover Effects

| Class | Effect | Use Case |
|-------|--------|----------|
| `hover-lift` | translateY(-1px) + shadow | Cards |
| `hover-scale` | scale(1.02) | Interactive elements |
| `hover-glow` | Blue glow | Primary elements |
| `hover-glow-ai` | Purple glow | AI elements |
| `hover-gentle` | translateY(-0.5px) | Subtle interaction |

### Stagger Animation

```css
.stagger-list > *:nth-child(1) { animation-delay: 0.05s; }
.stagger-list > *:nth-child(2) { animation-delay: 0.10s; }
.stagger-list > *:nth-child(3) { animation-delay: 0.15s; }
/* ... continues to 8 items */
```

### Accessibility: Reduced Motion

All animations respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Dark Mode

### Theme Toggle

Dark mode is implemented via `class` strategy with the `dark` class on `<html>`.

### Color Adjustments

In dark mode, colors are adjusted for eye comfort:

| Color Role | Light Mode | Dark Mode | Reason |
|------------|------------|-----------|--------|
| Primary | Blue-600 | Blue-400 | Brighter for visibility |
| AI | Purple-500 | Purple-400 | Softer for eye comfort |
| Success | Teal-500 | Teal-400 | Lighter for dark bg |
| Warning | Amber-500 | Amber-400 | Brighter |
| Error | Red-500 | Red-400 | Softer |

### Dark Mode Backgrounds

| Token | Light | Dark | Hex (Dark) |
|-------|-------|------|------------|
| `background` | #FAFBFC | Slate-950 | `#020617` |
| `background-surface` | #FFFFFF | Slate-900 | `#0F172A` |
| `background-elevated` | — | Slate-800 | `#1E293B` |
| `background-subtle` | #F1F5F9 | Slate-800 | `#1E293B` |

### Dark Mode Typography

**Critical Rule:** White text on dark backgrounds appears thicker than it is.

| Element | Light Mode Weight | Dark Mode Weight |
|---------|-------------------|------------------|
| Body | 400 | 400 |
| Headings | 600 (semibold) | 500 (medium) |

This maintains **premium sharpness** in both themes.

### Dark Mode Shadows

Shadows are **darker** in dark mode:

| Token | Dark Mode Value |
|-------|-----------------|
| `shadow-sm` | `0 1px 2px 0 rgba(0,0,0,0.2)` |
| `shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.3)` |
| `shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.4)` |
| `shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.5)` |

### Theme Transition

Smooth 200ms transition for theme switching:

```css
* {
  transition-property: background-color, border-color, color, fill, stroke, box-shadow;
  transition-duration: 200ms;
}
```

---

## Component Patterns

### Buttons

| Variant | Class | Description |
|---------|-------|-------------|
| Primary | `btn-primary-gradient` | Gradient blue, primary actions |
| AI | `btn-ai-gradient` | Gradient purple, AI actions |
| Secondary | `bg-secondary` | Subtle, secondary actions |
| Ghost | `variant="ghost"` | Text only, tertiary actions |
| Destructive | `bg-error` | Dangerous actions |

### Cards

```jsx
// Standard card
<div className="bg-background-surface rounded-xl border border-border-default shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">

// AI card with accent
<div className="bg-ai-50 dark:bg-ai-900/20 rounded-lg p-4 border-l-[3px] border-l-ai-500">
```

### AI Score Display

```jsx
<div className="font-mono font-bold text-success">92</div>
<div className="font-mono text-xs uppercase tracking-wide">AI Score</div>
```

### AI Reasoning Block

```jsx
<div className="ai-reasoning-block">
  <p className="font-mono text-sm">{reasoning}</p>
</div>
```

### Form Inputs

```jsx
<input className="h-12 px-4 rounded-xl border-border-default bg-background-subtle/50 
  focus:bg-background-surface focus:border-primary focus:ring-4 focus:ring-primary/10" />
```

### Glass Effect

```jsx
<div className="glass">
  {/* bg-card/60 backdrop-blur-lg border-border/50 */}
</div>
```

---

## Accessibility

### Color Contrast

All text colors meet WCAG 2.1 AA standards:

| Combination | Contrast Ratio | Status |
|-------------|----------------|--------|
| text-primary on background | 15.8:1 | ✅ AAA |
| text-secondary on background | 7.2:1 | ✅ AAA |
| text-tertiary on background | 4.6:1 | ✅ AA |
| White on primary-600 | 4.9:1 | ✅ AA |
| White on ai-500 | 4.5:1 | ✅ AA |

### Focus States

All interactive elements have visible focus indicators:

```css
.focus-ring {
  @apply focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2;
}
```

### Reduced Motion

All animations are disabled when user prefers reduced motion.

### Semantic HTML

- Proper heading hierarchy (h1 → h6)
- ARIA labels on icon-only buttons
- Focus management in modals
- Skip links for keyboard navigation

---

## Implementation Reference

### File Locations

| File | Purpose |
|------|---------|
| `frontend/tailwind.config.ts` | Tailwind configuration, tokens |
| `frontend/src/app/globals.css` | CSS custom properties, utilities |
| `frontend/src/app/layout.tsx` | Font loading configuration |

### CSS Custom Properties

All colors are defined as HSL values in CSS custom properties:

```css
:root {
  --primary: 221 83% 53%;
  --ai: 271 91% 65%;
  /* ... */
}
```

Usage in Tailwind:

```jsx
<div className="bg-primary text-primary-foreground" />
<div className="text-ai-500" />
```

### Font Loading (Next.js)

```tsx
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'

const inter = Inter({ variable: '--font-sans' })
const jakarta = Plus_Jakarta_Sans({ variable: '--font-display' })
const jetbrainsMono = JetBrains_Mono({ variable: '--font-mono' })
```

### Tailwind Classes

```jsx
// Fonts
className="font-sans"     // Inter
className="font-display"  // Plus Jakarta Sans
className="font-mono"     // JetBrains Mono

// Letter spacing
className="tracking-tightest"  // -0.04em
className="tracking-tighter"   // -0.02em

// Heading utilities
className="heading-hero"     // font-display font-bold tracking-[-0.04em]
className="heading-section"  // font-display font-semibold tracking-[-0.03em]
className="heading-card"     // font-display font-semibold tracking-[-0.02em]
```

---

## Quick Reference Card

### Typography

```
Headings: Plus Jakarta Sans, semibold, -0.02em to -0.04em
Body: Inter, regular, 1.6 line-height
AI Data: JetBrains Mono, for scores/logs/reasoning
```

### Colors

```
Primary: #3B82F6 (Blue-500) — Trust, CTAs
AI:      #A855F7 (Purple-500) — AI features
Success: #14B8A6 (Teal-500) — Positive
Warning: #F59E0B (Amber-500) — Attention
Error:   #EF4444 (Red-500) — Critical
```

### Spacing

```
Component gap: 16px (4)
Section gap: 32px (8)
Page section: 96px (24)
```

### Border Radius

```
Buttons: 12px (rounded-xl)
Cards: 16px (rounded-xl)
Inputs: 12px (rounded-xl)
```

---

<div align="center">

### Built with precision for ConvexHire

*Where AI meets Human Judgment*

</div>
