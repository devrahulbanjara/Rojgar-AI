export interface HeroContent {
  subtitle: string;
  title: string;
  description: string;
  primaryCTA: {
    text: string;
    href: string;
  };
  secondaryCTA: {
    text: string;
    href: string;
  };
}

export interface ValuePropItem {
  icon: string;
  iconAlt: string;
  title: string;
  description: string;
}

export interface ValuePropositionContent {
  subtitle: string;
  title: string;
  items: ValuePropItem[];
}

export interface FeatureItem {
  icon: string;
  iconAlt: string;
  title: string;
  description: string;
}

export interface FeaturesContent {
  subtitle: string;
  title: string;
  features: FeatureItem[];
}

export interface ProcessStep {
  icon: string;
  iconAlt: string;
  title: string;
  description: string;
}

export interface HowItWorksContent {
  subtitle: string;
  title: string;
  steps: ProcessStep[];
}

export interface BenefitItem {
  icon: string;
  iconAlt: string;
  title: string;
  description: string;
}

export interface BenefitsContent {
  title: string;
  recruiterBenefits: {
    subtitle: string;
    items: BenefitItem[];
  };
  candidateBenefits: {
    subtitle: string;
    items: BenefitItem[];
  };
}

export interface CTAContent {
  title: string;
  description: string;
  cta: {
    text: string;
    href: string;
  };
}

export interface TestimonialItem {
  name: string;
  role: string;
  company: string;
  avatar: string;
  content: string;
  rating: number;
}

export interface TestimonialsContent {
  subtitle: string;
  title: string;
  testimonials: TestimonialItem[];
}

export interface PricingFeature {
  text: string;
  included: boolean;
}

export interface PricingPlan {
  name: string;
  description: string;
  price: string;
  period: string;
  features: PricingFeature[];
  cta: {
    text: string;
    href: string;
  };
  featured?: boolean;
}

export interface PricingContent {
  subtitle: string;
  title: string;
  plans: PricingPlan[];
}

