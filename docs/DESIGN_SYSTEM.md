# ConvexHire design system

One library, used everywhere. If a thing exists here, use it. If it doesn't, add it here first,
then use it. Never style a one-off copy inside a page.

- **Primitives:** `src/components/ui`. These are shadcn/ui (new-york) components on Radix, owned and
  edited by us. They are the only place raw `<button>`, `<input>`, `<select>`, `<textarea>`,
  `<table>` and `<dialog>` may appear.
- **Product components:** `src/components/app`. Shells, page structure, tables, pills, cards and
  sharing.
- **Icons:** `src/components/icons.ts`. This is the only module that imports an icon library.
- **Screens:** `src/components/{today,public,me}`. Route files under `src/app` stay thin (fetch params,
  render a screen component).

## Principles

1. **Design from the user's day.** Every screen answers "what needs me now?" first, then status,
   then everything else.
2. **Plain English, no filler.** There are no subtitles under headings and no helper text. Tip
   boxes, promo cards and marketing banners inside the app are not allowed either. A secondary
   line may only carry facts: "Kathmandu · Hybrid · Closes 30 Oct · 48 applicants".
3. **One primary action per screen.** Use at most two actions in a page header: one filled
   primary and one outline.
4. **Never repeat the same state in three places.** If a count is on a tile, don't also put it
   in a heading and a badge.
5. **Numbers only when they drive action.** "To review 12" is fine. "Avg time to hire" and
   "Applying ratio +33%" are not.
