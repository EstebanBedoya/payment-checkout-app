# Payment Checkout App — Spec

**Fecha:** 2026-03-23
**Stack:** React 19.1 + Redux Toolkit, NestJS + Prisma + PostgreSQL, Jest
**Arquitectura backend:** Hexagonal con Ports & Adapters + Railway Oriented Programming (ROP)

---

## 1. Contexto del negocio

App de checkout de un solo producto pagado con tarjeta de crédito a través de la pasarela de pagos Wompi (sandbox). El flujo obtiene datos de pago y entrega del cliente, procesa la transacción, actualiza el stock y muestra el resultado.

**Flujo de pantallas (5 pasos):**
```
1. ProductPage → 2. CheckoutModal (tarjeta + entrega) → 3. SummaryBackdrop → 4. StatusPage → 5. ProductPage
```

---

## 2. Requerimientos funcionales

### RF-01: Página de producto
- Muestra nombre, descripción, imagen, precio y unidades disponibles en stock.
- Botón "Pagar con tarjeta de crédito" visible solo cuando `stock > 0`.
- Cuando `stock = 0`, el botón se deshabilita con mensaje "Sin stock disponible".

### RF-02: Modal de datos de pago y entrega
- Campos de tarjeta: número, nombre del titular, fecha de expiración (MM/YY), CVV.
- Detección automática de red (Visa / MasterCard) por prefijo del número con logo correspondiente.
- Validación de número de tarjeta con algoritmo de Luhn.
- Campos de entrega: nombre completo, email, teléfono, dirección, ciudad.
- Datos de tarjeta son fake pero estructuralmente válidos (test cards de Wompi sandbox).
- Botón "Continuar" habilitado solo cuando todos los campos son válidos.

### RF-03: Tokenización de tarjeta (frontend)
- El frontend llama directamente a Wompi `POST /tokens/cards` con la `pub_key`.
- Solo el `token_id` resultante se guarda en el estado de la app; el PAN nunca sale del browser hacia el backend propio.

### RF-04: Resumen de pago (Backdrop)
- Muestra desglose:
  - Precio del producto
  - Base fee: COP $3.000 (fijo, siempre)
  - Delivery fee: COP $5.000 (fijo, siempre)
  - **Total = producto + base_fee + delivery_fee**
- Botón "Confirmar pago".

### RF-05: Procesamiento del pago
Al hacer click en "Confirmar pago":
1. Frontend llama `POST /api/v1/transactions` → obtiene `transactionId` y `reference` (status `PENDING`).
2. Backend (dentro del mismo use case) llama al adaptador Wompi para crear la transacción.
3. Una vez resuelta (APPROVED / DECLINED / ERROR):
   - Backend actualiza `Transaction.status`.
   - Si APPROVED: crea `Delivery`, descuenta stock en una operación atómica con Prisma transaction.
4. Frontend recibe la respuesta final y navega a StatusPage.

### RF-06: Página de resultado
- Muestra si el pago fue aprobado, rechazado o con error.
- Muestra referencia de transacción.
- Si APPROVED, muestra datos de entrega.
- Botón "Volver al inicio" → redirige a ProductPage con stock actualizado.

### RF-07: Resiliencia ante refresh
- Estado del checkout persiste en `localStorage` vía `redux-persist`.
- Reglas de recuperación por paso:

| Paso al refrescar | Comportamiento |
|---|---|
| Step 1 (ProductPage) | Rehidrata normally, sin acción |
| Step 2 (formulario) | Sin `transactionId` → vuelve a step 1 limpio |
| Step 3 (summary) | Restaura producto y step; no hay dinero comprometido |
| Step 4 (status) | `transactionId` persiste → `GET /transactions/:id` rehidrata resultado |

---

## 3. Requerimientos no funcionales

### RNF-01: Seguridad
- Nunca se almacena ni transmite el PAN, CVV ni fecha de expiración al backend propio.
- El `cardTokenId` de Wompi es el único dato sensible almacenado (en memoria / localStorage, nunca en DB completo).
- HTTPS obligatorio en producción.
- Security headers: `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security` (OWASP alignment).
- Variables de entorno para todas las API keys; ninguna key hardcodeada en código.

### RNF-02: Responsividad
- Mobile-first. Tamaño mínimo de referencia: iPhone SE 2020 (375 × 667 px en CSS pixels).
- Funcional en Chrome, Firefox y Safari.

### RNF-03: Rendimiento
- Imágenes optimizadas (WebP, tamaño controlado) para evitar layout shift.
- Lazy loading de rutas secundarias.

