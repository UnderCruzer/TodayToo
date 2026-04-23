FROM node:20-alpine AS base

# 의존성 설치 레이어
FROM base AS deps
WORKDIR /app
COPY package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/ai/package.json ./packages/ai/
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
RUN npm ci

# 빌드 레이어
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build --workspace=@oneuldo/web

# 실행 레이어
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 8080
ENV PORT=8080

CMD ["node", "apps/web/server.js"]
