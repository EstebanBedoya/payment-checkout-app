# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN npx prisma generate
RUN pnpm run build

# ─── Stage 2: Production ─────────────────────────────────────────────────────
# Install ALL dependencies (including devDependencies) so that prisma CLI,
# ts-node, and typescript are available for `prisma migrate deploy` and
# `prisma db seed` (seed runs via ts-node per package.json prisma.seed config).
FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# prisma.config.ts: Prisma v7 reads datasource URL from here (not schema.prisma)
# tsconfig.json: required by the seed command (`ts-node --project tsconfig.json`)
COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
RUN npx prisma generate

COPY --from=build /app/dist ./dist

EXPOSE 3001
CMD ["node", "dist/main"]
