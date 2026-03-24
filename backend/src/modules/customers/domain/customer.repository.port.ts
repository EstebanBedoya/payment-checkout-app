import { Customer } from './customer.entity'

export interface ICustomerRepository {
  upsertByEmail(data: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer>
}
