# Stage 1: Builder
FROM node:24-alpine AS builder
WORKDIR /app

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --config.ignore-scripts=false

COPY . .
RUN pnpm run build

# Stage 2: Runner
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --prod --frozen-lockfile --config.ignore-scripts=false

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]