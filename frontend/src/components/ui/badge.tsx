'use client'

import * as React from 'react'
import { Badge as ChakraBadge } from '@chakra-ui/react'
import { cn } from '../../lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'solid'
    | 'subtle'
    | 'surface'
    | 'plain'
  colorPalette?:
    | 'gray'
    | 'red'
    | 'orange'
    | 'yellow'
    | 'green'
    | 'teal'
    | 'blue'
    | 'cyan'
    | 'purple'
    | 'pink'
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

function Badge({
  className,
  variant = 'subtle',
  colorPalette = 'gray',
  size = 'sm',
  children,
  ...props
}: BadgeProps) {
  // Map old variants to Chakra variants
  const chakraVariant =
    variant === 'default'
      ? 'solid'
      : variant === 'secondary'
        ? 'subtle'
        : variant === 'destructive'
          ? 'solid'
          : variant

  // Map destructive to red color
  const chakraColorPalette = variant === 'destructive' ? 'red' : colorPalette

  return (
    <ChakraBadge
      variant={chakraVariant}
      colorPalette={chakraColorPalette}
      size={size}
      className={cn(className)}
      {...props}
    >
      {children}
    </ChakraBadge>
  )
}

export { Badge }
