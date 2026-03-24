import { Product } from './product.entity'

export interface IProductRepository {
  findById(id: string): Promise<Product | null>
  findAll(): Promise<Product[]>
  decrementStock(productId: string, tx?: any): Promise<void>
}