export interface FooterLink {
  text: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface FooterContent {
  logo: {
    src: string;
    alt: string;
  };
  description: string;
  contact: {
    email: string;
  };
  columns: FooterColumn[];
  copyright: string;
}

export interface NavigationLink {
  text: string;
  href: string;
}

export interface NavigationContent {
  logo: {
    src: string;
    alt: string;
  };
  links: NavigationLink[];
  cta: {
    signIn: {
      text: string;
      href: string;
    };
    demo: {
      text: string;
      href: string;
    };
  };
}

export interface LandingPageContent {
  navigation: NavigationContent;
  hero: HeroContent;
  valueProposition: ValuePropositionContent;
  features: FeaturesContent;
  howItWorks: HowItWorksContent;
  benefits: BenefitsContent;
  testimonials: TestimonialsContent;
  pricing: PricingContent;
  cta: CTAContent;
  footer: FooterContent;
}

export const landingPageContent: LandingPageContent = {
  navigation: {
    logo: {
      src: '/logo-light.svg',
      alt: 'ConvexHire Logo',
    },
    links: [
      { text: 'Features', href: '#features' },
      { text: 'How It Works', href: '#how-it-works' },
      { text: 'Benefits', href: '#benefits' },
      { text: 'Testimonials', href: '#testimonials' },
      { text: 'Pricing', href: '#pricing' },
    ],
    cta: {
      signIn: {
        text: 'Sign In',
        href: '/signin',
      },
      demo: {
        text: 'Book a Demo',
        href: '/demo',
      },
    },
  },
  hero: {
    subtitle: 'AI-Powered Recruitment Operations',
    title: 'Make Hiring Understandable, Efficient, and Fair',
    description: 'ConvexHire treats hiring as a reasoning problem, not keyword filtering. Our multi-agent AI system assists recruiters and candidates across the entire hiring lifecycle with humans always in control.',
    primaryCTA: {
      text: 'Get Started',
      href: '/signup',
    },
    secondaryCTA: {
      text: 'Book a Demo',
      href: '/demo',
    },
  },
  valueProposition: {
    subtitle: 'Why ConvexHire',
    title: 'Replace Mechanical Filtering with Semantic\nUnderstanding',
    items: [
      {
        icon: '/icons/semantic.svg',
        iconAlt: 'Semantic Understanding Icon',
        title: 'Semantic Understanding',
        description: 'Evaluates resumes based on meaning, not vocabulary. Understands skill equivalence and adjacency for fair, accurate screening.',
      },
      {
        icon: '/icons/transparent.svg',
        iconAlt: 'Transparency Icon',
        title: 'Transparent Decisions',
        description: 'Every recommendation comes with a traceable rationale and natural-language explanation. No black-box scoring.',
      },
      {
        icon: '/icons/human-loop.svg',
        iconAlt: 'Human-in-the-Loop Icon',
        title: 'Human-in-the-Loop',
        description: 'AI prepares, humans decide. Every critical action requires recruiter approval. Accountability built into the architecture.',
      },
    ],
  },
  features: {
    subtitle: 'AI Agent System',
    title: 'Specialized Agents for Every Stage of Hiring',
    features: [
      {
        icon: '/icons/jd-generator.svg',
        iconAlt: 'Job Description Generator Icon',
        title: 'Job Description Generator',
        description: 'Transforms rough recruiter intent into structured, professional JDs. Clarifies required vs optional skills to reduce downstream mismatch.',
      },
      {
        icon: '/icons/resume-screener.svg',
        iconAlt: 'Resume Screener Icon',
        title: 'Resume Screener',
        description: 'Semantic analysis of resumes with skill match, experience alignment, and education relevance. Transparent score breakdown included.',
      },
      {
        icon: '/icons/interview-questions.svg',
        iconAlt: 'Interview Questions Icon',
        title: 'Interview Question Generator',
        description: 'Bidirectional question generation: helps candidates prepare and provides recruiters with tailored question sets based on resumes.',
      },
      {
        icon: '/icons/voice-analysis.svg',
        iconAlt: 'Voice Analysis Icon',
        title: 'Interview Voice Analysis',
        description: 'Analyzes communication signals: clarity, conceptual consistency, and confidence indicators. Produces insights, not decisions.',
      },
      {
        icon: '/icons/scheduling.svg',
        iconAlt: 'Scheduling Icon',
        title: 'Interview Handler & Scheduling',
        description: 'Prepares personalized outreach and drafts scheduling emails. Integrates with Cal.com—always requires recruiter approval.',
      },
      {
        icon: '/icons/talent-pool.svg',
        iconAlt: 'Talent Pool Icon',
        title: 'Talent Pool & Memory',
        description: 'RAG-powered institutional memory. Query past applicants in plain English: "Find backend engineers from last year with AWS experience."',
      },
    ],
  },
  howItWorks: {
    subtitle: 'The Process',
    title: 'How ConvexHire Works',
    steps: [
      {
        icon: '/icons/step-1.svg',
        iconAlt: 'Create Job Description',
        title: 'Create Job Description',
        description: 'AI transforms your rough requirements into a structured, professional job description with clear expectations.',
      },
      {
        icon: '/icons/step-2.svg',
        iconAlt: 'Screen Candidates',
        title: 'Screen Candidates',
        description: 'Semantic screening evaluates resumes based on meaning. You review transparent recommendations with full explanations.',
      },
      {
        icon: '/icons/step-3.svg',
        iconAlt: 'Conduct Interviews',
        title: 'Conduct Interviews',
        description: 'AI generates tailored questions and analyzes interview recordings. You make the final decision with enhanced insights.',
      },
    ],
  },
  benefits: {
    title: 'Benefits for Everyone',
    recruiterBenefits: {
      subtitle: 'For Recruiters',
      items: [
        {
          icon: '/icons/efficiency.svg',
          iconAlt: 'Efficiency Icon',
          title: 'Focus on Evaluation, Not Filtering',
          description: 'Spend time on meaningful candidate interactions instead of manual resume screening.',
        },
        {
          icon: '/icons/talent-pool-benefit.svg',
          iconAlt: 'Talent Pool Icon',
          title: 'Institutional Memory',
          description: 'Never lose track of great candidates. Query your talent pool semantically for future roles.',
        },
        {
          icon: '/icons/confidence.svg',
          iconAlt: 'Confidence Icon',
          title: 'Explainable Decisions',
          description: 'Every recommendation is traceable and auditable. Defend hiring decisions with confidence.',
        },
      ],
    },
    candidateBenefits: {
      subtitle: 'For Candidates',
      items: [
        {
          icon: '/icons/fair.svg',
          iconAlt: 'Fairness Icon',
          title: 'Fair Evaluation',
          description: 'Semantic screening means your skills are understood, not just keyword-matched.',
        },
        {
          icon: '/icons/feedback.svg',
          iconAlt: 'Feedback Icon',
          title: 'Constructive Feedback',
          description: 'No more silent rejections. Get clear explanations and improvement paths.',
        },
        {
          icon: '/icons/preparation.svg',
          iconAlt: 'Preparation Icon',
          title: 'Interview Preparation',
          description: 'Access role-specific questions to prepare meaningfully for your interview.',
        },
      ],
    },
  },
  testimonials: {
    subtitle: 'What Our Clients Say',
    title: 'Trusted by Forward-Thinking Companies',
    testimonials: [
      {
        name: 'Sampada Poudel',
        role: 'Head of Talent',
        company: 'TechCorp',
        avatar: '/avatars/sampada.png',
        content: 'ConvexHire transformed our hiring process. We reduced time-to-hire by 40% while improving candidate quality. The semantic screening is a game-changer.',
        rating: 5,
      },
      {
        name: 'Sarthak Sharma',
        role: 'VP of Engineering',
        company: 'Drively',
        avatar: '/avatars/sarthak.png',
        content: 'Finally, an ATS that understands context. The AI agents help us find candidates we would have missed with traditional keyword filtering.',
        rating: 5,
      },
      {
        name: 'Aayush Neupane',
        role: 'Recruiting Manager',
        company: 'Fusemachines',
        avatar: '/avatars/aayush.png',
        content: 'The transparency is incredible. Every decision is explainable, which helps us maintain compliance and build trust with candidates.',
        rating: 5,
      },
    ],
  },
  pricing: {
    subtitle: 'Simple, Transparent Pricing',
    title: 'Choose the Plan That Fits Your Needs',
    plans: [
      {
        name: 'Starter',
        description: 'Perfect for small teams getting started',
        price: '$299',
        period: '/month',
        features: [
          { text: 'Up to 50 active job postings', included: true },
          { text: 'Semantic resume screening', included: true },
          { text: 'Job description generator', included: true },
          { text: 'Basic analytics', included: true },
          { text: 'Email support', included: true },
          { text: 'Interview voice analysis', included: false },
          { text: 'Talent pool memory (RAG)', included: false },
          { text: 'Priority support', included: false },
        ],
        cta: {
          text: 'Start Free Trial',
          href: '/signup?plan=starter',
        },
      },
      {
        name: 'Professional',
        description: 'For growing teams with advanced needs',
        price: '$799',
        period: '/month',
        features: [
          { text: 'Unlimited job postings', included: true },
          { text: 'Semantic resume screening', included: true },
          { text: 'Job description generator', included: true },
          { text: 'Advanced analytics & reporting', included: true },
          { text: 'Interview question generator', included: true },
          { text: 'Interview voice analysis', included: true },
          { text: 'Talent pool memory (RAG)', included: true },
          { text: 'Priority support', included: true },
        ],
        cta: {
          text: 'Start Free Trial',
          href: '/signup?plan=professional',
        },
        featured: true,
      },
      {
        name: 'Enterprise',
        description: 'Custom solutions for large organizations',
        price: 'Custom',
        period: '',
        features: [
          { text: 'Everything in Professional', included: true },
          { text: 'Custom integrations', included: true },
          { text: 'Dedicated account manager', included: true },
          { text: 'Custom AI model training', included: true },
          { text: 'SLA guarantees', included: true },
          { text: 'On-premise deployment option', included: true },
          { text: 'Advanced security features', included: true },
          { text: '24/7 phone support', included: true },
        ],
        cta: {
          text: 'Contact Sales',
          href: '/contact-sales',
        },
      },
    ],
  },
  cta: {
    title: 'Ready to Transform Your Hiring Process?',
    description: 'Join forward-thinking companies using ConvexHire to make hiring understandable, efficient, and fair.',
    cta: {
      text: 'Get Started Today',
      href: '/signup',
    },
  },
  footer: {
    logo: {
      src: '/logo-dark.svg',
      alt: 'ConvexHire Logo',
    },
    description: 'AI-powered recruitment operations platform designed to make hiring understandable, efficient, and fair.',
    contact: {
      email: 'hello@convexhire.com',
    },
    columns: [
      {
        title: 'Product',
        links: [
          { text: 'Features', href: '#features' },
          { text: 'How It Works', href: '#how-it-works' },
          { text: 'Pricing', href: '#pricing' },
          { text: 'Integrations', href: '/integrations' },
        ],
      },
      {
        title: 'Company',
        links: [
          { text: 'About', href: '/about' },
          { text: 'Blog', href: '/blog' },
          { text: 'Careers', href: '/careers' },
          { text: 'Contact', href: '/contact' },
        ],
      },
      {
        title: 'Legal',
        links: [
          { text: 'Privacy Policy', href: '/privacy' },
          { text: 'Terms of Service', href: '/terms' },
          { text: 'Security', href: '/security' },
        ],
      },
    ],
    copyright: '© 2026 ConvexHire. All rights reserved.',
  },
};
