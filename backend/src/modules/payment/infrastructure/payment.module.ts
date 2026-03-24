import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { WompiPaymentAdapter, type WompiAdapterConfig } from './adapters/wompi-payment.adapter'

@Module({
  providers: [
    {
      provide: 'IPaymentGateway',
      useFactory: (configService: ConfigService): WompiPaymentAdapter => {
        const config: WompiAdapterConfig = {
          apiUrl: configService.getOrThrow<string>('WOMPI_API_URL'),
          publicKey: configService.getOrThrow<string>('WOMPI_PUBLIC_KEY'),
          privateKey: configService.getOrThrow<string>('WOMPI_PRIVATE_KEY'),
          integrityKey: configService.getOrThrow<string>('WOMPI_INTEGRITY_KEY'),
        }
        return new WompiPaymentAdapter(config)
      },
      inject: [ConfigService],
    },
  ],
  exports: ['IPaymentGateway'],
})
export class PaymentModule {}
