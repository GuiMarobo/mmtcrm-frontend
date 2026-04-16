import { api } from '@/lib/api'
import type { Quotation, CreateQuotationDto } from '@/types'

export const quotationsService = {
  findAll(): Promise<Quotation[]> {
    return api.get<Quotation[]>('/quotations').then((r) => r.data)
  },
  create(dto: CreateQuotationDto): Promise<Quotation> {
    return api.post<Quotation>('/quotations', dto).then((r) => r.data)
  },
  update(id: string, dto: Partial<CreateQuotationDto>): Promise<Quotation> {
    return api.patch<Quotation>(`/quotations/${id}`, dto).then((r) => r.data)
  },
  remove(id: string): Promise<Quotation> {
    return api.delete<Quotation>(`/quotations/${id}`).then((r) => r.data)
  },
}
