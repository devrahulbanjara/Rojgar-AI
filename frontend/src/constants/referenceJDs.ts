/**
 * Reference Job Descriptions
 * Department-specific JD examples that can be used as templates for AI-powered job generation
 */

export interface ReferenceJD {
    id: string;
    title: string;
    department: 'Engineering' | 'Product' | 'Design' | 'Marketing' | 'Data Science' | 'Sales';
    level: 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Principal';
    description: string;
    requirements: string[];
    skills: string[];
    salaryRange: {
        min: number;
        max: number;
        currency: string;
    };
    keywords: string;
}

// Department color mapping for UI
export const departmentColors: Record<string, { bg: string; text: string; gradient: string }> = {
    Engineering: {
        bg: '#EFF6FF',
        text: '#1E40AF',
        gradient: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
    },
    Product: {
        bg: '#F0FDF4',
        text: '#166534',
        gradient: 'linear-gradient(135deg, #10B981, #34D399)',
    },
    Design: {
        bg: '#FDF4FF',
        text: '#86198F',
        gradient: 'linear-gradient(135deg, #A855F7, #C084FC)',
    },
    Marketing: {
        bg: '#FFF7ED',
        text: '#9A3412',
        gradient: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
    },
    'Data Science': {
        bg: '#F0F9FF',
        text: '#0C4A6E',
        gradient: 'linear-gradient(135deg, #0EA5E9, #38BDF8)',
    },
    Sales: {
        bg: '#FEF2F2',
        text: '#991B1B',
        gradient: 'linear-gradient(135deg, #EF4444, #F87171)',
    },
};

