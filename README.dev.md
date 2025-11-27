# Local Development Guide

This guide covers setting up the Podigger project for local development, including both backend (Django) and frontend (Next.js).

## Prerequisites

- **Git**: For cloning the repository
- **Docker & Docker Compose**: For running Postgres and Redis services
- **Make**: For running automation commands (usually pre-installed on Linux/macOS)
- **curl**: For downloading installation scripts (usually pre-installed)

UV (backend) and NVM (frontend) will be automatically installed by the setup scripts.

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd podigger
```

### 2. Backend Setup

The setup script will:
- Install UV if not present
- Create a virtual environment with Python 3.12.7
- Install all project dependencies
- Create a `.env` file from the example

```bash
make setup
```

### 3. Frontend Setup

The setup script will:
- Install NVM (Node Version Manager)
- Install Node.js 24 LTS
- Install pnpm package manager
- Configure automatic Node version switching
- Install all frontend dependencies

```bash
make frontend-setup
```

**Important**: After frontend setup, restart your shell or run:
```bash
source ~/.bashrc  # or ~/.zshrc
```

### 4. Start Local Services

Start Postgres and Redis in Docker:

```bash
make services
```

### 5. Run Backend Migrations

```bash
make migrate
```

### 6. Create Superuser (Optional)

```bash
make superuser
```

### 7. Start Development Servers

**Backend** (Terminal 1):
```bash
make dev
# API available at http://localhost:8000
```

**Frontend** (Terminal 2):
```bash
make frontend-dev
# App available at http://localhost:3000
```

## Available Make Commands

Run `make help` to see all available commands:

### Setup & Installation
- `make setup` - Install UV, create venv, install Python 3.12 and dependencies (Backend)
- `make install` - Install/update dependencies only (assumes UV is installed)
- `make frontend-setup` - Setup frontend environment (NVM, Node.js 24, pnpm)

### Development
- `make dev` - Start local services and run Django dev server
- `make frontend-dev` - Start frontend dev server
- `make services` - Start Docker services (Postgres + Redis) only
- `make services-stop` - Stop Docker services

### Database
- `make migrate` - Run Django migrations
- `make superuser` - Create Django superuser
- `make seed` - Seed database with sample data

### Testing & Quality

**Backend:**
- `make test` - Run pytest
- `make lint` - Run Ruff linting
- `make format` - Run Ruff formatting

**Frontend:**
- `make frontend-test` - Run frontend tests (Jest + Playwright)
- `make frontend-lint` - Run frontend linting (ESLint)
- `make frontend-build` - Build frontend for production

### Utilities
- `make shell` - Open Django shell
- `make clean` - Clean up venv, cache, and build files

## Development Workflow

### Daily Development

1. **Start services** (if not running):
   ```bash
   make services
   ```

2. **Backend Development**:
   ```bash
   source .venv/bin/activate  # Activate virtual environment
   make dev                    # Start Django dev server
   ```

3. **Frontend Development**:
   ```bash
   cd frontend
   # Node version automatically switches to v24 (via .nvmrc)
   make frontend-dev  # or: pnpm dev
   ```

### Running Tests

**Backend:**
```bash
make test
```

Or with coverage:
```bash
cd backend
pytest --cov --cov-report=html
```

**Frontend:**
```bash
make frontend-test
```

Or specific test types:
```bash
cd frontend
pnpm test              # Unit tests (Jest)
pnpm test:watch        # Watch mode
pnpm test:coverage     # With coverage
pnpm test:e2e          # E2E tests (Playwright)
```

### Code Quality

Before committing, run linting and formatting:

**Backend:**
```bash
make lint
make format
```

**Frontend:**
```bash
make frontend-lint
# or
cd frontend
pnpm lint
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
├── backend/                    # Django backend
│   ├── config/                # Django settings
│   ├── podcasts/              # Main app
│   ├── requirements.txt       # Python dependencies
│   ├── pyproject.toml         # Ruff & UV config
│   └── .env.example           # Environment template
├── frontend/                   # Next.js frontend
│   ├── app/                   # App Router (Next.js 13+)
│   ├── public/                # Static assets
│   ├── package.json           # Node dependencies
│   ├── .nvmrc                 # Node version (24 LTS)
│   └── README.md              # Frontend documentation
├── scripts/                    # Setup scripts
│   ├── setup-uv.sh            # Backend setup (UV)
│   └── setup-frontend.sh      # Frontend setup (NVM + pnpm)
├── .github/
│   └── workflows/
│       ├── backend.yml        # Backend CI/CD
│       └── frontend.yml       # Frontend CI/CD
├── docker-compose.local.yml   # Local services only
├── docker-compose.yml         # Full stack
├── Makefile                   # Development commands
└── .python-version            # Python version for UV
```

## Frontend-Specific Information

### Node Version Management

The frontend uses Node.js 24 LTS. When you enter the `frontend/` directory, the Node version automatically switches based on the `.nvmrc` file.

To manually switch:
```bash
cd frontend
nvm use
```

### Package Manager

The frontend uses **pnpm** instead of npm for:
- Faster installation
- Efficient disk space usage
- Strict dependency resolution

### Frontend Stack

- **Framework**: Next.js 16 (App Router)
- **Runtime**: Node.js 24 LTS
- **Package Manager**: pnpm 9
- **Language**: TypeScript 5
- **UI**: React 19 + Tailwind CSS 4
- **Linting**: ESLint 9
- **Testing**: Jest + Playwright

For detailed frontend documentation, see [`frontend/README.md`](frontend/README.md).

## Additional Resources

### Backend
- [UV Documentation](https://github.com/astral-sh/uv)
- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Ruff Documentation](https://docs.astral.sh/ruff/)

### Frontend
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [pnpm Documentation](https://pnpm.io)
- [NVM Documentation](https://github.com/nvm-sh/nvm)