6. **AI is plumbing.** No "AI-powered" badges. Show the *why* ("5 yrs Python · led payments
   team") and let people open the details.

## Tokens (`src/app/globals.css`)

| Token | Value | Use |
|---|---|---|
| `--background` | `#f5f5f4` (warm gray) | App background |
| `--card` | `#ffffff` | Cards, tables, popovers |
| `--foreground` / `--muted-foreground` | `#1c1917` / `#78716c` | Text / secondary text |
| `--primary` | `#2563eb` (ConvexHire blue) | The single accent: primary buttons, links, active nav |
| `--border` | `#e7e5e4` | 1px borders everywhere. Shadows are ~zero. |
| `--radius` | `1rem` | `rounded-xl` = 16px for cards; `rounded-full` for buttons, pills, chips |
| `--tone-{success,warning,danger,neutral}` (+ `-bg`) | green / amber / red / gray | Status pills, fit bars, tiles |
| `--sidebar-*` | white surface, blue-tint active | Recruiter sidebar |

Tailwind exposes these as `bg-background`, `text-primary`, `bg-success-bg text-success`, and so
on. Dark-mode values are defined under `.dark` but not polished yet. Don't hard-code hex colours
in components.

**Semantic tones only:**
- green: good or active (Open, Shortlisted, Hired);
- amber: pending or draft (Draft, Interviewed, waiting);
- red: overdue or not selected;
- neutral: closed or applied.

### Typography

There are two typefaces, both loaded once in `app/layout.tsx` through `next/font`:
- **Manrope** (`font-heading`): h1–h3, PageHeader titles, Section titles, large numerals
  (StatStrip values, RoleCard tiles) and the wordmark.
- **DM Sans** (`font-sans`, the body default): everything else. That covers body text, table
  cells, buttons, inputs, pills, labels and nav.

| Style | Size / line-height | Weight | Font | Where |
|---|---|---|---|---|
| display | 36px / 1.15 | 400 | Manrope | Marketing hero only |
| h1 | 30px / 1.2 (`text-3xl`) | 400 | Manrope | `PageHeader` title |
| h2 | 16px / 1.4 (`text-base`) | 600 | Manrope | `Section` title |
| h3 | 15px / 1.4 | 600 | Manrope | Card titles |
| numeral | 20–24px / 1 | 300 | Manrope | `StatStrip`, `ActionTile` |
| body | 14px / 1.5 (`text-sm`) | 400 | DM Sans | Default |
| small | 12px / 1.4 (`text-xs`) | 400–500 | DM Sans | Meta, pills, table secondary |
| caption | 11px / 1.3, uppercase, tracking-wide | 500 | DM Sans | Sparing eyebrows ("STEP 2 OF 4") |

Use few weights: large titles are regular or light, and labels are medium at small sizes.

### Icons (`@/components/icons`)

The icon set is Phosphor (`@phosphor-icons/react`, SSR build), re-exported under semantic names:
- **Nav:** `TodayIcon`, `JobsIcon`, `CandidatesIcon`, `InterviewsIcon`, `TeamIcon`, `SettingsIcon`
- **Actions:** `ShareIcon`, `LinkIcon`, `CopyIcon`, `QrIcon`, `PlusIcon`, `EditIcon`, `TrashIcon`, `SearchIcon`, `FilterIcon`, `SortIcon`, `MoreIcon`, `SignOutIcon`
- **Chevrons:** `ChevronDown/Up/Left/RightIcon`
- **Status:** `CheckIcon`, `XIcon`, `WarningIcon`, `InfoIcon`, `SpinnerIcon`
- **Brands:** `LinkedInIcon`, `FacebookIcon`, `GoogleIcon`

See the file for the rest.

- Sizes come from CSS. Icons are 16px inside buttons, inputs and pills (the primitives size child
  SVGs), 20px in the nav and top bar, and 24px in empty states.
- Colour is always `currentColor`.
- The weight is `regular`. Active nav items use `weight="fill"` of the same icon.
- Use an icon only for nav, buttons with a clear verb, status, and empty states. Never put
  decorative icons next to headings.

## Buttons

| Variant | Use for | Rule |
|---|---|---|
| `primary` (default) | The main action: Post a job, Submit, Approve | **One per screen or dialog.** |
| `secondary` | A strong alternative next to a primary | Neutral fill |
| `outline` | Supporting actions: Share, Edit, Cancel, Decline | The usual second button |
| `ghost` | Toolbars and icon-only actions | Low emphasis |
| `destructive` | Irreversible actions only: delete, remove member | Pair with `ConfirmDialog` |
| `link` | Navigation that reads as text, e.g. table "Open →" | Not for actions |

- **Sizes:** `sm` 32px, `md` 40px (the default), `lg` 48px (also used for touch-critical CTAs),
  `icon` 40px, `icon-sm` 32px.
- **Props:**
  - `loading`: spinner, `aria-busy`, disabled, width kept;
  - `fullWidth`;
  - `asChild`: wrap a `<Link>`;
  - icons as children: `<Button><PlusIcon />Post a job</Button>`.
- **`IconButton label="Share"`:** for icon-only buttons; the label is required.
- **Aliases:** `variant="default"` and `size="default"` are deprecated aliases kept for
  generated shadcn code.

## Product components (`@/components/app/*`)

**Layout**
- **`RecruiterShell`** / **`AppShell role`**: the recruiter app frame. It contains `AppSidebar`
  (Today · Jobs · Candidates · Interviews · Team for admins, with Settings pinned to the bottom,
  collapsible, and an off-canvas sheet on mobile) and `TopBar` (`MobileNav` trigger, ⌘K
  `CommandSearch`, `NotificationsBell`, `AccountMenu` with avatar, name and role).
- **`CandidateShell`**: a simple mobile-first top bar.
- **`PageContainer narrow?`**: page width and padding.

**Page structure**
- **`PageHeader breadcrumb? title status? facts? primaryAction? secondaryAction?`**: the skeleton
  every page shares. `facts` is an array joined with " · ". There is **no subtitle prop on
  purpose**.
- **`Section title action?`**: a titled block, with no helper text under it.

**Data display**
- **`DataTable columns data getRowId bulkActions? initialSorting? emptyText?`**: built on TanStack.
  - Sortable headers come from `SortableHeader`.
  - Passing `bulkActions` adds a checkbox column and a sticky `BulkBar`.
  - The footer shows "Showing 1–10 of 48", rows per page and paging.
  - Put `PersonCell` in the first cell and a `RowLink` ("Review →") on the right.
- **`PersonCell name meta? src?`**: avatar plus a bold name and a muted meta line.
- **`StatusPill tone`**: dot, tinted background and matching text.
  - `ApplicationStatusPill` and `JobStatusPill` map statuses to wording and tone (see
    `APPLICATION_STATUS` / `JOB_STATUS`).
  - **`Tag`** is the neutral pill for "Remote", "Kathmandu" and so on.
- **`ScoreBar score outOf?`**: "8/10 ▬ 80%", coloured by threshold (≥70 green, ≥40 amber, else
  red). **`FitPill`** is the compact "8/10" for dense rows.
- **`StatStrip items`**: one bordered row of 3–4 action numbers, with a small muted label above
  each value.
- **`KeyFacts items`**: a grid of icon, label and value for the ⅓-width side card on detail pages.
- **`RoleCard role companyName`**: one role and the work waiting on it, shown as `ActionTile`s
  ("+12 to review", "+3 to contact", "+1 to decide"). Each tile links to the job's matching
  stage. Use it on Today only.
- **`EntityAvatar name src? kind`** and **`AvatarStack people max?`**.

**Feedback**
- **`EmptyState action?`**: one line and at most one action.
- **`ErrorState onRetry?`**: one line plus "Try again".
- **`ConfirmDialog title consequence? confirmLabel onConfirm`**: for irreversible actions only.
  Reversible actions should just happen, with an undo toast via `notify`.
- **Toasts:** `notify.success/error/info/warning(message, description?)` from `@/lib/notify`
  (sonner).

**Forms and sharing**
- **Forms:**
  - **`Field`** (label, control and error; no helper text by default) and **`Form`**
    (react-hook-form + zod) come from `components/ui`.
  - Inputs come from `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup` and `Switch`.
- **`FileUpload value onChange accept? maxBytes? progress? error?`**: the CV dropzone. It
  validates type and size, shows the file name and size, offers Replace, and shows upload
  progress.
- **`ShareMenu job trigger?`**: copy the apply link, LinkedIn post text, Facebook post text and
  the Merojob external link, or download a QR code. Links are tagged `?src=direct|linkedin|facebook|merojob`
  (`lib/shareLinks.ts`).
- **`BuilderLayout title steps current savedAt? saving? onPrevious? onNext`**:
  - a left outline with "Job setup 60%" and ✓ on finished steps;
  - "STEP 2 OF 4" on the step;
  - "Saved · 2 min ago";
  - Previous / Save & continue in the footer.

**Public chrome** is owned by the public-pages branch: `PublicNav`, `PublicFooter`,
`lib/brand.ts` (`BRAND`). There is one definition of each.

## Page patterns

- **List page:**
  - a `PageHeader` with a primary action;
  - filter chips as pills (`ToggleGroup`, with a black pill for the active chip) plus search;
  - a `DataTable`.
- **Detail page:**
  - a main column (about ⅔) plus a side card (about ⅓) with `KeyFacts` and the decision buttons;
  - tabs with counts: `<TabsTrigger count={48}>Applicants</TabsTrigger>`.
- **Builder:** a `BuilderLayout` with autosave and a character counter on long text. No tip
  boxes.
- **Mapping:**
  - **Jobs list:** a table with Job · Posted · Applicants · To review · Status · Open →, plus
    "Post a job".
  - **Job page:** a header with Share and Edit, then an Applicants tab: a table with fit pill,
    stage pill, source and applied date, plus bulk ✓/✗.
  - **Candidate review:** the main column shows the why and the CV; the side card holds the
    decision buttons and key facts.

## Copy rules

- Use sentence case and short labels. Prefer "Post a job" over "Create New Job Posting".
- Don't put a subtitle under a heading, and don't restate the title ("List of all jobs").
- Write empty states as one line that tells the next step: "No open roles." plus [Post a job].
- Status lines must be facts with dates: "Interview Tue 2:00 PM · Join", "Not selected".
- Errors say what to do: "Couldn't copy. Select the text and copy it instead."

## How Tailwind coexists with the legacy SCSS

- **No preflight.** `globals.css` imports only Tailwind's theme and utilities. The legacy reset
  in `styles/_reset.scss` stays in force, so unmigrated pages look the same (verified with
  before/after screenshots of login, /jobs, recruiter jobs, pipeline and talent).
- **Important utilities.** They are imported `important`, so they beat the legacy unlayered
  rules on migrated elements.
- **Scanning.** Tailwind scans only `components/{ui,app,public,me,today}`, so legacy class names
  such as `container` or `hidden` never generate utilities. Keep markup in those folders and
  keep route files thin.
- **Base-layer fixes:**
  - border colour defaults to `--border`;
  - `p` margins are zeroed inside `.app-surface` and `[data-slot]`.

## Enforcement (ESLint, errors)

The rules live in `eslint.config.mjs`, with legacy exemptions in `eslint.legacy.mjs`:

- No raw `<button>`, `<input>` (except `type="file"`), `<select>`, `<textarea>`, `<table>` or
  `<dialog>` in `src/app/**` or the new folders. Use `components/ui`.
- No `lucide-react` or `@phosphor-icons/react` imports outside `components/icons.ts`.
- New folders may not import legacy chrome: `common/header`, `common/footer`, `Loader`,
  `SegmentedControl`, `Toolbar`, `sections/*`, `DashNavbar`.
- No `.scss` imports in new folders or in route files that aren't on the legacy list.

The legacy lists in `eslint.legacy.mjs` may only shrink.

## Migration TODO

The legacy lists hold:
- 61 route files that still use raw elements;
- 74 files that still import `lucide-react` (`lucide-react` stays in `package.json` until this
  list is empty);
- 34 route files that import SCSS.

When a route migrates:
1. Rebuild it from `components/app` and `components/ui`, with markup in a screen folder.
2. Delete its `.module.scss` and remove it from the legacy lists.
3. Delete the global SCSS partial once nothing uses it.

| Route | Owner | Becomes | SCSS to delete |
|---|---|---|---|
| `/recruiter` | recruiter | ✅ Today (`components/today`) | ✅ old insights removed |
| `/recruiter/jobs` | recruiter | Jobs table | `recruiter/jobs/page.module.scss` |
| `/recruiter/jobs/[id]` | recruiter | Job page + Applicants table + bulk ✓/✗ | `JobPipelineWorkspace.module.scss` |
| `/recruiter/jobs/new`, `/manual`, `/[id]/edit` | recruiter | `BuilderLayout` | `jobs/new/page.module.scss`, `pages/_job-drafting.scss` |
| `/recruiter/candidates/[application_id]` (+ drawer) | recruiter | Candidate review (main + side card) | `CandidateDrawer` styles |
| `/recruiter/talent`, `/recruiter/candidates` | recruiter | Candidates table | `talent/page.module.scss` |
| `/recruiter/interviews`, `/[id]` | recruiter | Interviews table + detail | `pages/_interviews.scss` |
| `/recruiter/team`, `/recruiters`, `/audit` | recruiter | Team table + approvals | — |
| `/recruiter/settings`, `/profile`, `/company/settings` | recruiter | Settings forms | `settings/page.module.scss`, `profile/page.module.scss`, `pages/_profile.scss` |
| `/recruiter/chat` | recruiter | Phase 2 helper (see REDESIGN.md) | `components/_recruiter-chat.scss` |
| `/`, `/jobs`, legal pages | public | `PublicNav`/`PublicFooter` pages | `pages/_homepage.scss`, `_public-jobs.scss`, `_legal.scss`, `components/_header|_footer|_pricing|_faq|_featured-jobs|_explore-categories|_why-prefer-us.scss` |
| `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email` | public | `Field`/`Form` auth pages | `pages/_auth.scss` |
| `/candidate/**`, `/onboarding`, `/interviews` | public | `/me/applications` + guest apply; resume builder, gap analysis and auto-patch are **removed** | `pages/_applications.scss`, `_resume.scss`, candidate `*.module.scss` |
| Global | — | Delete `styles/main.scss` once every route has migrated | `styles/**` |
