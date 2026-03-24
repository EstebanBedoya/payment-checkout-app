import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(config: ConfigService) {
    const adapter = new PrismaPg({ connectionString: config.get<string>('DATABASE_URL') })
    super({ adapter } as ConstructorParameters<typeof PrismaClient>[0])
  }

  async onModuleInit() {
    await this.$connect()
  }
}
