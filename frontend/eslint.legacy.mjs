// Legacy files exempt from the design-system lint rules until they migrate.
// Paths are globs, so ( ) [ ] are escaped.
// Shrink these lists as screens move to components/ui + components/app; never add to them.
// See docs/DESIGN_SYSTEM.md → "Migration TODO".

/** Route files that still render raw <button>/<input>/<select>/<textarea>/<table>/<dialog>. */
export const LEGACY_RAW_ELEMENTS = [
  'src/app/jobs/page.tsx',
  'src/app/page.tsx',
  'src/app/recruiter/candidates/\\[application_id\\]/resume/page.tsx',
  'src/app/recruiter/candidates/_components/CandidatesSkeletons.tsx',
  'src/app/recruiter/jobs/\\[id\\]/page.tsx',
  'src/app/recruiter/jobs/new/page.tsx',
  'src/app/recruiter/settings/page.tsx',
  'src/app/recruiter/team/page.tsx',
]

/** Files that still import lucide-react directly instead of @/components/icons. */
export const LEGACY_LUCIDE = [
  'src/app/candidate/resume/_components/ResumeTemplate.tsx',
  'src/app/jobs/page.tsx',
  'src/app/page.tsx',
  'src/app/recruiter/candidates/\\[application_id\\]/resume/page.tsx',
  'src/app/recruiter/jobs/\\[id\\]/edit/page.tsx',
  'src/app/recruiter/jobs/\\[id\\]/page.tsx',
  'src/app/recruiter/jobs/new/page.tsx',
  'src/components/common/Toolbar/index.tsx',
]

/** Route files that still import SCSS. */
export const LEGACY_SCSS_ROUTES = [
  'src/app/layout.tsx',
  'src/app/recruiter/jobs/new/page.tsx',
  'src/app/recruiter/settings/page.tsx',
]
