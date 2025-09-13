import { Job } from '@/lib/types';
import { companies } from './company';

export const jobs: Job[] = [
  {
    id: 'job-001',
    companyId: 'comp-001',
    company: companies[0],
    title: 'Senior Frontend Engineer',
    department: 'Engineering',
    level: 'Senior',
    location: 'San Francisco, CA',
    locationType: 'Hybrid',
    employmentType: 'Full-time',
    salaryRange: {
      min: 150000,
      max: 200000,
      currency: 'USD'
    },
    description: 'We are looking for a Senior Frontend Engineer to join our team and help build the next generation of our cloud platform. You will work with React, TypeScript, and modern web technologies to create exceptional user experiences.',
    requirements: [
      '5+ years of frontend development experience',
      'Expert knowledge of React and TypeScript',
      'Experience with state management solutions',
      'Strong understanding of web performance',
      'Excellent communication skills'
    ],
    skills: ['React', 'TypeScript', 'JavaScript', 'CSS', 'Redux', 'GraphQL', 'Jest', 'Webpack'],
    postedDate: new Date('2024-12-01'),
    status: 'Active',
    applicantCount: 45
  },
  {
    id: 'job-002',
    companyId: 'comp-001',
    company: companies[0],
    title: 'Backend Engineer',
    department: 'Engineering',
    level: 'Mid',
    location: 'San Francisco, CA',
    locationType: 'Remote',
    employmentType: 'Full-time',
    salaryRange: {
      min: 120000,
      max: 160000,
      currency: 'USD'
    },
    description: 'Join our backend team to build scalable APIs and microservices. You will work with Node.js, Python, and cloud technologies.',
    requirements: [
      '3+ years of backend development',
      'Experience with Node.js or Python',
      'Knowledge of SQL and NoSQL databases',
      'Understanding of microservices architecture'
    ],
    skills: ['Node.js', 'Python', 'PostgreSQL', 'MongoDB', 'Docker', 'AWS', 'REST APIs'],
    postedDate: new Date('2024-11-28'),
    status: 'Active',
    applicantCount: 32
  },
  {
    id: 'job-003',
    companyId: 'comp-002',
    company: companies[1],
    title: 'Data Scientist',
    department: 'Data',
    level: 'Senior',
    location: 'New York, NY',
    locationType: 'Hybrid',
    employmentType: 'Full-time',
    salaryRange: {
      min: 140000,
      max: 180000,
      currency: 'USD'
    },
    description: 'We need a Data Scientist to help us derive insights from large datasets and build predictive models.',
    requirements: [
      '4+ years in data science',
      'Strong Python and R skills',
      'Experience with machine learning',
      'PhD or Master\'s in relevant field preferred'
    ],
    skills: ['Python', 'R', 'TensorFlow', 'PyTorch', 'SQL', 'Spark', 'Machine Learning'],
    postedDate: new Date('2024-11-25'),
    status: 'Active',
    applicantCount: 28
  },
  {
    id: 'job-004',
    companyId: 'comp-003',
    company: companies[2],
    title: 'DevOps Engineer',
    department: 'Infrastructure',
    level: 'Mid',
    location: 'Seattle, WA',
    locationType: 'On-site',
    employmentType: 'Full-time',
    salaryRange: {
      min: 130000,
      max: 170000,
      currency: 'USD'
    },
    description: 'Help us build and maintain our cloud infrastructure. You will work with Kubernetes, Terraform, and CI/CD pipelines.',
    requirements: [
      '3+ years DevOps experience',
      'Strong knowledge of Kubernetes',
      'Experience with IaC tools',
      'Cloud platform expertise (AWS/GCP/Azure)'
    ],
    skills: ['Kubernetes', 'Docker', 'Terraform', 'Jenkins', 'AWS', 'Python', 'Bash'],
    postedDate: new Date('2024-11-20'),
    status: 'Active',
    applicantCount: 19
  },
  {
    id: 'job-005',
    companyId: 'comp-001',
    company: companies[0],
    title: 'Product Manager',
    department: 'Product',
    level: 'Senior',
    location: 'San Francisco, CA',
    locationType: 'Hybrid',
    employmentType: 'Full-time',
    salaryRange: {
      min: 160000,
      max: 210000,
      currency: 'USD'
    },
    description: 'Lead product strategy and execution for our core platform. Work closely with engineering, design, and customers.',
    requirements: [
      '5+ years product management',
      'B2B SaaS experience',
      'Strong analytical skills',
      'Excellent stakeholder management'
    ],
    skills: ['Product Strategy', 'Agile', 'Data Analysis', 'User Research', 'Roadmapping'],
    postedDate: new Date('2024-11-18'),
    status: 'Active',
    applicantCount: 38
  },
  {
    id: 'job-006',
    companyId: 'comp-002',
    company: companies[1],
    title: 'UX Designer',
    department: 'Design',
    level: 'Mid',
    location: 'New York, NY',
    locationType: 'Remote',
    employmentType: 'Full-time',
    salaryRange: {
      min: 100000,
      max: 140000,
      currency: 'USD'
    },
    description: 'Create beautiful and intuitive user experiences for our analytics platform.',
    requirements: [
      '3+ years UX design',
      'Strong portfolio',
      'Figma expertise',
      'User research experience'
    ],
    skills: ['Figma', 'Sketch', 'Adobe XD', 'Prototyping', 'User Research', 'Wireframing'],
    postedDate: new Date('2024-11-15'),
    status: 'Active',
    applicantCount: 52
  },
  {
    id: 'job-007',
    companyId: 'comp-003',
    company: companies[2],
    title: 'Cloud Architect',
    department: 'Engineering',
    level: 'Lead',
    location: 'Seattle, WA',
    locationType: 'Hybrid',
    employmentType: 'Full-time',
    salaryRange: {
      min: 180000,
      max: 250000,
      currency: 'USD'
    },
    description: 'Design and implement cloud architecture solutions for enterprise clients.',
    requirements: [
      '8+ years cloud architecture',
      'Multi-cloud expertise',
      'Solution architecture experience',
      'Client-facing skills'
    ],
    skills: ['AWS', 'Azure', 'GCP', 'Kubernetes', 'Microservices', 'Security', 'Terraform'],
    postedDate: new Date('2024-11-10'),
    status: 'Active',
    applicantCount: 24
  },
  {
    id: 'job-008',
    companyId: 'comp-001',
    company: companies[0],
    title: 'QA Engineer',
    department: 'Engineering',
    level: 'Mid',
    location: 'San Francisco, CA',
    locationType: 'Remote',
    employmentType: 'Full-time',
    salaryRange: {
      min: 100000,
      max: 130000,
      currency: 'USD'
    },
    description: 'Ensure the quality of our products through comprehensive testing strategies.',
    requirements: [
      '3+ years QA experience',
      'Automation testing skills',
      'API testing experience',
      'Agile methodology'
    ],
    skills: ['Selenium', 'Jest', 'Cypress', 'API Testing', 'Test Planning', 'CI/CD'],
    postedDate: new Date('2024-11-08'),
    status: 'Active',
    applicantCount: 41
  }
];