### RNF-04: Cobertura de tests
- >80% de cobertura global en frontend y backend.
- 100% de cobertura en use cases del backend (núcleo de negocio puro).

### RNF-05: API documentation
- Swagger disponible en `/api/docs` en ambiente de desarrollo.
- Postman collection exportada en `docs/postman_collection.json`.

### RNF-06: Semilla de datos
- DB seeded con al menos 1 producto dummy con stock > 0.
- No existe endpoint para crear productos.

---

## 4. Arquitectura backend

### Hexagonal — estructura de carpetas
```
src/
  modules/
    products/
      domain/
        product.entity.ts
        product.repository.port.ts        ← IProductRepository (Port)
      application/
        use-cases/
          get-product.use-case.ts
          get-products.use-case.ts
          decrement-stock.use-case.ts
      infrastructure/
        prisma-product.repository.ts      ← Adapter
        products.controller.ts
        products.module.ts
    customers/
      domain/
        customer.entity.ts
        customer.repository.port.ts
      application/
        use-cases/
          upsert-customer.use-case.ts
      infrastructure/
        prisma-customer.repository.ts
        customers.controller.ts
        customers.module.ts
    transactions/
      domain/
        transaction.entity.ts
        transaction.repository.port.ts
      application/
        use-cases/
          create-transaction.use-case.ts  ← orquesta todo el flujo de pago
          get-transaction.use-case.ts
      infrastructure/
        prisma-transaction.repository.ts
        transactions.controller.ts
        transactions.module.ts
    deliveries/
      domain/
        delivery.entity.ts
        delivery.repository.port.ts
      application/
        use-cases/
          get-delivery.use-case.ts
      infrastructure/
        prisma-delivery.repository.ts
        deliveries.controller.ts
        deliveries.module.ts
    payment/
      domain/
        payment-gateway.port.ts           ← IPaymentGateway (Port)
        payment.types.ts
      infrastructure/
        adapters/
          wompi-payment.adapter.ts        ← Adapter real (llama a Wompi API)
          wompi-payment.adapter.mock.ts   ← Adapter mock para tests
      payment.module.ts
  shared/
    result.ts                             ← Result<T, E> / Ok / Err
    use-case.interface.ts                 ← UseCase<I, O>
    domain-errors.ts                      ← catálogo de errores de dominio
  prisma/
    schema.prisma
    seed.ts
  main.ts
```

### Railway Oriented Programming (ROP)
```typescript
// shared/result.ts
type Result<T, E> = Ok<T> | Err<E>

class Ok<T>  { readonly _tag = 'ok';  constructor(readonly value: T) {} }
class Err<E> { readonly _tag = 'err'; constructor(readonly error: E) {} }

function ok<T>(value: T): Ok<T>   { return new Ok(value) }
function err<E>(error: E): Err<E> { return new Err(error) }
```

Cada use case devuelve `Promise<Result<T, DomainError>>`. Los controllers mapean:
- `Ok` → 200/201
- `Err(StockUnavailable)` → 409
- `Err(ProductNotFound)` → 404
- `Err(PaymentGatewayUnavailable)` → 503
- `Err(InvalidCardToken)` → 400
- `Err(InvalidAcceptanceToken)` → 400

### Adapter Wompi — IPaymentGateway Port
```typescript
// payment/domain/payment-gateway.port.ts
interface IPaymentGateway {
  createTransaction(params: CreateTransactionParams): Promise<Result<WompiTransaction, PaymentGatewayError>>
  getTransactionStatus(wompiId: string): Promise<Result<WompiTransaction, PaymentGatewayError>>
}
```

`getAcceptanceToken()` **no está en el Port** — el `acceptanceToken` lo obtiene el frontend directamente de Wompi (`GET /merchants/:pub_key`), se muestra al usuario como aceptación de T&C, y se envía en el body de `POST /transactions`. El backend lo pasa directamente a Wompi sin re-fetching.

`WompiPaymentAdapter` implementa esta interfaz llamando a `https://api-sandbox.co.uat.wompi.dev/v1`.
`WompiPaymentAdapterMock` implementa la misma interfaz con respuestas controladas para tests.

---

## 5. Arquitectura frontend

