import { cn } from '@/lib/utils'

type BadgeVariant = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'gray'

const variantStyles: Record<BadgeVariant, string> = {
  blue: 'bg-[#EBF5FF] text-[#0071E3]',
  green: 'bg-[#E8F8EF] text-[#28A745]',
  yellow: 'bg-[#FFF8E6] text-[#F5A623]',
  red: 'bg-[#FFEBEE] text-[#FF3B30]',
  purple: 'bg-[#F3E8FF] text-[#8B5CF6]',
  orange: 'bg-[#FFF3E0] text-[#F97316]',
  gray: 'bg-[#F5F5F7] text-[#6E6E73]',
}

export function StatusBadge({ variant, children, className }: { variant: BadgeVariant; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide whitespace-nowrap', variantStyles[variant], className)}>
      {children}
    </span>
  )
}
