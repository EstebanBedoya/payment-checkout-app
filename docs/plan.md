# Payment Checkout App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 5-step payment checkout SPA (React 19.1 + Redux Toolkit) backed by a REST API (NestJS + Prisma + PostgreSQL) that tokenizes credit cards via Wompi sandbox and processes transactions end-to-end.

**Architecture:** Backend follows Hexagonal Architecture — all business logic lives in use cases returning `Result<T, E>` (ROP), never in controllers. Wompi is behind `IPaymentGateway` Port (backend) and `IWompiTokenizationAdapter` interface (frontend), swapped for mocks in tests. Frontend persists checkout state in `localStorage` via `redux-persist` for refresh recovery.

**Tech Stack:** React 19.1, Vite, Redux Toolkit, redux-persist, React Testing Library, MSW; NestJS, Prisma, PostgreSQL, Jest, Supertest, nock, Helmet, Swagger.

**Spec:** `docs/spec.md`

---

## Scope note

Backend (Tasks 1–12) and frontend (Tasks 13–22) are independent subsystems. Backend must be running locally before frontend integration tasks. Complete Phase 1 fully before starting Phase 2.

---

## File Map

### Backend (`backend/`)
```
src/
  shared/
    result.ts
    use-case.interface.ts
    domain-errors.ts
    __tests__/result.spec.ts
  modules/
    products/
      domain/product.entity.ts
      domain/product.repository.port.ts
      application/use-cases/get-product.use-case.ts
      application/use-cases/get-products.use-case.ts
      application/use-cases/decrement-stock.use-case.ts
      infrastructure/prisma-product.repository.ts
      infrastructure/products.controller.ts
      infrastructure/products.module.ts
      __tests__/get-product.use-case.spec.ts
      __tests__/get-products.use-case.spec.ts
      __tests__/products.controller.spec.ts
    customers/
      domain/customer.entity.ts
      domain/customer.repository.port.ts
      application/use-cases/upsert-customer.use-case.ts
      infrastructure/prisma-customer.repository.ts
      infrastructure/customers.controller.ts
      infrastructure/customers.module.ts
      __tests__/upsert-customer.use-case.spec.ts
      __tests__/customers.controller.spec.ts
    payment/
      domain/payment-gateway.port.ts
      domain/payment.types.ts
      infrastructure/adapters/wompi-payment.adapter.ts
      infrastructure/adapters/wompi-payment.adapter.mock.ts
      __tests__/wompi-payment.adapter.spec.ts
      payment.module.ts
    transactions/
      domain/transaction.entity.ts
      domain/transaction.repository.port.ts
      application/use-cases/create-transaction.use-case.ts
      application/use-cases/get-transaction.use-case.ts
      infrastructure/prisma-transaction.repository.ts
      infrastructure/transactions.controller.ts
      infrastructure/transactions.module.ts
      __tests__/create-transaction.use-case.spec.ts
      __tests__/get-transaction.use-case.spec.ts
      __tests__/transactions.controller.spec.ts
    deliveries/
      domain/delivery.entity.ts
      domain/delivery.repository.port.ts
      application/use-cases/get-delivery.use-case.ts
      infrastructure/prisma-delivery.repository.ts
      infrastructure/deliveries.controller.ts
      infrastructure/deliveries.module.ts
      __tests__/get-delivery.use-case.spec.ts
  app.module.ts
  main.ts
prisma/schema.prisma
prisma/seed.ts
.env.example
jest.config.ts
```

### Frontend (`frontend/`)
```
src/
  adapters/wompi/
    wompi-tokenization.interface.ts
    wompi-tokenization.adapter.ts
    wompi-tokenization.mock.ts
    wompi-tokenization.adapter.spec.ts
  store/
    index.ts
    checkout/checkout.slice.ts
    checkout/checkout.selectors.ts
    checkout/checkout.slice.spec.ts
    product/product.slice.ts
    product/product.selectors.ts
    product/product.thunks.ts
    product/product.slice.spec.ts
    payment/payment.slice.ts
    payment/payment.selectors.ts
    payment/payment.thunks.ts
    payment/payment.slice.spec.ts
  api/products.api.ts
  api/customers.api.ts
  api/transactions.api.ts
  utils/luhn.ts
  utils/luhn.spec.ts
  utils/currency.ts
  utils/currency.spec.ts
  hooks/useCheckoutStep.ts
  hooks/useCardDetection.ts
  components/CardNetworkLogo/CardNetworkLogo.tsx
  components/CardNetworkLogo/CardNetworkLogo.spec.tsx
  components/CreditCardForm/CreditCardForm.tsx
  components/CreditCardForm/CreditCardForm.spec.tsx
  components/DeliveryForm/DeliveryForm.tsx
  components/DeliveryForm/DeliveryForm.spec.tsx
  components/SummaryBackdrop/SummaryBackdrop.tsx
  components/SummaryBackdrop/SummaryBackdrop.spec.tsx
  pages/ProductPage/ProductPage.tsx
  pages/ProductPage/ProductPage.spec.tsx
  pages/CheckoutPage/CheckoutPage.tsx
  pages/CheckoutPage/CheckoutPage.spec.tsx
  pages/StatusPage/StatusPage.tsx
  pages/StatusPage/StatusPage.spec.tsx
  App.tsx
  App.spec.tsx
  main.tsx
jest.config.ts
jest.setup.ts
vite.config.ts
.env.example
```

---

## PHASE 1: BACKEND

---

### Task 1: Scaffold NestJS project

**Files:** `backend/` (new project), `backend/.env.example`, `backend/jest.config.ts`

- [x] **Step 1: Create project**
```bash
cd /Users/ebedoya/Projects/wompi-test/payment-checkout-app
npx @nestjs/cli new backend --package-manager npm --skip-git
cd backend
```

- [x] **Step 2: Install runtime dependencies**
```bash
npm install @prisma/client @nestjs/config class-validator class-transformer helmet @nestjs/swagger swagger-ui-express uuid
npm install -D prisma @types/uuid ts-jest jest @types/jest supertest @types/supertest nock @types/nock
```

- [x] **Step 3: Replace `backend/jest.config.ts`**
```typescript
import type { Config } from 'jest'
const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: ['**/*.(t|j)s', '!**/node_modules/**', '!**/*.module.ts', '!**/main.ts'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageThreshold: { global: { lines: 80, branches: 80, functions: 80, statements: 80 } },
}
export default config
```

- [x] **Step 4: Create `backend/.env.example`**
```
DATABASE_URL=postgresql://user:password@localhost:5432/checkout_db
WOMPI_API_URL=https://api-sandbox.co.uat.wompi.dev/v1
WOMPI_PUBLIC_KEY=pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7
WOMPI_PRIVATE_KEY=prv_stagtest_5i0ZGIGiFcDQifYsXxvsny7Y37tKqFWg
WOMPI_INTEGRITY_KEY=stagtest_integrity_nAIBuqayW70XpUqJS4qf4STYiISd89Fp
BASE_FEE_CENTS=300000
DELIVERY_FEE_CENTS=500000
PORT=3001
FRONTEND_URL=http://localhost:5173
```

- [x] **Step 5: Copy and fill `.env`, run tests**
```bash
cp .env.example .env
npm test
```
Expected: boilerplate tests pass.

- [x] **Step 6: Commit**
```bash
git add backend/ && git commit -m "feat(backend): scaffold NestJS project"
```

---

### Task 2: ROP primitives

**Files:**
- Create: `backend/src/shared/result.ts`
- Create: `backend/src/shared/domain-errors.ts`
- Create: `backend/src/shared/use-case.interface.ts`
- Create: `backend/src/shared/__tests__/result.spec.ts`

- [x] **Step 1: Write failing test**
```typescript
// backend/src/shared/__tests__/result.spec.ts
import { ok, err } from '../result'

describe('Result', () => {
  it('ok() has tag ok and exposes value', () => {
    const r = ok(42)
    expect(r._tag).toBe('ok')
    expect(r.value).toBe(42)
    expect(r.isOk()).toBe(true)
    expect(r.isErr()).toBe(false)
  })

  it('err() has tag err and exposes error', () => {
    const r = err('boom')
    expect(r._tag).toBe('err')
    expect(r.error).toBe('boom')
    expect(r.isOk()).toBe(false)
    expect(r.isErr()).toBe(true)
  })
})
```

- [x] **Step 2: Run — expect FAIL**
```bash
cd backend && npx jest shared/__tests__/result.spec.ts --no-coverage
```

- [x] **Step 3: Implement `result.ts`**
```typescript
// backend/src/shared/result.ts
export type Result<T, E> = Ok<T> | Err<E>

export class Ok<T> {
  readonly _tag = 'ok' as const
  constructor(readonly value: T) {}
  isOk(): this is Ok<T> { return true }
  isErr(): this is Err<never> { return false }
}

export class Err<E> {
  readonly _tag = 'err' as const
  constructor(readonly error: E) {}
  isOk(): this is Ok<never> { return false }
  isErr(): this is Err<E> { return true }
}

export const ok = <T>(value: T): Ok<T> => new Ok(value)
export const err = <E>(error: E): Err<E> => new Err(error)
```

- [x] **Step 4: Implement `domain-errors.ts`**
```typescript
// backend/src/shared/domain-errors.ts
export type DomainErrorCode =
  | 'PRODUCT_NOT_FOUND' | 'STOCK_UNAVAILABLE'
  | 'TRANSACTION_NOT_FOUND' | 'DELIVERY_NOT_FOUND'
  | 'INVALID_CARD_TOKEN' | 'INVALID_ACCEPTANCE_TOKEN'
  | 'PAYMENT_GATEWAY_UNAVAILABLE' | 'VALIDATION_ERROR'

export class DomainError {
  constructor(readonly code: DomainErrorCode, readonly message: string) {}
}

export const Errors = {
  productNotFound: () => new DomainError('PRODUCT_NOT_FOUND', 'Product not found'),
  stockUnavailable: () => new DomainError('STOCK_UNAVAILABLE', 'Product out of stock'),
  transactionNotFound: () => new DomainError('TRANSACTION_NOT_FOUND', 'Transaction not found'),
  deliveryNotFound: () => new DomainError('DELIVERY_NOT_FOUND', 'Delivery not found'),
  invalidCardToken: () => new DomainError('INVALID_CARD_TOKEN', 'Card token is invalid or expired'),
  invalidAcceptanceToken: () => new DomainError('INVALID_ACCEPTANCE_TOKEN', 'Acceptance token expired, please re-accept terms'),
  paymentGatewayUnavailable: () => new DomainError('PAYMENT_GATEWAY_UNAVAILABLE', 'Payment gateway is temporarily unavailable'),
  validationError: (msg: string) => new DomainError('VALIDATION_ERROR', msg),
}
```

- [x] **Step 5: Implement `use-case.interface.ts`**
```typescript
// backend/src/shared/use-case.interface.ts
import { Result } from './result'
import { DomainError } from './domain-errors'
export interface UseCase<I, O> {
  execute(input: I): Promise<Result<O, DomainError>>
}
```

- [x] **Step 6: Run — expect PASS**
```bash
cd backend && npx jest shared/__tests__/result.spec.ts --no-coverage
```

- [x] **Step 7: Commit**
```bash
git add backend/src/shared/ && git commit -m "feat(backend): add ROP primitives — Result<T,E>, DomainError, UseCase"
```

---

### Task 3: Prisma schema + migration + seed

**Files:** `backend/prisma/schema.prisma`, `backend/prisma/seed.ts`

- [x] **Step 1: Initialize Prisma**
```bash
cd backend && npx prisma init
```

