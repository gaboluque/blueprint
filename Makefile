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
ifndef NAME
	$(error Set NAME to a snake_case description, e.g. make db-generate NAME=add_audit_events)
endif
	npm run db:generate -- $(NAME)

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
