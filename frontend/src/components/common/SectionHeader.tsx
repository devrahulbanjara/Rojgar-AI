import React from 'react'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  className?: string
  centered?: boolean
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  className = '',
  centered = false,
}) => {
  const alignmentClass = centered ? 'text-center' : 'text-center md:text-left'

  return (
    <div className={`space-y-2 ${alignmentClass} ${className}`}>
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      {subtitle && <p className="text-slate-600">{subtitle}</p>}
    </div>
  )
}
