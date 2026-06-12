# Dependências — podigger

> Gerado pelo Scout em 2026-06-04
> Versões extraídas de `backend/requirements.txt`, `backend/requirements-dev.txt`, `backend/pyproject.toml` e `frontend/package.json`

---

## Backend (Python 3.12)

### Produção (`requirements.txt`)

| Pacote | Versão | Função |
|--------|--------|--------|
| Django | 5.2.13 | Framework web |
| djangorestframework | ≥3.16.1,<4.0 | Toolkit API REST |
| djangorestframework-simplejwt | 5.5.1 | Autenticação JWT |
| psycopg2 | 2.9.11 | Driver PostgreSQL (compilado, prod) |
| django-cors-headers | 4.0.0 | CORS middleware |
| celery | 5.5.3 | Fila assíncrona |
| redis | 7.1.0 | Broker + cache |
| gunicorn | ≥20.1.0,<24.0 | WSGI server (prod) |
| uvicorn | 0.38.0 | ASGI server |
| django-environ | ≥0.10.0 | Config via env |
| django-redis | ≥5.4.0 | Cache backend Redis |
| django-filter | ≥23.2 | Filtros para DRF |
| feedparser | ≥6.0.10 | Parse RSS/Atom |
| requests | ≥2.31.0 | HTTP client |
| urllib3 | ≥2.6.3 | HTTP low-level |
| zipp | ≥3.19.1 | Pathlib (compat) |
| hypothesis | 6.135.0 | Property-based testing |

### Desenvolvimento (`requirements-dev.txt`)

| Pacote | Versão | Função |
|--------|--------|--------|
| pytest | ≥7.0.0 | Framework de teste |
| pytest-django | ≥4.0.0 | Integração pytest + Django |
| pytest-mock | ≥3.10.0 | Mocks para pytest |
| pytest-cov | ≥4.1.0 | Cobertura de código |
| Faker | 19.9.0 | Geração de dados fake |
| ruff | ≥0.8.0,<0.9.0 | Linter + formatter |
| commitizen | ≥3.13.0 | Conventional commits |
| psycopg2-binary | 2.9.11 | Driver PostgreSQL (binário, dev) |

### Versões consolidadas (de `pyproject.toml`)

- `Django==5.2.13` (overrides 5.2.11 do PROJECT.md)
- `psycopg2-binary==2.9.11`
- `celery==5.5.3`, `redis==7.1.0`
- `gunicorn>=20.1.0,<24.0`
- `uvicorn==0.38.0`
- `Faker==19.9.0`
- `feedparser>=6.0.10`
- `requests>=2.31.0`

---

## Frontend (Node.js)

### Dependências de produção (`package.json`)

| Pacote | Versão | Função |
|--------|--------|--------|
| next | 16.2.3 | Framework React |
| react | 19.2.1 | UI library |
| react-dom | 19.2.1 | React DOM renderer |
| clsx | ^2.1.1 | Concatenação de classes |
| tailwind-merge | ^3.4.0 | Merge de classes Tailwind |

### Dependências de desenvolvimento

| Pacote | Versão | Função |
|--------|--------|--------|
| @next/bundle-analyzer | ^16.2.3 | Análise de bundle |
| @tailwindcss/postcss | ^4 | PostCSS plugin Tailwind v4 |
| @testing-library/dom | ^10.4.1 | Testing utilities |
| @testing-library/jest-dom | ^6.9.1 | Matchers Jest |
| @testing-library/react | ^16.3.2 | Testing React |
| @testing-library/user-event | ^14.6.1 | Simulação de usuário |
| @types/node | ^24 | Tipos Node |
| @types/react | ^19 | Tipos React |
| @types/react-dom | ^19 | Tipos ReactDOM |
| @vitejs/plugin-react | ^5.1.4 | Plugin Vite React |
| babel-plugin-react-compiler | 1.0.0 | React Compiler |
| eslint | ^9 | Linter |
| eslint-config-next | 16.0.10 | Config ESLint para Next |
| fast-check | 3.23.2 | Property-based testing |
| jsdom | ^28.0.0 | DOM para testes |
| tailwindcss | ^4 | Framework CSS |
| typescript | ^5 | Compilador TS |
| vite-tsconfig-paths | ^6.1.1 | Resolve tsconfig paths |
| vitest | ^4.0.18 | Framework de teste |

### Versões Node.js

- `.nvmrc` no frontend (Node version manager)
- `setup-frontend.sh` instala Node.js 24

---

## Versões de runtime

| Componente | Versão |
|------------|--------|
| Python | 3.12.x (range `>=3.12,<3.13`) |
| Node.js | 24.x |
| PostgreSQL | 15 (alpine) |
| Redis | 7 (alpine) |
| OS base Docker | (definido nos Dockerfiles) |

---

## Versão do projeto

- **Backend (pyproject.toml):** 0.1.0
- **Frontend (package.json):** 0.1.0
- **Tag inicial:** v0.3.0 (changelog_start_rev em .cz.toml)
- **Conventional commits:** ativo

---

## Notas

- `requirements.txt` e `pyproject.toml` divergem em alguns pacotes (psycopg2 vs psycopg2-binary, djangorestframework-simplejwt ausente em pyproject.toml, hypothesis ausente em pyproject.toml). Pode haver lacuna intencional (dev-only em pyproject, prod em requirements) ou drift — **recomenda-se revisão pelo `reversa-data-master` ou `reversa-detective`**.
- `djangorestframework-simplejwt` está em `requirements.txt` mas não em `pyproject.toml`. Possível bug de sincronização.
- `PROJECT.md` cita `Django 5.2.11`, mas a versão real é `5.2.13`. **Documentação desatualizada.**