- [x] **Step 2: Write `prisma/schema.prisma`** (full content from `docs/spec.md` §7 — copy exactly as written there)

- [x] **Step 3: Run migration**
```bash
cd backend && npx prisma migrate dev --name init
```
Expected: migration applied, Prisma Client generated.

- [x] **Step 4: Write `prisma/seed.ts`**
```typescript
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

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
```

Add to `backend/package.json`:
```json
"prisma": { "seed": "ts-node prisma/seed.ts" }
```

- [x] **Step 5: Run seed**
```bash
cd backend && npx prisma db seed
```
Expected: "Seed complete ✓"

- [x] **Step 6: Commit**
```bash
git add backend/prisma/ backend/package.json && git commit -m "feat(backend): Prisma schema, migration init, seed product"
```

---

### Task 4: Products module — domain + use cases (TDD)

**Files:**
- Create: `backend/src/modules/products/domain/product.entity.ts`
- Create: `backend/src/modules/products/domain/product.repository.port.ts`
- Create: `backend/src/modules/products/application/use-cases/get-product.use-case.ts`
- Create: `backend/src/modules/products/application/use-cases/get-products.use-case.ts`
- Create: `backend/src/modules/products/application/use-cases/decrement-stock.use-case.ts`
- Create: `backend/src/modules/products/__tests__/get-product.use-case.spec.ts`

- [x] **Step 1: Write failing tests**
```typescript
// backend/src/modules/products/__tests__/get-product.use-case.spec.ts
import { GetProductUseCase } from '../application/use-cases/get-product.use-case'
import { IProductRepository } from '../domain/product.repository.port'

const mockProduct = {
  id: 'p1', name: 'Test', description: 'D',
  imageUrl: 'https://img.com', priceInCents: 10000, stock: 5, createdAt: new Date(),
}

const mockRepo: jest.Mocked<IProductRepository> = {
  findById: jest.fn(), findAll: jest.fn(), decrementStock: jest.fn(),
}

describe('GetProductUseCase', () => {
  let useCase: GetProductUseCase
  beforeEach(() => { jest.clearAllMocks(); useCase = new GetProductUseCase(mockRepo) })

  it('returns Ok(product) when found', async () => {
    mockRepo.findById.mockResolvedValue(mockProduct)
    const r = await useCase.execute({ productId: 'p1' })
    expect(r.isOk()).toBe(true)
    if (r.isOk()) expect(r.value.id).toBe('p1')
  })

  it('returns Err(PRODUCT_NOT_FOUND) when missing', async () => {
    mockRepo.findById.mockResolvedValue(null)
    const r = await useCase.execute({ productId: 'x' })
    expect(r.isErr()).toBe(true)
    if (r.isErr()) expect(r.error.code).toBe('PRODUCT_NOT_FOUND')
  })
})
```

- [x] **Step 2: Run — expect FAIL**
```bash
cd backend && npx jest products/__tests__/get-product.use-case.spec.ts --no-coverage
```

- [x] **Step 3: Implement domain**
```typescript
// backend/src/modules/products/domain/product.entity.ts
export interface Product {
  id: string; name: string; description: string
  imageUrl: string; priceInCents: number; stock: number; createdAt: Date
}
```

```typescript
// backend/src/modules/products/domain/product.repository.port.ts
import { Product } from './product.entity'
export interface IProductRepository {
  findById(id: string): Promise<Product | null>
  findAll(): Promise<Product[]>
  decrementStock(productId: string, tx?: any): Promise<void>
}
```

- [x] **Step 4: Implement use cases**
```typescript
// backend/src/modules/products/application/use-cases/get-product.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import { ok, err, Result } from '../../../../shared/result'
import { DomainError, Errors } from '../../../../shared/domain-errors'
import { Product } from '../../domain/product.entity'
import { IProductRepository } from '../../domain/product.repository.port'

@Injectable()
export class GetProductUseCase {
  constructor(@Inject('IProductRepository') private readonly repo: IProductRepository) {}

  async execute({ productId }: { productId: string }): Promise<Result<Product, DomainError>> {
    const product = await this.repo.findById(productId)
    if (!product) return err(Errors.productNotFound())
    return ok(product)
  }
}
```

```typescript
// backend/src/modules/products/application/use-cases/get-products.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import { ok, Result } from '../../../../shared/result'
import { DomainError } from '../../../../shared/domain-errors'
import { Product } from '../../domain/product.entity'
import { IProductRepository } from '../../domain/product.repository.port'

@Injectable()
export class GetProductsUseCase {
  constructor(@Inject('IProductRepository') private readonly repo: IProductRepository) {}

  async execute(): Promise<Result<Product[], DomainError>> {
    return ok(await this.repo.findAll())
  }
}
```

```typescript
// backend/src/modules/products/application/use-cases/decrement-stock.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import { ok, err, Result } from '../../../../shared/result'
import { DomainError, Errors } from '../../../../shared/domain-errors'
import { IProductRepository } from '../../domain/product.repository.port'

@Injectable()
export class DecrementStockUseCase {
  constructor(@Inject('IProductRepository') private readonly repo: IProductRepository) {}

  async execute({ productId, tx }: { productId: string; tx?: any }): Promise<Result<void, DomainError>> {
    const product = await this.repo.findById(productId)
    if (!product) return err(Errors.productNotFound())
    if (product.stock <= 0) return err(Errors.stockUnavailable())
    await this.repo.decrementStock(productId, tx)
    return ok(undefined)
  }
}
```

- [x] **Step 5: Run — expect PASS**
```bash
cd backend && npx jest products/__tests__/ --no-coverage
```

- [x] **Step 6: Commit**
```bash
git add backend/src/modules/products/ && git commit -m "feat(backend): products domain, ports, use cases (TDD)"
```

---

### Task 5: Products infrastructure — repository + controller

**Files:**
- Create: `backend/src/modules/products/infrastructure/prisma-product.repository.ts`
- Create: `backend/src/modules/products/infrastructure/products.controller.ts`
- Create: `backend/src/modules/products/infrastructure/products.module.ts`
- Create: `backend/src/modules/products/__tests__/products.controller.spec.ts`

- [x] **Step 1: Write failing controller tests**
```typescript
// backend/src/modules/products/__tests__/products.controller.spec.ts
import { Test } from '@nestjs/testing'
import { ProductsController } from '../infrastructure/products.controller'
import { GetProductUseCase } from '../application/use-cases/get-product.use-case'
import { GetProductsUseCase } from '../application/use-cases/get-products.use-case'
import { ok, err } from '../../../shared/result'
import { Errors } from '../../../shared/domain-errors'

const mockGetProduct = { execute: jest.fn() }
const mockGetProducts = { execute: jest.fn() }

describe('ProductsController', () => {
  let controller: ProductsController

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        { provide: GetProductUseCase, useValue: mockGetProduct },
        { provide: GetProductsUseCase, useValue: mockGetProducts },
      ],
    }).compile()
    controller = module.get(ProductsController)
    jest.clearAllMocks()
  })

  it('GET /products returns 200 with product array', async () => {
    mockGetProducts.execute.mockResolvedValue(ok([{ id: 'p1' }]))
    const res = await controller.findAll()
    expect(res).toEqual({ data: [{ id: 'p1' }] })
  })

  it('GET /products/:id returns 200', async () => {
    mockGetProduct.execute.mockResolvedValue(ok({ id: 'p1' }))
    const res = await controller.findOne('p1')
    expect(res).toEqual({ data: { id: 'p1' } })
  })

  it('GET /products/:id throws 404 when not found', async () => {
    mockGetProduct.execute.mockResolvedValue(err(Errors.productNotFound()))
    await expect(controller.findOne('x')).rejects.toMatchObject({ status: 404 })
  })
})
```

- [x] **Step 2: Run — expect FAIL**
```bash
cd backend && npx jest products/__tests__/products.controller.spec.ts --no-coverage
```

- [x] **Step 3: Implement repository**
```typescript
// backend/src/modules/products/infrastructure/prisma-product.repository.ts
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { IProductRepository } from '../domain/product.repository.port'
import { Product } from '../domain/product.entity'

@Injectable()
export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Product | null> {
    return this.prisma.product.findUnique({ where: { id } })
  }

  findAll(): Promise<Product[]> {
    return this.prisma.product.findMany({ orderBy: { createdAt: 'asc' } })
  }

  async decrementStock(productId: string, tx?: any): Promise<void> {
    const client = tx ?? this.prisma
    await client.product.update({
      where: { id: productId },
      data: { stock: { decrement: 1 } },
    })
  }
}
```

Note: Create `backend/src/prisma/prisma.service.ts` and `backend/src/prisma/prisma.module.ts` at this step:
```typescript
// backend/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() { await this.$connect() }
}
```

- [x] **Step 4: Implement controller**
```typescript
// backend/src/modules/products/infrastructure/products.controller.ts
import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { GetProductUseCase } from '../application/use-cases/get-product.use-case'
import { GetProductsUseCase } from '../application/use-cases/get-products.use-case'

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly getProduct: GetProductUseCase,
    private readonly getProducts: GetProductsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all products with stock' })
  async findAll() {
    const r = await this.getProducts.execute()
    if (r.isErr()) throw new HttpException(r.error.message, HttpStatus.INTERNAL_SERVER_ERROR)
    return { data: r.value }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by id' })
  async findOne(@Param('id') id: string) {
    const r = await this.getProduct.execute({ productId: id })
    if (r.isErr()) throw new HttpException({ error: r.error.code, message: r.error.message }, HttpStatus.NOT_FOUND)
    return { data: r.value }
  }
}
```

- [x] **Step 5: Wire module**
```typescript
// backend/src/modules/products/infrastructure/products.module.ts
import { Module } from '@nestjs/common'
import { PrismaModule } from '../../../prisma/prisma.module'
import { ProductsController } from './products.controller'
import { PrismaProductRepository } from './prisma-product.repository'
import { GetProductUseCase } from '../application/use-cases/get-product.use-case'
import { GetProductsUseCase } from '../application/use-cases/get-products.use-case'
import { DecrementStockUseCase } from '../application/use-cases/decrement-stock.use-case'

@Module({
  imports: [PrismaModule],
  controllers: [ProductsController],
  providers: [
    { provide: 'IProductRepository', useClass: PrismaProductRepository },
    GetProductUseCase, GetProductsUseCase, DecrementStockUseCase,
  ],
  exports: [GetProductUseCase, DecrementStockUseCase],
})
export class ProductsModule {}
```

- [x] **Step 6: Run — expect PASS**
```bash
cd backend && npx jest products/__tests__/products.controller.spec.ts --no-coverage
```

- [x] **Step 7: Commit**
```bash
git add backend/src/modules/products/infrastructure/ backend/src/prisma/
git commit -m "feat(backend): products repository, controller, module"
```

---

### Task 6: Customers module (TDD)

**Files:** all under `backend/src/modules/customers/`

- [x] **Step 1: Write failing test**
```typescript
// backend/src/modules/customers/__tests__/upsert-customer.use-case.spec.ts
import { UpsertCustomerUseCase } from '../application/use-cases/upsert-customer.use-case'
import { ICustomerRepository } from '../domain/customer.repository.port'

const mockRepo: jest.Mocked<ICustomerRepository> = { upsertByEmail: jest.fn() }
const input = { name: 'Juan', email: 'juan@test.com', phone: '3001234567', address: 'Calle 1', city: 'Bogotá' }
const customer = { id: 'c1', ...input, createdAt: new Date() }

describe('UpsertCustomerUseCase', () => {
  let useCase: UpsertCustomerUseCase
  beforeEach(() => { jest.clearAllMocks(); useCase = new UpsertCustomerUseCase(mockRepo) })

  it('returns Ok(customer) on success', async () => {
    mockRepo.upsertByEmail.mockResolvedValue(customer)
    const r = await useCase.execute(input)
    expect(r.isOk()).toBe(true)
    if (r.isOk()) expect(r.value.email).toBe('juan@test.com')
  })

  it('returns Err(VALIDATION_ERROR) when email invalid', async () => {
    const r = await useCase.execute({ ...input, email: 'not-an-email' })
    expect(r.isErr()).toBe(true)
    if (r.isErr()) expect(r.error.code).toBe('VALIDATION_ERROR')
  })
})
```

