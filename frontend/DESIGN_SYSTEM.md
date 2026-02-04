# ConvexHire Design System Documentation

## 🎨 Overview

ConvexHire uses a modern, professional design system focused on clean aesthetics, smooth animations, and excellent user experience. The design emphasizes clarity, accessibility, and visual hierarchy with a vibrant color palette and thoughtful spacing.

---

## 🎨 Color System

### Primary Brand Colors

- **Brand Blue (Primary)**: `#3056F5` / `hsl(221, 83%, 53%)`
  - Used for primary actions, links, and brand elements
  - Hover: `#2B3CF5` / `hsl(221, 83%, 43%)`
  - Light variant: `hsl(221, 83%, 63%)`
  - Dark variant: `hsl(221, 83%, 43%)`

### Semantic Colors

#### Text Colors

- **Primary Text**: `#0F172A` / `hsl(222, 47%, 11%)` - Main headings and important text
- **Secondary Text**: `#475569` / `hsl(215, 16%, 47%)` - Body text, descriptions
- **Muted Text**: `#94A3B8` / `hsl(215, 20%, 65%)` - Placeholders, helper text

#### Background Colors

- **Page Background**: `#F9FAFB` - Main page background
- **Card Background**: `#FFFFFF` - White cards
- **Muted Background**: `hsl(210, 40%, 96%)` - Subtle backgrounds

#### Border Colors

- **Default Border**: `#E5E7EB` / `hsl(214, 32%, 91%)`
- **Input Border**: `#E5E7EB`
- **Focus Ring**: `#3056F5` with 10-20% opacity

#### Status Colors

**Success** (Green):

- Background: `bg-emerald-50/80` or `bg-green-50/80`
- Text: `text-emerald-700` or `text-green-700`
- Border: `border-emerald-200` or `border-green-200`
- HSL: `hsl(142, 71%, 45%)`

**Warning** (Amber/Orange):

- Background: `bg-amber-50/80` or `bg-orange-50/80`
- Text: `text-amber-700` or `text-orange-700`
- Border: `border-amber-200` or `border-orange-200`
- HSL: `hsl(38, 92%, 50%)`

**Destructive** (Red):

- Background: `bg-red-50/80` or `bg-rose-50/80`
- Text: `text-red-700` or `text-rose-700`
- Border: `border-red-200` or `border-rose-200`
- HSL: `hsl(0, 84%, 60%)`

**Info** (Blue):

- Background: `bg-blue-50/80`
- Text: `text-blue-700`
- Border: `border-blue-200`

### Department Color Schemes

Each department has its own color scheme for badges and cards:

| Department   | Background         | Text               | Border               |
| ------------ | ------------------ | ------------------ | -------------------- |
| Engineering  | `bg-blue-50/80`    | `text-blue-700`    | `border-blue-200`    |
| Sales        | `bg-green-50/80`   | `text-green-700`   | `border-green-200`   |
| Marketing    | `bg-orange-50/80`  | `text-orange-700`  | `border-orange-200`  |
| Product      | `bg-purple-50/80`  | `text-purple-700`  | `border-purple-200`  |
| Design       | `bg-pink-50/80`    | `text-pink-700`    | `border-pink-200`    |
| Data Science | `bg-cyan-50/80`    | `text-cyan-700`    | `border-cyan-200`    |
| HR           | `bg-rose-50/80`    | `text-rose-700`    | `border-rose-200`    |
| Finance      | `bg-emerald-50/80` | `text-emerald-700` | `border-emerald-200` |
| Operations   | `bg-amber-50/80`   | `text-amber-700`   | `border-amber-200`   |
| Default      | `bg-slate-50/80`   | `text-slate-700`   | `border-slate-200`   |

### Level Color Schemes

