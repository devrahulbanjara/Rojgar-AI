import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarColor, getInitials } from '@/lib/avatarUtils'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  name?: string | null
  src?: string | null
  className?: string
}

export function UserAvatar({ name, src, className }: UserAvatarProps) {
  const displayName = name || 'User'
  const initials = getInitials(displayName)
  const colorClass = getAvatarColor(displayName)

  return (
    <Avatar className={cn('border border-slate-200', className)}>
      <AvatarImage src={src || undefined} alt={displayName} />
      <AvatarFallback className={cn('font-bold text-sm', colorClass)}>{initials}</AvatarFallback>
    </Avatar>
  )
}
