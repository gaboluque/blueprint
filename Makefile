.PHONY: setup start db-up db-down db-reset db-generate db-migrate seed format format-check lint typecheck test check build

setup:
	@test -f .env || cp .env.example .env
	npm install

start: db-up db-migrate
	npm run dev

db-up:
	docker compose up -d --wait db

db-down:
	docker compose down

# Wipes local Postgres data and rebuilds it from migrations + seed.
db-reset:
	docker compose down -v
	$(MAKE) db-up db-migrate seed

db-generate:
ifndef NAME
	$(error Set NAME to a snake_case description, e.g. make db-generate NAME=add_audit_events)
endif
	npm run db:generate -- $(NAME)

db-migrate:
	npm run db:migrate

seed:
	npm run db:seed

format:
	npm run format

format-check:
	npm run format:check

lint:
	npm run lint
	npm run lint:complexity

typecheck:
	npm run typecheck

test:
	npm test

build:
	npm run build

# Same gates as GitHub Actions (migrate separately when you need a real DB).
check: format-check lint typecheck test build
