/**
 * Development-only stand-ins for /public/* routes that the backend has not
 * deployed yet. Only used by lib/publicApi.ts when NODE_ENV !== 'production'.
 */
const DAY = 86_400_000

const COMPANY = {
  name: 'Example Tech',
  slug: 'example-tech',
  website_url: 'https://example.com',
  location: 'Kathmandu',
  industry: 'Software',
  description: 'A product team building payments software in Kathmandu.',
}

const JOB = {
  slug: 'example-backend-engineer',
  title: 'Backend Engineer',
  location: 'Kathmandu',
  location_type: 'hybrid',
  salary_min: 120000,
  salary_max: 180000,
  currency: 'NPR',
  posted_at: new Date(Date.now() - 3 * DAY).toISOString(),
  expires_at: new Date(Date.now() + 14 * DAY).toISOString(),
}

const MOCKS: Record<string, (path: string) => unknown> = {
  job: (path) => ({
    ...JOB,
    slug: decodeURIComponent(path.split('/').pop() ?? JOB.slug),
    company: COMPANY,
    overview: 'Build and run the APIs behind our payments product.',
    responsibilities: ['Design and ship APIs', 'Keep services fast and reliable'],
    requirements: ['3+ years with Python', 'PostgreSQL in production'],
    preferred_qualifications: ['FastAPI or Django', 'AWS'],
    benefits: ['Hybrid work', 'Health insurance'],
    screening_questions: ['Why does this role interest you?'],
  }),
  careers: () => ({ company: COMPANY, jobs: [JOB] }),
  prefill: () => ({ full_name: 'Sita Gurung', email: 'sita@example.com', phone: '9800000000' }),
  apply: () => ({
    application_id: '00000000-0000-0000-0000-000000000000',
    job_title: JOB.title,
    company_name: COMPANY.name,
    email: 'sita@example.com',
    status_link_sent: true,
  }),
  status: () => ({
    application_id: '00000000-0000-0000-0000-000000000000',
    job_title: JOB.title,
    job_slug: JOB.slug,
    company_name: COMPANY.name,
    company_slug: COMPANY.slug,
    status: 'applied',
    status_label: 'Applied',
    next_step: 'The team reviews applications after the job closes.',
    applied_at: new Date(Date.now() - 2 * DAY).toISOString(),
    updated_at: new Date(Date.now() - 2 * DAY).toISOString(),
    can_withdraw: true,
  }),
  withdraw: () => ({ withdrawn: true, data_deleted: true }),
  magicLink: () => ({ sent: true }),
  myApplications: () => [
    {
      application_id: '00000000-0000-0000-0000-000000000001',
      job_title: JOB.title,
      job_slug: JOB.slug,
      company_name: COMPANY.name,
      company_slug: COMPANY.slug,
      status: 'interview_booked',
      status_label: 'Interview',
      next_step: 'Interview booked. Check your email for the time.',
      applied_at: new Date(Date.now() - 9 * DAY).toISOString(),
      updated_at: new Date(Date.now() - DAY).toISOString(),
    },
    {
      application_id: '00000000-0000-0000-0000-000000000002',
      job_title: 'Frontend Engineer',
      job_slug: 'example-frontend-engineer',
      company_name: COMPANY.name,
      company_slug: COMPANY.slug,
      status: 'applied',
      status_label: 'Applied',
      next_step: null,
      applied_at: new Date(Date.now() - 2 * DAY).toISOString(),
      updated_at: new Date(Date.now() - 2 * DAY).toISOString(),
    },
  ],
}

export async function publicApiMock<T>(key: string, path: string, init?: RequestInit): Promise<T> {
  void init
  const make = MOCKS[key]
  if (!make) throw new Error(`No mock for ${key}`)
  await new Promise((r) => setTimeout(r, 250))
  return make(path) as T
}
