import { Applicant, CandidateProfile } from '@/lib/types';

export const candidates: CandidateProfile[] = [
  {
    id: 'can-001',
    email: 'candidate@convexhire.com',
    name: 'John Doe',
    role: 'candidate',
    currentRole: 'Senior Frontend Developer',
    experience: 6,
    skills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'AWS'],
    preferredRoles: ['Senior Frontend Engineer', 'Tech Lead'],
    preferredLocations: ['San Francisco', 'Remote'],
    expectedSalary: { min: 150000, max: 180000, currency: 'USD' },
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'can-002',
    email: 'jane.smith@email.com',
    name: 'Jane Smith',
    role: 'candidate',
    currentRole: 'Full Stack Developer',
    experience: 4,
    skills: ['React', 'Python', 'Django', 'PostgreSQL', 'Docker'],
    preferredRoles: ['Full Stack Engineer', 'Backend Engineer'],
    preferredLocations: ['New York', 'Remote'],
    expectedSalary: { min: 120000, max: 150000, currency: 'USD' },
    createdAt: new Date('2024-01-15')
  },
  {
    id: 'can-003',
    email: 'alex.chen@email.com',
    name: 'Alex Chen',
    role: 'candidate',
    currentRole: 'Data Scientist',
    experience: 5,
    skills: ['Python', 'TensorFlow', 'SQL', 'Spark', 'Machine Learning'],
    preferredRoles: ['Data Scientist', 'ML Engineer'],
    preferredLocations: ['Seattle', 'San Francisco'],
    expectedSalary: { min: 140000, max: 170000, currency: 'USD' },
    createdAt: new Date('2024-02-01')
  },
  {
    id: 'can-004',
    email: 'sarah.jones@email.com',
    name: 'Sarah Jones',
    role: 'candidate',
    currentRole: 'DevOps Engineer',
    experience: 7,
    skills: ['Kubernetes', 'AWS', 'Terraform', 'Python', 'Jenkins'],
    preferredRoles: ['DevOps Engineer', 'SRE'],
    preferredLocations: ['Austin', 'Remote'],
    expectedSalary: { min: 160000, max: 190000, currency: 'USD' },
    createdAt: new Date('2024-02-10')
  },
  {
    id: 'can-005',
    email: 'mike.wilson@email.com',
    name: 'Mike Wilson',
    role: 'candidate',
    currentRole: 'Backend Developer',
    experience: 3,
    skills: ['Node.js', 'MongoDB', 'Express', 'REST APIs', 'JavaScript'],
    preferredRoles: ['Backend Engineer', 'Full Stack Developer'],
    preferredLocations: ['Remote'],
    expectedSalary: { min: 100000, max: 130000, currency: 'USD' },
    createdAt: new Date('2024-02-15')
  },
  {
    id: 'can-006',
    email: 'emily.brown@email.com',
    name: 'Emily Brown',
    role: 'candidate',
    currentRole: 'UX Designer',
    experience: 5,
    skills: ['Figma', 'Sketch', 'User Research', 'Prototyping', 'Design Systems'],
    preferredRoles: ['UX Designer', 'Product Designer'],
    preferredLocations: ['San Francisco', 'Los Angeles'],
    expectedSalary: { min: 120000, max: 150000, currency: 'USD' },
    createdAt: new Date('2024-02-20')
  },
  {
    id: 'can-007',
    email: 'david.lee@email.com',
    name: 'David Lee',
    role: 'candidate',
    currentRole: 'Cloud Architect',
    experience: 9,
    skills: ['AWS', 'Azure', 'Kubernetes', 'Microservices', 'Security'],
    preferredRoles: ['Cloud Architect', 'Solutions Architect'],
    preferredLocations: ['Seattle', 'Remote'],
    expectedSalary: { min: 180000, max: 220000, currency: 'USD' },
    createdAt: new Date('2024-03-01')
  },
  {
    id: 'can-008',
    email: 'lisa.martin@email.com',
    name: 'Lisa Martin',
    role: 'candidate',
    currentRole: 'QA Engineer',
    experience: 4,
    skills: ['Selenium', 'Cypress', 'Jest', 'API Testing', 'Agile'],
    preferredRoles: ['QA Engineer', 'Test Automation Engineer'],
    preferredLocations: ['Chicago', 'Remote'],
    expectedSalary: { min: 95000, max: 125000, currency: 'USD' },
    createdAt: new Date('2024-03-05')
  }
];

