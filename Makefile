.PHONY: help install dev up down logs backend-shell frontend-shell seed test test-backend test-frontend lint lint-backend lint-frontend build build-backend build-frontend

help:
	@echo "Comandos disponibles para SpaceUp:"
	@echo "  make dev             - Levantar todo el entorno de desarrollo"
	@echo "  make up              - Alias de dev"
	@echo "  make down            - Detener contenedores"
	@echo "  make logs            - Ver logs de todos los servicios"
	@echo "  make backend-shell   - Entrar al contenedor del backend"
	@echo "  make frontend-shell  - Entrar al contenedor del frontend"
	@echo "  make seed            - Crear usuario admin inicial"
	@echo "  make test            - Ejecutar tests de backend y frontend"
	@echo "  make lint            - Ejecutar lint de backend y frontend"
	@echo "  make build           - Build de backend y frontend"

install:
	cd SpaceUpBackend && npm install
	cd SpaceUpWeb && npm install

dev up:
	cp -n SpaceUpBackend/.env.example SpaceUpBackend/.env || true
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

backend-shell:
	docker compose exec backend sh

frontend-shell:
	docker compose exec frontend sh

seed:
	docker compose exec backend npm run seed:admin

test: test-backend test-frontend

test-backend:
	cd SpaceUpBackend && npm run test

test-frontend:
	cd SpaceUpWeb && npm run test:ci

lint: lint-backend lint-frontend

lint-backend:
	cd SpaceUpBackend && npm run lint

lint-frontend:
	cd SpaceUpWeb && npm run lint

build: build-backend build-frontend

build-backend:
	cd SpaceUpBackend && npm run build

build-frontend:
	cd SpaceUpWeb && npm run build