### Estructura de carpetas
```
src/
  adapters/
    wompi/
      wompi-tokenization.adapter.ts       ← tokeniza tarjeta con pub_key
      wompi-tokenization.interface.ts     ← IWompiTokenizationAdapter
      wompi-tokenization.mock.ts          ← mock para tests
  store/
    index.ts                              ← configureStore + redux-persist
    checkout/
      checkout.slice.ts                   ← step actual, productId, transactionId
      checkout.selectors.ts
    product/
      product.slice.ts                    ← producto activo + stock
      product.selectors.ts
      product.thunks.ts                   ← fetch producto/stock
    payment/
      payment.slice.ts                    ← tokenId, amounts, result
      payment.selectors.ts
      payment.thunks.ts                   ← crear transacción en backend
  pages/
    ProductPage/
    CheckoutPage/       ← contiene Modal + Backdrop como sub-componentes
    StatusPage/
  components/
    CreditCardForm/
    DeliveryForm/
    SummaryBackdrop/
    CardNetworkLogo/    ← detecta Visa / MasterCard por prefijo
  hooks/
    useCheckoutStep.ts
    useCardDetection.ts
  api/
    transactions.api.ts
    products.api.ts
    customers.api.ts
  utils/
    luhn.ts             ← validación de número de tarjeta
    currency.ts         ← formateo COP
```

### React 19 APIs usadas
| API | Dónde |
|---|---|
| `use(promise)` | Fetching de producto en `ProductPage` con Suspense |
| `useActionState` | Formulario de checkout para manejar submit + errores |
| `useOptimistic` | Decrementa stock optimistamente al iniciar pago; revierte automáticamente si el status de respuesta es DECLINED o ERROR |
| `ref` como prop | Inputs del formulario de tarjeta (sin `forwardRef`) |

### Persistencia de estado
`redux-persist` persiste solo los slices `checkout` y `payment` (no `product`). El slice `payment` **nunca** persiste el campo `cardData` bruto — solo el `tokenId`.

---

## 6. Contrato completo de la API

**Base URL:** `/api/v1`
**Content-Type:** `application/json`

### 6.1 Products

#### `GET /products`
Lista todos los productos incluyendo su campo `stock` (sin filtrar por stock > 0 — el frontend decide si deshabilitar el botón de pago).

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Audífonos Premium",
      "description": "...",
      "imageUrl": "https://...",
      "priceInCents": 15000000,
      "stock": 10
    }
  ]
}
```

#### `GET /products/:id`
Detalle de un producto.

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Audífonos Premium",
    "description": "...",
    "imageUrl": "https://...",
    "priceInCents": 15000000,
    "stock": 10
  }
}
```

**Response 404:**
```json
{ "error": "PRODUCT_NOT_FOUND", "message": "Product not found" }
```

---

### 6.2 Customers

#### `POST /customers`
Crea o recupera cliente por email (upsert).

**Request body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "+573001234567",
  "address": "Calle 123 #45-67",
  "city": "Bogotá"
}
```

**Response 201:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Juan Pérez",
    "email": "juan@example.com"
  }
}
```

**Validaciones:**
- `email`: formato válido, requerido
- `phone`: requerido, mínimo 7 dígitos
- `name`, `address`, `city`: requeridos, no vacíos

---

### 6.3 Transactions

#### `POST /transactions`
Crea transacción PENDING y ejecuta el pago en Wompi de forma sincrónica.

**Request body:**
```json
{
  "customerId": "uuid",
  "productId": "uuid",
  "cardTokenId": "tok_stagtest_...",
  "installments": 1,
  "acceptanceToken": "eyJ..."
}
```

**Response 201:**
```json
{
  "data": {
    "transactionId": "uuid",
    "reference": "uuid-generado",
    "amountInCents": 20800000,
    "baseFeeInCents": 300000,
    "deliveryFeeInCents": 500000,
    "status": "APPROVED",
    "wompiTransactionId": "wompi-123",
    "delivery": {
      "id": "uuid",
      "address": "Calle 123 #45-67",
      "city": "Bogotá",
      "status": "PENDING"
    }
  }
}
```

**Response 409 (stock agotado):**
```json
{ "error": "STOCK_UNAVAILABLE", "message": "Product out of stock" }
```

**Response 400 (token de tarjeta inválido):**
```json
{ "error": "INVALID_CARD_TOKEN", "message": "Card token is invalid or expired" }
```

**Response 400 (acceptanceToken vencido):**
```json
{ "error": "INVALID_ACCEPTANCE_TOKEN", "message": "Acceptance token is expired, please re-accept terms" }
```

**Response 503 (Wompi caído):**
```json
{ "error": "PAYMENT_GATEWAY_UNAVAILABLE", "message": "Payment gateway is temporarily unavailable" }
```

