# SpaceUp Backend

API REST construida con [NestJS](https://nestjs.com/) para la aplicación SpaceUp y su panel administrativo web.

## Requisitos

- Node.js 18 o 20
- MySQL 8.0
- (Opcional) Docker

## Configuración

```bash
cp .env.example .env
# Edita .env con tus valores
```

## Desarrollo local con Docker

```bash
# Desde la raíz del proyecto
cd ..
docker compose up -d backend mysql
```

## Desarrollo local sin Docker

```bash
npm install
npm run start:dev
```

## Comandos

```bash
npm run build            # Compilar
npm run start:dev        # Desarrollo con hot reload
npm run start:prod       # Producción (requiere dist/)
npm run lint             # Verificar lint
npm run lint:fix         # Corregir lint
npm run test             # Tests unitarios
npm run test:cov         # Tests con cobertura
npm run seed:admin       # Crear usuario admin inicial
```

## Estructura

```
src/
├── auth/                # Autenticación JWT
├── usuario/             # Gestión de usuarios
├── empresa/             # Gestión de empresas
├── estacionamiento/     # Estacionamientos
├── reserva/             # Reservas
├── pago/                # Pagos (Stripe)
├── reportes/            # Reportes PDF
├── web/                 # Endpoints exclusivos del panel web
├── database/            # Seeds y migraciones
└── util/                # Utilidades (almacenamiento local, Stripe)
```

## Variables de entorno importantes

| Variable | Descripción |
|---|---|
| `DB_HOST` | Host de MySQL |
| `DB_USER` | Usuario de MySQL |
| `DB_PASS` | Contraseña de MySQL |
| `DB_NAME` | Nombre de la base de datos |
| `JWT_SECRET` | Secret para firmar tokens |
| `STRIPE_SECRET_KEY` | Secret key de Stripe |
| `UPLOAD_DIR` | Carpeta para archivos subidos |
| `PUBLIC_URL` | URL pública del backend para archivos estáticos |

## Seguridad

Ver [`docs/SEGURIDAD.md`](../docs/SEGURIDAD.md) en la raíz del proyecto.
