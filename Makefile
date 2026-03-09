SHELL := /bin/bash
.DEFAULT_GOAL := help

COMPOSE ?= docker compose
NPM ?= npm
FRONTEND_DIR ?= .
BACKEND_DIR ?= backend
SEED_DIR ?= docker/mongo/seed
SEED_DB_NAME ?= safira
MONGO_SEED_SOURCE_URI ?= mongodb://host.docker.internal:27017/$(SEED_DB_NAME)

.PHONY: help install install-frontend install-backend dev-frontend dev-backend build build-frontend build-backend lint test-backend docker-build docker-up docker-down docker-restart docker-ps docker-logs docker-rebuild docker-clean health seed-export seed-import

help: ## Show available commands
	@awk 'BEGIN {FS = ":.*##"; printf "\nSafira - Make Commands\n\n"} /^[a-zA-Z0-9_.-]+:.*##/ {printf "  %-18s %s\n", $$1, $$2} END {printf "\n"}' $(MAKEFILE_LIST)

install: install-frontend install-backend ## Install all dependencies (frontend + backend)

install-frontend: ## Install frontend dependencies
	@cd $(FRONTEND_DIR) && $(NPM) ci

install-backend: ## Install backend dependencies
	@cd $(BACKEND_DIR) && $(NPM) ci

dev-frontend: ## Run frontend in development mode
	@cd $(FRONTEND_DIR) && $(NPM) run dev

dev-backend: ## Run backend in development mode
	@cd $(BACKEND_DIR) && $(NPM) run dev

build: build-frontend build-backend ## Build frontend and backend

build-frontend: ## Build frontend
	@cd $(FRONTEND_DIR) && $(NPM) run build

build-backend: ## Build backend
	@cd $(BACKEND_DIR) && $(NPM) run build

lint: ## Run frontend lint
	@cd $(FRONTEND_DIR) && $(NPM) run lint

test-backend: ## Run backend tests
	@cd $(BACKEND_DIR) && $(NPM) run test

docker-build: ## Build Docker images
	@$(COMPOSE) build

docker-up: ## Start containers in detached mode
	@$(COMPOSE) up -d

docker-down: ## Stop and remove containers
	@$(COMPOSE) down

docker-restart: ## Restart all containers
	@$(COMPOSE) restart

docker-ps: ## Show containers status
	@$(COMPOSE) ps -a

docker-logs: ## Tail logs from all services
	@$(COMPOSE) logs -f --tail=200

docker-rebuild: ## Rebuild containers without cache and restart
	@$(COMPOSE) down
	@$(COMPOSE) build --no-cache
	@$(COMPOSE) up -d

docker-clean: ## Remove containers, networks, volumes and images created by compose
	@$(COMPOSE) down --volumes --rmi local

health: ## Check frontend and backend health endpoints
	@curl -fsS http://localhost:3000 >/dev/null && echo "frontend: ok" || (echo "frontend: fail" && exit 1)
	@curl -fsS http://localhost:3333/health >/dev/null && echo "backend: ok" || (echo "backend: fail" && exit 1)

seed-export: ## Export local MongoDB data into docker/mongo/seed
	@rm -rf $(SEED_DIR)/$(SEED_DB_NAME)
	@mkdir -p $(SEED_DIR)
	@docker run --rm -v "$(PWD)/$(SEED_DIR):/backup" mongo:7 sh -c 'mongodump --uri="$(MONGO_SEED_SOURCE_URI)" --db "$(SEED_DB_NAME)" --out=/backup'
	@echo "Seed exportado em $(SEED_DIR)/$(SEED_DB_NAME)"

seed-import: ## Import docker/mongo/seed into running mongodb container
	@$(COMPOSE) exec -T mongodb mongorestore --drop --db "$(SEED_DB_NAME)" /seed/$(SEED_DB_NAME)
	@echo "Seed importado para o banco $(SEED_DB_NAME)"