export const referenceJDs: ReferenceJD[] = [
    // Engineering - Backend
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
        skills: ['Python', 'FastAPI', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'System Design'],
        salaryRange: { min: 140000, max: 190000, currency: 'USD' },
        keywords: 'senior backend engineer, python, fastapi, postgresql, redis, kubernetes, aws, microservices',
    },
    // Engineering - ML
    {
        id: 'eng-ml-senior',
        title: 'Senior ML Engineer',
        department: 'Engineering',
        level: 'Senior',
        description:
            'Join our ML team to build and deploy state-of-the-art machine learning models that power intelligent features across our platform. You will work on everything from recommendation systems to natural language processing, taking models from research to production at scale. This role combines deep technical expertise with practical engineering skills.',
        requirements: [
            '5+ years of experience in machine learning engineering or data science',
            'Strong proficiency in Python and ML frameworks (PyTorch, TensorFlow, scikit-learn)',
            'Experience deploying ML models to production and MLOps best practices',
            'Solid understanding of deep learning, NLP, and recommendation systems',
            'Experience with cloud ML platforms (AWS SageMaker, GCP Vertex AI)',
            'Strong software engineering fundamentals and experience with Git, CI/CD',
        ],
        skills: ['Python', 'PyTorch', 'FastAPI', 'AWS', 'MLOps', 'NLP', 'Docker', 'Kubernetes'],
        salaryRange: { min: 150000, max: 210000, currency: 'USD' },
        keywords: 'senior ml engineer, pytorch, fastapi, aws, mlops, nlp, kubernetes, 5 years',
    },
    // Engineering - Frontend
    {
        id: 'eng-frontend-senior',
        title: 'Senior Frontend Engineer',
        department: 'Engineering',
        level: 'Senior',
        description:
            'We are looking for a talented Senior Frontend Engineer to craft beautiful, performant, and accessible user interfaces. You will work with React, TypeScript, and modern frontend technologies to create delightful user experiences. Your work will directly impact millions of users and set the standard for frontend excellence in our organization.',
        requirements: [
            '5+ years of frontend development experience with React and TypeScript',
            'Expert knowledge of modern JavaScript, HTML5, and CSS3',
            'Strong experience with state management (Redux, Zustand, or similar)',
            'Proficiency with Next.js or similar SSR frameworks',
            'Deep understanding of web performance optimization and accessibility (WCAG)',
            'Experience with design systems and component libraries',
        ],
        skills: ['React', 'TypeScript', 'Next.js', 'TailwindCSS', 'Redux', 'GraphQL', 'Jest', 'Cypress'],
        salaryRange: { min: 135000, max: 185000, currency: 'USD' },
        keywords: 'senior frontend engineer, react, typescript, nextjs, tailwindcss, 5 years',
    },
    // Engineering - DevOps
    {
        id: 'eng-devops-mid',
        title: 'DevOps Engineer',
        department: 'Engineering',
        level: 'Mid',
        description:
            'As a DevOps Engineer, you will be responsible for building and maintaining our cloud infrastructure, CI/CD pipelines, and deployment automation. You will work closely with engineering teams to ensure our systems are reliable, scalable, and secure. This role is perfect for someone passionate about infrastructure as code and automation.',
        requirements: [
            '3+ years of experience in DevOps, SRE, or infrastructure engineering',
            'Strong knowledge of AWS, GCP, or Azure cloud platforms',
            'Expert with containerization (Docker) and orchestration (Kubernetes)',
            'Proficiency with infrastructure as code (Terraform, CloudFormation)',
            'Experience with CI/CD tools (GitHub Actions, Jenkins, GitLab CI)',
            'Solid understanding of networking, security, and Linux systems administration',
        ],
        skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD', 'Python', 'Bash', 'Monitoring'],
        salaryRange: { min: 120000, max: 160000, currency: 'USD' },
        keywords: 'devops engineer, aws, kubernetes, terraform, cicd, docker, 3 years',
    },
    // Product
    {
        id: 'product-manager-senior',
        title: 'Senior Product Manager',
        department: 'Product',
        level: 'Senior',
        description:
            'We are seeking a strategic Senior Product Manager to lead the development of key product initiatives. You will define product vision, strategy, and roadmap while working cross-functionally with engineering, design, and business teams. The ideal candidate combines strong analytical skills with excellent communication and a customer-centric mindset.',
        requirements: [
            '5+ years of product management experience in B2B SaaS or consumer tech',
            'Proven track record of launching successful products from 0 to 1',
            'Strong analytical skills and data-driven decision making',
            'Excellent stakeholder management and communication skills',
            'Experience with Agile/Scrum methodologies and product development processes',
            'Deep understanding of user research, A/B testing, and product analytics',
        ],
        skills: [
            'Product Strategy',
            'Roadmap Planning',
            'User Research',
            'A/B Testing',
            'Analytics',
            'Agile',
            'Stakeholder Management',
        ],
        salaryRange: { min: 140000, max: 180000, currency: 'USD' },
        keywords: 'senior product manager, b2b saas, product strategy, analytics, agile, 5 years',
    },
    // Design
    {
        id: 'design-product-senior',
        title: 'Senior Product Designer',
        department: 'Design',
        level: 'Senior',
        description:
            'Join our design team to create beautiful, intuitive, and delightful user experiences. As a Senior Product Designer, you will own the end-to-end design process from research to final implementation. You will collaborate closely with product managers and engineers to solve complex design challenges and elevate our product experience.',
        requirements: [
            '5+ years of product design experience in tech companies',
            'Expert proficiency in Figma, Sketch, or similar design tools',
            'Strong portfolio demonstrating UX/UI design skills and process',
            'Experience with user research, user testing, and design thinking methodologies',
            'Knowledge of design systems and component-based design',
            'Understanding of frontend technologies (HTML, CSS, React) is a plus',
        ],
        skills: ['Figma', 'UI/UX Design', 'User Research', 'Prototyping', 'Design Systems', 'Interaction Design'],
        salaryRange: { min: 125000, max: 170000, currency: 'USD' },
        keywords: 'senior product designer, figma, ux ui design, user research, design systems, 5 years',
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
        salaryRange: { min: 115000, max: 155000, currency: 'USD' },
        keywords: 'senior growth marketing, b2b saas, seo sem, analytics, ab testing, 5 years',
    },
    // Data Science
    {
        id: 'data-scientist-senior',
        title: 'Senior Data Scientist',
        department: 'Data Science',
        level: 'Senior',
        description:
            'As a Senior Data Scientist, you will uncover insights from complex datasets, build predictive models, and drive data-informed decision making across the organization. You will work on diverse problems including customer analytics, forecasting, and experimentation. This role offers the opportunity to have significant impact through data science.',
        requirements: [
            '5+ years of experience in data science, analytics, or related field',
            'Strong proficiency in Python and data science libraries (pandas, scikit-learn, numpy)',
            'Expertise in statistical modeling, machine learning, and experimental design',
            'Experience with SQL and working with large-scale datasets',
            'Strong communication skills and ability to present findings to non-technical stakeholders',
            'Experience with data visualization tools (Tableau, Looker, or similar)',
        ],
        skills: ['Python', 'SQL', 'Machine Learning', 'Statistics', 'Data Visualization', 'A/B Testing', 'Tableau'],
        salaryRange: { min: 135000, max: 180000, currency: 'USD' },
        keywords: 'senior data scientist, python, sql, machine learning, statistics, tableau, 5 years',
    },
    // Sales
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
        salaryRange: { min: 120000, max: 160000, currency: 'USD' },
        keywords: 'senior enterprise sales, b2b saas, consultative selling, salesforce, 5 years',
    },
];
