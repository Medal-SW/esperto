.PHONY: up dev prod down build logs seed migrate migration typecheck shell-back shell-front clean

up:
	docker compose up -d

dev:
	docker compose up --build

dev-d:
	docker compose up --build -d

prod:
	docker compose -f docker-compose.prod.yml up --build -d

down:
	docker compose down

down-prod:
	docker compose -f docker-compose.prod.yml down

build:
	docker compose build

logs:
	docker compose logs -f

logs-back:
	docker compose logs -f backend

logs-front:
	docker compose logs -f frontend

migrate:
	docker compose exec backend alembic upgrade head

migration:
	@read -p "Migration message: " msg; \
	docker compose exec backend alembic revision --autogenerate -m "$$msg"

seed:
	docker compose exec backend python -m app.seed

typecheck:
	docker compose exec frontend npx tsc --noEmit

shell-back:
	docker compose exec backend bash

shell-front:
	docker compose exec frontend sh

clean:
	docker compose down -v --rmi local
