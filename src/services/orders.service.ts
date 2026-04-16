import { api } from '@/lib/api'
import type { Order, CreateOrderDto, UpdateOrderDto } from '@/types'

export const ordersService = {
  findAll(): Promise<Order[]> {
    return api.get<Order[]>('/orders').then((r) => r.data)
  },
  create(dto: CreateOrderDto): Promise<Order> {
    return api.post<Order>('/orders', dto).then((r) => r.data)
  },
  update(id: string, dto: UpdateOrderDto): Promise<Order> {
    return api.patch<Order>(`/orders/${id}`, dto).then((r) => r.data)
  },
  remove(id: string): Promise<Order> {
    return api.delete<Order>(`/orders/${id}`).then((r) => r.data)
  },
}
