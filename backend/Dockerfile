
FROM node:18-alpine AS base
RUN npm install -g pnpm


FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile


FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build


FROM base AS production
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY --from=builder /app/dist ./dist
EXPOSE 3000


CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && node dist/main.js"]