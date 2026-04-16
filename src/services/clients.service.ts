import { api } from '@/lib/api'
import type { Client, CreateClientDto, UpdateClientDto } from '@/types'

export const clientsService = {
  findAll(): Promise<Client[]> {
    return api.get<Client[]>('/clients').then((r) => r.data)
  },
  create(dto: CreateClientDto): Promise<Client> {
    return api.post<Client>('/clients', dto).then((r) => r.data)
  },
  update(id: string, dto: UpdateClientDto): Promise<Client> {
    return api.patch<Client>(`/clients/${id}`, dto).then((r) => r.data)
  },
  remove(id: string): Promise<Client> {
    return api.delete<Client>(`/clients/${id}`).then((r) => r.data)
  },
}
