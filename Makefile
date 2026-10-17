.PHONY: setup start db-up db-down db-generate db-migrate seed lint typecheck test check build

setup:
	@test -f .env || cp .env.example .env
	npm install

start: db-up db-migrate
	npm run dev

db-up:
	docker compose up -d --wait db

db-down:
	docker compose down

db-generate:
	npm run db:generate

db-migrate:
	npm run db:migrate

seed:
	npm run db:seed

lint:
	npm run lint

typecheck:
	npm run typecheck

test:
	npm test

build:
	npm run build

# Same gates as GitHub Actions (migrate separately when you need a real DB).
check: lint typecheck test build
