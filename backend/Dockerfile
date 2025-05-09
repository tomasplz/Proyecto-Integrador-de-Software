# ---- Base Node ----
FROM node:18-alpine AS base
# Instalar pnpm globalmente
RUN npm install -g pnpm

# ---- Dependencies ----
FROM base AS deps
WORKDIR /app
# Copiar solo los archivos de manifiesto para cachear la instalación de dependencias
COPY package.json pnpm-lock.yaml ./
# Instalar dependencias, incluyendo las de desarrollo para la construcción
RUN pnpm install --frozen-lockfile

# ---- Builder ----
FROM base AS builder
WORKDIR /app
# Copiar dependencias instaladas y el código fuente
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Construir la aplicación (no generamos el cliente Prisma aquí)
RUN pnpm run build

# ---- Production Image ----
FROM base AS production
ENV NODE_ENV production
WORKDIR /app

# Copiar esquema de Prisma y archivos de migraciones
COPY --from=builder /app/prisma ./prisma

# Copiar archivos de manifiesto
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Instalar todas las dependencias (incluyendo devDependencies para poder ejecutar prisma generate)
RUN pnpm install --frozen-lockfile

# Copiar los artefactos construidos
COPY --from=builder /app/dist ./dist

# Exponer el puerto que usa tu aplicación
EXPOSE 3000

# Script de inicio: genera el cliente Prisma, ejecuta las migraciones y luego inicia la aplicación
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && node dist/main.js"]