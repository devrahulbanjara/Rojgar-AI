import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  role: string;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const getRoleVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case 'recruiter':
        return 'default';
      case 'candidate':
        return 'secondary';
      case 'admin':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Badge variant={getRoleVariant(role)} className={cn('capitalize', className)}>
      {role}
    </Badge>
  );
}