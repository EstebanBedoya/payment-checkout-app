import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string })
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.product.upsert({
    where: { id: 'seed-product-001' },
    update: {},
    create: {
      id: 'seed-product-001',
      name: 'Audífonos Premium BT-500',
      description: 'Audífonos inalámbricos con cancelación activa de ruido, 30h batería, audio Hi-Fi.',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
      priceInCents: 15000000,
      stock: 10,
    },
  })
  console.log('Seed complete ✓')
}

main().catch(console.error).finally(() => prisma.$disconnect())
