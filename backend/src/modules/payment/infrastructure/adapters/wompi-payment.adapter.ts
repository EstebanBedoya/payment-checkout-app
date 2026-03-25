import { Injectable } from '@nestjs/common'
import { createHash } from 'crypto'
import { ok, err, type Result } from '../../../../shared/result'
import { type DomainError, Errors } from '../../../../shared/domain-errors'
import type { IPaymentGateway } from '../../domain/payment-gateway.port'
import type { CreateTransactionParams, WompiTransaction } from '../../domain/payment.types'

export interface WompiAdapterConfig {
  apiUrl: string
  publicKey: string
  /** ⚠️ Solo viaja en el header Authorization: Bearer — nunca en el body ni en logs */
  privateKey: string
  /** ⚠️ Solo se usa para computar el hash — nunca se envía directamente */
  integrityKey: string
}

@Injectable()
export class WompiPaymentAdapter implements IPaymentGateway {
  constructor(private readonly config: WompiAdapterConfig) {}

  async createTransaction(
    params: CreateTransactionParams,
  ): Promise<Result<WompiTransaction, DomainError>> {
    try {
      // Integrity hash: SHA256(reference + amountInCents + currency + integrityKey)
      // integrityKey nunca sale del backend
      const integrityHash = createHash('sha256')
        .update(
          `${params.reference}${params.amountInCents}${params.currency}${this.config.integrityKey}`,
        )
        .digest('hex')

      // privateKey SOLO en el header — nunca en el body
      const response = await fetch(`${this.config.apiUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.privateKey}`,
        },
        body: JSON.stringify({
          amount_in_cents: params.amountInCents,
          currency: params.currency,
          customer_email: params.customerEmail,
          reference: params.reference,
          payment_method: {
            type: 'CARD',
            installments: params.installments,
            token: params.cardTokenId,
          },
          acceptance_token: params.acceptanceToken,
          signature: integrityHash,
        }),
      })

      if (!response.ok) {
        if (response.status === 422) return err(Errors.invalidCardToken())
        if (response.status === 401) return err(Errors.invalidAcceptanceToken())
        return err(Errors.paymentGatewayUnavailable())
      }

      const { data } = await response.json()
      return ok(this.mapTransaction(data))
    } catch {
      return err(Errors.paymentGatewayUnavailable())
    }
  }

  async getTransactionStatus(
    wompiId: string,
  ): Promise<Result<WompiTransaction, DomainError>> {
    try {
      const response = await fetch(`${this.config.apiUrl}/transactions/${wompiId}`, {
        headers: { Authorization: `Bearer ${this.config.privateKey}` },
      })

      if (!response.ok) return err(Errors.paymentGatewayUnavailable())

      const { data } = await response.json()
      return ok(this.mapTransaction(data))
    } catch {
      return err(Errors.paymentGatewayUnavailable())
    }
  }

  private mapTransaction(data: Record<string, unknown>): WompiTransaction {
    return {
      id: data.id as string,
      status: data.status as WompiTransaction['status'],
      reference: data.reference as string,
      amountInCents: data.amount_in_cents as number,
    }
  }
}
