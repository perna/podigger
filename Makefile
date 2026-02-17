.PHONY: help setup install dev services services-stop migrate test lint format clean shell superuser seed version bump-patch bump-minor bump-major changelog frontend-setup frontend-dev frontend-test frontend-build

# Default target
help:
	@echo "Podigger Development Commands"
	@echo "=============================="
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make setup          - Install UV, create venv, install Python 3.12 and dependencies"
	@echo "  make install        - Install/update dependencies only (assumes UV is installed)"
	@echo ""
	@echo "Development:"
	@echo "  make dev            - Start local services and run Django dev server"
	@echo "  make services       - Start Docker services (Postgres + Redis) only"
	@echo "  make services-stop  - Stop Docker services"
	@echo ""
	@echo "Database:"
	@echo "  make migrate        - Run Django migrations"
	@echo "  make superuser      - Create Django superuser"
	@echo "  make seed           - Seed database with sample data"
	@echo ""
	@echo "Testing & Quality:"
	@echo "  make test           - Run pytest"
	@echo "  make lint           - Run Ruff linting"
	@echo "  make format         - Run Ruff formatting"
	@echo ""
	@echo "Utilities:"
	@echo "  make shell          - Open Django shell"
	@echo "  make clean          - Clean up venv, cache, and build files"
	@echo ""
	@echo "Version Management:"
	@echo "  make version        - Show current version"
	@echo "  make bump-patch     - Bump patch version (0.0.X)"
	@echo "  make bump-minor     - Bump minor version (0.X.0)"
	@echo "  make bump-major     - Bump major version (X.0.0)"
	@echo "  make changelog      - Generate/update CHANGELOG.md"
	@echo ""
	@echo "Frontend:"
	@echo "  make frontend-setup - Setup frontend environment (NVM, Node.js 24)"
	@echo "  make frontend-dev   - Start frontend dev server"
	@echo "  make frontend-test  - Run frontend tests"
	@echo "  make frontend-build - Build frontend for production"

# Setup UV and create virtual environment
setup:
	@echo "Setting up development environment..."
	@bash scripts/setup-uv.sh
	@echo "Setup complete! Activate the virtual environment with: source .venv/bin/activate"

# Install dependencies (assumes UV is already installed)
install:
	@echo "Installing dependencies..."
	@cd backend && uv pip install -r requirements.txt
	@echo "Dependencies installed!"

# Start local services and run Django dev server
dev: services
	@echo "Starting Django development server..."
	@cd backend && uv run python manage.py runserver 0.0.0.0:8000

# Start Docker services (Postgres + Redis)
services:
	@echo "Starting local services (Postgres + Redis)..."
	@docker compose -f docker-compose.local.yml up -d
	@echo "Waiting for services to be ready..."
	@sleep 3
	@echo "Services started! Postgres: localhost:5432, Redis: localhost:6379"

# Stop Docker services
services-stop:
	@echo "Stopping local services..."
	@docker compose -f docker-compose.local.yml down
	@echo "Services stopped!"

# Run Django migrations
migrate:
	@echo "Running migrations..."
	@cd backend && uv run python manage.py migrate
	@echo "Migrations complete!"

# Create Django superuser
superuser:
	@echo "Creating superuser..."
	@cd backend && uv run python manage.py createsuperuser

# Seed database
seed:
	@echo "Seeding database..."
	@cd backend && uv run python manage.py seed_podcasts
	@echo "Database seeded!"

# Run tests
test:
	@echo "Running tests..."
	@cd backend && uv run pytest -v --tb=short --strict-markers

# Run Ruff linting
lint:
	@echo "Running Ruff linting..."
	@cd backend && uv run ruff check .

# Run Ruff formatting
format:
	@echo "Running Ruff formatting..."
	@cd backend && uv run ruff format .
	@cd backend && uv run ruff check --fix .

# Open Django shell
shell:
	@cd backend && uv run python manage.py shell

# Clean up
clean:
	@echo "Cleaning up..."
	@rm -rf .venv
	@rm -rf backend/.venv
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	@echo "Cleanup complete!"

# Version Management
version:
	@cd backend && uv run cz version --project

bump-patch:
	@echo "Bumping patch version..."
	@cd backend && uv run cz bump --increment PATCH --yes
	@echo "Version bumped! Don't forget to push tags: git push --tags"

bump-minor:
	@echo "Bumping minor version..."
	@cd backend && uv run cz bump --increment MINOR --yes
	@echo "Version bumped! Don't forget to push tags: git push --tags"

bump-major:
	@echo "Bumping major version..."
	@cd backend && uv run cz bump --increment MAJOR --yes
	@echo "Version bumped! Don't forget to push tags: git push --tags"

changelog:
	@echo "Generating changelog..."
	@cd backend && uv run cz changelog
	@echo "Changelog updated!"

# Frontend targets
frontend-setup:
	@echo "Setting up frontend environment..."
	@bash scripts/setup-frontend.sh
	@echo "Frontend setup complete!"

frontend-dev:
	@echo "Starting frontend dev server..."
	@cd frontend && exec npm run dev

frontend-test:
	@echo "Running frontend tests..."
	@cd frontend && npm test

frontend-build:
	@echo "Building frontend for production..."
	@cd frontend && npm run build
	@echo "Frontend build complete!"