| Level     | Background         | Text               | Border               |
| --------- | ------------------ | ------------------ | -------------------- |
| Senior    | `bg-indigo-50/80`  | `text-indigo-700`  | `border-indigo-200`  |
| Mid       | `bg-blue-50/80`    | `text-blue-700`    | `border-blue-200`    |
| Junior    | `bg-emerald-50/80` | `text-emerald-700` | `border-emerald-200` |
| Lead      | `bg-violet-50/80`  | `text-violet-700`  | `border-violet-200`  |
| Principal | `bg-amber-50/80`   | `text-amber-700`   | `border-amber-200`   |
| Entry     | `bg-teal-50/80`    | `text-teal-700`    | `border-teal-200`    |

### Gradients

- **Brand Gradient**: `linear-gradient(135deg, hsl(221, 83%, 53%), hsl(217, 91%, 60%))`
- **Subtle Gradient**: `linear-gradient(180deg, hsl(0, 0%, 100%), hsl(210, 40%, 98%))`
- **Hero Gradient**: `linear-gradient(135deg, hsl(221, 83%, 53%), hsl(217, 91%, 60%), hsl(213, 94%, 68%))`
- **Header Gradient**: `bg-gradient-to-b from-indigo-50/50 to-white`

---

## 📝 Typography

### Font Families

1. **Primary Font**: `Plus Jakarta Sans`
   - Weights: 400, 500, 600, 700
   - Used for: Body text, UI elements
   - Import: `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`

