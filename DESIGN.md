---
version: alpha
name: Rojgar AI
description: Calm, plain-spoken hiring tool for Nepali businesses. Indigo brand on cool neutrals; an AI gradient only when AI is working.
colors:
  primary: "#4338CA"
  primary-hover: "#3730A3"
  primary-tint: "#EEF0FE"
  on-primary: "#FFFFFF"
  background: "#F6F7FB"
  surface: "#FFFFFF"
  ink: "#141A2E"
  muted: "#5B6275"
  border: "#E4E7EF"
  input: "#DFE3EC"
  ring: "#A5B4FC"
  ai-1: "#4F46E5"
  ai-2: "#3B82F6"
  ai-3: "#22D3EE"
  ai-4: "#2DD4BF"
  success: "#157347"
  success-bg: "#E7F6EE"
  warning: "#A15C07"
  warning-bg: "#FDF3E1"
  danger: "#B42318"
  danger-bg: "#FDECEC"
  neutral: "#4A5163"
  neutral-bg: "#EEF0F6"
typography:
  display:
    fontFamily: Manrope
    fontSize: 3.5rem
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: -0.02em
  h1:
    fontFamily: Manrope
    fontSize: 2rem
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.01em
  h2:
    fontFamily: Manrope
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.3
  h3:
    fontFamily: Manrope
    fontSize: 1rem
    fontWeight: 600
    lineHeight: 1.4
  numeral:
    fontFamily: Manrope
    fontSize: 1.75rem
    fontWeight: 500
    lineHeight: 1
  body:
    fontFamily: DM Sans
    fontSize: 0.9375rem
    fontWeight: 400
    lineHeight: 1.55
  small:
    fontFamily: DM Sans
    fontSize: 0.8125rem
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: DM Sans
    fontSize: 0.8125rem
    fontWeight: 500
    lineHeight: 1.3
  eyebrow:
    fontFamily: DM Sans
    fontSize: 0.6875rem
    fontWeight: 600
    letterSpacing: 0.06em
rounded:
  sm: 8px
  md: 10px
  lg: 12px
  xl: 16px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    padding: 10px 18px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"
  pill:
    rounded: "{rounded.full}"
    padding: 2px 10px
    typography: "{typography.label}"
  input:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    height: 40px
  text-secondary:
    textColor: "{colors.muted}"
  divider:
    backgroundColor: "{colors.border}"
    height: 1px
  input-border:
    backgroundColor: "{colors.input}"
    height: 1px
  focus-ring:
    backgroundColor: "{colors.ring}"
    width: 3px
  page:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink}"
  pill-success:
    backgroundColor: "{colors.success-bg}"
    textColor: "{colors.success}"
  pill-warning:
    backgroundColor: "{colors.warning-bg}"
    textColor: "{colors.warning}"
  pill-danger:
    backgroundColor: "{colors.danger-bg}"
    textColor: "{colors.danger}"
  pill-neutral:
    backgroundColor: "{colors.neutral-bg}"
    textColor: "{colors.neutral}"
  ai-stop-1:
    backgroundColor: "{colors.ai-1}"
    textColor: "{colors.on-primary}"
  ai-stop-2:
    backgroundColor: "{colors.ai-2}"
    textColor: "{colors.ink}"
  ai-stop-3:
    backgroundColor: "{colors.ai-3}"
    textColor: "{colors.ink}"
  ai-stop-4:
    backgroundColor: "{colors.ai-4}"
    textColor: "{colors.ink}"
  heading:
    textColor: "{colors.ink}"
    typography: "{typography.h1}"
  sidebar-item-active:
    backgroundColor: "{colors.primary-tint}"
    textColor: "{colors.primary-hover}"
    rounded: "{rounded.lg}"
---

# Rojgar AI — Design

## Overview

Rojgar AI helps small and medium businesses in Nepal hire for any job — hotels, clinics, schools, shops, banks, factories. Most owners are not technical and use a phone. The interface should feel calm, obvious and trustworthy: every screen answers "what needs me now?", the next action is one tap away, and nothing needs explaining.

Personality: plain-spoken, warm, competent. Never clever, never salesy. AI is quiet help in the background; when it is working, it shows a soft moving light — never a robot, never "AI-powered" badges.

Voice: "AI assists. You decide." We say Business, Team, Job, Applicant, "Suggest someone you know". Stages: New, Shortlisted, Interview, Offer, Hired, Not selected. Nepali: व्यवसाय, टिम, जागिर, आवेदक; नयाँ · छानिएको · अन्तर्वार्ता · प्रस्ताव · नियुक्त · यसपटक छानिएन.

## Colors

