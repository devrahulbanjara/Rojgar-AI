export interface ReferenceJD {
  id: string
  title: string
  department: 'Engineering' | 'Product' | 'Design' | 'Marketing' | 'Data Science' | 'Sales'
  level: 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Principal'
  description: string
  requirements: string[]
  skills: string[]
  benefits?: string[]
  salaryRange: {
    min: number
    max: number
    currency: string
  }
  keywords: string
}

export const departmentColors: Record<string, { bg: string; text: string; border: string }> = {
  Engineering: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  Product: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  Design: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
  },
  Marketing: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
  },
  'Data Science': {
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-200 dark:border-cyan-800',
  },
  Sales: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
}

export const referenceJDs: ReferenceJD[] = [
  {
    id: 'eng-backend-senior',
    title: 'Senior Backend Engineer',
    department: 'Engineering',
    level: 'Senior',
    description:
      'We are seeking an exceptional Senior Backend Engineer to architect and build scalable, high-performance systems that power our platform. You will work with cutting-edge technologies, design robust APIs, and solve complex distributed systems challenges. This role offers the opportunity to make a significant impact on our technical infrastructure while mentoring junior engineers.',
    requirements: [
      '5+ years of backend development experience with Python, Node.js, or Go',
      'Strong experience with RESTful API design and microservices architecture',
      'Expert knowledge of relational and NoSQL databases (PostgreSQL, MongoDB, Redis)',
      'Experience with cloud platforms (AWS, GCP, or Azure) and containerization (Docker, Kubernetes)',
      'Solid understanding of system design, scalability, and performance optimization',
      'Experience with message queues and event-driven architectures (Kafka, RabbitMQ)',
    ],
    skills: [
      'Python',
      'FastAPI',
      'PostgreSQL',
      'Redis',
      'Docker',
      'Kubernetes',
      'AWS',
      'System Design',
    ],
    benefits: [
      'Work on cutting-edge AI projects',
      'Competitive salary and benefits',
      'Opportunities for research and publication',
      'International exposure',
    ],
    salaryRange: { min: 140000, max: 190000, currency: 'USD' },
    keywords:
      'senior backend engineer, python, fastapi, postgresql, redis, kubernetes, aws, microservices',
  },
  // Marketing
  {
    id: 'marketing-growth-senior',
    title: 'Senior Growth Marketing Manager',
    department: 'Marketing',
    level: 'Senior',
    description:
      'We are looking for a data-driven Senior Growth Marketing Manager to drive user acquisition, activation, and retention. You will design and execute multi-channel marketing campaigns, optimize conversion funnels, and identify growth opportunities through experimentation. This role requires a blend of creativity, analytical thinking, and technical marketing skills.',
    requirements: [
      '5+ years of growth marketing or digital marketing experience in B2B SaaS',
      'Proven track record of driving measurable growth through marketing initiatives',
      'Strong analytical skills and experience with marketing analytics tools (Google Analytics, Mixpanel)',
      'Expertise in performance marketing channels (SEO, SEM, paid social, email)',
      'Experience with A/B testing, conversion rate optimization, and growth experimentation',
      'Proficiency with marketing automation and CRM tools (HubSpot, Salesforce)',
    ],
    skills: [
      'Growth Marketing',
      'Digital Marketing',
      'SEO/SEM',
      'Analytics',
      'A/B Testing',
      'Content Marketing',
      'Marketing Automation',
    ],
    benefits: [
      'Work on cutting-edge AI projects',
      'Competitive salary and benefits',
      'Opportunities for research and publication',
      'International exposure',
    ],
    salaryRange: { min: 115000, max: 155000, currency: 'USD' },
    keywords: 'senior growth marketing, b2b saas, seo sem, analytics, ab testing, 5 years',
  },
  // Sales (Business)
  {
    id: 'sales-enterprise-senior',
    title: 'Senior Enterprise Sales Executive',
    department: 'Sales',
    level: 'Senior',
    description:
      'We are seeking a results-driven Senior Enterprise Sales Executive to drive revenue growth by closing strategic enterprise deals. You will manage the full sales cycle from prospecting to close, build relationships with C-level executives, and become a trusted advisor to our largest customers. This role offers significant earning potential through commissions.',
    requirements: [
      '5+ years of enterprise B2B software sales experience with proven track record',
      'Experience selling to C-level executives and navigating complex organizations',
      'Consistent achievement of $1M+ annual quota',
      'Strong understanding of SaaS business models and value-based selling',
      'Excellent presentation, negotiation, and relationship-building skills',
      'Experience with Salesforce or similar CRM platforms',
    ],
    skills: [
      'Enterprise Sales',
      'B2B Sales',
      'Consultative Selling',
      'Negotiation',
      'Salesforce',
      'Account Management',
    ],
    benefits: [
      'Work on cutting-edge AI projects',
      'Competitive salary and benefits',
      'Opportunities for research and publication',
      'International exposure',
    ],
    salaryRange: { min: 120000, max: 160000, currency: 'USD' },
    keywords: 'senior enterprise sales, b2b saas, consultative selling, salesforce, 5 years',
  },
]
