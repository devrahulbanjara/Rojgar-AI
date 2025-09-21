import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Users,
  Clock,
  TrendingUp,
  CheckCircle,
  Building2,
  User,
  ArrowRight,
  Star,
  MapPin,
  DollarSign,
  Sparkles
} from 'lucide-react';

const jobCategories = [
  { title: 'Software Engineering', count: '2,847', trend: '+12%' },
  { title: 'Marketing & Sales', count: '1,923', trend: '+8%' },
  { title: 'Design & Creative', count: '1,456', trend: '+15%' },
  { title: 'Data & Analytics', count: '892', trend: '+22%' },
  { title: 'Product Management', count: '634', trend: '+18%' },
  { title: 'Operations', count: '1,203', trend: '+5%' }
];

const recentJobs = [
  {
    title: 'Senior Frontend Developer',
    company: 'Innovate Tech',
    location: 'Kathmandu, Nepal',
    salary: 'NPR 1,200,000 - 1,600,000',
    type: 'Full-time',
    posted: '2 hours ago',
    applicants: 23
  },
  {
    title: 'Product Marketing Manager',
    company: 'Adex International',
    location: 'Kathmandu, Nepal',
    salary: 'NPR 900,000 - 1,200,000',
    type: 'Full-time',
    posted: '4 hours ago',
    applicants: 15
  },
  {
    title: 'UX Designer',
    company: 'Smart Data Solutions',
    location: 'Kathmandu, Nepal',
    salary: 'NPR 850,000 - 1,100,000',
    type: 'Full-time',
    posted: '6 hours ago',
    applicants: 31
  }
];

const platformStats = [
  { value: '847', label: 'Active Jobs', icon: Briefcase },
  { value: '12.3k', label: 'Candidates', icon: Users },
  { value: '156', label: 'Companies', icon: Building2 },
  { value: '4.2k', label: 'Successful Hires', icon: CheckCircle }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold gradient-text">ConvexHire</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/login">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Find your next
                <span className="gradient-text"> opportunity</span>
                <br />
                or hire the best talent
              </h1>
              
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Connect skilled professionals with growing companies. 
                Whether you're looking for your dream job or building your team, 
                we make the process simple and transparent.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/signup?type=candidate">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                    <User className="mr-2 h-5 w-5" />
                    Find Jobs
                  </Button>
                </Link>
                <Link to="/signup?type=recruiter">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    <Building2 className="mr-2 h-5 w-5" />
                    Hire Talent
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Job Posted Successfully</h3>
                    <p className="text-sm text-gray-500">Senior Developer at TechCorp</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Applications received</span>
                    <span className="font-semibold text-gray-900">23</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Time to first application</span>
                    <span className="font-semibold text-gray-900">2 hours</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Match quality</span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Job Categories */}
      <section className="py-16 px-6 bg-white">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Explore Opportunities by Category
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find jobs in your field or discover new career paths
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobCategories.map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{category.title}</h3>
                      <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        {category.trend}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 mb-2">{category.count}</p>
                    <p className="text-sm text-gray-500">active positions</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Jobs */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Latest Job Postings
            </h2>
            <p className="text-lg text-gray-600">
              Fresh opportunities updated daily
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentJobs.map((job, index) => (
              <motion.div
                key={job.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{job.title}</h3>
                        <p className="text-blue-600 font-medium">{job.company}</p>
                      </div>
                      <span className="text-xs text-gray-500">{job.posted}</span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="h-4 w-4" />
                        {job.salary}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        {job.type}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="text-sm text-gray-500">
                        {job.applicants} applicants
                      </span>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Apply Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Link to="/login">
              <Button variant="outline" size="lg">
                View All Jobs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="py-16 px-6 bg-white">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Trusted by Professionals & Companies
            </h2>
            <p className="text-lg text-gray-600">
              Real numbers from our growing community
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {platformStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
                <p className="text-gray-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Simplified */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple Process, Better Results
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Whether you're hiring or job hunting, we've streamlined the process
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            {/* For Recruiters */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-8 shadow-sm border border-gray-200"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">For Companies</h3>
              </div>
              <div className="space-y-4">
                {[
                  'Post your job requirements',
                  'Review qualified candidates',
                  'Schedule interviews seamlessly',
                  'Make informed hiring decisions'
                ].map((step, index) => (
                  <div key={step} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <p className="text-gray-700">{step}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* For Candidates */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-8 shadow-sm border border-gray-200"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">For Job Seekers</h3>
              </div>
              <div className="space-y-4">
                {[
                  'Create your professional profile',
                  'Discover relevant opportunities',
                  'Apply with one click',
                  'Track your application status'
                ].map((step, index) => (
                  <div key={step} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <p className="text-gray-700">{step}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-blue-600">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="container mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals and companies who trust ConvexHire for their career and hiring needs
          </p>
          <Link to="/login">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Get Started
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold gradient-text">ConvexHire</span>
            </div>
            <p className="text-sm text-gray-600">
              © 2025 ConvexHire. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
