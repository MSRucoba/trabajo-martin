# ============================================
# SpaceUp Backend - Dockerfile (multi-stage)
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar dependencias primero para aprovechar cache
COPY package*.json ./
RUN npm ci

# Copiar código fuente y compilar
COPY . .
RUN npm run build

# ============================================
# Imagen final de producción
# ============================================
FROM node:20-alpine

WORKDIR /app

# Crear directorio para secretos (se monta en runtime)
RUN mkdir -p /app/secrets /app/logs

COPY package*.json ./
RUN npm ci --only=production

# Copiar artefactos compilados
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
