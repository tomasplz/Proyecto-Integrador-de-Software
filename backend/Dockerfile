# --- Stage 1: Build the NestJS application ---
FROM node:18-slim as builder

# Instala pnpm globalmente
RUN npm install -g pnpm

# Habilitar Corepack para usar PNPM (si el packageManager está definido en package.json)
RUN corepack enable

# Establece el directorio de trabajo
WORKDIR /app

# Copia archivos de definición de dependencias (package.json y pnpm-lock.yaml)
COPY package.json pnpm-lock.yaml ./

# Instala las dependencias usando pnpm
RUN pnpm install --frozen-lockfile

# Copia el resto del código fuente
COPY . .

# Construye la aplicación NestJS
RUN pnpm run build

# --- Stage 2: Imagen final para producción (más ligera) ---
FROM node:18-slim

# Establece el directorio de trabajo
WORKDIR /app

# Habilitar Corepack en la imagen final si lo necesitas para correr scripts
# RUN corepack enable # Descomentar si tus CMD o entrypoint usan pnpm/yarn directamente

# Copia los archivos necesarios desde la etapa de 'builder'
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Opcional: Copia el .env si tu app lo lee en runtime (cuidado con secretos)
# Si tu app lee DATABASE_URL u otras variables del ENV del contenedor (lo ideal con docker),
# no necesitas copiar el .env file dentro de la imagen.
# Si tu app lee .env file específicamente, descomenta la siguiente línea.
# COPY --from=builder /app/.env ./.env


# Expone el puerto en el que corre la aplicación NestJS (por defecto 3000)
EXPOSE 3000

# Define el comando por defecto para ejecutar el contenedor
# Ejecuta el archivo main.js compilado
CMD [ "node", "dist/main" ]

# Si necesitas ejecutar migraciones al iniciar el contenedor (solo para ciertos flujos de despliegue, úsalo con precaución en prod)
# COPY --from=builder /app/run-migrations-and-start.sh ./
# RUN chmod +x ./run-migrations-and-start.sh
# CMD [ "./run-migrations-and-start.sh" ]