**Lógica interna (use case — ROP):**
```
1. validate inputs                           → Err(ValidationError) si falla
2. getProduct(productId)                     → Err(ProductNotFound) si no existe
3. checkStock(product)                       → Err(StockUnavailable) si stock = 0
4. createTransaction DB status=PENDING
5. callWompi(reference, amountInCents,       → Err(PaymentGatewayUnavailable) si falla
            cardTokenId, acceptanceToken)      Err(InvalidCardToken) si token inválido
                                               Err(InvalidAcceptanceToken) si token vencido
6. updateTransaction(status)
7. if APPROVED → createDelivery + decrementStock  (Prisma $transaction atómica)
8. return Ok(transaction)
```

**Nota sobre `acceptanceToken`:** el frontend lo obtiene de Wompi (`GET /merchants/:pub_key`) antes de mostrar el backdrop de resumen. Se envía al backend como campo del body; el backend lo pasa directamente a Wompi sin re-fetching.

#### `GET /transactions/:id`
Consulta estado de una transacción.

**Response 200:**
```json
{
  "data": {
    "transactionId": "uuid",
    "reference": "uuid",
    "status": "APPROVED",
    "amountInCents": 20800000,
    "wompiTransactionId": "wompi-123",
    "finalizedAt": "2026-03-23T10:00:00Z",
    "product": { "id": "uuid", "name": "Audífonos Premium" },
    "customer": { "id": "uuid", "name": "Juan Pérez" },
    "delivery": {
      "id": "uuid",
      "address": "Calle 123 #45-67",
      "city": "Bogotá",
      "status": "PENDING"
    }
  }
}
```

**Response 404:**
```json
{ "error": "TRANSACTION_NOT_FOUND", "message": "Transaction not found" }
```

---

### 6.4 Deliveries

#### `GET /deliveries/:transactionId`
Consulta la entrega asociada a una transacción.

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "transactionId": "uuid",
    "address": "Calle 123 #45-67",
    "city": "Bogotá",
    "status": "PENDING"
  }
}
```

**Response 404:**
```json
{ "error": "DELIVERY_NOT_FOUND", "message": "Delivery not found" }
```

---

## 7. Schema de base de datos (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Product {
  id           String        @id @default(uuid())
  name         String
  description  String
  imageUrl     String
  priceInCents Int
  stock        Int
  createdAt    DateTime      @default(now())
  transactions Transaction[]
  deliveries   Delivery[]
}

model Customer {
  id           String        @id @default(uuid())
  name         String
  email        String        @unique
  phone        String
  address      String
  city         String
  createdAt    DateTime      @default(now())
  transactions Transaction[]
  deliveries   Delivery[]
}

model Transaction {
  id                 String            @id @default(uuid())
  reference          String            @unique
  customerId         String
  productId          String
  amountInCents      Int
  baseFeeInCents     Int
  deliveryFeeInCents Int
  status             TransactionStatus @default(PENDING)
  wompiTransactionId String?
  cardTokenId        String
  installments       Int               @default(1)
  finalizedAt        DateTime?
  createdAt          DateTime          @default(now())
  customer           Customer          @relation(fields: [customerId], references: [id])
  product            Product           @relation(fields: [productId], references: [id])
  delivery           Delivery?
}

model Delivery {
  id            String         @id @default(uuid())
  transactionId String         @unique
  productId     String
  customerId    String
  address       String
  city          String
  status        DeliveryStatus @default(PENDING)
  createdAt     DateTime       @default(now())
  transaction   Transaction    @relation(fields: [transactionId], references: [id])
  product       Product        @relation(fields: [productId], references: [id])
  customer      Customer       @relation(fields: [customerId], references: [id])
}

enum TransactionStatus {
  PENDING
  APPROVED
  DECLINED
  ERROR
}

enum DeliveryStatus {
  PENDING
  SHIPPED
  DELIVERED
}
```

---

## 8. Edge cases de negocio

