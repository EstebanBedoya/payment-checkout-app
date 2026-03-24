import { Injectable, Inject } from '@nestjs/common'
import { ok, err, Result } from '../../../../shared/result'
import { DomainError, Errors } from '../../../../shared/domain-errors'
import { Customer } from '../../domain/customer.entity'
import type { ICustomerRepository } from '../../domain/customer.repository.port'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

@Injectable()
export class UpsertCustomerUseCase {
  constructor(@Inject('ICustomerRepository') private readonly repo: ICustomerRepository) {}

  async execute(input: Omit<Customer, 'id' | 'createdAt'>): Promise<Result<Customer, DomainError>> {
    if (!EMAIL_RE.test(input.email)) return err(Errors.validationError('Invalid email format'))
    if (!input.phone || input.phone.replace(/\D/g, '').length < 7)
      return err(Errors.validationError('Phone must have at least 7 digits'))
    const customer = await this.repo.upsertByEmail(input)
    return ok(customer)
  }
}
