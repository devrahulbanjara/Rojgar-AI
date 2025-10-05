/**
 * Design System Components
 * Re-export commonly used utilities and components
 */

// Utility functions
export { 
  cn, 
  formatDate, 
  formatCurrency, 
  debounce, 
  generateId, 
  isEmpty, 
  capitalize, 
  truncate,
  formatUserName,
  getDashboardRoute,
  getUserInitials,
  delay,
  validateEmail,
  validatePassword,
  validateName,
  validateConfirmPassword,
  validateRequired
} from '../lib/utils';

// UI Components
export { Button } from '../components/ui/button';
export { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
export { Badge } from '../components/ui/badge';
export { Input } from '../components/ui/input';
export { Label } from '../components/ui/label';
export { Textarea } from '../components/ui/textarea';
export { Select } from '../components/ui/select';
export { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
export { Separator } from '../components/ui/separator';
export { Progress } from '../components/ui/progress';