- [x] **Step 2: Run — expect FAIL**
```bash
cd backend && npx jest customers/__tests__/ --no-coverage
```

- [x] **Step 3: Implement domain**
```typescript
// backend/src/modules/customers/domain/customer.entity.ts
export interface Customer {
  id: string; name: string; email: string; phone: string
  address: string; city: string; createdAt: Date
}
```

```typescript
// backend/src/modules/customers/domain/customer.repository.port.ts
import { Customer } from './customer.entity'
export interface ICustomerRepository {
  upsertByEmail(data: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer>
}
```

- [x] **Step 4: Implement use case + controller + module** following the same pattern as products (upsert by email, validate email format with regex before calling repo, return `err(Errors.validationError('Invalid email'))` on bad input)

```typescript
// backend/src/modules/customers/application/use-cases/upsert-customer.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import { ok, err, Result } from '../../../../shared/result'
import { DomainError, Errors } from '../../../../shared/domain-errors'
import { Customer } from '../../domain/customer.entity'
import { ICustomerRepository } from '../../domain/customer.repository.port'

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
```

Controller maps: `Ok → 201`, `Err(VALIDATION_ERROR) → 400`.

- [x] **Step 5: Run — expect PASS**
```bash
cd backend && npx jest customers/__tests__/ --no-coverage
```

- [x] **Step 6: Commit**
```bash
git add backend/src/modules/customers/ && git commit -m "feat(backend): customers module — upsert use case, controller (TDD)"
```

---

### Task 7: Payment Port + Wompi adapter (TDD)

**Files:**
- Create: `backend/src/modules/payment/domain/payment-gateway.port.ts`
- Create: `backend/src/modules/payment/domain/payment.types.ts`
- Create: `backend/src/modules/payment/infrastructure/adapters/wompi-payment.adapter.ts`
- Create: `backend/src/modules/payment/infrastructure/adapters/wompi-payment.adapter.mock.ts`
- Create: `backend/src/modules/payment/__tests__/wompi-payment.adapter.spec.ts`

- [x] **Step 1: Write failing tests for adapter**
```typescript
// backend/src/modules/payment/__tests__/wompi-payment.adapter.spec.ts
import nock from 'nock'
import { WompiPaymentAdapter } from '../infrastructure/adapters/wompi-payment.adapter'

const WOMPI_URL = 'https://api-sandbox.co.uat.wompi.dev'
const adapter = new WompiPaymentAdapter({ apiUrl: WOMPI_URL, privateKey: 'prv_test', publicKey: 'pub_test' })

describe('WompiPaymentAdapter', () => {
  afterEach(() => nock.cleanAll())

  it('createTransaction returns Ok on 201', async () => {
    nock(WOMPI_URL).post('/v1/transactions').reply(201, {
      data: { id: 'wt1', status: 'APPROVED', reference: 'ref1', amount_in_cents: 1000 }
    })
    const r = await adapter.createTransaction({
      amountInCents: 1000, reference: 'ref1', cardTokenId: 'tok_1',
      customerEmail: 'a@b.com', installments: 1, acceptanceToken: 'acc1',
      currency: 'COP', description: 'Test',
    })
    expect(r.isOk()).toBe(true)
    if (r.isOk()) expect(r.value.id).toBe('wt1')
  })

  it('createTransaction returns Err(PAYMENT_GATEWAY_UNAVAILABLE) on network error', async () => {
    nock(WOMPI_URL).post('/v1/transactions').replyWithError('Network error')
    const r = await adapter.createTransaction({
      amountInCents: 1000, reference: 'ref2', cardTokenId: 'tok_2',
      customerEmail: 'a@b.com', installments: 1, acceptanceToken: 'acc1',
      currency: 'COP', description: 'Test',
    })
    expect(r.isErr()).toBe(true)
    if (r.isErr()) expect(r.error.code).toBe('PAYMENT_GATEWAY_UNAVAILABLE')
  })
})
```

- [x] **Step 2: Run — expect FAIL**
```bash
cd backend && npx jest payment/__tests__/ --no-coverage
```

- [x] **Step 3: Implement types + port**
```typescript
// backend/src/modules/payment/domain/payment.types.ts
export interface CreateTransactionParams {
  amountInCents: number; reference: string; cardTokenId: string
  customerEmail: string; installments: number; acceptanceToken: string
  currency: string; description: string
}

export interface WompiTransaction {
  id: string; status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR'
  reference: string; amount_in_cents: number
}
```

```typescript
// backend/src/modules/payment/domain/payment-gateway.port.ts
import { Result } from '../../../shared/result'
import { DomainError } from '../../../shared/domain-errors'
import { CreateTransactionParams, WompiTransaction } from './payment.types'

export interface IPaymentGateway {
  createTransaction(params: CreateTransactionParams): Promise<Result<WompiTransaction, DomainError>>
  getTransactionStatus(wompiId: string): Promise<Result<WompiTransaction, DomainError>>
}
```

- [x] **Step 4: Implement real adapter**
```typescript
// backend/src/modules/payment/infrastructure/adapters/wompi-payment.adapter.ts
import { Injectable } from '@nestjs/common'
import { ok, err } from '../../../../shared/result'
import { Errors } from '../../../../shared/domain-errors'
import { IPaymentGateway } from '../../domain/payment-gateway.port'
import { CreateTransactionParams, WompiTransaction } from '../../domain/payment.types'
import { Result } from '../../../../shared/result'
import { DomainError } from '../../../../shared/domain-errors'

interface AdapterConfig { apiUrl: string; privateKey: string; publicKey: string }

@Injectable()
export class WompiPaymentAdapter implements IPaymentGateway {
  constructor(private readonly config: AdapterConfig) {}

  async createTransaction(params: CreateTransactionParams): Promise<Result<WompiTransaction, DomainError>> {
    try {
      const response = await fetch(`${this.config.apiUrl}/v1/transactions`, {
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
          payment_method: { type: 'CARD', installments: params.installments, token: params.cardTokenId },
          acceptance_token: params.acceptanceToken,
        }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        if (response.status === 422) return err(Errors.invalidCardToken())
        if (response.status === 401) return err(Errors.invalidAcceptanceToken())
        return err(Errors.paymentGatewayUnavailable())
      }
      const { data } = await response.json()
      return ok(data as WompiTransaction)
    } catch {
      return err(Errors.paymentGatewayUnavailable())
    }
  }

  async getTransactionStatus(wompiId: string): Promise<Result<WompiTransaction, DomainError>> {
    try {
      const response = await fetch(`${this.config.apiUrl}/v1/transactions/${wompiId}`, {
        headers: { Authorization: `Bearer ${this.config.privateKey}` },
      })
      if (!response.ok) return err(Errors.paymentGatewayUnavailable())
      const { data } = await response.json()
      return ok(data as WompiTransaction)
    } catch {
      return err(Errors.paymentGatewayUnavailable())
    }
  }
}
```

- [x] **Step 5: Implement mock adapter**
```typescript
// backend/src/modules/payment/infrastructure/adapters/wompi-payment.adapter.mock.ts
import { IPaymentGateway } from '../../domain/payment-gateway.port'
import { ok } from '../../../../shared/result'
import { WompiTransaction } from '../../domain/payment.types'

export class WompiPaymentAdapterMock implements IPaymentGateway {
  private _status: WompiTransaction['status'] = 'APPROVED'

  setStatus(status: WompiTransaction['status']) { this._status = status }

  async createTransaction(params: any) {
    return ok<WompiTransaction>({ id: 'mock-wt-id', status: this._status, reference: params.reference, amount_in_cents: params.amountInCents })
  }

  async getTransactionStatus(wompiId: string) {
    return ok<WompiTransaction>({ id: wompiId, status: this._status, reference: 'ref', amount_in_cents: 0 })
  }
}
```

- [x] **Step 6: Run — expect PASS**
```bash
cd backend && npx jest payment/__tests__/ --no-coverage
```

- [x] **Step 7: Commit**
```bash
git add backend/src/modules/payment/ && git commit -m "feat(backend): payment port, Wompi adapter with mock (TDD)"
```

---

### Task 8: Transactions module — CreateTransaction use case (TDD, core business logic)

**Files:**
- Create: `backend/src/modules/transactions/domain/transaction.entity.ts`
- Create: `backend/src/modules/transactions/domain/transaction.repository.port.ts`
- Create: `backend/src/modules/transactions/application/use-cases/create-transaction.use-case.ts`
- Create: `backend/src/modules/transactions/application/use-cases/get-transaction.use-case.ts`
- Create: `backend/src/modules/transactions/__tests__/create-transaction.use-case.spec.ts`

- [x] **Step 1: Write failing tests (ALL branches — 100% coverage required)**
```typescript
// backend/src/modules/transactions/__tests__/create-transaction.use-case.spec.ts
import { CreateTransactionUseCase } from '../application/use-cases/create-transaction.use-case'
import { WompiPaymentAdapterMock } from '../../payment/infrastructure/adapters/wompi-payment.adapter.mock'
import { err } from '../../../shared/result'
import { Errors } from '../../../shared/domain-errors'

const product = { id: 'p1', name: 'X', description: 'D', imageUrl: 'i', priceInCents: 15000000, stock: 5, createdAt: new Date() }
const customer = { id: 'c1', name: 'J', email: 'j@t.com', phone: '123', address: 'A', city: 'B', createdAt: new Date() }

const mockProductRepo = { findById: jest.fn(), findAll: jest.fn(), decrementStock: jest.fn() }
const mockTransactionRepo = { create: jest.fn(), updateStatus: jest.fn(), findById: jest.fn() }
const mockDeliveryRepo = { create: jest.fn(), findByTransactionId: jest.fn() }
const mockPrisma = { $transaction: jest.fn((fn: any) => fn(mockPrisma)) }
const wompiMock = new WompiPaymentAdapterMock()

const baseInput = { customerId: 'c1', productId: 'p1', cardTokenId: 'tok_1', installments: 1, acceptanceToken: 'acc1', customerEmail: 'j@t.com', address: 'Calle 1 #2-3', city: 'Bogotá' }

describe('CreateTransactionUseCase', () => {
  let useCase: CreateTransactionUseCase

  beforeEach(() => {
    jest.clearAllMocks()
    wompiMock.setStatus('APPROVED')
    mockProductRepo.findById.mockResolvedValue(product)
    mockTransactionRepo.create.mockResolvedValue({ id: 'tx1', reference: 'ref1', ...baseInput, status: 'PENDING', amountInCents: 20800000, baseFeeInCents: 300000, deliveryFeeInCents: 500000, wompiTransactionId: null, finalizedAt: null, createdAt: new Date() })
    mockTransactionRepo.updateStatus.mockResolvedValue(undefined)
    mockDeliveryRepo.create.mockResolvedValue({ id: 'd1' })
    useCase = new CreateTransactionUseCase(mockProductRepo as any, mockTransactionRepo as any, mockDeliveryRepo as any, wompiMock, mockPrisma as any, { baseFee: 300000, deliveryFee: 500000 })
  })

  it('returns Err(PRODUCT_NOT_FOUND) when product missing', async () => {
    mockProductRepo.findById.mockResolvedValue(null)
    const r = await useCase.execute(baseInput)
    expect(r.isErr()).toBe(true)
    if (r.isErr()) expect(r.error.code).toBe('PRODUCT_NOT_FOUND')
  })

  it('returns Err(STOCK_UNAVAILABLE) when stock is 0', async () => {
    mockProductRepo.findById.mockResolvedValue({ ...product, stock: 0 })
    const r = await useCase.execute(baseInput)
    expect(r.isErr()).toBe(true)
    if (r.isErr()) expect(r.error.code).toBe('STOCK_UNAVAILABLE')
  })

  it('returns Err(PAYMENT_GATEWAY_UNAVAILABLE) when Wompi fails', async () => {
    wompiMock.setStatus('ERROR')
    // override mock to return err
    jest.spyOn(wompiMock, 'createTransaction').mockResolvedValue(err(Errors.paymentGatewayUnavailable()))
    const r = await useCase.execute(baseInput)
    expect(r.isErr()).toBe(true)
    if (r.isErr()) expect(r.error.code).toBe('PAYMENT_GATEWAY_UNAVAILABLE')
  })

  it('on APPROVED: creates delivery, decrements stock, returns Ok', async () => {
    const r = await useCase.execute(baseInput)
    expect(r.isOk()).toBe(true)
    expect(mockDeliveryRepo.create).toHaveBeenCalledTimes(1)
    expect(mockProductRepo.decrementStock).toHaveBeenCalledWith('p1', mockPrisma)
  })

  it('on DECLINED: does NOT create delivery or decrement stock', async () => {
    wompiMock.setStatus('DECLINED')
    const r = await useCase.execute(baseInput)
    expect(r.isOk()).toBe(true)
    if (r.isOk()) expect(r.value.status).toBe('DECLINED')
    expect(mockDeliveryRepo.create).not.toHaveBeenCalled()
    expect(mockProductRepo.decrementStock).not.toHaveBeenCalled()
  })
})
```

