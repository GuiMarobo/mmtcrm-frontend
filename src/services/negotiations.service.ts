import { api } from '@/lib/api'
import type { Negotiation, CreateNegotiationDto, UpdateNegotiationDto } from '@/types'

export const negotiationsService = {
  findAll(): Promise<Negotiation[]> {
    return api.get<Negotiation[]>('/negotiations').then((r) => r.data)
  },
  create(dto: CreateNegotiationDto): Promise<Negotiation> {
    return api.post<Negotiation>('/negotiations', dto).then((r) => r.data)
  },
  update(id: string, dto: UpdateNegotiationDto): Promise<Negotiation> {
    return api.patch<Negotiation>(`/negotiations/${id}`, dto).then((r) => r.data)
  },
  remove(id: string): Promise<Negotiation> {
    return api.delete<Negotiation>(`/negotiations/${id}`).then((r) => r.data)
  },
}
