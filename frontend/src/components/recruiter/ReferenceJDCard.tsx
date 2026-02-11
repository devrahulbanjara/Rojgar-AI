import React from 'react'
import { ListChecks, Briefcase, Copy } from 'lucide-react'
import { cn } from '../../lib/utils'
import { ReferenceJD } from '../../services/referenceJDService'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Badge,
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui'

interface ReferenceJDCardProps {
  jd: ReferenceJD
  onClick?: () => void
  onUseTemplate?: (e: React.MouseEvent) => void
  className?: string
}

export function ReferenceJDCard({ jd, onClick, onUseTemplate, className }: ReferenceJDCardProps) {
  const jobResponsibilities = jd.job_responsibilities || []
  const requiredQualifications = jd.required_qualifications || jd.requiredSkillsAndExperience || []
  const summary = jd.job_summary || jd.role_overview || 'No description available'

  const handleUseTemplate = (e: React.MouseEvent) => {
    e.stopPropagation()
    onUseTemplate?.(e)
  }

  return (
    <Card
      onClick={onClick}
      className={cn(
        'group cursor-pointer border-border-default hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-300 shadow-sm flex flex-col bg-background-surface hover:shadow-md hover:-translate-y-0.5',
        className
      )}
    >
      <CardHeader className="space-y-4 pb-4">
        {/* Header Badges */}
        <div className="flex gap-2">
          {jd.department && (
            <Badge variant="subtle" colorPalette="blue" className="border-none font-medium h-6">
              {jd.department}
            </Badge>
          )}
          <Badge variant="subtle" colorPalette="purple" className="border-none font-medium h-6">
            Template
          </Badge>
        </div>

        {/* AI Description Snippet */}
        <p className="text-sm text-text-secondary leading-relaxed line-clamp-3 font-medium">
          {summary}
        </p>
      </CardHeader>

      <CardContent className="space-y-5 flex-grow">
        {/* Responsibilities & Requirements Stats */}
        <div className="flex items-center gap-4 text-xs font-semibold text-text-muted">
          <div className="flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-text-tertiary" />
            <span>{jobResponsibilities.length} responsibilities</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ListChecks className="w-4 h-4 text-text-tertiary" />
            <span>{requiredQualifications.length} requirements</span>
          </div>
        </div>

        {/* Quick-Glance Requirement Tags */}
        {requiredQualifications.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {requiredQualifications.slice(0, 2).map((tag, i) => (
              <Badge
                key={i}
                variant="outline"
                colorPalette="gray"
                className="font-normal truncate max-w-[150px]"
                title={tag}
              >
                {tag}
              </Badge>
            ))}

            {requiredQualifications.length > 2 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="subtle" colorPalette="blue" className="cursor-help">
                      +{requiredQualifications.length - 2} more
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="max-w-xs space-y-1 py-1">
                      <p className="text-xs font-bold mb-1 border-b border-border-default pb-1">
                        Additional Requirements
                      </p>
                      {requiredQualifications.slice(2, 7).map((req, idx) => (
                        <p key={idx} className="text-[11px] leading-tight">
                          • {req}
                        </p>
                      ))}
                      {requiredQualifications.length > 7 && (
                        <p className="text-[11px] text-text-muted italic">
                          and {requiredQualifications.length - 7} more...
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-2 p-6">
        {/* Primary Action */}
        <Button
          variant="outline"
          onClick={handleUseTemplate}
          className="w-full justify-center gap-2 text-primary-600 dark:text-primary-400 border-primary-100 dark:border-primary-900 bg-primary-50/30 dark:bg-primary-950/10 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-600 transition-colors"
        >
          <Copy className="w-4 h-4" />
          Use Template
        </Button>
      </CardFooter>
    </Card>
  )
}