- [x] **Step 2: Run — expect FAIL**
```bash
cd backend && npx jest transactions/__tests__/create-transaction.use-case.spec.ts --no-coverage
```

- [x] **Step 3: Implement domain**
```typescript
// backend/src/modules/transactions/domain/transaction.entity.ts
export type TransactionStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR'
export interface Transaction {
  id: string; reference: string; customerId: string; productId: string
  amountInCents: number; baseFeeInCents: number; deliveryFeeInCents: number
  status: TransactionStatus; wompiTransactionId: string | null
  cardTokenId: string; installments: number; finalizedAt: Date | null; createdAt: Date
  delivery?: any
}
```

```typescript
// backend/src/modules/transactions/domain/transaction.repository.port.ts
import { Transaction, TransactionStatus } from './transaction.entity'
export interface ITransactionRepository {
  create(data: Omit<Transaction, 'id' | 'createdAt' | 'delivery'>): Promise<Transaction>
  updateStatus(id: string, status: TransactionStatus, wompiId?: string): Promise<void>
  findById(id: string): Promise<Transaction | null>
}
```

- [x] **Step 4: Implement CreateTransactionUseCase**
```typescript
// backend/src/modules/transactions/application/use-cases/create-transaction.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import { ok, err, Result } from '../../../../shared/result'
import { DomainError, Errors } from '../../../../shared/domain-errors'
import { Transaction } from '../../domain/transaction.entity'
import { ITransactionRepository } from '../../domain/transaction.repository.port'
import { IProductRepository } from '../../../products/domain/product.repository.port'
import { IDeliveryRepository } from '../../../deliveries/domain/delivery.repository.port'
import { IPaymentGateway } from '../../../payment/domain/payment-gateway.port'
import { v4 as uuid } from 'uuid'

interface CreateTransactionInput {
  customerId: string; productId: string; cardTokenId: string
  installments: number; acceptanceToken: string; customerEmail: string
  address: string; city: string   // delivery address — required, passed from customer data
}

@Injectable()
export class CreateTransactionUseCase {
  constructor(
    @Inject('IProductRepository') private readonly productRepo: IProductRepository,
    @Inject('ITransactionRepository') private readonly txRepo: ITransactionRepository,
    @Inject('IDeliveryRepository') private readonly deliveryRepo: IDeliveryRepository,
    @Inject('IPaymentGateway') private readonly gateway: IPaymentGateway,
    @Inject('PRISMA_SERVICE') private readonly prisma: any,
    @Inject('FEES_CONFIG') private readonly fees: { baseFee: number; deliveryFee: number },
  ) {}

  async execute(input: CreateTransactionInput): Promise<Result<Transaction, DomainError>> {
    // 1. Validate product + stock
    const product = await this.productRepo.findById(input.productId)
    if (!product) return err(Errors.productNotFound())
    if (product.stock <= 0) return err(Errors.stockUnavailable())

    // 2. Calculate amount
    const amountInCents = product.priceInCents + this.fees.baseFee + this.fees.deliveryFee

    // 3. Persist PENDING transaction
    const reference = uuid()
    const transaction = await this.txRepo.create({
      reference, customerId: input.customerId, productId: input.productId,
      amountInCents, baseFeeInCents: this.fees.baseFee, deliveryFeeInCents: this.fees.deliveryFee,
      status: 'PENDING', wompiTransactionId: null, cardTokenId: input.cardTokenId,
      installments: input.installments, finalizedAt: null,
    })

    // 4. Call Wompi
    const paymentResult = await this.gateway.createTransaction({
      amountInCents, reference, cardTokenId: input.cardTokenId,
      customerEmail: input.customerEmail, installments: input.installments,
      acceptanceToken: input.acceptanceToken, currency: 'COP',
      description: `Payment for ${product.name}`,
    })

    if (paymentResult.isErr()) {
      await this.txRepo.updateStatus(transaction.id, 'ERROR')
      return err(paymentResult.error)
    }

    const wompiTx = paymentResult.value

    // 5. Update transaction status
    await this.txRepo.updateStatus(transaction.id, wompiTx.status as any, wompiTx.id)

    // 6. If APPROVED: create delivery + decrement stock atomically
    if (wompiTx.status === 'APPROVED') {
      await this.prisma.$transaction(async (tx: any) => {
        await this.deliveryRepo.create({
          transactionId: transaction.id, productId: input.productId,
          customerId: input.customerId,
          address: input.address,   // from CreateTransactionInput
          city: input.city,         // from CreateTransactionInput
          status: 'PENDING',
        }, tx)
        await this.productRepo.decrementStock(input.productId, tx)
      })
    }

    return ok({ ...transaction, status: wompiTx.status as any, wompiTransactionId: wompiTx.id })
  }
}
```

Note: Delivery address/city must come from input. Update the input type and test accordingly to pass `address` and `city` from the customer data (fetch customer or pass in input). **Preferred approach:** add `address` and `city` to `CreateTransactionInput`, populated from the customer record already created by the frontend step. Update tests to include these fields.

- [x] **Step 5: Run — expect PASS**
```bash
cd backend && npx jest transactions/__tests__/ --no-coverage
```

- [x] **Step 6: Commit**
```bash
git add backend/src/modules/transactions/ && git commit -m "feat(backend): transactions domain + CreateTransaction use case (TDD)"
```

---

### Task 9: Transactions + Deliveries infrastructure

**Files:**
- Create: `backend/src/modules/transactions/infrastructure/prisma-transaction.repository.ts`
- Create: `backend/src/modules/transactions/infrastructure/transactions.controller.ts`
- Create: `backend/src/modules/transactions/infrastructure/transactions.module.ts`
- Create: `backend/src/modules/deliveries/` (full module, same pattern)

- [x] **Step 1: Implement Prisma transaction repository**
```typescript
// backend/src/modules/transactions/infrastructure/prisma-transaction.repository.ts
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { ITransactionRepository } from '../domain/transaction.repository.port'
import { Transaction, TransactionStatus } from '../domain/transaction.entity'

@Injectable()
export class PrismaTransactionRepository implements ITransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Omit<Transaction, 'id' | 'createdAt' | 'delivery'>): Promise<Transaction> {
    return this.prisma.transaction.create({ data }) as any
  }

  async updateStatus(id: string, status: TransactionStatus, wompiId?: string): Promise<void> {
    await this.prisma.transaction.update({
      where: { id },
      data: { status, wompiTransactionId: wompiId ?? undefined, finalizedAt: status !== 'PENDING' ? new Date() : undefined },
    })
  }

  findById(id: string): Promise<Transaction | null> {
    return this.prisma.transaction.findUnique({
      where: { id },
      include: { product: { select: { id: true, name: true } }, customer: { select: { id: true, name: true } }, delivery: true },
    }) as any
  }
}
```

- [x] **Step 2: Implement transactions controller**

Maps results to HTTP per the error catalog in `docs/spec.md` §4:
- `Ok → 201` for POST, `200` for GET
- `PRODUCT_NOT_FOUND → 404`, `STOCK_UNAVAILABLE → 409`, `INVALID_CARD_TOKEN → 400`, `INVALID_ACCEPTANCE_TOKEN → 400`, `PAYMENT_GATEWAY_UNAVAILABLE → 503`, `TRANSACTION_NOT_FOUND → 404`

```typescript
// backend/src/modules/transactions/infrastructure/transactions.controller.ts
import { Controller, Post, Get, Param, Body, HttpException, HttpStatus } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { IsString, IsNumber, IsEmail, Min, IsOptional } from 'class-validator'
import { CreateTransactionUseCase } from '../application/use-cases/create-transaction.use-case'
import { GetTransactionUseCase } from '../application/use-cases/get-transaction.use-case'
import { DomainErrorCode } from '../../../shared/domain-errors'

const ERROR_STATUS: Record<DomainErrorCode, number> = {
  PRODUCT_NOT_FOUND: 404, STOCK_UNAVAILABLE: 409, TRANSACTION_NOT_FOUND: 404,
  DELIVERY_NOT_FOUND: 404, INVALID_CARD_TOKEN: 400, INVALID_ACCEPTANCE_TOKEN: 400,
  PAYMENT_GATEWAY_UNAVAILABLE: 503, VALIDATION_ERROR: 400,
}

export class CreateTransactionDto {
  @IsString() customerId: string
  @IsString() productId: string
  @IsString() cardTokenId: string
  @IsNumber() @Min(1) installments: number
  @IsString() acceptanceToken: string
  @IsEmail() customerEmail: string
  @IsString() address: string
  @IsString() city: string
}

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly createTx: CreateTransactionUseCase,
    private readonly getTx: GetTransactionUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateTransactionDto) {
    const r = await this.createTx.execute(dto)
    if (r.isErr()) throw new HttpException({ error: r.error.code, message: r.error.message }, ERROR_STATUS[r.error.code] ?? 500)
    return { data: r.value }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const r = await this.getTx.execute({ transactionId: id })
    if (r.isErr()) throw new HttpException({ error: r.error.code, message: r.error.message }, 404)
    return { data: r.value }
  }
}
```

- [x] **Step 3: Implement deliveries module** (same pattern — `IDeliveryRepository` port, `PrismaDeliveryRepository`, `GetDeliveryUseCase`, `DeliveriesController` with `GET /deliveries/:transactionId`)

- [x] **Step 4: Wire all modules in `app.module.ts`**
```typescript
// backend/src/app.module.ts
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { ProductsModule } from './modules/products/infrastructure/products.module'
import { CustomersModule } from './modules/customers/infrastructure/customers.module'
import { TransactionsModule } from './modules/transactions/infrastructure/transactions.module'
import { DeliveriesModule } from './modules/deliveries/infrastructure/deliveries.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule, ProductsModule, CustomersModule, TransactionsModule, DeliveriesModule,
  ],
})
export class AppModule {}
```

