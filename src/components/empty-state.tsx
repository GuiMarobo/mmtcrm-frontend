import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#D2D2D7] bg-white/50 px-8 py-16">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F5F7]">
        <Icon className="h-7 w-7 text-[#A1A1A6]" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-[#1D1D1F]">{title}</h3>
      <p className="mt-1.5 max-w-sm text-center text-sm text-[#6E6E73]">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-6 cursor-pointer" size="sm">{actionLabel}</Button>
      )}
    </div>
  )
}
