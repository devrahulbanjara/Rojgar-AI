import { Company } from '@/lib/types';

export const defaultCompany: Company = {
  id: 'comp-001',
  name: 'TechCorp Solutions',
  logo: undefined,
  website: 'https://techcorp.example.com',
  size: '201-500',
  industry: 'Technology',
  headquarters: 'San Francisco, CA',
  about: 'TechCorp Solutions is a leading innovator in cloud computing and AI solutions. We help businesses transform their operations through cutting-edge technology and exceptional talent.',
  benefits: [
    'Competitive salary',
    'Health insurance',
    'Remote work options',
    '401(k) matching',
    'Professional development',
    'Unlimited PTO',
    'Stock options',
    'Wellness programs'
  ],
  brandColor: '#2563eb'
};

export const companies: Company[] = [
  defaultCompany,
  {
    id: 'comp-002',
    name: 'DataFlow Analytics',
    website: 'https://dataflow.example.com',
    size: '51-200',
    industry: 'Data & Analytics',
    headquarters: 'New York, NY',
    about: 'DataFlow Analytics specializes in big data solutions and business intelligence.',
    benefits: ['Health insurance', 'Remote work', 'Learning budget'],
    brandColor: '#10b981'
  },
  {
    id: 'comp-003',
    name: 'CloudNine Systems',
    website: 'https://cloudnine.example.com',
    size: '501-1000',
    industry: 'Cloud Infrastructure',
    headquarters: 'Seattle, WA',
    about: 'CloudNine Systems provides enterprise cloud infrastructure and DevOps solutions.',
    benefits: ['Stock options', 'Flexible hours', 'Gym membership'],
    brandColor: '#8b5cf6'
  }
];