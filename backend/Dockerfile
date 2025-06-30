FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
# Instalar OpenSSL para resolver el warning de Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

FROM base AS dependencies_stage
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM base AS build_stage
WORKDIR /app
COPY . .
COPY --from=dependencies_stage /app/node_modules ./node_modules
RUN pnpm exec prisma generate
RUN chown -R node /app/node_modules 
RUN pnpm run build

FROM base AS deploy
WORKDIR /app

# Instalar OpenSSL en la imagen final
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=build_stage /app/dist ./dist

COPY --from=build_stage /app/package.json ./package.json
COPY --from=build_stage /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build_stage /app/tsconfig.json ./tsconfig.json
COPY --from=build_stage /app/prisma ./prisma

COPY --from=build_stage /app/node_modules ./node_modules

RUN pnpm install -g ts-node tsx

# Copiar el script de inicio
COPY start.sh ./start.sh
RUN chmod +x start.sh

CMD [ "./start.sh" ]