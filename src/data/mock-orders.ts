import { OrderStatus, PaymentMethod } from '@/types'
import type { Order } from '@/types'

export const mockOrders: Order[] = [
  { id: 'ord-001', code: 'PED-001', clientId: 'cli-001', clientName: 'Ana Paula Ribeiro', vendedorId: 'usr-002', vendedorName: 'Lucas Oliveira', negotiationId: 'neg-001', status: OrderStatus.CONCLUIDO, paymentMethod: PaymentMethod.CARTAO_CREDITO, totalValue: 9499, notes: 'Parcelado em 10x no cartão', items: [{ id: 'oi-001', productId: 'prd-001', productName: 'iPhone 15 Pro Max 256GB', quantity: 1, unitPrice: 9499 }], createdAt: '2026-03-18T10:00:00Z', updatedAt: '2026-03-20T10:00:00Z' },
  { id: 'ord-002', code: 'PED-002', clientId: 'cli-007', clientName: 'Gabriela Nunes', vendedorId: 'usr-002', vendedorName: 'Lucas Oliveira', negotiationId: null, status: OrderStatus.PROCESSANDO, paymentMethod: PaymentMethod.PIX, totalValue: 4198, notes: 'Pagamento via PIX com desconto', items: [{ id: 'oi-002', productId: 'prd-007', productName: 'AirPods Pro 2ª Geração', quantity: 2, unitPrice: 2099 }], createdAt: '2026-04-08T10:00:00Z', updatedAt: '2026-04-08T10:00:00Z' },
  { id: 'ord-003', code: 'PED-003', clientId: 'cli-004', clientName: 'Diego Moreira', vendedorId: 'usr-002', vendedorName: 'Lucas Oliveira', negotiationId: null, status: OrderStatus.AGUARDANDO_PAGAMENTO, paymentMethod: PaymentMethod.BOLETO, totalValue: 11499, notes: 'Aguardando compensação do boleto', items: [{ id: 'oi-003', productId: 'prd-004', productName: 'MacBook Air 13" M2', quantity: 1, unitPrice: 11499 }], createdAt: '2026-04-10T10:00:00Z', updatedAt: '2026-04-10T10:00:00Z' },
]
