import React, { memo } from 'react';
import { motion, Variants } from 'framer-motion';
import { cn } from '../../lib/utils';

interface AnimatedContainerProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade' | 'scale';
  stagger?: boolean;
  staggerDelay?: number;
  once?: boolean;
}

const variants: Record<string, Variants> = {
  up: {
    hidden: {
      opacity: 0,
      y: 20,
      filter: 'blur(4px)'
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
        filter: { duration: 0.2 }
      }
    }
  },
  down: {
    hidden: {
      opacity: 0,
      y: -20,
      filter: 'blur(4px)'
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
        filter: { duration: 0.2 }
      }
    }
  },
  left: {
    hidden: {
      opacity: 0,
      x: -20,
      filter: 'blur(4px)'
    },
    visible: {
      opacity: 1,
      x: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
        filter: { duration: 0.2 }
      }
    }
  },
  right: {
    hidden: {
      opacity: 0,
      x: 20,
      filter: 'blur(4px)'
    },
    visible: {
      opacity: 1,
      x: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
        filter: { duration: 0.2 }
      }
    }
  },
  fade: {
    hidden: {
      opacity: 0,
      filter: 'blur(4px)'
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
        filter: { duration: 0.2 }
      }
    }
  },
  scale: {
    hidden: {
      opacity: 0,
      scale: 0.95,
      filter: 'blur(4px)'
    },
    visible: {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        duration: 0.3,
        ease: [0.175, 0.885, 0.32, 1.275],
        filter: { duration: 0.2 }
      }
    }
  }
};

export const AnimatedContainer = memo<AnimatedContainerProps>(({
  children,
  className,
  delay = 0,
  duration = 0.3,
  direction = 'up',
  stagger = false,
  staggerDelay = 0.05,
  once = true
}) => {
  const variant = variants[direction];

  if (!variant) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      variants={variant}
      initial="hidden"
      animate="visible"
      transition={{
        delay: delay + (stagger ? staggerDelay : 0),
        duration,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      viewport={{ once, margin: "-50px" }}
      style={{ willChange: 'opacity, transform, filter' }}
    >
      {children}
    </motion.div>
  );
});

AnimatedContainer.displayName = 'AnimatedContainer';

export const StaggerContainer = memo<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
  staggerDelay?: number;
}>(({ children, className, delay = 0, staggerDelay = 0.05 }) => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delay,
        staggerChildren: staggerDelay,
        delayChildren: delay
      }
    }
  };

  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 20,
      filter: 'blur(4px)'
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
        filter: { duration: 0.2 }
      }
    }
  };

  return (
    <motion.div
      className={cn(className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      viewport={{ once: true, margin: "-50px" }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={itemVariants}
          style={{ willChange: 'opacity, transform, filter' }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
});

StaggerContainer.displayName = 'StaggerContainer';
