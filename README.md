# 🚀 SpaceUp - Sistema de Gestión Web + Backend

Plataforma administrativa web para la aplicación móvil **SpaceUp**, construida con:

- **Backend:** NestJS + TypeORM + MySQL
- **Frontend:** Angular 18 + Angular Material
- **DevOps:** Docker Compose + Jenkins + SonarQube + GitHub Actions + AWS

## 📁 Estructura del repositorio

```
.
├── SpaceUpBackend/          # API REST con NestJS
├── SpaceUpWeb/              # Panel administrativo Angular
├── docker-compose.yml       # Entorno de desarrollo local
├── Jenkinsfile              # Pipeline de Jenkins
├── sonar-project.properties # Configuración de SonarQube
├── .github/workflows/       # GitHub Actions para CI/CD
└── scripts/                 # Scripts de utilidad (deploy AWS)
```

## 🚀 Inicio rápido (desarrollo local)

### Requisitos

- Docker + Docker Compose
- Git

### 1. Clonar y configurar

```bash
git clone https://github.com/tu-org/spaceup.git
cd spaceup
cp SpaceUpBackend/.env.example SpaceUpBackend/.env
# Edita SpaceUpBackend/.env con tus valores
```

### 2. Levantar el entorno

```bash
docker compose up -d
```

### 3. Crear usuario administrador

```bash
docker compose exec backend npm run seed:admin
```

### URLs locales

| Servicio | URL |
|---|---|
| Panel web | http://localhost:4200 |
| API backend | http://localhost:3000 |
| phpMyAdmin | http://localhost:8080 |

## 🧪 Comandos útiles

```bash
# Backend
cd SpaceUpBackend
npm install
npm run start:dev
npm run lint
npm run test
npm run build
npm run seed:admin

# Frontend
cd SpaceUpWeb
npm install
npm run start:dev
npm run lint
npm run test:ci
npm run build
```

También puedes usar el `Makefile` en la raíz:

```bash
make dev      # Levantar todo
make seed     # Crear admin
make down     # Detener
make test     # Tests
make lint     # Lint
make build    # Build
```

## 🔐 Seguridad

- Nunca commitear `.env`, claves privadas ni archivos subidos (`uploads/`)
- Usar variables de entorno o secretos de Docker/Jenkins/GitHub
- JWT_SECRET fuerte y desde variable de entorno
- CORS restringido en producción

## 🔄 CI/CD

- **Jenkins:** `Jenkinsfile`
- **SonarQube:** `sonar-project.properties`
- **GitHub Actions:** `.github/workflows/ci-cd.yml`
- **Deploy AWS:** `scripts/deploy-aws.sh`

## 📝 Nota

La documentación extendida para el equipo (guía de desarrollo, CI/CD, AWS y seguridad) se encuentra en archivos aparte, fuera de este repositorio de código, según lo solicitado.
