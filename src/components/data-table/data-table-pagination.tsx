import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  currentPage: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function DataTablePagination({ currentPage, totalPages, total, pageSize, onPageChange }: Props) {
  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, total)

  return (
    <div className="flex items-center justify-between text-sm text-[#6E6E73]">
      <span>Mostrando {start}\u2013{end} de {total}</span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => totalPages <= 7 || p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
          .map((page, idx, arr) => {
            const prev = arr[idx - 1]
            const gap = prev && page - prev > 1
            return (
              <span key={page} className="flex items-center">
                {gap && <span className="px-1 text-[#A1A1A6]">&hellip;</span>}
                <Button variant={page === currentPage ? 'default' : 'ghost'} size="icon" className="h-8 w-8 text-xs cursor-pointer" onClick={() => onPageChange(page)}>
                  {page}
                </Button>
              </span>
            )
          })}
        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
