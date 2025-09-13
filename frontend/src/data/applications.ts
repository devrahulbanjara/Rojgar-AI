import { Application } from '@/lib/types';
import { jobs } from './jobs';

export const applications: Application[] = [
  {
    id: 'app-001',
    candidateId: 'can-001',
    jobId: 'job-001',
    job: jobs[0],
    status: 'Interview Scheduled',
    appliedDate: new Date('2024-12-02'),
    lastUpdated: new Date('2024-12-04'),
    feedback: [
      'Your React expertise is impressive',
      'We appreciate your TypeScript proficiency',
      'Looking forward to discussing your GraphQL experience'
    ],
    matchScore: 92,
    coverLetter: 'I am excited about the opportunity to join TechCorp Solutions as a Senior Frontend Engineer...'
  },
  {
    id: 'app-002',
    candidateId: 'can-001',
    jobId: 'job-005',
    job: jobs[4],
    status: 'Applied',
    appliedDate: new Date('2024-12-01'),
    lastUpdated: new Date('2024-12-01'),
    matchScore: 75,
    coverLetter: 'While my background is in engineering, I have strong product sense...'
  },
  {
    id: 'app-003',
    candidateId: 'can-001',
    jobId: 'job-002',
    job: jobs[1],
    status: 'Rejected',
    appliedDate: new Date('2024-11-20'),
    lastUpdated: new Date('2024-11-25'),
    feedback: [
      'Strong frontend skills but limited backend experience',
      'Consider gaining more Node.js and database experience',
      'We encourage you to apply for frontend positions'
    ],
    matchScore: 65
  }
];