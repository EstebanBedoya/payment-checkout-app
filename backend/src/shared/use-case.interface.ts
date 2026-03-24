import { Result } from './result'
import { DomainError } from './domain-errors'

export interface UseCase<I, O> {
  execute(input: I): Promise<Result<O, DomainError>>
}
