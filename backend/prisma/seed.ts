import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load .env explicitly
dotenv.config({ path: path.join(__dirname, '../.env') })

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined in .env')
  }

  const adapter = new PrismaPg({ connectionString })
  const prisma = new PrismaClient({ adapter })

  const products = [
    {
      id: 'seed-product-001',
      name: 'Audífonos Premium BT-500',
      description: 'Audífonos inalámbricos con cancelación activa de ruido, 30h batería, audio Hi-Fi.',
      imageUrl: '/products/product-001.png',
      priceInCents: 15000000,
      stock: 10,
    },
    {
      id: 'seed-product-002',
      name: 'Reloj Inteligente Sport X',
      description: 'GPS integrado, monitor de ritmo cardíaco, resistente al agua 50m y batería de 10 días.',
      imageUrl: '/products/product-002.png',
      priceInCents: 45000000,
      stock: 15,
    },
    {
      id: 'seed-product-003',
      name: 'Cámara Mirrorless 4K',
      description: 'Sensor de 24.2MP, grabación 4K, enfoque automático ultra rápido y lente 16-50mm.',
      imageUrl: '/products/product-003.png',
      priceInCents: 280000000,
      stock: 5,
    },
    {
      id: 'seed-product-004',
      name: 'Teclado Mecánico RGB',
      description: 'Switches mecánicos táctiles, iluminación RGB personalizable por tecla, cuerpo de aluminio.',
      imageUrl: '/products/product-004.png',
      priceInCents: 35000000,
      stock: 20,
    },
    {
      id: 'seed-product-005',
      name: 'Mouse Gamer Inalámbrico',
      description: 'Sensor de 16000 DPI, latencia ultra baja, diseño ergonómico y 60h de batería.',
      imageUrl: '/products/product-005.png',
      priceInCents: 22000000,
      stock: 25,
    },
    {
      id: 'seed-product-006',
      name: 'Monitor Curvo 27" QHD',
      description: 'Resolución QHD, 144Hz, tiempo de respuesta de 1ms, compatible con FreeSync.',
      imageUrl: '/products/product-006.png',
      priceInCents: 110000000,
      stock: 8,
    },
    {
      id: 'seed-product-007',
      name: 'Mochila Tecnológica Elite',
      description: 'Compartimento para laptop de 15.6", puertos USB externos, material impermeable.',
      imageUrl: '/products/product-007.png',
      priceInCents: 18000000,
      stock: 30,
    },
    {
      id: 'seed-product-008',
      name: 'Silla Ergonómica Pro',
      description: 'Soporte lumbar ajustable, reposacabezas, reposabrazos 4D y base de metal.',
      imageUrl: '/products/product-008.png',
      priceInCents: 85000000,
      stock: 12,
    },
    {
      id: 'seed-product-009',
      name: 'Lámpara de Escritorio LED',
      description: 'Carga inalámbrica para móvil, 5 modos de color, control táctil y temporizador.',
      imageUrl: '/products/product-009.png',
      priceInCents: 12500000,
      stock: 40,
    },
    {
      id: 'seed-product-010',
      name: 'Micrófono USB Studio',
      description: 'Micrófono de condensador profesional, patrón cardioide, incluye filtro pop.',
      imageUrl: '/products/product-010.png',
      priceInCents: 42000000,
      stock: 18,
    },
  ]

  console.log('Beginning seeding process with local images...')

  for (const product of products) {
    try {
      await prisma.product.upsert({
        where: { id: product.id },
        update: product,
        create: product,
      })
      console.log(`✓ Product "${product.name}" seeded with local image path.`)
    } catch (error) {
      console.error(`✗ Error seeding product "${product.name}":`, error)
    }
  }

  console.log('Seed process complete ✓')
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  process.exit(1)
})
