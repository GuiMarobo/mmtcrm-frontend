import type { OrderStatus, PaymentMethod } from './enums'

export interface OrderItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
}

export interface Order {
  id: string
  code: string
  clientId: string
  clientName: string
  vendedorId: string
  vendedorName: string
  negotiationId: string | null
  status: OrderStatus
  paymentMethod: PaymentMethod | null
  totalValue: number
  notes: string | null
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

export interface CreateOrderDto {
  clientId: string
  vendedorId: string
  negotiationId?: string
  status: OrderStatus
  paymentMethod?: PaymentMethod
  totalValue: number
  notes?: string
  items: { productId: string; quantity: number; unitPrice: number }[]
}

export type UpdateOrderDto = Partial<CreateOrderDto>
