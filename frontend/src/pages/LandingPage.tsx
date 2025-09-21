import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Brain,
  Shield,
  Calendar,
  ChevronRight,
  Building2,
  User,
  ArrowRight,
  BarChart3,
  Target,
  Zap
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered JD Generation',
    description: 'Generate compelling job descriptions in seconds with our intelligent AI assistant.'
  },
  {
    icon: Target,
    title: 'Smart Resume Screening',
    description: 'Get detailed compatibility scores and explanations for every applicant.'
  },
  {
    icon: Shield,
    title: 'Transparent Feedback',
    description: 'Provide constructive feedback to candidates, building trust and improving experiences.'
  },
  {
    icon: Calendar,
    title: 'Interview Scheduling',
    description: 'Streamline interview coordination with automated scheduling and reminders.'
  },
  {
    icon: BarChart3,
    title: 'Market Insights',
    description: 'Access real-time salary data and market trends to make informed decisions.'
  },
  {
    icon: Zap,
    title: 'Fast & Efficient',
    description: 'Reduce time-to-hire by 50% with our optimized recruitment workflows.'
  }
];

const trustIndicators = [
  { value: '10,000+', label: 'Companies' },
  { value: '1M+', label: 'Candidates' },
  { value: '95%', label: 'Satisfaction' },
  { value: '50%', label: 'Faster Hiring' }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold gradient-text">ConvexHire</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/login">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="container mx-auto text-center relative z-10"
        >
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Transform Your Hiring Process
            <br />
            <span className="gradient-text">With Intelligence</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            ConvexHire combines AI-powered tools with human expertise to create fair, 
            transparent, and efficient recruitment experiences for everyone.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup?type=recruiter">
              <Button size="lg" className="group">
                <Building2 className="mr-2 h-5 w-5" />
                For Recruiters
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/signup?type=candidate">
              <Button size="lg" variant="outline" className="group">
                <User className="mr-2 h-5 w-5" />
                For Candidates
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Hire Smarter
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to streamline your recruitment process
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full card-hover">
                  <CardContent className="p-6">
                    <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-card/50">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes and transform your recruitment process
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Recruiter Flow */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-2 mb-6">
                <Building2 className="h-6 w-6 text-primary" />
                <h3 className="text-2xl font-semibold">For Recruiters</h3>
              </div>
              <div className="space-y-4">
                {[
                  'Create AI-powered job descriptions',
                  'Post to multiple job boards instantly',
                  'Get ranked applicants with match scores',
                  'Schedule interviews effortlessly',
                  'Make data-driven hiring decisions'
                ].map((step, index) => (
                  <div key={step} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">{index + 1}</span>
                    </div>
                    <p className="text-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Candidate Flow */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-2 mb-6">
                <User className="h-6 w-6 text-accent" />
                <h3 className="text-2xl font-semibold">For Candidates</h3>
              </div>
              <div className="space-y-4">
                {[
                  'Build your professional profile',
                  'Get matched with relevant opportunities',
                  'Apply with one-click applications',
                  'Track application status in real-time',
                  'Receive transparent feedback'
                ].map((step, index) => (
                  <div key={step} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-accent">{index + 1}</span>
                    </div>
                    <p className="text-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by Leading Companies
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of companies revolutionizing their hiring process
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {trustIndicators.map((indicator, index) => (
              <motion.div
                key={indicator.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <p className="text-4xl font-bold gradient-text mb-2">{indicator.value}</p>
                <p className="text-muted-foreground">{indicator.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-brand">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="container mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-brand-foreground">
            Ready to Transform Your Hiring?
          </h2>
          <p className="text-xl text-brand-foreground/90 mb-8 max-w-2xl mx-auto">
            Join ConvexHire today and experience the future of recruitment
          </p>
          <Link to="/login">
            <Button size="lg" variant="secondary" className="group">
              Get Started Free
              <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold gradient-text">ConvexHire</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 ConvexHire. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
          
          {/* Made with love by Rahul */}
          <div className="mt-6 pt-6 border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground">
              Made with{' '}
              <span className="inline-block animate-pulse text-red-500 text-base mx-1 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]">
                ❤️
              </span>{' '}
              by <span className="font-medium text-foreground">Rahul</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
