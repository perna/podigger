# Local Development Guide

This guide covers setting up the Podigger backend for local development using UV package manager and Docker services.

## Prerequisites

- **Git**: For cloning the repository
- **Docker & Docker Compose**: For running Postgres and Redis services
- **Make**: For running automation commands (usually pre-installed on Linux/macOS)

UV will be automatically installed by the setup script.

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd podigger
```

### 2. Run Setup

The setup script will:
- Install UV if not present
- Create a virtual environment with Python 3.12.7
- Install all project dependencies
- Create a `.env` file from the example

```bash
make setup
```

### 3. Activate Virtual Environment

```bash
source .venv/bin/activate
```

### 4. Start Local Services

Start Postgres and Redis in Docker:

```bash
make services
```

### 5. Run Migrations

```bash
make migrate
```

### 6. Create Superuser (Optional)

```bash
make superuser
```

### 7. Start Development Server

```bash
cd backend
python manage.py runserver
```

Or use the combined command:

```bash
make dev
```

The API will be available at `http://localhost:8000`

## Available Make Commands

Run `make help` to see all available commands:

### Setup & Installation
- `make setup` - Install UV, create venv, install Python 3.12 and dependencies
- `make install` - Install/update dependencies only (assumes UV is installed)

### Development
- `make dev` - Start local services and run Django dev server
- `make services` - Start Docker services (Postgres + Redis) only
- `make services-stop` - Stop Docker services

### Database
- `make migrate` - Run Django migrations
- `make superuser` - Create Django superuser
- `make seed` - Seed database with sample data

### Testing & Quality
- `make test` - Run pytest
- `make lint` - Run Ruff linting
- `make format` - Run Ruff formatting

### Utilities
- `make shell` - Open Django shell
- `make clean` - Clean up venv, cache, and build files

## Development Workflow

### Daily Development

1. **Start services** (if not running):
   ```bash
   make services
   ```

2. **Activate virtual environment**:
   ```bash
   source .venv/bin/activate
   ```

3. **Run development server**:
   ```bash
   cd backend
   python manage.py runserver
   ```

### Running Tests

```bash
make test
```

Or with coverage:

```bash
cd backend
pytest --cov --cov-report=html
```

### Code Quality

Before committing, run linting and formatting:

```bash
make lint
make format
```

## Environment Configuration

The project uses environment variables for configuration. Copy `.env.example` to `.env` and update as needed:

```bash
cd backend
cp .env.example .env
```

### Key Environment Variables

- `DJANGO_SECRET_KEY`: Django secret key (change in production)
- `DJANGO_DEBUG`: Debug mode (True for development)
- `DATABASE_HOST`: Database host (localhost for local dev)
- `DATABASE_PORT`: Database port (5432)
- `DATABASE_NAME`: Database name (podigger)
- `DATABASE_USER`: Database user (docker)
- `DATABASE_PASSWORD`: Database password (docker)
- `REDIS_URL`: Redis URL for cache (redis://localhost:6379/1)
- `CELERY_BROKER_URL`: Celery broker URL (redis://localhost:6379/0)

## Docker Services

### Local Services (Recommended for Development)

Uses `docker-compose.local.yml` - only Postgres and Redis:

```bash
# Start services
docker-compose -f docker-compose.local.yml up -d

# Stop services
docker-compose -f docker-compose.local.yml down

# View logs
docker-compose -f docker-compose.local.yml logs -f
```

### Full Stack (All Services)

Uses `docker-compose.yml` - includes backend, frontend, database, redis, and celery:

```bash
# Start all services
docker-compose up --build

# Stop all services
docker-compose down
```

## Troubleshooting

### UV Not Found After Installation

If UV is not found after installation, add it to your PATH:

```bash
export PATH="$HOME/.cargo/bin:$PATH"
```

Add this to your `~/.bashrc` or `~/.zshrc` for persistence.

### Python Version Not Found

UV will automatically download Python 3.12.7. If you encounter issues:

```bash
uv python install 3.12.7
```

### Database Connection Errors

Ensure Docker services are running:

```bash
docker-compose -f docker-compose.local.yml ps
```

Check if Postgres is accessible:

```bash
docker-compose -f docker-compose.local.yml logs db
```

### Redis Connection Errors

Check if Redis is running:

```bash
docker-compose -f docker-compose.local.yml logs redis
```

Test Redis connection:

```bash
redis-cli -h localhost -p 6379 ping
```

### Port Already in Use

If port 5432 or 6379 is already in use, you can either:

1. Stop the conflicting service
2. Change the port mapping in `docker-compose.local.yml`

## Project Structure

```
podigger/
├── backend/              # Django backend
│   ├── config/          # Django settings
│   ├── podcasts/        # Main app
│   ├── requirements.txt # Python dependencies
│   ├── pyproject.toml   # Ruff & UV config
│   └── .env.example     # Environment template
├── scripts/             # Setup scripts
│   └── setup-uv.sh     # UV installation script
├── docker-compose.local.yml  # Local services
├── docker-compose.yml        # Full stack
├── Makefile            # Development commands
└── .python-version     # Python version for UV
```

## Additional Resources

- [UV Documentation](https://github.com/astral-sh/uv)
- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Ruff Documentation](https://docs.astral.sh/ruff/)
