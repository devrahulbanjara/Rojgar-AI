import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { 
  Home,
  Sparkles
} from 'lucide-react';
import { ROUTES } from '../config/constants';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-6">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-12 pb-8">
          {/* ConvexHire Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <Sparkles className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold gradient-text">ConvexHire</span>
          </div>

          {/* 404 Message */}
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-slate-300 mb-4">404</h1>
            <h2 className="text-xl font-semibold text-slate-700 mb-4">
              Caught in 4k
            </h2>
            <p className="text-slate-500 mb-6">
              The page you're looking for doesn't exist. Let's get you back on track!
            </p>
          </div>


          {/* Action Buttons */}
          <div className="space-y-3">
            <Link to={ROUTES.HOME} className="block">
              <Button className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <Link to={ROUTES.LOGIN} className="block">
              <Button variant="outline" className="w-full">
                Sign In
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
