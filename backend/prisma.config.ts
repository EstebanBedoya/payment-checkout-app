import { config } from 'dotenv'
import path from 'node:path'
import { defineConfig } from 'prisma/config'

config({ path: path.resolve(__dirname, '.env') })

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    seed: 'ts-node --project tsconfig.json prisma/seed.ts',
  },
})
