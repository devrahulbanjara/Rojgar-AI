/**
 * Design System - Component Variants
 * Standardized component styles and variants
 */

// import { theme } from './theme';

export const componentVariants = {
  // Button variants
  button: {
    base: 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
    
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'underline-offset-4 hover:underline text-primary',
      },
      
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
      },
    },
    
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
  
  // Input variants
  input: {
    base: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    
    variants: {
      variant: {
        default: 'border-input',
        error: 'border-destructive focus-visible:ring-destructive',
        success: 'border-green-500 focus-visible:ring-green-500',
      },
    },
    
    defaultVariants: {
      variant: 'default',
    },
  },
  
  // Card variants
  card: {
    base: 'rounded-lg border bg-card text-card-foreground shadow-sm',
    
    variants: {
      variant: {
        default: 'border-border',
        elevated: 'border-border shadow-md',
        outlined: 'border-2 border-border',
      },
    },
    
    defaultVariants: {
      variant: 'default',
    },
  },
  
  // Badge variants
  badge: {
    base: 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        success: 'border-transparent bg-green-500 text-white hover:bg-green-600',
        warning: 'border-transparent bg-yellow-500 text-white hover:bg-yellow-600',
      },
    },
    
    defaultVariants: {
      variant: 'default',
    },
  },
  
  // Alert variants
  alert: {
    base: 'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
    
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
        success: 'border-green-500/50 text-green-700 bg-green-50 dark:border-green-500 dark:text-green-400 dark:bg-green-950 [&>svg]:text-green-600',
        warning: 'border-yellow-500/50 text-yellow-700 bg-yellow-50 dark:border-yellow-500 dark:text-yellow-400 dark:bg-yellow-950 [&>svg]:text-yellow-600',
        info: 'border-blue-500/50 text-blue-700 bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:bg-blue-950 [&>svg]:text-blue-600',
      },
    },
    
    defaultVariants: {
      variant: 'default',
    },
  },
  
  // Loading spinner variants
  spinner: {
    base: 'animate-spin rounded-full border-2 border-current border-t-transparent',
    
    variants: {
      size: {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12',
      },
      
      color: {
        primary: 'text-primary',
        secondary: 'text-secondary',
        white: 'text-white',
        current: 'text-current',
      },
    },
    
    defaultVariants: {
      size: 'md',
      color: 'primary',
    },
  },
} as const;

// Utility function to combine class names
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// Utility function to create variant classes
export const createVariantClasses = <T extends Record<string, any>>(
  base: string,
  variants: T,
  props: Partial<Record<keyof T, keyof T[keyof T]>>
): string => {
  const variantClasses = Object.entries(props).map(([key, value]) => {
    const variant = variants[key];
    return variant && variant[value] ? variant[value] : '';
  });
  
  return cn(base, ...variantClasses);
};
