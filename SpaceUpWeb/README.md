# SpaceUp Web Admin

Panel administrativo web de SpaceUp construido con [Angular CLI](https://github.com/angular/angular-cli) 18.

## Requisitos

- Node.js 18.x
- npm 9+

## Configuración de entornos

Los entornos están en `src/environments/`:

```ts
// src/environments/environment.ts (desarrollo)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
};
```

```ts
// src/environments/environment.prod.ts (producción)
export const environment = {
  production: true,
  apiUrl: 'https://api.tu-dominio.com',
};
```

## Desarrollo local con Docker

```bash
# Desde la raíz del proyecto
cd ..
docker compose up -d frontend
```

Luego abre http://localhost:4200.

## Desarrollo local sin Docker

```bash
npm install
npm run start:dev
```

## Comandos

```bash
npm run start:dev        # Servidor de desarrollo
npm run build            # Build de producción
npm run test             # Tests interactivos
npm run test:ci          # Tests en CI (headless)
npm run lint             # Verificar lint
npm run lint:fix         # Corregir lint
```

## Estructura

```
src/app/
├── auth/                # Login
├── pages/               # Vistas del panel (dashboard, empresas, etc.)
├── services/            # Servicios HTTP
├── services/web/        # Servicios del panel web
├── guards/              # Protección de rutas
├── interceptors/        # Interceptor de JWT
└── components/          # Componentes reutilizables
```

## Build de producción

```bash
npm run build
```

El build se genera en `dist/space-up-web-admin/browser`.

## Docker

El `Dockerfile` construye el frontend y lo sirve con nginx.

## Notas

- Todos los servicios usan `environment.apiUrl` para no depender de URLs hardcodeadas.
- El interceptor añade automáticamente el token JWT en las peticiones.