- **Primary (indigo #4338CA)** is the brand and the only colour for primary actions, links, focus and the active nav item. White text on it passes WCAG AA (7.9:1).
- **Neutrals** are cool and quiet: page background `background`, cards `surface`, text `ink`, secondary text `muted` (6.1:1 on white), hairlines `border`.
- **AI gradient** (`ai-1` → `ai-4`: indigo → blue → cyan → teal) is reserved for moments when AI is working or speaking: the moving ring around a card under review, the sparkle, shimmering status text, the spinner. Never on buttons, never decorative.
- **Status tones** come in pairs (text on its own background, all AA): success (good, active, fits), warning (pending, needs a look), danger (not selected, overdue, destructive), neutral (closed, draft).
- Never put white text on light colours. Never use colour as the only signal — pills always have words.
- Dark mode tokens exist (`.dark`) with the same roles; light mode is the reference.

## Typography

- **Manrope** for headings, large numbers and the wordmark — it gives counts like "+12 to review" their presence.
- **DM Sans** for everything else: body, tables, buttons, inputs, pills, nav. **Noto Sans Devanagari** is the fallback for Nepali text.
- Few sizes, few weights (see `typography` tokens). Titles are large and regular-to-semibold, not heavy. Labels are medium at small size.
- Eyebrow text (small uppercase) only for builder steps like "STEP 2 OF 4" — never above every card.

## Layout

- Desktop app: 240 px sidebar (collapsible to a rail with the logo mark) + a light top bar (sidebar toggle · search icon · notifications · account). Content in a centred column, max ~1120 px.
- Phone first for owners and applicants: single column, 16 px side gutters, 44 px minimum tap targets, sticky bottom actions where a page has one main action.
- Every page uses the same skeleton: breadcrumb (small, muted) → title with a status pill → **one facts line** (facts only, e.g. "Kathmandu · Hybrid · Closes 30 Oct · 48 applicants") → at most two actions top-right (one filled, one outline).
- Work happens in lists. The job page is a split view: list on the left, the selected applicant on the right; on phones, tapping a card opens the applicant full-screen.
- Spacing steps: 4, 8, 16, 24, 32, 48. Sections 32–48 apart; cards padded 24.

## Elevation & Depth

Flat by default. Cards are white on the cool background with a 1 px border and no shadow. Shadows only for things that float: menus, popovers, dialogs, toasts (soft, large blur, low opacity). The AI glow is the only "lit" effect and it moves only while work is in progress.

## Shapes

Rounded and friendly: cards 16 px, inputs 10 px, buttons and pills fully round. Avatars are circles; the logo mark is a 16 px-radius tile. Icons are Phosphor "regular" (filled for the active nav item), 16 px in buttons and pills, 20 px in nav, 24 px in empty states.

## Components

- **Logo** — `mark` (R tile with a spark) or `full` (mark + "Rojgar AI"); tones default, onDark, mono. Never redraw it.
- **Button** — primary, secondary, outline, ghost, destructive, link; sizes sm 32, md 40, lg 48, icon. One primary per screen. `loading` shows the spinner and keeps the width. Destructive only for things that can't be undone.
- **PageHeader / Section** — title, status, facts, actions. No subtitle prop by design.
- **DataTable** — click a header to sort ascending → descending → off; search, filter chips with counts, column picker, rows per page, bulk bar on selection, skeleton rows while loading, a "No results — clear filters" state.
- **StatusPill / FitPill** — dot + tinted background + words: "Fits", "Might fit", "Doesn't fit yet"; never a bare number.
- **RoleCard** — job title, status, "posted 2 days ago", and two or three action tiles ("+12 to review", "+3 to call", "1 to decide") that open the job filtered to that group.
- **Applicant panel** — one scroll, no tabs: who → decision buttons → why (each must-have ✓ / ~ / not evidenced with a short quote) → answers → CV → activity → note.
- **Ai** — `AiGlow` (moving gradient ring while AI works), `AiSpark`, `AiText` (shimmer status line), `Spinner` (the only spinner: an asymmetric gradient arc). All stop under reduced motion.
- **Skeleton** — shaped like the content it replaces, with a soft left-to-right sheen.
- **Toasts** — bottom-right, short. Reversible actions use Undo with a visible countdown; anything that sends a message waits for the countdown.
- **EmptyState / ErrorState** — one plain sentence and one action. The offline bar says "You're offline. We'll reconnect automatically." and disappears by itself.
- **Charts** — Recharts via the shared chart component, token colours, Manrope numerals, tooltips, a screen-reader table. Only on the Insights page, never on home screens.

## Do's and Don'ts

- Do write labels people say out loud. Don't use HR or AI jargon ("pipeline", "AI screening", "evaluation", "candidate", "recruiter").
- Do let the title stand alone. Don't add a subtitle that repeats it, helper paragraphs, or a card titled the same as its page.
- Do show the next action next to the thing it acts on. Don't hide decisions behind dropdowns or tabs.
- Do show why ("Valid two-wheeler licence ✓ 'Licence no. 01-…'"). Don't show bare scores.
- Do use the AI gradient only while AI works. Don't decorate with sparkles or "AI-powered" badges.
- Do build from the shared components and tokens. Don't hard-code colours, create one-off buttons, or import icons directly.
- Do design for a phone and Nepali text first. Don't assume email, a CV, or a desktop.
- Do confirm only irreversible actions; give Undo for everything else.
