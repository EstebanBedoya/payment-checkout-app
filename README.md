# Payment Checkout App

A full-stack payment checkout application for credit card processing via [Wompi](https://wompi.com), built with Hexagonal Architecture and Railway Oriented Programming (ROP).

## Screenshots

| Catalog | Product Detail | Card Form |
|---------|---------------|-----------|
| ![Catalog](step1-catalog.png) | ![Detail](step1-product-detail.png) | ![Card](step2-card-form.png) |

| Delivery | Summary | Status |
|----------|---------|--------|
| ![Delivery](step3-delivery.png) | ![Summary](flow-step3-summary.png) | ![Approved](step4-approved.png) |

## Tech Stack

- **Frontend**: React 19, Vite, Redux Toolkit, TypeScript
- **Backend**: NestJS, Prisma ORM, PostgreSQL, TypeScript
- **Payments**: Wompi Sandbox (card tokenization + transactions)
- **Testing**: Jest + Testing Library (>80% coverage on both)

## Architecture

### Hexagonal Architecture (Ports & Adapters)

Each backend module follows a strict 3-layer structure:

```
src/modules/<module>/
  domain/           ← Entities + Repository Port interfaces
  application/      ← Use Cases (business logic)
  infrastructure/   ← Controllers, NestJS Modules, Prisma adapters
```

### Railway Oriented Programming (ROP)

All use cases return `Promise<Result<T, DomainError>>` using a custom `Result<Ok, Err>` type in `src/shared/result.ts`. This eliminates exceptions from the business logic layer and forces explicit error handling at the controller boundary.

## Project Structure

```
payment-checkout-app/
├── backend/          NestJS API (port 3001)
├── frontend/         React SPA (port 5173)
├── docker-compose.yml  PostgreSQL for local dev
└── docs/             Specification and implementation plan
```

## Prerequisites

- [Node.js](https://nodejs.org) >= 20
- [pnpm](https://pnpm.io) >= 9
- [Docker](https://docker.com) (for PostgreSQL) or a local PostgreSQL 15+ instance

## Setup

### 1. Start PostgreSQL

```bash
docker-compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env       # fill in your Wompi sandbox keys
pnpm install
pnpm run db:push           # apply Prisma schema
pnpm run db:seed           # seed products
pnpm run start:dev         # starts on http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env       # or create manually (see below)
pnpm install
pnpm run dev               # starts on http://localhost:5173
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/checkout_db` |
| `WOMPI_API_URL` | Wompi API base URL | `https://api-sandbox.co.uat.wompi.dev/v1` |
| `WOMPI_PUBLIC_KEY` | Wompi sandbox public key | `pub_stagtest_...` |
| `WOMPI_PRIVATE_KEY` | Wompi sandbox private key | `prv_stagtest_...` |
| `WOMPI_INTEGRITY_KEY` | Wompi integrity key for signature | `stagtest_integrity_...` |
| `BASE_FEE_CENTS` | Fixed base fee in cents (COP) | `300000` |
| `DELIVERY_FEE_CENTS` | Fixed delivery fee in cents (COP) | `500000` |
| `PORT` | API port | `3001` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:5173` |

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_WOMPI_PUBLIC_KEY=pub_stagtest_...
VITE_WOMPI_API_URL=https://api-sandbox.co.uat.wompi.dev/v1
```

## API Endpoints

Base path: `http://localhost:3001/api/v1`
Swagger docs: `http://localhost:3001/api/docs`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/products` | List all products |
| `GET` | `/products/:id` | Get product by ID |
| `POST` | `/customers` | Create/upsert customer by email |
| `POST` | `/transactions` | Create a new transaction |
| `GET` | `/transactions/:id` | Get transaction by ID |
| `GET` | `/deliveries/:transactionId` | Get delivery info |

## Running Tests

### Backend

```bash
cd backend
pnpm test              # run all unit tests
pnpm run test:cov      # with coverage report (threshold: 80%)
```

### Frontend

```bash
cd frontend
pnpm test              # run all tests
pnpm run test:coverage # with coverage report (threshold: 80%)
```

## Security

The API implements OWASP best practices:
- **Helmet** with strict CSP, HSTS, and security headers
- **Rate limiting** (60 requests / 60 seconds per IP)
- **CORS** restricted to the configured `FRONTEND_URL`
- **Input validation** with class-validator (whitelist mode)
- Private keys and integrity secrets never leave the backend
