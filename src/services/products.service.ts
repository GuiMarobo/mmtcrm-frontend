import { api } from '@/lib/api'
import type { Product, CreateProductDto, UpdateProductDto } from '@/types'

export const productsService = {
  findAll(): Promise<Product[]> {
    return api.get<Product[]>('/products').then((r) => r.data)
  },
  create(dto: CreateProductDto): Promise<Product> {
    return api.post<Product>('/products', dto).then((r) => r.data)
  },
  update(id: string, dto: UpdateProductDto): Promise<Product> {
    return api.patch<Product>(`/products/${id}`, dto).then((r) => r.data)
  },
  remove(id: string): Promise<Product> {
    return api.delete<Product>(`/products/${id}`).then((r) => r.data)
  },
}
