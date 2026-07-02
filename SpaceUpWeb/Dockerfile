# ============================================
# SpaceUp Web - Dockerfile (multi-stage)
# ============================================
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ============================================
# Imagen final con nginx
# ============================================
FROM nginx:alpine

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar build de Angular
COPY --from=builder /app/dist/space-up-web-admin/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