2. **Secondary Font**: `Inter`
   - Weights: 400, 500, 600, 700, 800
   - Used for: Headings, emphasis
   - Import: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`

### Typography Scale

#### Headings

**H1 - Page Titles**

- Size: `text-4xl` (2.25rem / 36px) on mobile, `max-lg:text-3xl` (1.875rem / 30px)
- Weight: `font-bold` (700)
- Color: `text-[#0F172A]`
- Line Height: `leading-tight`
- Letter Spacing: `tracking-tight` (-0.5%)
- Example: Page headers, hero titles

**H2 - Section Titles**

- Size: `text-2xl` (1.5rem / 24px)
- Weight: `font-semibold` (600)
- Color: `text-[#0F172A]`
- Example: Section headers

**H3 - Card Titles**

- Size: `text-[19px]` or `text-xl` (1.25rem / 20px)
- Weight: `font-semibold` (600)
- Color: `text-slate-900` or `text-[#0F172A]`
- Line Height: `leading-tight`
- Example: Job card titles, card headers

**H4 - Subsection Titles**

- Size: `text-lg` (1.125rem / 18px)
- Weight: `font-semibold` (600)
- Color: `text-[#0F172A]`

#### Body Text

**Large Body**

- Size: `text-lg` (1.125rem / 18px) or `text-base` (1rem / 16px)
- Weight: `font-medium` (500) or `font-normal` (400)
- Color: `text-[#475569]`
- Line Height: `1.7`

**Regular Body**

- Size: `text-sm` (0.875rem / 14px) or `text-[15px]`
- Weight: `font-normal` (400)
- Color: `text-[#475569]` or `text-slate-600`
- Line Height: `1.7`

**Small Text**

- Size: `text-xs` (0.75rem / 12px)
- Weight: `font-medium` (500) or `font-semibold` (600)
- Color: `text-[#475569]` or `text-slate-600`

**Tiny Text**

- Size: `text-[11px]`
- Weight: `font-semibold` (600)
- Color: Varies by context (usually colored badges)

### Typography Patterns

**Page Headers**:

```tsx
<h1 className="text-4xl max-lg:text-3xl font-bold text-[#0F172A] leading-tight tracking-tight">
  Page Title
</h1>
<p className="text-lg text-[#475569] mt-2 max-w-2xl">
  Subtitle or description
</p>
```

**Card Titles**:

```tsx
<h3 className="font-semibold text-[19px] leading-tight text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
  Card Title
</h3>
```

**Stat Numbers**:

```tsx
<p className="text-[40px] max-lg:text-4xl font-bold text-[#0F172A] leading-none mb-2 tracking-tight">
  {value}
</p>
```

---

## 📏 Spacing System

### Spacing Scale (Tailwind Default)

- `0` = 0px
- `1` = 0.25rem (4px)
- `2` = 0.5rem (8px)
- `3` = 0.75rem (12px)
- `4` = 1rem (16px)
- `5` = 1.25rem (20px)
- `6` = 1.5rem (24px)
- `8` = 2rem (32px)
- `10` = 2.5rem (40px)
- `12` = 3rem (48px)
- `16` = 4rem (64px)
- `20` = 5rem (80px)
- `24` = 6rem (96px)

### Common Spacing Patterns

**Page Layout**:

- Page padding: `px-4 sm:px-6 lg:px-8`
- Section spacing: `space-y-8` or `space-y-6`
- Container max-width: `max-w-7xl mx-auto`

**Card Spacing**:

- Card padding: `p-6` (24px)
- Card gap: `gap-8` (32px) for grids
- Card internal spacing: `space-y-2.5` or `space-y-4`
- Border spacing: `pt-6 border-t` (24px top padding with border)

**Component Spacing**:

- Button padding: `px-6 py-3` (24px horizontal, 12px vertical)
- Input padding: `px-3 sm:px-4` (12px/16px horizontal)
- Input height: `h-10 sm:h-12` (40px/48px)
- Icon gaps: `gap-1.5` or `gap-2` (6px/8px)

**Header Spacing**:

- Header padding: `py-12` or `py-8` (48px/32px vertical)
- Header margin bottom: `mb-8` or `mb-6` (32px/24px)

---

## 🎭 Component Styles

### Buttons

**Primary Button**:

```tsx
className =
  'inline-flex items-center gap-2 px-6 py-3 bg-[#3056F5] hover:bg-[#2B3CF5] text-white text-base font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-95'
```

**Secondary Button**:

```tsx
className =
  'inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-indigo-600 bg-white border border-indigo-100 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all duration-200 shadow-sm'
```

**Ghost Button**:

```tsx
className =
  'text-[#475569] hover:text-brand-blue text-sm sm:text-base font-medium rounded-xl px-6 sm:px-8 py-4 sm:py-6 h-auto group'
```

**Button Sizes**:

- Default: `h-10 px-4 py-2`
- Small: `h-9 px-3`
- Large: `h-11 px-8` or `px-6 sm:px-8 py-4 sm:py-6 h-auto`

### Cards

**Standard Card**:

```tsx
className="bg-white rounded-xl border border-slate-200 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200"
style={{
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}}
```

**Card Hover Effect**:

- Shadow: `0 2px 8px rgba(0,0,0,0.08)` → `0 4px 16px rgba(0,0,0,0.12)`
- Transform: `translateY(-1px)` or `translateY(-4px)`
- Border: `border-slate-200` → `border-indigo-200`

**Stat Card**:

```tsx
className="group bg-white rounded-2xl p-8 border border-[#E5E7EB] transition-all duration-300 hover:scale-[1.02] relative overflow-hidden"
style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
```

### Badges

**Department/Status Badge**:

```tsx
className =
  'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-blue-50/80 text-blue-700 border-blue-200'
```

**Count Badge**:

```tsx
className =
  'inline-flex items-center gap-2 px-3 py-2 bg-purple-50/80 text-purple-700 rounded-lg border border-purple-200'
```

**Tab Badge**:

```tsx
className =
  'px-2 py-0.5 rounded-full text-xs font-semibold transition-all duration-300 bg-blue-100 text-blue-700'
```

### Inputs

**Text Input**:

```tsx
className =
  'w-full h-10 sm:h-12 px-3 sm:px-4 bg-white border-[1.5px] rounded-lg sm:rounded-xl text-sm sm:text-[15px] text-[#0F172A] placeholder-[#94A3B8] transition-all duration-200 focus:outline-none border-[#E5E7EB] focus:border-[#3056F5] focus:ring-4 focus:ring-[#3056F5]/10'
```

**Error Input**:

```tsx
className =
  '... border-[#DC2626] bg-[#FEF2F2] focus:border-[#DC2626] focus:ring-4 focus:ring-[#DC2626]/10'
```

### Modals/Dialogs

**Modal Container**:

- Background: `bg-white`
- Border radius: `rounded-xl` or `rounded-2xl`
- Padding: `p-6` or `p-8`
- Shadow: `shadow-xl` or `shadow-2xl`
- Max width: `max-w-2xl` or `max-w-3xl`

### Empty States

**Empty State Container**:

```tsx
className =
  'flex flex-col items-center justify-center py-24 text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200'
```

**Empty State Icon**:

```tsx
className =
  'w-20 h-20 bg-white shadow-sm border border-gray-100 rounded-2xl flex items-center justify-center mb-6'
```

---

## 🎯 Border Radius

- **Small**: `rounded-md` (0.375rem / 6px) or `rounded-lg` (0.5rem / 8px)
- **Medium**: `rounded-xl` (0.75rem / 12px) - **Most common**
- **Large**: `rounded-2xl` (1rem / 16px) - Cards, stat cards
- **Extra Large**: `rounded-3xl` (1.5rem / 24px) - Empty states
- **Full**: `rounded-full` - Badges, avatars, pills

**CSS Variables**:

- `--radius-sm`: `0.5rem` (8px)
- `--radius`: `0.75rem` (12px)
- `--radius-lg`: `1rem` (16px)
- `--radius-xl`: `1.5rem` (24px)

---

## 🌈 Shadows

### Shadow Scale

**Small Shadow** (`shadow-sm`):

```css
box-shadow: 0 1px 2px 0 hsl(222 47% 11% / 0.05);
```

**Medium Shadow** (`shadow-md`):

```css
box-shadow: 0 4px 6px -1px hsl(222 47% 11% / 0.07);
```

**Large Shadow** (`shadow-lg`):

```css
box-shadow: 0 10px 15px -3px hsl(222 47% 11% / 0.1);
```

**Extra Large Shadow** (`shadow-xl`):

```css
box-shadow: 0 20px 25px -5px hsl(222 47% 11% / 0.1);
```

### Custom Shadows

**Card Shadow**:

```css
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
```

**Card Hover Shadow**:

```css
box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
```

**Button Shadow**:

```css
box-shadow: 0 4px 12px rgba(48, 86, 245, 0.3);
```

**Stat Card Hover Shadow**:

```css
box-shadow: 0 12px 24px -8px rgba(48, 86, 245, 0.15);
```

---

## 🎬 Animations & Transitions

### Transition Durations

- **Fast**: `120ms` (`--transition-fast`)
- **Base**: `200ms` (`--transition-base`) - **Most common**
- **Slow**: `300ms` (`--transition-slow`)

### Easing Functions

- **Smooth**: `cubic-bezier(0.4, 0, 0.2, 1)` (`--ease-smooth`) - **Most common**
- **Spring**: `cubic-bezier(0.175, 0.885, 0.32, 1.275)` (`--ease-spring`) - Bouncy animations
- **Gentle**: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (`--ease-gentle`) - Subtle animations

### Common Animations

**Fade In**:

```css
animation: fadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
```

**Slide Up**:

```css
animation: slideUp 0.2s cubic-bezier(0.4, 0, 0.2, 1);
```

**Scale In**:

```css
animation: scaleIn 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

**Hover Lift**:

```tsx
className = 'transition-all duration-300 hover:-translate-y-1'
```

**Hover Scale**:

```tsx
className = 'transition-all duration-300 hover:scale-[1.02]'
```

**Active Scale**:

```tsx
className = 'active:scale-95'
```

### Animation Keyframes

**Fade In**:

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Slide Up**:

```css
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Scale In**:

```css
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

### Stagger Animations

Stagger delays: `0.05s`, `0.1s`, `0.15s`, `0.2s`, `0.25s`, `0.3s`, `0.35s`, `0.4s`

---

## 🎨 Icons

### Icon Library

**Lucide React** - Primary icon library

- Import: `import { IconName } from 'lucide-react'`
- Common icons: `Briefcase`, `Users`, `Calendar`, `MapPin`, `DollarSign`, `Clock`, `Eye`, `FileText`, `Search`, `LayoutDashboard`, etc.

### Icon Sizes

- **Tiny**: `w-[14px] h-[14px]` - Metadata icons in cards
- **Small**: `w-4 h-4` (16px) - Buttons, badges
- **Medium**: `w-5 h-5` (20px) - Standard UI icons
- **Large**: `w-6 h-6` (24px) - Stat card icons
- **Extra Large**: `w-10 h-10` (40px) or `w-12 h-12` (48px) - Feature icons

### Icon Colors

- **Default**: `text-slate-400` or `text-[#94A3B8]`
- **Primary**: `text-[#3056F5]` or `text-brand-blue`
- **Active**: `text-indigo-600`, `text-blue-600`, etc. (varies by context)
- **Hover**: `hover:text-indigo-600` or `hover:text-gray-700`

### Icon Usage Patterns

**In Cards**:

```tsx
<MapPin className="w-[14px] h-[14px] text-slate-400" />
<span className="truncate">{location}</span>
```

**In Buttons**:

```tsx
<Plus className="w-5 h-5" />
```

**In Stat Cards**:

```tsx
<div
  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
  style={{ background: 'rgba(48, 86, 245, 0.08)' }}
>
  <Icon className="h-6 w-6 text-[#3056F5]" />
</div>
```

---

## 🏗️ Layout Patterns

### Page Structure

```tsx
<AppShell>
  <PageTransition className="min-h-screen" style={{ background: '#F9FAFB' }}>
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <AnimatedContainer direction="up" delay={0.1}>
        <div className="relative py-12 bg-gradient-to-b from-indigo-50/50 to-white border-b border-indigo-50/50 mb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl max-lg:text-3xl font-bold text-[#0F172A] leading-tight tracking-tight">
              Page Title
            </h1>
            <p className="text-lg text-[#475569] mt-2 max-w-2xl">Subtitle</p>
          </div>
        </div>
      </AnimatedContainer>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">{/* Content here */}</div>
    </div>
  </PageTransition>
</AppShell>
```

### Grid Layouts

**Card Grid**:

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">{/* Cards */}</div>
```

**Stats Grid**:

```tsx
<div className="grid gap-6 md:grid-cols-4">{/* Stat cards */}</div>
```

### Container Widths

- **Full Width**: `w-full`
- **Max Content**: `max-w-7xl mx-auto` (1280px) - **Most common**
- **Medium**: `max-w-4xl mx-auto` (896px)
- **Small**: `max-w-2xl mx-auto` (672px)

### Responsive Breakpoints

- **sm**: `640px` - Small tablets
- **md**: `768px` - Tablets
- **lg**: `1024px` - Desktop
- **xl**: `1280px` - Large desktop
- **2xl**: `1400px` - Extra large desktop

---

## 🎭 Component Patterns

### Tab Switcher

```tsx
<div className="inline-flex items-center gap-1 p-1 bg-gray-100/80 backdrop-blur-sm rounded-2xl">
  <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 bg-white text-gray-900 shadow-sm">
    <Icon className="w-4 h-4 text-blue-600" />
    <span>Tab Label</span>
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
      {count}
    </span>
  </button>
</div>
```

### Search Bar

```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
  <input
    className="w-full h-12 pl-10 pr-4 bg-white border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:border-[#3056F5] focus:ring-4 focus:ring-[#3056F5]/10"
    placeholder="Search..."
  />
</div>
```

### Loading States

**Skeleton Loader**:

```tsx
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
  <div className="h-4 bg-gray-200 rounded w-1/2" />
</div>
```

**Spinner**:

```tsx
<Loader2 className="h-4 w-4 animate-spin" />
```

---

## 🎨 Visual Effects

### Glass Morphism

```tsx
className = 'bg-white/80 backdrop-blur-xl border border-[#E2E8F0]'
```

### Gradient Overlays

**Hover Gradient**:

```tsx
<div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-blue-50/0 to-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
```

### Blur Effects

- **Backdrop Blur**: `backdrop-blur-sm`, `backdrop-blur-xl`
- **Filter Blur**: Used in animations: `filter: blur(4px)` → `blur(0px)`

---

## 📱 Responsive Design

### Mobile-First Approach

- Base styles target mobile
- Progressive enhancement with `sm:`, `md:`, `lg:` prefixes
- Common pattern: `text-base sm:text-lg lg:text-xl`

### Common Responsive Patterns

**Text Sizes**:

```tsx
className = 'text-sm sm:text-base lg:text-lg'
```

**Padding**:

```tsx
className = 'px-4 sm:px-6 lg:px-8'
```

**Grid Columns**:

```tsx
className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
```

**Heights**:

```tsx
className = 'h-10 sm:h-12'
```

---

## 🎯 Accessibility

### Focus States

```tsx
className = 'focus:outline-none focus:ring-2 focus:ring-[#3056F5] focus:ring-offset-2'
```

### ARIA Labels

```tsx
aria-label="Button description"
aria-expanded={isOpen}
role="button"
tabIndex={0}
```

### Keyboard Navigation

- Enter/Space for button activation
- Tab for navigation
- Escape for closing modals

---

## 🎨 Design Principles

1. **Clean & Minimal**: Avoid clutter, use white space effectively
2. **Consistent Spacing**: Use the spacing scale consistently
3. **Smooth Animations**: All transitions should be smooth and purposeful
4. **Color Coding**: Use department/status colors consistently
5. **Visual Hierarchy**: Clear distinction between headings, body, and metadata
6. **Hover Feedback**: All interactive elements should provide visual feedback
7. **Responsive**: Mobile-first, progressive enhancement
8. **Accessible**: Proper contrast ratios, focus states, ARIA labels

---

## 📚 CSS Variables Reference

All CSS variables are defined in `globals.css`:

```css
/* Colors */
--background: 0 0% 100%;
--foreground: 222 47% 11%;
--brand: 221 83% 53%;
--primary: 221 83% 53%;
--secondary: 210 40% 96%;
--muted: 210 40% 96%;
--accent: 142 71% 45%;
--success: 142 71% 45%;
--warning: 38 92% 50%;
--destructive: 0 84% 60%;

/* Borders */
--border: 214 32% 91%;
--input: 214 32% 91%;
--ring: 221 83% 53%;

/* Radius */
--radius-sm: 0.5rem;
--radius: 0.75rem;
--radius-lg: 1rem;
--radius-xl: 1.5rem;

/* Shadows */
--shadow-sm: 0 1px 2px 0 hsl(222 47% 11% / 0.05);
--shadow-md: 0 4px 6px -1px hsl(222 47% 11% / 0.07);
--shadow-lg: 0 10px 15px -3px hsl(222 47% 11% / 0.1);
--shadow-xl: 0 20px 25px -5px hsl(222 47% 11% / 0.1);

/* Transitions */
--transition-fast: 120ms;
--transition-base: 200ms;
--transition-slow: 300ms;
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
--ease-gentle: cubic-bezier(0.25, 0.46, 0.45, 0.94);
```

---

## 🎨 Quick Reference

### Most Common Classes

**Colors**:

- `text-[#0F172A]` - Primary text
- `text-[#475569]` - Secondary text
- `bg-[#3056F5]` - Primary blue
- `bg-white` - White background
- `border-[#E5E7EB]` - Default border

**Spacing**:

- `p-6` - Card padding
- `gap-8` - Grid gap
- `space-y-8` - Vertical spacing
- `px-4 sm:px-6 lg:px-8` - Responsive padding

**Typography**:

- `text-4xl max-lg:text-3xl font-bold` - Page title
- `text-[19px] font-semibold` - Card title
- `text-sm text-[#475569]` - Body text

**Effects**:

- `rounded-xl` - Standard border radius
- `transition-all duration-300` - Smooth transitions
- `hover:-translate-y-1` - Hover lift
- `shadow-md` - Medium shadow

---

This design system ensures consistency, maintainability, and a beautiful user experience across the entire ConvexHire platform.
