import React from 'react'

interface DashboardHeaderProps {
  title: string
  subtitle?: string
  className?: string
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  className = '',
}) => {
  return (
    <div className={`mb-12 ${className}`}>
      <h1 className="text-4xl max-lg:text-3xl font-bold text-text-primary leading-tight">
        {title}
      </h1>
      {subtitle && <p className="text-base text-text-secondary mt-2 leading-relaxed">{subtitle}</p>}
    </div>
  )
}
