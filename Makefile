SHELL := /bin/bash
.DEFAULT_GOAL := help

COMPOSE ?= docker compose
NPM ?= npm
FRONTEND_DIR ?= .
BACKEND_DIR ?= backend
ENV ?= development
ROOT_ENV_FILE ?= config/env/$(ENV).env
BACKEND_ENV_FILE ?= backend/config/env/$(ENV).env
SEED_DIR ?= docker/mongo/seed
SEED_DB_NAME ?= safira
MONGO_SEED_SOURCE_URI ?= mongodb://host.docker.internal:27017/$(SEED_DB_NAME)

.PHONY: help install install-frontend install-backend dev-frontend dev-backend build build-frontend build-backend lint test-backend docker-build docker-up docker-down docker-restart docker-ps docker-logs docker-rebuild docker-clean health seed-export seed-import check-env-files

check-env-files: ## Validate environment files for selected ENV=<development|production>
	@test -f "$(ROOT_ENV_FILE)" || (echo "Arquivo nao encontrado: $(ROOT_ENV_FILE)" && exit 1)
	@test -f "$(BACKEND_ENV_FILE)" || (echo "Arquivo nao encontrado: $(BACKEND_ENV_FILE)" && exit 1)

help: ## Show available commands
	@awk 'BEGIN {FS = ":.*##"; printf "\nSafira - Make Commands\n\n"} /^[a-zA-Z0-9_.-]+:.*##/ {printf "  %-18s %s\n", $$1, $$2} END {printf "\n"}' $(MAKEFILE_LIST)

install: install-frontend install-backend ## Install all dependencies (frontend + backend)

install-frontend: ## Install frontend dependencies
	@cd $(FRONTEND_DIR) && $(NPM) ci

install-backend: ## Install backend dependencies
	@cd $(BACKEND_DIR) && $(NPM) ci

dev-frontend: check-env-files ## Run frontend in development mode for selected ENV
	@set -a; source "$(ROOT_ENV_FILE)"; set +a; cd $(FRONTEND_DIR) && NODE_ENV=$(ENV) APP_ENV=$(ENV) $(NPM) run dev

dev-backend: check-env-files ## Run backend in development mode for selected ENV
	@cd $(BACKEND_DIR) && APP_ENV=$(ENV) NODE_ENV=$(ENV) $(NPM) run dev

build: build-frontend build-backend ## Build frontend and backend

build-frontend: check-env-files ## Build frontend for selected ENV
	@set -a; cd $(FRONTEND_DIR) && $(NPM) run build

build-backend: check-env-files ## Build backend for selected ENV
	@cd $(BACKEND_DIR) && APP_ENV=$(ENV) NODE_ENV=$(ENV) $(NPM) run build

lint: ## Run frontend lint
	@cd $(FRONTEND_DIR) && $(NPM) run lint

test-backend: ## Run backend tests
	@cd $(BACKEND_DIR) && $(NPM) run test

docker-build: check-env-files ## Build Docker images for selected ENV
	@APP_ENV=$(ENV) BACKEND_ENV_FILE=./$(BACKEND_ENV_FILE) FRONTEND_ENV_FILE=./$(ROOT_ENV_FILE) $(COMPOSE) --env-file ./$(ROOT_ENV_FILE) build

docker-up: check-env-files ## Start containers in detached mode for selected ENV
	@APP_ENV=$(ENV) BACKEND_ENV_FILE=./$(BACKEND_ENV_FILE) FRONTEND_ENV_FILE=./$(ROOT_ENV_FILE) $(COMPOSE) --env-file ./$(ROOT_ENV_FILE) up -d

docker-down: check-env-files ## Stop and remove containers for selected ENV
	@APP_ENV=$(ENV) BACKEND_ENV_FILE=./$(BACKEND_ENV_FILE) FRONTEND_ENV_FILE=./$(ROOT_ENV_FILE) $(COMPOSE) --env-file ./$(ROOT_ENV_FILE) down

docker-restart: check-env-files ## Restart all containers for selected ENV
	@APP_ENV=$(ENV) BACKEND_ENV_FILE=./$(BACKEND_ENV_FILE) FRONTEND_ENV_FILE=./$(ROOT_ENV_FILE) $(COMPOSE) --env-file ./$(ROOT_ENV_FILE) restart

docker-ps: check-env-files ## Show containers status for selected ENV
	@APP_ENV=$(ENV) BACKEND_ENV_FILE=./$(BACKEND_ENV_FILE) FRONTEND_ENV_FILE=./$(ROOT_ENV_FILE) $(COMPOSE) --env-file ./$(ROOT_ENV_FILE) ps -a

docker-logs: check-env-files ## Tail logs from all services for selected ENV
	@APP_ENV=$(ENV) BACKEND_ENV_FILE=./$(BACKEND_ENV_FILE) FRONTEND_ENV_FILE=./$(ROOT_ENV_FILE) $(COMPOSE) --env-file ./$(ROOT_ENV_FILE) logs -f --tail=200

docker-rebuild: check-env-files ## Rebuild containers without cache and restart for selected ENV
	@APP_ENV=$(ENV) BACKEND_ENV_FILE=./$(BACKEND_ENV_FILE) FRONTEND_ENV_FILE=./$(ROOT_ENV_FILE) $(COMPOSE) --env-file ./$(ROOT_ENV_FILE) down
	@APP_ENV=$(ENV) BACKEND_ENV_FILE=./$(BACKEND_ENV_FILE) FRONTEND_ENV_FILE=./$(ROOT_ENV_FILE) $(COMPOSE) --env-file ./$(ROOT_ENV_FILE) build --no-cache
	@APP_ENV=$(ENV) BACKEND_ENV_FILE=./$(BACKEND_ENV_FILE) FRONTEND_ENV_FILE=./$(ROOT_ENV_FILE) $(COMPOSE) --env-file ./$(ROOT_ENV_FILE) up -d

docker-clean: check-env-files ## Remove containers, networks, volumes and images created by compose for selected ENV
	@APP_ENV=$(ENV) BACKEND_ENV_FILE=./$(BACKEND_ENV_FILE) FRONTEND_ENV_FILE=./$(ROOT_ENV_FILE) $(COMPOSE) --env-file ./$(ROOT_ENV_FILE) down --volumes --rmi local

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