- [x] **Step 5: Write controller tests + run all backend tests**
```bash
cd backend && npm test -- --coverage
```
Expected: >80% coverage, all tests pass.

- [x] **Step 6: Commit**
```bash
git add backend/src/modules/transactions/infrastructure/ backend/src/modules/deliveries/ backend/src/app.module.ts
git commit -m "feat(backend): transactions + deliveries infrastructure, app module wired"
```

---

### Task 10: Security, Swagger, CORS, validation pipe

**Files:** `backend/src/main.ts`

- [x] **Step 1: Update `main.ts`**
```typescript
// backend/src/main.ts
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import helmet from 'helmet'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.use(helmet({
    contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"] } },
    hsts: { maxAge: 31536000, includeSubDomains: true },
  }))

  app.enableCors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173', credentials: true })

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))

  app.setGlobalPrefix('api/v1')

  const config = new DocumentBuilder()
    .setTitle('Checkout API').setDescription('Payment checkout API').setVersion('1.0')
    .addBearerAuth().build()
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config))

  await app.listen(process.env.PORT ?? 3001)
  console.log(`API running on http://localhost:${process.env.PORT ?? 3001}/api/v1`)
  console.log(`Swagger at http://localhost:${process.env.PORT ?? 3001}/api/docs`)
}
bootstrap()
```

- [x] **Step 2: Start and verify**
```bash
cd backend && npm run start:dev
```
Expected: API running, Swagger at `/api/docs`, `GET /api/v1/products` returns seeded product.

- [x] **Step 3: Commit**
```bash
git add backend/src/main.ts && git commit -m "feat(backend): add Helmet security headers, CORS, ValidationPipe, Swagger"
```

---

## PHASE 2: FRONTEND

---

### Task 11: Scaffold React 19 + Vite + Redux

**Files:** `frontend/` (new project), config files

- [x] **Step 1: Create Vite project**
```bash
cd /Users/ebedoya/Projects/wompi-test/payment-checkout-app
pnpm create vite@latest frontend -- --template react-ts
cd frontend
```

- [x] **Step 2: Install dependencies**
```bash
pnpm install @reduxjs/toolkit react-redux redux-persist
pnpm install react-router-dom
pnpm install -D jest @types/jest ts-jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event msw identity-obj-proxy
```

- [x] **Step 3: Create `frontend/jest.config.ts`**
```typescript
import type { Config } from 'jest'
const config: Config = {
  testEnvironment: 'jsdom',
  transform: { '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }] },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: { '\\.(css|less|scss)$': 'identity-obj-proxy', '\\.(jpg|png|svg|webp)$': '<rootDir>/__mocks__/fileMock.ts' },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/main.tsx', '!src/**/*.d.ts'],
  coverageThreshold: { global: { lines: 80, branches: 80, functions: 80, statements: 80 } },
}
export default config
```

- [x] **Step 4: Create `frontend/jest.setup.ts`**
```typescript
import '@testing-library/jest-dom'
```

- [x] **Step 5: Create `frontend/.env.example`**
```
VITE_API_URL=http://localhost:3001/api/v1
VITE_WOMPI_PUBLIC_KEY=pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7
VITE_WOMPI_API_URL=https://api-sandbox.co.uat.wompi.dev/v1
```

- [x] **Step 6: Copy `.env`, run dev server**
```bash
cp .env.example .env && pnpm run dev
```
Expected: Vite dev server running at `http://localhost:5173`.

- [x] **Step 7: Commit**
```bash
git add frontend/ && git commit -m "feat(frontend): scaffold React 19 + Vite + Redux Toolkit with pnpm"
```

---

### Task 12: Utils — Luhn + currency (TDD)

**Files:**
- Create: `frontend/src/utils/luhn.ts` + `luhn.spec.ts`
- Create: `frontend/src/utils/currency.ts` + `currency.spec.ts`

- [x] **Step 1: Write failing Luhn tests**
```typescript
// frontend/src/utils/luhn.spec.ts
import { validateLuhn, detectCardNetwork } from './luhn'

describe('validateLuhn', () => {
  it('returns true for valid Visa test card', () => expect(validateLuhn('4111111111111111')).toBe(true))
  it('returns true for valid MC test card', () => expect(validateLuhn('5500005555555559')).toBe(true))
  it('returns false for invalid number', () => expect(validateLuhn('1234567890123456')).toBe(false))
  it('returns false for empty string', () => expect(validateLuhn('')).toBe(false))
})

describe('detectCardNetwork', () => {
  it('detects Visa by prefix 4', () => expect(detectCardNetwork('4111111111111111')).toBe('VISA'))
  it('detects MasterCard by prefix 51-55', () => expect(detectCardNetwork('5500005555555559')).toBe('MASTERCARD'))
  it('returns UNKNOWN for unrecognized prefix', () => expect(detectCardNetwork('3714496353984312')).toBe('UNKNOWN'))
})
```

- [x] **Step 2: Run — expect FAIL**
```bash
cd frontend && npx jest src/utils/luhn.spec.ts --no-coverage
```

- [x] **Step 3: Implement `luhn.ts`**
```typescript
// frontend/src/utils/luhn.ts
export function validateLuhn(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '')
  if (!digits.length) return false
  let sum = 0
  let alternate = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10)
    if (alternate) { n *= 2; if (n > 9) n -= 9 }
    sum += n
    alternate = !alternate
  }
  return sum % 10 === 0
}

export type CardNetwork = 'VISA' | 'MASTERCARD' | 'UNKNOWN'

export function detectCardNetwork(cardNumber: string): CardNetwork {
  const digits = cardNumber.replace(/\D/g, '')
  if (/^4/.test(digits)) return 'VISA'
  if (/^5[1-5]/.test(digits)) return 'MASTERCARD'
  return 'UNKNOWN'
}
```

- [x] **Step 4: Implement `currency.ts` + tests**
```typescript
// frontend/src/utils/currency.ts
export function formatCOP(amountInCents: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amountInCents / 100)
}
```

```typescript
// frontend/src/utils/currency.spec.ts
import { formatCOP } from './currency'
it('formats 15000000 cents as COP $150.000', () => {
  expect(formatCOP(15000000)).toMatch(/150.000/)
})
```

- [x] **Step 5: Run — expect PASS**
```bash
cd frontend && npx jest src/utils/ --no-coverage
```

- [x] **Step 6: Commit**
```bash
git add frontend/src/utils/ && git commit -m "feat(frontend): Luhn validation, card network detection, COP formatter (TDD)"
```

---

### Task 13: Wompi tokenization adapter (TDD)

**Files:**
- Create: `frontend/src/adapters/wompi/wompi-tokenization.interface.ts`
- Create: `frontend/src/adapters/wompi/wompi-tokenization.adapter.ts`
- Create: `frontend/src/adapters/wompi/wompi-tokenization.mock.ts`
- Create: `frontend/src/adapters/wompi/wompi-tokenization.adapter.spec.ts`

- [x] **Step 1: Write failing tests**
```typescript
// frontend/src/adapters/wompi/wompi-tokenization.adapter.spec.ts
import { WompiTokenizationAdapter } from './wompi-tokenization.adapter'

const adapter = new WompiTokenizationAdapter({
  publicKey: 'pub_test', apiUrl: 'https://api-sandbox.co.uat.wompi.dev/v1',
})

describe('WompiTokenizationAdapter', () => {
  it('tokenizeCard calls POST /tokens/cards and returns token', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'CREATED', data: { id: 'tok_test_123' } }),
    }) as any

    const r = await adapter.tokenizeCard({ number: '4111111111111111', cvc: '123', expMonth: '12', expYear: '28', cardHolder: 'Test User' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.tokenId).toBe('tok_test_123')
  })

  it('returns error on network failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network')) as any
    const r = await adapter.tokenizeCard({ number: '4111111111111111', cvc: '123', expMonth: '12', expYear: '28', cardHolder: 'Test' })
    expect(r.success).toBe(false)
  })
})
```

- [x] **Step 2: Run — expect FAIL**
```bash
cd frontend && npx jest src/adapters/ --no-coverage
```

- [x] **Step 3: Implement interface + adapter**
```typescript
// frontend/src/adapters/wompi/wompi-tokenization.interface.ts
export interface CardData { number: string; cvc: string; expMonth: string; expYear: string; cardHolder: string }
export type TokenizeResult = { success: true; tokenId: string } | { success: false; error: string }

export interface IWompiTokenizationAdapter {
  tokenizeCard(data: CardData): Promise<TokenizeResult>
  getAcceptanceToken(): Promise<{ success: true; token: string } | { success: false; error: string }>
}
```

```typescript
// frontend/src/adapters/wompi/wompi-tokenization.adapter.ts
import { IWompiTokenizationAdapter, CardData, TokenizeResult } from './wompi-tokenization.interface'

interface Config { publicKey: string; apiUrl: string }

export class WompiTokenizationAdapter implements IWompiTokenizationAdapter {
  constructor(private readonly config: Config) {}

  async tokenizeCard(data: CardData): Promise<TokenizeResult> {
    try {
      const res = await fetch(`${this.config.apiUrl}/tokens/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.config.publicKey}` },
        body: JSON.stringify({
          number: data.number.replace(/\s/g, ''),
          cvc: data.cvc,
          exp_month: data.expMonth,
          exp_year: data.expYear,
          card_holder: data.cardHolder,
        }),
      })
      if (!res.ok) return { success: false, error: 'Tokenization failed' }
      const json = await res.json()
      return { success: true, tokenId: json.data.id }
    } catch {
      return { success: false, error: 'Network error during tokenization' }
    }
  }

  async getAcceptanceToken(): Promise<{ success: true; token: string } | { success: false; error: string }> {
    try {
      const res = await fetch(`${this.config.apiUrl}/merchants/${this.config.publicKey}`)
      if (!res.ok) return { success: false, error: 'Could not fetch acceptance token' }
      const json = await res.json()
      return { success: true, token: json.data.presigned_acceptance.acceptance_token }
    } catch {
      return { success: false, error: 'Network error' }
    }
  }
}
```

```typescript
// frontend/src/adapters/wompi/wompi-tokenization.mock.ts
import { IWompiTokenizationAdapter } from './wompi-tokenization.interface'

export class WompiTokenizationMock implements IWompiTokenizationAdapter {
  async tokenizeCard() { return { success: true as const, tokenId: 'tok_mock_123' } }
  async getAcceptanceToken() { return { success: true as const, token: 'mock_acceptance_token' } }
}
```

- [x] **Step 4: Run — expect PASS**
```bash
cd frontend && npx jest src/adapters/ --no-coverage
```

- [x] **Step 5: Commit**
```bash
git add frontend/src/adapters/ && git commit -m "feat(frontend): Wompi tokenization adapter with mock (TDD)"
```

---

### Task 14: Redux store — slices + selectors (TDD)

**Files:** all under `frontend/src/store/`

- [x] **Step 1: Write failing tests for checkout slice**
```typescript
// frontend/src/store/checkout/checkout.slice.spec.ts
import checkoutReducer, { setStep, setProductId, setTransactionId, resetCheckout } from './checkout.slice'

describe('checkoutSlice', () => {
  const initial = { step: 1, productId: null, transactionId: null }

  it('setStep updates step', () => {
    const s = checkoutReducer(initial, setStep(2))
    expect(s.step).toBe(2)
  })

  it('setProductId stores productId', () => {
    const s = checkoutReducer(initial, setProductId('p1'))
    expect(s.productId).toBe('p1')
  })

  it('setTransactionId stores transactionId', () => {
    const s = checkoutReducer(initial, setTransactionId('tx1'))
    expect(s.transactionId).toBe('tx1')
  })

  it('resetCheckout clears all fields', () => {
    const dirty = { step: 3, productId: 'p1', transactionId: 'tx1' }
    const s = checkoutReducer(dirty, resetCheckout())
    expect(s).toEqual(initial)
  })
})
```