| Escenario | Manejo |
|---|---|
| **Stock = 0 al cargar producto** | Frontend deshabilita botón de pago; texto "Sin stock disponible" |
| **Stock se agota entre step 1 y paso de pago** | `POST /transactions` valida stock dentro de Prisma `$transaction` → 409 CONFLICT |
| **Pago DECLINED en Wompi** | Status → DECLINED, stock no se descuenta, delivery no se crea; frontend muestra resultado negativo |
| **Pago ERROR en Wompi** | Status → ERROR, mismo comportamiento que DECLINED |
| **Doble click en "Confirmar pago"** | Frontend deshabilita botón tras primer submit; backend tiene constraint UNIQUE en `reference` |
| **cardTokenId expirado o inválido** | Wompi retorna error → Adapter → `Err(InvalidCardToken)` → 400 |
| **Wompi API timeout / caída** | Adapter captura error de red → `Err(PaymentGatewayUnavailable)` → 503; transacción queda en PENDING en DB |
| **Refresh en step 2 (formulario)** | Sin `transactionId` en persisted state → reset a step 1; formulario se limpia |
| **Refresh en step 3 (summary)** | `productId` y `checkoutStep` persisten → muestra summary; no hay dinero comprometido |
| **Refresh en step 4 (status)** | `transactionId` persiste → `GET /transactions/:id` rehidrata el resultado completo |
| **Email duplicado al crear Customer** | `upsert` por email → retorna cliente existente sin error |
| **acceptanceToken vencido** | Wompi lo rechaza → Adapter lo mapea a `Err(InvalidAcceptanceToken)` → frontend debe solicitar nuevo token |

---

## 9. Estrategia de testing

### Backend

| Capa | Cobertura objetivo | Herramientas |
|---|---|---|
| Use Cases | 100% | Jest, mocks de ports via DI de NestJS |
| Adapters (`WompiPaymentAdapter`) | >80% | Jest + `nock` para mock HTTP |
| Controllers | >80% | Jest + Supertest |
| Repositories (Prisma) | >80% | Jest + DB de test dedicada |

**Patrón para use cases:**
```typescript
// create-transaction.use-case.spec.ts
describe('CreateTransactionUseCase', () => {
  it('returns Err(StockUnavailable) when stock is 0', async () => { ... })
  it('returns Err(PaymentGatewayUnavailable) when Wompi fails', async () => { ... })
  it('creates delivery and decrements stock on APPROVED', async () => { ... })
  it('does NOT decrement stock on DECLINED', async () => { ... })
})
```

### Frontend

| Capa | Cobertura objetivo | Herramientas |
|---|---|---|
| Redux slices (reducers + selectors) | 100% | Jest |
| `WompiTokenizationAdapter` | 100% | Jest + fetch mock |
| `luhn.ts` utility | 100% | Jest |
| Componentes (`CreditCardForm`, `SummaryBackdrop`, `StatusPage`) | >80% | Jest + React Testing Library |
| Flujo E2E store → UI | >80% | Jest + RTL + MSW |

---

## 10. Variables de entorno

### Backend (`.env`)
```
DATABASE_URL=postgresql://user:password@localhost:5432/checkout_db
WOMPI_PUBLIC_KEY=pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7
WOMPI_PRIVATE_KEY=prv_stagtest_5i0ZGIGiFcDQifYsXxvsny7Y37tKqFWg
WOMPI_INTEGRITY_KEY=stagtest_integrity_nAIBuqayW70XpUqJS4qf4STYiISd89Fp
WOMPI_API_URL=https://api-sandbox.co.uat.wompi.dev/v1
BASE_FEE_CENTS=300000
DELIVERY_FEE_CENTS=500000
PORT=3001
```

### Frontend (`.env`)
```
VITE_API_URL=http://localhost:3001/api/v1
VITE_WOMPI_PUBLIC_KEY=pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7
VITE_WOMPI_API_URL=https://api-sandbox.co.uat.wompi.dev/v1
```

---

## 11. Criterios de evaluación mapeados

| Criterio | Puntos | Cómo se cubre |
|---|---|---|
| README completo | 5 | Docs, data model, Swagger link, test results |
| Imágenes rápidas, sin out-of-bounds | 5 | WebP, tamaños controlados, mobile-first CSS |
| Funcionalidad completa del checkout | 20 | Flujo 5 pasos end-to-end con Wompi sandbox |
| API funcionando correctamente | 20 | 4 recursos REST con validaciones y error handling |
| >80% cobertura unit tests | 30 | Jest frontend + backend |
| Deploy en cloud | 20 | AWS (S3+CloudFront frontend, ECS/Lambda backend, RDS PostgreSQL) |
| OWASP + HTTPS + security headers | +5 | Helmet.js en NestJS, CSP, HSTS |
| Responsive + multi-browser | +5 | Mobile-first, tested en Chrome/Firefox/Safari |
| CSS skills | +10 | Flexbox/Grid, diseño propio |
| Clean code | +10 | Hexagonal, ROP, sin lógica en controllers |
| Hexagonal Architecture + Ports & Adapters | +10 | Estructura de módulos arriba |
| ROP | +10 | Result<T,E> en todos los use cases |

**Total posible: 100 base + 50 bonus = 150 puntos**
