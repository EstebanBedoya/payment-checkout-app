export type DomainErrorCode =
  | 'PRODUCT_NOT_FOUND'
  | 'STOCK_UNAVAILABLE'
  | 'CUSTOMER_NOT_FOUND'
  | 'TRANSACTION_NOT_FOUND'
  | 'DELIVERY_NOT_FOUND'
  | 'INVALID_CARD_TOKEN'
  | 'INVALID_ACCEPTANCE_TOKEN'
  | 'PAYMENT_GATEWAY_UNAVAILABLE'
  | 'VALIDATION_ERROR'

export class DomainError {
  constructor(readonly code: DomainErrorCode, readonly message: string) {}
}

export const Errors = {
  productNotFound: () => new DomainError('PRODUCT_NOT_FOUND', 'Product not found'),
  customerNotFound: () => new DomainError('CUSTOMER_NOT_FOUND', 'Customer not found'),
  stockUnavailable: () => new DomainError('STOCK_UNAVAILABLE', 'Product out of stock'),
  transactionNotFound: () => new DomainError('TRANSACTION_NOT_FOUND', 'Transaction not found'),
  deliveryNotFound: () => new DomainError('DELIVERY_NOT_FOUND', 'Delivery not found'),
  invalidCardToken: () => new DomainError('INVALID_CARD_TOKEN', 'Card token is invalid or expired'),
  invalidAcceptanceToken: () => new DomainError('INVALID_ACCEPTANCE_TOKEN', 'Acceptance token expired, please re-accept terms'),
  paymentGatewayUnavailable: () => new DomainError('PAYMENT_GATEWAY_UNAVAILABLE', 'Payment gateway is temporarily unavailable'),
  validationError: (msg: string) => new DomainError('VALIDATION_ERROR', msg),
}