- [x] **Step 2: Run — expect FAIL**

- [x] **Step 3: Implement all three slices**

```typescript
// frontend/src/store/checkout/checkout.slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface CheckoutState { step: number; productId: string | null; transactionId: string | null }
const initialState: CheckoutState = { step: 1, productId: null, transactionId: null }

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    setStep: (s, a: PayloadAction<number>) => { s.step = a.payload },
    setProductId: (s, a: PayloadAction<string>) => { s.productId = a.payload },
    setTransactionId: (s, a: PayloadAction<string>) => { s.transactionId = a.payload },
    resetCheckout: () => initialState,
  },
})
export const { setStep, setProductId, setTransactionId, resetCheckout } = checkoutSlice.actions
export default checkoutSlice.reducer
```

```typescript
// frontend/src/store/payment/payment.slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { TransactionResult } from '../../api/transactions.api'

interface PaymentState {
  tokenId: string | null
  acceptanceToken: string | null
  amounts: { productPrice: number; baseFee: number; deliveryFee: number; total: number } | null
  result: TransactionResult | null
  loading: boolean
  error: string | null
}

const initialState: PaymentState = { tokenId: null, acceptanceToken: null, amounts: null, result: null, loading: false, error: null }

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    setTokenId: (s, a: PayloadAction<string>) => { s.tokenId = a.payload },
    setAcceptanceToken: (s, a: PayloadAction<string>) => { s.acceptanceToken = a.payload },
    setAmounts: (s, a: PayloadAction<PaymentState['amounts']>) => { s.amounts = a.payload },
    setResult: (s, a: PayloadAction<TransactionResult>) => { s.result = a.payload },
    setLoading: (s, a: PayloadAction<boolean>) => { s.loading = a.payload },
    setError: (s, a: PayloadAction<string | null>) => { s.error = a.payload },
    resetPayment: () => initialState,
  },
})
export const { setTokenId, setAcceptanceToken, setAmounts, setResult, setLoading, setError, resetPayment } = paymentSlice.actions
export default paymentSlice.reducer
```

- [x] **Step 4: Implement store with redux-persist**
```typescript
// frontend/src/store/index.ts
import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { combineReducers } from 'redux'
import checkoutReducer from './checkout/checkout.slice'
import productReducer from './product/product.slice'
import paymentReducer from './payment/payment.slice'

// IMPORTANT: never persist raw card data — payment slice persists tokenId only
const paymentPersistConfig = { key: 'payment', storage, blacklist: [] }
const checkoutPersistConfig = { key: 'checkout', storage }

const rootReducer = combineReducers({
  checkout: persistReducer(checkoutPersistConfig, checkoutReducer),
  product: productReducer,  // not persisted — always refetched
  payment: persistReducer(paymentPersistConfig, paymentReducer),
})

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: { ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] } }),
})

export const persistor = persistStore(store)
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

- [x] **Step 5: Run all slice tests — expect PASS**
```bash
cd frontend && npx jest src/store/ --no-coverage
```

- [x] **Step 6: Commit**
```bash
git add frontend/src/store/ && git commit -m "feat(frontend): Redux slices — checkout, product, payment with persist (TDD)"
```

---

### Task 15: API layer

**Files:** `frontend/src/api/products.api.ts`, `customers.api.ts`, `transactions.api.ts`

- [x] **Step 1: Implement API functions**
```typescript
// frontend/src/api/products.api.ts
const BASE = import.meta.env.VITE_API_URL

export interface Product { id: string; name: string; description: string; imageUrl: string; priceInCents: number; stock: number }

export const fetchProducts = async (): Promise<Product[]> => {
  const res = await fetch(`${BASE}/products`)
  if (!res.ok) throw new Error('Failed to fetch products')
  const json = await res.json()
  return json.data
}

export const fetchProduct = async (id: string): Promise<Product> => {
  const res = await fetch(`${BASE}/products/${id}`)
  if (!res.ok) throw new Error('Product not found')
  const json = await res.json()
  return json.data
}
```

```typescript
// frontend/src/api/customers.api.ts
const BASE = import.meta.env.VITE_API_URL

export interface CustomerPayload { name: string; email: string; phone: string; address: string; city: string }
export interface Customer { id: string; name: string; email: string }

export const upsertCustomer = async (payload: CustomerPayload): Promise<Customer> => {
  const res = await fetch(`${BASE}/customers`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  })
  if (!res.ok) { const e = await res.json(); throw new Error(e.message ?? 'Failed to save customer') }
  return (await res.json()).data
}
```

```typescript
// frontend/src/api/transactions.api.ts
const BASE = import.meta.env.VITE_API_URL

export interface CreateTransactionPayload {
  customerId: string; productId: string; cardTokenId: string
  installments: number; acceptanceToken: string; customerEmail: string
  address: string; city: string
}

export interface TransactionResult {
  transactionId: string; reference: string; status: string
  amountInCents: number; wompiTransactionId: string | null
  delivery?: { id: string; address: string; city: string; status: string } | null
}

