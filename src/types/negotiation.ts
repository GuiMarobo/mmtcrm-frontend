import type { NegotiationStatus } from './enums'

export interface NegotiationItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
}

export interface Negotiation {
  id: string
  clientId: string
  clientName: string
  vendedorId: string
  vendedorName: string
  status: NegotiationStatus
  totalValue: number | null
  notes: string | null
  items: NegotiationItem[]
  usedDeviceName: string | null
  createdAt: string
  updatedAt: string
  closedAt: string | null
}

export interface CreateNegotiationDto {
  clientId: string
  vendedorId: string
  status: NegotiationStatus
  totalValue?: number
  notes?: string
  items: { productId: string; quantity: number; unitPrice: number }[]
}

export type UpdateNegotiationDto = Partial<CreateNegotiationDto>