export const applicants: Applicant[] = [
  {
    id: 'app-001',
    candidateId: 'can-001',
    candidate: candidates[0],
    jobId: 'job-001',
    matchScore: 92,
    matchExplanation: [
      'Strong React and TypeScript expertise matching job requirements',
      '6 years of experience exceeds the 5-year requirement',
      'Has worked with GraphQL and modern web technologies',
      'Location preference aligns with hybrid work in San Francisco'
    ],
    keySkills: ['React', 'TypeScript', 'GraphQL'],
    experience: 6,
    status: 'Interview Scheduled',
    appliedDate: new Date('2024-12-02'),
    lastUpdated: new Date('2024-12-04'),
    interviewDate: new Date('2024-12-10'),
    notes: 'Very strong candidate, team is excited to meet'
  },
  {
    id: 'app-002',
    candidateId: 'can-002',
    candidate: candidates[1],
    jobId: 'job-001',
    matchScore: 78,
    matchExplanation: [
      'Good React experience but less TypeScript expertise',
      '4 years experience is slightly below requirement',
      'Full stack background brings additional value',
      'Remote work preference matches hybrid option'
    ],
    keySkills: ['React', 'Python', 'Django'],
    experience: 4,
    status: 'In Review',
    appliedDate: new Date('2024-12-03'),
    lastUpdated: new Date('2024-12-04')
  },
  {
    id: 'app-003',
    candidateId: 'can-003',
    candidate: candidates[2],
    jobId: 'job-003',
    matchScore: 95,
    matchExplanation: [
      'Perfect match for data science requirements',
      'Strong Python and machine learning skills',
      '5 years experience meets senior level requirement',
      'Experience with TensorFlow and Spark is a plus'
    ],
    keySkills: ['Python', 'TensorFlow', 'Machine Learning'],
    experience: 5,
    status: 'Offer Extended',
    appliedDate: new Date('2024-11-26'),
    lastUpdated: new Date('2024-12-05'),
    feedback: ['Excellent technical skills', 'Great cultural fit', 'Strong problem-solving abilities']
  },
  {
    id: 'app-004',
    candidateId: 'can-004',
    candidate: candidates[3],
    jobId: 'job-004',
    matchScore: 88,
    matchExplanation: [
      'Strong Kubernetes and cloud expertise',
      'Exceeds experience requirements with 7 years',
      'Terraform and IaC experience is valuable',
      'Remote preference may not align with on-site requirement'
    ],
    keySkills: ['Kubernetes', 'AWS', 'Terraform'],
    experience: 7,
    status: 'Applied',
    appliedDate: new Date('2024-12-04'),
    lastUpdated: new Date('2024-12-04')
  },
  {
    id: 'app-005',
    candidateId: 'can-005',
    candidate: candidates[4],
    jobId: 'job-002',
    matchScore: 85,
    matchExplanation: [
      'Good Node.js and backend experience',
      '3 years meets the minimum requirement',
      'MongoDB experience is relevant',
      'Remote preference aligns perfectly'
    ],
    keySkills: ['Node.js', 'MongoDB', 'REST APIs'],
    experience: 3,
    status: 'Interview Completed',
    appliedDate: new Date('2024-11-29'),
    lastUpdated: new Date('2024-12-03'),
    feedback: ['Strong technical foundation', 'Good communication', 'Would benefit from more cloud experience']
  },
  {
    id: 'app-006',
    candidateId: 'can-006',
    candidate: candidates[5],
    jobId: 'job-006',
    matchScore: 90,
    matchExplanation: [
      'Excellent UX design portfolio',
      'Strong Figma expertise as required',
      'User research experience is valuable',
      'Location flexibility with remote option'
    ],
    keySkills: ['Figma', 'User Research', 'Prototyping'],
    experience: 5,
    status: 'Interview Scheduled',
    appliedDate: new Date('2024-11-16'),
    lastUpdated: new Date('2024-11-18'),
    interviewDate: new Date('2024-12-08')
  },
  {
    id: 'app-007',
    candidateId: 'can-007',
    candidate: candidates[6],
    jobId: 'job-007',
    matchScore: 98,
    matchExplanation: [
      'Exceptional cloud architecture experience',
      '9 years exceeds requirements',
      'Multi-cloud expertise is exactly what we need',
      'Seattle location matches perfectly'
    ],
    keySkills: ['AWS', 'Azure', 'Kubernetes'],
    experience: 9,
    status: 'Hired',
    appliedDate: new Date('2024-11-11'),
    lastUpdated: new Date('2024-11-25'),
    feedback: ['Outstanding technical expertise', 'Excellent leadership potential', 'Perfect fit for the role']
  },
  {
    id: 'app-008',
    candidateId: 'can-008',
    candidate: candidates[7],
    jobId: 'job-008',
    matchScore: 82,
    matchExplanation: [
      'Good QA and automation experience',
      '4 years meets requirements',
      'Cypress and Selenium expertise is valuable',
      'Remote work preference aligns'
    ],
    keySkills: ['Selenium', 'Cypress', 'API Testing'],
    experience: 4,
    status: 'In Review',
    appliedDate: new Date('2024-11-09'),
    lastUpdated: new Date('2024-11-10')
  }
];