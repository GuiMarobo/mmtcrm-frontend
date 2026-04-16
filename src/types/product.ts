import type { ProductCategory, ProductStatus } from './enums'

export interface Product {
  id: string
  name: string
  category: ProductCategory
  brand: string
  model: string | null
  storage: string | null
  color: string | null
  price: number
  stock: number
  status: ProductStatus
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateProductDto {
  name: string
  category: ProductCategory
  price: number
  stock: number
  status: ProductStatus
  brand?: string
  model?: string
  storage?: string
  color?: string
  description?: string
}

export type UpdateProductDto = Partial<CreateProductDto>