export const createTransaction = async (payload: CreateTransactionPayload): Promise<TransactionResult> => {
  const res = await fetch(`${BASE}/transactions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  })
  if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? 'Payment failed') }
  return (await res.json()).data
}

export const getTransaction = async (id: string): Promise<TransactionResult> => {
  const res = await fetch(`${BASE}/transactions/${id}`)
  if (!res.ok) throw new Error('Transaction not found')
  return (await res.json()).data
}
```

- [x] **Step 2: Commit**
```bash
git add frontend/src/api/ && git commit -m "feat(frontend): API layer — products, customers, transactions"
```

---

### Task 16: ProductPage (TDD)

**Files:**
- Create: `frontend/src/pages/ProductPage/ProductPage.tsx`
- Create: `frontend/src/pages/ProductPage/ProductPage.spec.tsx`

- [ ] **Step 1: Write failing tests**
```typescript
// frontend/src/pages/ProductPage/ProductPage.spec.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import checkoutReducer from '../../store/checkout/checkout.slice'
import productReducer from '../../store/product/product.slice'
import paymentReducer from '../../store/payment/payment.slice'
import { ProductPage } from './ProductPage'
import { server } from '../../mocks/server'  // MSW server
import { http, HttpResponse } from 'msw'

const makeStore = () => configureStore({ reducer: { checkout: checkoutReducer, product: productReducer, payment: paymentReducer } })

const product = { id: 'p1', name: 'Audífonos BT-500', description: 'Great', imageUrl: 'https://img.com', priceInCents: 15000000, stock: 5 }

describe('ProductPage', () => {
  it('shows product name and stock', async () => {
    server.use(http.get('*/products', () => HttpResponse.json({ data: [product] })))
    render(<Provider store={makeStore()}><ProductPage /></Provider>)
    expect(await screen.findByText('Audífonos BT-500')).toBeInTheDocument()
    expect(screen.getByText(/5 disponibles/i)).toBeInTheDocument()
  })

  it('disables pay button when stock is 0', async () => {
    server.use(http.get('*/products', () => HttpResponse.json({ data: [{ ...product, stock: 0 }] })))
    render(<Provider store={makeStore()}><ProductPage /></Provider>)
    const btn = await screen.findByRole('button', { name: /sin stock/i })
    expect(btn).toBeDisabled()
  })

  it('navigates to checkout when pay button clicked', async () => {
    const onPay = jest.fn()
    server.use(http.get('*/products', () => HttpResponse.json({ data: [product] })))
    render(<Provider store={makeStore()}><ProductPage onPayClick={onPay} /></Provider>)
    fireEvent.click(await screen.findByRole('button', { name: /pagar con tarjeta/i }))
    expect(onPay).toHaveBeenCalled()
  })
})
```

Note: Set up MSW in `frontend/src/mocks/server.ts` and `handlers.ts` before running this task.

- [x] **Step 2: Set up MSW**
```typescript
// frontend/src/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'
export const server = setupServer(...handlers)
```

```typescript
// frontend/src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'
export const handlers = [
  http.get('*/products', () => HttpResponse.json({ data: [] })),
]
```

Add to `jest.setup.ts`:
```typescript
import { server } from './src/mocks/server'
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

- [ ] **Step 3: Run — expect FAIL**

- [ ] **Step 4: Implement ProductPage**

Uses React 19 `use()` hook with Suspense for data fetching:

```typescript
// frontend/src/pages/ProductPage/ProductPage.tsx
import { Suspense, use } from 'react'
import { useDispatch } from 'react-redux'
import { setStep, setProductId } from '../../store/checkout/checkout.slice'
import { fetchProducts, Product } from '../../api/products.api'
import { formatCOP } from '../../utils/currency'

let productsPromise: Promise<Product[]> | null = null
function getProductsPromise() {
  if (!productsPromise) productsPromise = fetchProducts()
  return productsPromise
}

function ProductList({ onPayClick }: { onPayClick?: () => void }) {
  const products = use(getProductsPromise())
  const dispatch = useDispatch()
  const product = products[0]  // Single product per spec

  const handlePay = () => {
    dispatch(setProductId(product.id))
    dispatch(setStep(2))
    onPayClick?.()
  }

  return (
    <div className="product-page">
      <img src={product.imageUrl} alt={product.name} loading="lazy" />
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p className="price">{formatCOP(product.priceInCents)}</p>
      <p>{product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock disponible'}</p>
      <button onClick={handlePay} disabled={product.stock === 0} aria-label={product.stock === 0 ? 'Sin stock disponible' : 'Pagar con tarjeta de crédito'}>
        {product.stock === 0 ? 'Sin stock disponible' : 'Pagar con tarjeta de crédito'}
      </button>
    </div>
  )
}

export function ProductPage({ onPayClick }: { onPayClick?: () => void }) {
  productsPromise = null  // Reset on mount so re-navigation refetches
  return (
    <Suspense fallback={<div>Cargando producto...</div>}>
      <ProductList onPayClick={onPayClick} />
    </Suspense>
  )
}
```

- [ ] **Step 5: Run — expect PASS**
```bash
cd frontend && npx jest src/pages/ProductPage/ --no-coverage
```

- [ ] **Step 6: Commit**
```bash
git add frontend/src/pages/ProductPage/ frontend/src/mocks/
git commit -m "feat(frontend): ProductPage with React 19 use() + Suspense (TDD)"
```

---

### Task 17: CheckoutPage — CreditCardForm + DeliveryForm (TDD)

**Files:** all under `frontend/src/components/CreditCardForm/`, `DeliveryForm/`, `CardNetworkLogo/`, `frontend/src/pages/CheckoutPage/`

- [x] **Step 1: Write failing tests for CreditCardForm**
```typescript
// frontend/src/components/CreditCardForm/CreditCardForm.spec.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { CreditCardForm } from './CreditCardForm'

describe('CreditCardForm', () => {
  it('shows Visa logo when card starts with 4', () => {
    render(<CreditCardForm onSubmit={jest.fn()} />)
    const input = screen.getByPlaceholderText(/número de tarjeta/i)
    fireEvent.change(input, { target: { value: '4111 1111 1111 1111' } })
    expect(screen.getByAltText(/visa/i)).toBeInTheDocument()
  })

  it('shows MasterCard logo when card starts with 5', () => {
    render(<CreditCardForm onSubmit={jest.fn()} />)
    fireEvent.change(screen.getByPlaceholderText(/número de tarjeta/i), { target: { value: '5500 0055 5555 5559' } })
    expect(screen.getByAltText(/mastercard/i)).toBeInTheDocument()
  })

  it('submit button disabled when form invalid', () => {
    render(<CreditCardForm onSubmit={jest.fn()} />)
    expect(screen.getByRole('button', { name: /continuar/i })).toBeDisabled()
  })

  it('calls onSubmit with card data when valid', async () => {
    const onSubmit = jest.fn()
    render(<CreditCardForm onSubmit={onSubmit} />)
    fireEvent.change(screen.getByPlaceholderText(/número de tarjeta/i), { target: { value: '4111111111111111' } })
    fireEvent.change(screen.getByPlaceholderText(/titular/i), { target: { value: 'Juan Perez' } })
    fireEvent.change(screen.getByPlaceholderText(/mm/i), { target: { value: '12' } })
    fireEvent.change(screen.getByPlaceholderText(/yy/i), { target: { value: '28' } })
    fireEvent.change(screen.getByPlaceholderText(/cvv/i), { target: { value: '123' } })
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
    expect(onSubmit).toHaveBeenCalledWith({ number: '4111111111111111', cardHolder: 'Juan Perez', expMonth: '12', expYear: '28', cvc: '123' })
  })
})
```

- [x] **Step 2: Run — expect FAIL**

- [x] **Step 3: Implement CardNetworkLogo**
```typescript
// frontend/src/components/CardNetworkLogo/CardNetworkLogo.tsx
import { CardNetwork } from '../../utils/luhn'

const LOGOS: Record<CardNetwork, string | null> = {
  VISA: '💳 Visa',   // Replace with actual SVG/img in production
  MASTERCARD: '💳 MasterCard',
  UNKNOWN: null,
}

export function CardNetworkLogo({ network }: { network: CardNetwork }) {
  if (network === 'UNKNOWN') return null
  return <span className={`card-logo card-logo--${network.toLowerCase()}`}><img src={`/icons/${network.toLowerCase()}.svg`} alt={network} /></span>
}
```

- [x] **Step 4: Implement CreditCardForm** using `useActionState` for submission:
```typescript
// frontend/src/components/CreditCardForm/CreditCardForm.tsx
import { useState } from 'react'
import { validateLuhn, detectCardNetwork, CardNetwork } from '../../utils/luhn'
import { CardNetworkLogo } from '../CardNetworkLogo/CardNetworkLogo'

interface CardData { number: string; cardHolder: string; expMonth: string; expYear: string; cvc: string }

export function CreditCardForm({ onSubmit }: { onSubmit: (data: CardData) => void }) {
  const [number, setNumber] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [expMonth, setExpMonth] = useState('')
  const [expYear, setExpYear] = useState('')
  const [cvc, setCvc] = useState('')

  const network: CardNetwork = detectCardNetwork(number)
  const isValid = validateLuhn(number) && cardHolder.trim().length > 2
    && /^\d{2}$/.test(expMonth) && /^\d{2}$/.test(expYear) && /^\d{3,4}$/.test(cvc)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isValid) onSubmit({ number: number.replace(/\s/g, ''), cardHolder, expMonth, expYear, cvc })
  }

  return (
    <form onSubmit={handleSubmit} className="credit-card-form">
      <div className="input-with-logo">
        <input value={number} onChange={e => setNumber(e.target.value)} placeholder="Número de tarjeta" maxLength={19} />
        <CardNetworkLogo network={network} />
      </div>
      <input value={cardHolder} onChange={e => setCardHolder(e.target.value)} placeholder="Nombre del titular" />
      <div className="expiry-row">
        <input value={expMonth} onChange={e => setExpMonth(e.target.value)} placeholder="MM" maxLength={2} />
        <input value={expYear} onChange={e => setExpYear(e.target.value)} placeholder="YY" maxLength={2} />
        <input value={cvc} onChange={e => setCvc(e.target.value)} placeholder="CVV" maxLength={4} type="password" />
      </div>
      <button type="submit" disabled={!isValid}>Continuar</button>
    </form>
  )
}
```

- [x] **Step 5: Implement DeliveryForm** (same pattern — fields: name, email, phone, address, city; validates all non-empty, email format; calls `onSubmit` with data)

- [x] **Step 6: Run — expect PASS**
```bash
cd frontend && npx jest src/components/ --no-coverage
```

- [x] **Step 7: Commit**
```bash
git add frontend/src/components/ && git commit -m "feat(frontend): CreditCardForm, DeliveryForm, CardNetworkLogo (TDD)"
```

---

### Task 18: SummaryBackdrop + payment thunk (TDD)

**Files:**
- Create: `frontend/src/components/SummaryBackdrop/SummaryBackdrop.tsx` + spec
- Create: `frontend/src/store/payment/payment.thunks.ts`

- [x] **Step 1: Write failing tests**
```typescript
// frontend/src/components/SummaryBackdrop/SummaryBackdrop.spec.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { SummaryBackdrop } from './SummaryBackdrop'

const amounts = { productPrice: 15000000, baseFee: 300000, deliveryFee: 500000, total: 15800000 }

describe('SummaryBackdrop', () => {
  it('renders price breakdown', () => {
    render(<SummaryBackdrop amounts={amounts} onConfirm={jest.fn()} onBack={jest.fn()} loading={false} />)
    expect(screen.getByText(/base fee/i)).toBeInTheDocument()
    expect(screen.getByText(/delivery/i)).toBeInTheDocument()
  })

  it('disables confirm button while loading', () => {
    render(<SummaryBackdrop amounts={amounts} onConfirm={jest.fn()} onBack={jest.fn()} loading={true} />)
    expect(screen.getByRole('button', { name: /confirmar/i })).toBeDisabled()
  })

  it('calls onConfirm when button clicked', () => {
    const onConfirm = jest.fn()
    render(<SummaryBackdrop amounts={amounts} onConfirm={onConfirm} onBack={jest.fn()} loading={false} />)
    fireEvent.click(screen.getByRole('button', { name: /confirmar pago/i }))
    expect(onConfirm).toHaveBeenCalled()
  })
})
```

- [x] **Step 2: Run — expect FAIL**

- [x] **Step 3: Implement SummaryBackdrop**
```typescript
// frontend/src/components/SummaryBackdrop/SummaryBackdrop.tsx
import { formatCOP } from '../../utils/currency'

interface Amounts { productPrice: number; baseFee: number; deliveryFee: number; total: number }

export function SummaryBackdrop({ amounts, onConfirm, onBack, loading }: {
  amounts: Amounts; onConfirm: () => void; onBack: () => void; loading: boolean
}) {
  return (
    <div className="backdrop" role="dialog" aria-modal="true">
      <div className="backdrop__content">
        <h2>Resumen de pago</h2>
        <table className="summary-table">
          <tbody>
            <tr><td>Producto</td><td>{formatCOP(amounts.productPrice)}</td></tr>
            <tr><td>Base fee</td><td>{formatCOP(amounts.baseFee)}</td></tr>
            <tr><td>Delivery fee</td><td>{formatCOP(amounts.deliveryFee)}</td></tr>
            <tr className="total"><td><strong>Total</strong></td><td><strong>{formatCOP(amounts.total)}</strong></td></tr>
          </tbody>
        </table>
        <div className="backdrop__actions">
          <button onClick={onBack} disabled={loading}>Volver</button>
          <button onClick={onConfirm} disabled={loading} aria-label="Confirmar pago">
            {loading ? 'Procesando...' : 'Confirmar pago'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [x] **Step 4: Implement payment thunk**
```typescript
// frontend/src/store/payment/payment.thunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit'
import { createTransaction, CreateTransactionPayload } from '../../api/transactions.api'
import { setResult, setError } from './payment.slice'
import { setTransactionId, setStep } from '../checkout/checkout.slice'

export const processPayment = createAsyncThunk(
  'payment/process',
  async (payload: CreateTransactionPayload, { dispatch, rejectWithValue }) => {
    try {
      const result = await createTransaction(payload)
      dispatch(setResult(result))
      dispatch(setTransactionId(result.transactionId))
      dispatch(setStep(4))
      return result
    } catch (e: any) {
      dispatch(setError(e.message))
      return rejectWithValue(e.message)
    }
  }
)
```

- [x] **Step 5: Run — expect PASS**
```bash
cd frontend && npx jest src/components/SummaryBackdrop/ src/store/payment/ --no-coverage
```

- [x] **Step 6: Commit**
```bash
git add frontend/src/components/SummaryBackdrop/ frontend/src/store/payment/payment.thunks.ts
git commit -m "feat(frontend): SummaryBackdrop + payment thunk (TDD)"
```

---

### Task 19: StatusPage + refresh recovery (TDD)

**Files:**
- Create: `frontend/src/pages/StatusPage/StatusPage.tsx` + spec

- [ ] **Step 1: Write failing tests**
```typescript
// frontend/src/pages/StatusPage/StatusPage.spec.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import checkoutReducer from '../../store/checkout/checkout.slice'
import paymentReducer from '../../store/payment/payment.slice'
import productReducer from '../../store/product/product.slice'
import { StatusPage } from './StatusPage'
import { server } from '../../mocks/server'
import { http, HttpResponse } from 'msw'

const approvedResult = { transactionId: 'tx1', reference: 'ref1', status: 'APPROVED', amountInCents: 15800000, wompiTransactionId: 'wt1', delivery: { id: 'd1', address: 'Calle 1', city: 'Bogotá', status: 'PENDING' } }

const makeStore = (overrides = {}) => configureStore({
  reducer: { checkout: checkoutReducer, payment: paymentReducer, product: productReducer },
  preloadedState: { checkout: { step: 4, productId: 'p1', transactionId: 'tx1' }, payment: { tokenId: null, acceptanceToken: null, amounts: null, result: approvedResult, loading: false, error: null }, ...overrides },
})

describe('StatusPage', () => {
  it('shows APPROVED status', () => {
    render(<Provider store={makeStore()}><StatusPage onRestart={jest.fn()} /></Provider>)
    expect(screen.getByText(/pago aprobado/i)).toBeInTheDocument()
  })

  it('shows delivery address when approved', () => {
    render(<Provider store={makeStore()}><StatusPage onRestart={jest.fn()} /></Provider>)
    expect(screen.getByText(/Calle 1/i)).toBeInTheDocument()
  })

  it('fetches transaction on mount when result is null (refresh recovery)', async () => {
    server.use(http.get('*/transactions/tx1', () => HttpResponse.json({ data: approvedResult })))
    const store = makeStore({ payment: { tokenId: null, acceptanceToken: null, amounts: null, result: null, loading: false, error: null } })
    render(<Provider store={store}><StatusPage onRestart={jest.fn()} /></Provider>)
    expect(await screen.findByText(/pago aprobado/i)).toBeInTheDocument()
  })

  it('calls onRestart when back button clicked', () => {
    const onRestart = jest.fn()
    render(<Provider store={makeStore()}><StatusPage onRestart={onRestart} /></Provider>)
    fireEvent.click(screen.getByRole('button', { name: /volver/i }))
    expect(onRestart).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement StatusPage with refresh recovery**
```typescript
// frontend/src/pages/StatusPage/StatusPage.tsx
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../../store'
import { setResult } from '../../store/payment/payment.slice'
import { resetCheckout } from '../../store/checkout/checkout.slice'
import { resetPayment } from '../../store/payment/payment.slice'
import { getTransaction } from '../../api/transactions.api'
import { formatCOP } from '../../utils/currency'

export function StatusPage({ onRestart }: { onRestart: () => void }) {
  const dispatch = useDispatch<AppDispatch>()
  const result = useSelector((s: RootState) => s.payment.result)
  const transactionId = useSelector((s: RootState) => s.checkout.transactionId)

  // Refresh recovery: if result missing but transactionId exists, re-fetch
  useEffect(() => {
    if (!result && transactionId) {
      getTransaction(transactionId).then(tx => dispatch(setResult(tx))).catch(() => {})
    }
  }, [result, transactionId, dispatch])

  const handleRestart = () => {
    dispatch(resetCheckout())
    dispatch(resetPayment())
    onRestart()
  }

  if (!result) return <div>Cargando resultado...</div>

  const isApproved = result.status === 'APPROVED'

  return (
    <div className={`status-page status-page--${result.status.toLowerCase()}`}>
      <div className="status-icon">{isApproved ? '✓' : '✗'}</div>
      <h1>{isApproved ? 'Pago aprobado' : result.status === 'DECLINED' ? 'Pago rechazado' : 'Error en el pago'}</h1>
      <p className="reference">Referencia: {result.reference}</p>
      {isApproved && result.delivery && (
        <div className="delivery-info">
          <h3>Datos de entrega</h3>
          <p>{result.delivery.address}, {result.delivery.city}</p>
          <p>Estado: {result.delivery.status}</p>
        </div>
      )}
      <p className="total">Total: {formatCOP(result.amountInCents)}</p>
      <button onClick={handleRestart} aria-label="Volver al inicio">Volver al inicio</button>
    </div>
  )
}
```

- [ ] **Step 4: Run — expect PASS**
```bash
cd frontend && npx jest src/pages/StatusPage/ --no-coverage
```

- [ ] **Step 5: Commit**
```bash
git add frontend/src/pages/StatusPage/ && git commit -m "feat(frontend): StatusPage with refresh recovery (TDD)"
```

---

### Task 20: CheckoutPage — wires all steps together

**Files:**
- Create: `frontend/src/pages/CheckoutPage/CheckoutPage.tsx` + spec

- [ ] **Step 1: Write test for step routing**
```typescript
// frontend/src/pages/CheckoutPage/CheckoutPage.spec.tsx
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import checkoutReducer from '../../store/checkout/checkout.slice'
import paymentReducer from '../../store/payment/payment.slice'
import productReducer from '../../store/product/product.slice'
import { CheckoutPage } from './CheckoutPage'

const makeStore = (step: number) => configureStore({
  reducer: { checkout: checkoutReducer, payment: paymentReducer, product: productReducer },
  preloadedState: { checkout: { step, productId: 'p1', transactionId: null }, payment: { tokenId: null, acceptanceToken: null, amounts: null, result: null, loading: false, error: null } },
})

describe('CheckoutPage', () => {
  it('renders CreditCardForm at step 2', () => {
    render(<Provider store={makeStore(2)}><CheckoutPage /></Provider>)
    expect(screen.getByPlaceholderText(/número de tarjeta/i)).toBeInTheDocument()
  })

  it('renders SummaryBackdrop at step 3', () => {
    render(<Provider store={makeStore(3)}><CheckoutPage /></Provider>)
    expect(screen.getByText(/resumen de pago/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Implement CheckoutPage** — routes by Redux `checkout.step`, orchestrates tokenization, customer creation, and payment dispatch:

```typescript
// frontend/src/pages/CheckoutPage/CheckoutPage.tsx
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../../store'
import { setStep, setTransactionId } from '../../store/checkout/checkout.slice'
import { setTokenId, setAmounts, setAcceptanceToken, setLoading } from '../../store/payment/payment.slice'
import { processPayment } from '../../store/payment/payment.thunks'
import { CreditCardForm } from '../../components/CreditCardForm/CreditCardForm'
import { DeliveryForm } from '../../components/DeliveryForm/DeliveryForm'
import { SummaryBackdrop } from '../../components/SummaryBackdrop/SummaryBackdrop'
import { upsertCustomer } from '../../api/customers.api'
import { fetchProduct } from '../../api/products.api'
import { WompiTokenizationAdapter } from '../../adapters/wompi/wompi-tokenization.adapter'

const wompiAdapter = new WompiTokenizationAdapter({
  publicKey: import.meta.env.VITE_WOMPI_PUBLIC_KEY,
  apiUrl: import.meta.env.VITE_WOMPI_API_URL,
})

interface CollectedData {
  card?: { number: string; cardHolder: string; expMonth: string; expYear: string; cvc: string }
  customer?: { name: string; email: string; phone: string; address: string; city: string }
  customerId?: string
}

export function CheckoutPage() {
  const dispatch = useDispatch<AppDispatch>()
  const step = useSelector((s: RootState) => s.checkout.step)
  const productId = useSelector((s: RootState) => s.checkout.productId)
  const loading = useSelector((s: RootState) => s.payment.loading)
  const amounts = useSelector((s: RootState) => s.payment.amounts)
  const [data, setData] = useState<CollectedData>({})

  const handleCardSubmit = async (cardData: CollectedData['card']) => {
    setData(d => ({ ...d, card: cardData }))
    dispatch(setStep(2.5 as any))  // sub-step: delivery form
  }

  // Sub-steps handled inline; for clarity these map to:
  // step 2: card form → step 2.5: delivery form → step 3: summary
  // Actual implementation uses a local sub-step state within step 2

  const handleDeliverySubmit = async (customerData: CollectedData['customer']) => {
    dispatch(setLoading(true))
    try {
      const [customer, product, acceptance] = await Promise.all([
        upsertCustomer(customerData!),
        fetchProduct(productId!),
        wompiAdapter.getAcceptanceToken(),
      ])
      if (!acceptance.success) throw new Error('Could not get acceptance token')

      const tokenResult = await wompiAdapter.tokenizeCard(data.card!)
      if (!tokenResult.success) throw new Error('Card tokenization failed')

      dispatch(setTokenId(tokenResult.tokenId))
      dispatch(setAcceptanceToken(acceptance.token))
      dispatch(setAmounts({
        productPrice: product.priceInCents,
        baseFee: 300000,
        deliveryFee: 500000,
        total: product.priceInCents + 300000 + 500000,
      }))
      setData(d => ({ ...d, customer: customerData, customerId: customer.id }))
      dispatch(setStep(3))
    } finally {
      dispatch(setLoading(false))
    }
  }

  const tokenId = useSelector((s: RootState) => s.payment.tokenId)
  const acceptanceToken = useSelector((s: RootState) => s.payment.acceptanceToken)

  const handleConfirmPayment = () => {
    if (!tokenId || !acceptanceToken || !data.customerId || !data.customer) return
    dispatch(processPayment({
      customerId: data.customerId,
      productId: productId!,
      cardTokenId: tokenId,
      installments: 1,
      acceptanceToken,
      customerEmail: data.customer.email,
      address: data.customer.address,
      city: data.customer.city,
    }))
  }

  if (step === 3 && amounts) return (
    <SummaryBackdrop amounts={amounts} onConfirm={handleConfirmPayment} onBack={() => dispatch(setStep(2))} loading={loading} />
  )

  // Step 2: show card form, then delivery form in sub-step
  return (
    <div className="checkout-page">
      <CreditCardForm onSubmit={handleCardSubmit} />
      {/* DeliveryForm shown after card is filled — local state controls this */}
    </div>
  )
}
```

Note: Refine the sub-step logic (card → delivery in one modal with two panels) during implementation. The key contract is: card data → tokenize → fetch acceptance → show summary.

- [ ] **Step 3: Run — expect PASS**
```bash
cd frontend && npx jest src/pages/CheckoutPage/ --no-coverage
```

- [ ] **Step 4: Commit**
```bash
git add frontend/src/pages/CheckoutPage/ && git commit -m "feat(frontend): CheckoutPage orchestrates card→delivery→summary flow"
```

---

### Task 21: App routing + full integration

**Files:** `frontend/src/App.tsx`, `frontend/src/App.spec.tsx`, `frontend/src/main.tsx`

- [ ] **Step 1: Implement App.tsx**
```typescript
// frontend/src/App.tsx
import { useSelector, useDispatch } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { persistor } from './store'
import { RootState } from './store'
import { setStep } from './store/checkout/checkout.slice'
import { ProductPage } from './pages/ProductPage/ProductPage'
import { CheckoutPage } from './pages/CheckoutPage/CheckoutPage'
import { StatusPage } from './pages/StatusPage/StatusPage'

function AppContent() {
  const dispatch = useDispatch()
  const step = useSelector((s: RootState) => s.checkout.step)

  const handleRestart = () => dispatch(setStep(1))

  if (step === 1) return <ProductPage onPayClick={() => dispatch(setStep(2))} />
  if (step === 4) return <StatusPage onRestart={handleRestart} />
  return <CheckoutPage />
}

export default function App() {
  return (
    <PersistGate loading={null} persistor={persistor}>
      <AppContent />
    </PersistGate>
  )
}
```

- [ ] **Step 2: Update main.tsx**
```typescript
// frontend/src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
)
```

- [ ] **Step 3: Run full test suite with coverage**
```bash
cd frontend && npm test -- --coverage
```
Expected: >80% coverage, all tests pass.

- [ ] **Step 4: Commit**
```bash
git add frontend/src/App.tsx frontend/src/main.tsx
git commit -m "feat(frontend): App routing + PersistGate integration"
```

---

### Task 22: Final — README + run full coverage check

**Files:** `README.md`

- [ ] **Step 1: Run backend coverage**
```bash
cd backend && npm test -- --coverage 2>&1 | tail -20
```
Expected: Statements >80%, Branches >80%, Functions >80%, Lines >80%.

- [ ] **Step 2: Run frontend coverage**
```bash
cd frontend && npm test -- --coverage 2>&1 | tail -20
```
Expected: same thresholds.

- [ ] **Step 3: Start both services and smoke test**
```bash
# Terminal 1
cd backend && npm run start:dev

# Terminal 2
cd frontend && npm run dev

# Then visit http://localhost:5173 and complete a full checkout with Wompi test card:
# Card: 4111 1111 1111 1111, Exp: 12/28, CVV: 123
```

- [ ] **Step 4: Write README.md**

Include:
- Project overview
- Local setup (prerequisites: Node 20+, PostgreSQL)
- `cd backend && cp .env.example .env && npm install && npx prisma migrate dev && npx prisma db seed && npm run start:dev`
- `cd frontend && cp .env.example .env && npm install && npm run dev`
- Swagger URL: `http://localhost:3001/api/docs`
- Data model diagram (text description of tables)
- Test results (paste coverage output)
- Postman collection note (`docs/postman_collection.json`)
- Deploy notes (AWS)

- [ ] **Step 5: Commit**
```bash
git add README.md && git commit -m "docs: add README with setup, data model, test results"
```

---

## Wompi test card numbers (sandbox)

| Card | Number | Exp | CVV | Result |
|------|--------|-----|-----|--------|
| Visa approved | `4111 1111 1111 1111` | 12/28 | 123 | APPROVED |
| MC declined | `5500 0055 5555 5559` | 12/28 | 123 | DECLINED (use Wompi sandbox test cards) |

Always use Wompi's official sandbox test cards from their docs.

---

## Dependency order

```
Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7 → Task 8 → Task 9 → Task 10
                                                                          ↓
Task 11 → Task 12 → Task 13 → Task 14 → Task 15 → Task 16 → Task 17 → Task 18 → Task 19 → Task 20 → Task 21 → Task 22
```

Tasks 1–10 (backend) must complete before Tasks 16+ (frontend integration). Tasks 11–15 can start in parallel with backend Tasks 6–10.
