import type { QuotationStatus } from './enums'

export interface QuotationItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
}

export interface Quotation {
  id: string
  code: string
  clientId: string
  clientName: string
  vendedorId: string
  vendedorName: string
  negotiationId: string | null
  status: QuotationStatus
  subtotal: number
  usedDeviceDiscount: number
  downPayment: number
  totalValue: number
  remainingBalance: number
  installments: number
  installmentValue: number
  interestRate: number
  notes: string | null
  validUntil: string | null
  items: QuotationItem[]
  createdAt: string
  updatedAt: string
}

export interface CalculateQuotationDto {
  items: { productId: string; quantity: number; unitPrice: number }[]
  usedDeviceValue?: number
  downPayment?: number
  installments?: number
  interestRate?: number
}

export interface QuotationResult {
  subtotal: number
  usedDeviceDiscount: number
  downPayment: number
  totalValue: number
  remainingBalance: number
  installments: number
  installmentValue: number
  interestRate: number
}

export interface CreateQuotationDto {
  clientId: string
  vendedorId: string
  negotiationId?: string
  items: { productId: string; quantity: number; unitPrice: number }[]
  usedDeviceValue?: number
  downPayment?: number
  installments?: number
  interestRate?: number
  notes?: string
}
