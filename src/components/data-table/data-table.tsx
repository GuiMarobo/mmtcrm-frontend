import { useState, useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTablePagination } from './data-table-pagination'
import { useDebounce } from '@/hooks/use-debounce'
import { usePagination } from '@/hooks/use-pagination'
import { Search } from 'lucide-react'

export interface Column<T> {
  header: string
  accessor: keyof T | ((row: T) => React.ReactNode)
  searchable?: boolean
  className?: string
}

export interface FilterConfig {
  key: string
  label: string
  options: { label: string; value: string }[]
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  filters?: FilterConfig[]
  searchPlaceholder?: string
  pageSize?: number
  onRowClick?: (row: T) => void
  emptyState?: React.ReactNode
}

export function DataTable<T extends { id: string | number }>({ columns, data, filters = [], searchPlaceholder = 'Buscar...', pageSize = 10, onRowClick, emptyState }: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const debouncedSearch = useDebounce(search)

  const filteredData = useMemo(() => {
    let result = data
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter((row) =>
        columns.some((col) => {
          if (!col.searchable || typeof col.accessor === 'function') return false
          return String(row[col.accessor] ?? '').toLowerCase().includes(q)
        })
      )
    }
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value && value !== '_all') {
        result = result.filter((row) => String((row as Record<string, unknown>)[key]) === value)
      }
    })
    return result
  }, [data, debouncedSearch, activeFilters, columns])

  const { currentPage, totalPages, paginatedData, goToPage, total } = usePagination(filteredData, pageSize)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A1A1A6]" />
          <Input placeholder={searchPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white border-[#D2D2D7] rounded-lg h-10" />
        </div>
        {filters.map((f) => (
          <Select key={f.key} value={activeFilters[f.key] || '_all'} onValueChange={(v) => setActiveFilters((prev) => ({ ...prev, [f.key]: v }))}>
            <SelectTrigger className="w-full sm:w-[180px] bg-white border-[#D2D2D7] rounded-lg h-10 cursor-pointer">
              <SelectValue placeholder={f.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos</SelectItem>
              {f.options.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
            </SelectContent>
          </Select>
        ))}
      </div>

      {filteredData.length === 0 ? (
        emptyState || <div className="rounded-2xl border border-[#D2D2D7] bg-white py-16 text-center text-sm text-[#6E6E73]">Nenhum resultado encontrado.</div>
      ) : (
        <div className="rounded-2xl border border-[#D2D2D7] bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[#D2D2D7] bg-[#F5F5F7]/60 hover:bg-[#F5F5F7]/60">
                {columns.map((col, i) => (
                  <TableHead key={i} className={`text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73] ${col.className || ''}`}>{col.header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row) => (
                <TableRow key={row.id} onClick={() => onRowClick?.(row)} className={`border-[#D2D2D7]/50 transition-colors duration-150 ${onRowClick ? 'cursor-pointer hover:bg-[#0071E3]/[0.03]' : 'hover:bg-[#F5F5F7]/40'}`}>
                  {columns.map((col, i) => (
                    <TableCell key={i} className={`text-sm text-[#1D1D1F] ${col.className || ''}`}>
                      {typeof col.accessor === 'function' ? col.accessor(row) : String(row[col.accessor] ?? '\u2014')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && <DataTablePagination currentPage={currentPage} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={goToPage} />}
    </div>
  )
}
