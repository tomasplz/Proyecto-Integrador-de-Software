
# --- Stage 1: Build the React/Vite application ---
FROM node:18-slim as builder

# Habilitar Corepack para usar Yarn (si el packageManager está definido en package.json)
RUN corepack enable

# Establece el directorio de trabajo
WORKDIR /app

# Copia package.json y yarn.lock
COPY package.json yarn.lock ./

# Instala las dependencias usando yarn (Corepack lo resuelve)
RUN yarn install --frozen-lockfile

# Copia el resto del código fuente
COPY . .

# Construye la aplicación React/Vite
RUN yarn run build

# --- Stage 2: Serve the static build with Nginx ---
FROM nginx:stable-alpine

# Copia los archivos estáticos de la build
COPY --from=builder /app/dist /usr/share/nginx/html

# Opcional: Copia un archivo de configuración de Nginx personalizado
# COPY ./nginx.conf /etc/nginx/nginx.conf

# Expone el puerto 80
EXPOSE 80

# El CMD por defecto de nginx:stable-alpine ya inicia Nginx.

