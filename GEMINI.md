# GEMINI - Guia de Desenvolvimento

> **Projeto**: Podcast Aggregator (Podigger)  
> **Python**: 3.12.7 | **Package Manager**: UV (dev) / pip (CI)  
> **Status**: Migração Flask → Django em andamento

---

## 🎯 REGRAS CRÍTICAS

### Status da Migração Flask → Django

**IMPORTANTE - Siga estas diretrizes obrigatórias:**

1. ❌ **NÃO adicione features no Flask** (`app/`)
2. ✅ **TODO novo código vai para Django** (`backend/`)
3. ⚠️ **Mantenha compatibilidade** durante transição
4. 🔄 **Frontend consome APIs Django** progressivamente
5. 📝 **Documente decisões** em CHANGELOG.md

### Tecnologias

- **Backend Legado**: Flask (`app/`) - DEPRECADO
- **Backend Novo**: Django + DRF (`backend/`) - ATIVO
- **Frontend**: Next.js + Tailwind CSS (em desenvolvimento)
- **Database**: PostgreSQL
- **Migrations**: Alembic (Flask) + Django migrations
- **Infra**: Docker Compose
- **Cache/Queue**: Redis + Celery (planejado)

---

## 📁 Estrutura do Projeto

```
podigger/
├── app/                    # ⚠️ LEGADO - Flask (NÃO adicionar features)
│   ├── admin/              # Admin Flask
│   ├── api/                # API Flask (deprecar)
│   ├── parser/             # Parser feeds (migrar → backend/podcasts/services/)
│   ├── repository/         # Repositórios Flask
│   ├── site/               # Views Flask
│   ├── static/             # Assets estáticos
│   ├── templates/          # Templates Jinja2
│   └── utils/              # Utilitários gerais
│
├── backend/                # ✅ NOVO - Django (desenvolvimento ativo)
│   ├── config/             # Settings, URLs, WSGI
│   ├── podcasts/           # App principal
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── services/       # Business logic (feed_parser.py)
│   │   ├── management/commands/  # Commands customizados
│   │   └── tests/
│   ├── pyproject.toml      # Ruff config
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/               # Next.js (em desenvolvimento)
│   ├── package.json
│   └── README.md
│
├── migrations/             # ⚠️ Alembic (Flask) - manter até migração completa
│
├── docker-compose.yml           # Full stack
├── docker-compose.local.yml     # Apenas Postgres + Redis
├── Makefile                     # Automação dev
├── scripts/setup-uv.sh          # UV installer
├── .python-version              # 3.12.7
├── GEMINI.md                    # Este arquivo
├── README.dev.md                # Guia dev local
└── CHANGELOG.md
```

---

## 🔄 Estratégia de Migração

### Princípios

- **Incremental**: Uma feature por vez
- **Compatibilidade**: Ambas APIs funcionando temporariamente
- **Feature Flags**: Quando necessário
- **Testes**: Exhaustivos antes de desativar Flask

### Ordem de Migração

1. ✅ **Models** (iniciado em `backend/podcasts/models.py`)
2. ⏳ **API Endpoints** (Flask → DRF)
3. ✅ **Business Logic** (`app/parser/` → `backend/podcasts/services/`)
4. ⏳ **Templates** (Jinja2 → React components)
5. ⏳ **Admin** (Flask → Django Admin)

### Mapeamento de Código

| Flask | Django |
|-------|--------|
| Routes | Views/ViewSets (DRF) |
| SQLAlchemy | Django ORM |
| Alembic migrations | Django migrations |
| Flask-RESTful | Django REST Framework |
| Jinja2 templates | React components |

### Migrações de Dados

- ❌ Não rode Alembic em produção
- ✅ Use Django migrations no novo código
- ⚠️ Mantenha schema compatível durante transição
- 📋 Planeje data migration quando necessário

---

## 🛠️ Setup Desenvolvimento Local

### Quick Start com UV

```bash
# Setup completo (UV + venv + Python 3.12.7 + deps)
make setup

# Ativar ambiente virtual
source .venv/bin/activate

# Iniciar serviços (Postgres + Redis)
make services

# Rodar migrations
make migrate

# Dev server
make dev
```

### Comandos Make

| Comando | Descrição |
|---------|-----------|
| `make help` | Lista todos comandos |
| `make setup` | Setup inicial completo |
| `make install` | Instalar/atualizar deps |
| `make dev` | Dev server + services |
| `make services` | Apenas Postgres + Redis |
| `make services-stop` | Parar services |
| `make migrate` | Rodar migrations |
| `make test` | Rodar testes |
| `make lint` | Linting (Ruff) |
| `make format` | Formatação (Ruff) |
| `make shell` | Django shell |
| `make clean` | Limpar venv e cache |

**Documentação completa**: [README.dev.md](file:///home/perna/workspace/projects/podigger/README.dev.md)

---

## 📋 Comandos Úteis

### Django

```bash
cd backend/

# Apps e migrations
python manage.py startapp nome_app
python manage.py makemigrations
python manage.py migrate

# Admin e shell
python manage.py createsuperuser
python manage.py shell_plus

# Testes
pytest
pytest --cov

# Linting/Formatação
ruff check .
ruff check --fix .
ruff format .

# Commands customizados
python manage.py seed_podcasts
python manage.py seed_fake_podcasts
python manage.py clear_fake_seed

# Dev server
python manage.py runserver 0.0.0.0:8000
```

### Next.js/React

```bash
# Setup
npx create-next-app@latest frontend
cd frontend

# Dev workflow
npm run dev
npm run build
npm run start
npm run lint

# Testes
npm run test
```

### Docker

```bash
# Local services (Postgres + Redis) - RECOMENDADO para dev
docker-compose -f docker-compose.local.yml up -d
docker-compose -f docker-compose.local.yml down

# Full stack (backend + frontend + db + redis + celery)
docker-compose up --build
docker-compose down

# Logs
docker-compose logs -f [service]

# Exec commands
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
docker-compose exec frontend npm install

# Rebuild
docker-compose build [service]

# Limpar volumes (⚠️ cuidado!)
docker-compose down -v
```

---

## 🎨 Padrões de Código

### Python/Django

**Princípios:**
- PEP 8 como base
- Type hints obrigatórios (mypy)
- Docstrings estilo Google/NumPy
- Ruff para linting + formatação (substitui Black, Flake8, isort)

**Clean Code:**
- Funções pequenas (responsabilidade única)
- Nomes descritivos e auto-explicativos
- Máximo 3-4 parâmetros por função
- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple, Stupid)

**SOLID:**
- **S**ingle Responsibility
- **O**pen/Closed
- **L**iskov Substitution
- **I**nterface Segregation
- **D**ependency Inversion

**Organização de Apps:**
- Uma app por domínio/funcionalidade
- Use `apps/` para agrupar aplicações
- Separe models, views, serializers, tests

**API Design:**
- Django REST Framework
- Versionamento (v1/, v2/)
- Documentação (drf-spectacular ou drf-yasg)
- Serializers para validação

**Testes:**
- Cobertura mínima: 80%
- pytest-django
- Unitários + integração
- Factory Boy para fixtures

**Configurações:**
- Variáveis de ambiente para credenciais
- Settings por ambiente (dev, staging, prod)
- Use `python-decouple` ou `django-environ`

### Ruff Configuration

**pyproject.toml:**
```toml
[tool.ruff]
line-length = 88
target-version = "py312"

[tool.ruff.lint]
select = [
    "E", "W",    # pycodestyle
    "F",         # pyflakes
    "I",         # isort
    "C90",       # mccabe
    "N",         # pep8-naming
    "D",         # pydocstyle
    "UP",        # pyupgrade
    "S",         # bandit security
    "B",         # bugbear
    "A",         # builtins
    "C4",        # comprehensions
    "DTZ",       # datetimez
    "T10",       # debugger
    "DJ",        # django
    "EM",        # errmsg
    "ISC",       # implicit-str-concat
    "ICN",       # import-conventions
    "PIE",       # pie
    "PT",        # pytest-style
    "Q",         # quotes
    "RET",       # return
    "SIM",       # simplify
    "ARG",       # unused-arguments
    "PTH",       # use-pathlib
    "ERA",       # eradicate
    "PL",        # pylint
    "RUF",       # ruff-specific
]
ignore = [
    "D100",      # Missing docstring in public module
    "D104",      # Missing docstring in public package
]

[tool.ruff.lint.per-file-ignores]
"tests/**/*.py" = ["S101", "PLR2004"]
"**/migrations/*.py" = ["E501"]

[tool.ruff.lint.mccabe]
max-complexity = 10

[tool.ruff.lint.pydocstyle]
convention = "google"
```

**Comandos:**
```bash
ruff check .           # Lint
ruff check --fix .     # Lint + autofix
ruff format .          # Format
ruff format --check .  # Check formatting
```

### TypeScript/Next.js

**Tipagem:**
- Interfaces para entidades
- Types para unions/aliases
- Evite `any`, prefira `unknown`

**Estrutura:**
- Componentes Funcionais (React)
- Server/Client Components
- Hooks para lógica reutilizável
- Context API/Zustand para estado global

**Nomenclatura:**
- Components: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `UPPER_CASE`
- Files: `kebab-case` ou `PascalCase` (components)

**Requisições:**
- Axios com interceptors
- Tratamento centralizado de erros
- Tipos compartilhados com backend

**Linting:**
- ESLint com config recomendada
- Prettier para formatação

### Docker

**Multi-stage Builds:**
- Reduza tamanho das imagens
- Separe build de runtime

**Volumes:**
- Code reload em dev
- Persistência com volumes nomeados

**Networks:**
- Isole serviços em networks customizadas
- Comunicação entre containers por nome

---

## 🔒 Segurança

### Backend
- CORS configurado corretamente
- CSRF protection habilitado
- Authentication/Authorization (JWT ou Session)
- Rate limiting
- SQL injection prevention (use ORM)

### Frontend
- Sanitize inputs
- XSS prevention
- Secure storage (httpOnly cookies)
- Environment variables

### Docker
- Não rode como root
- Use imagens oficiais
- Scan de vulnerabilidades
- Secrets management

---

## ⚡ Performance

### Backend
- Database indexing
- Query optimization (`select_related`, `prefetch_related`)
- Caching (Redis)
- Pagination

### Frontend
- Code splitting
- Lazy loading
- Memoization (`useMemo`, `useCallback`)
- Image optimization

---

## 🔄 Conventional Commits

### Estrutura
```
<tipo>[escopo opcional]: <descrição>

[corpo opcional]

[rodapé(s) opcional(is)]
```

### Tipos

| Tipo | Descrição |
|------|-----------|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Documentação |
| `style` | Formatação (não afeta código) |
| `refactor` | Refatoração (sem mudança de comportamento) |
| `perf` | Melhoria de performance |
| `test` | Testes |
| `build` | Sistema de build |
| `ci` | CI/CD |
| `chore` | Tarefas gerais (deps, configs) |
| `revert` | Reverter commit |

### Escopos Sugeridos
`backend`, `frontend`, `api`, `models`, `auth`, `docker`, `tests`, `ci`, `deps`

### Exemplos

```bash
# Feature
feat(auth): adiciona autenticação JWT

# Bugfix
fix(api): corrige validação no endpoint de usuários

# Breaking change
feat(api)!: remove suporte a API v1

BREAKING CHANGE: A API v1 foi removida. Migre para v2.

# Com issue
fix(orders): corrige cálculo de desconto

Closes #123

# Refactoring
refactor(models): aplica SOLID principles em UserService
```

### Ferramentas

```bash
# Commitizen (CLI interativo)
pip install commitizen
cz commit

# Husky + commitlint (validação)
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```

### Benefícios
- ✅ Histórico legível e pesquisável
- ✅ Geração automática de CHANGELOG
- ✅ Versionamento semântico automático
- ✅ Facilita code review
- ✅ Integração com ferramentas de release

---

## 🐛 Debugging

### Backend
```python
# Django Debug Toolbar
# django-extensions para shell_plus
# pdb ou ipdb

import pdb; pdb.set_trace()  # Python debugger
```

### Frontend
```typescript
// React DevTools
// Next.js Debugging
// Console logging estratégico
// Source maps habilitados
```

---

## ✅ Checklist de Migração

### Backend
- [x] Setup Django básico
- [x] Models principais (Podcast, Episode)
- [x] Django Admin configurado
- [x] Serializers DRF
- [x] Commands de seed
- [ ] Migrar todos endpoints da API Flask
- [ ] Migrar repositories para services
- [ ] Testes unitários (>80% cobertura)
- [ ] Testes de integração
- [ ] Configurar Celery
- [ ] Remover código Flask

### Frontend
- [ ] Setup Next.js + Tailwind
- [ ] Componentes principais (Server/Client)
- [ ] Integração com API Django (fetch/axios)
- [ ] Roteamento (App Router)
- [ ] Estado global (Context/Zustand)
- [ ] Formulários (React Hook Form + Zod)
- [ ] Listagens com paginação
- [ ] Search/filters
- [ ] Testes (Jest/React Testing Library)
- [ ] Build de produção

### Infraestrutura
- [x] Docker Django
- [x] Docker Frontend
- [ ] Docker Compose unificado
- [ ] PostgreSQL configurado
- [ ] Redis (cache/Celery)
- [ ] Nginx para produção
- [ ] CI/CD pipeline
- [ ] Monitoring/logging

### Documentação
- [x] GEMINI.md
- [ ] README.md atualizado
- [ ] API documentation (Swagger)
- [ ] DOCKER_DJANGO.md
- [ ] CHANGELOG.md mantido

---

## 🏗️ Decisões de Arquitetura

### Por que Django?
- ORM mais robusto que SQLAlchemy
- Admin interface poderosa
- DRF para APIs RESTful
- Ecossistema maduro e bem documentado
- Melhor suporte para testes
- Comunidade mais ativa

### Por que Next.js?
- Server Side Rendering (SSR) e Static Site Generation (SSG)
- Otimização automática de imagens e fontes
- Roteamento simplificado (App Router)
- Ecossistema React robusto
- TypeScript first-class citizen

### Estrutura de Services

**Padrão:**
```python
# backend/podcasts/services/feed_parser.py
class FeedParserService:
    """Service para parsing de feeds RSS/Atom."""
    
    @staticmethod
    def parse_feed(url: str) -> dict:
        """Parse feed e retorna dados estruturados."""
        pass
    
    @staticmethod
    def extract_episodes(feed_data: dict) -> list[dict]:
        """Extrai episódios do feed."""
        pass
```

**Separação de responsabilidades:**
- **Services**: Lógica de negócio
- **Models**: Acesso a dados
- **Views/Serializers**: Apresentação

---

## 🔧 CI/CD (Planejado)

- GitHub Actions ou GitLab CI
- Testes automatizados
- Linting/formatting checks
- Build de imagens Docker
- Deploy automatizado

---

## 📚 Documentação Obrigatória

Mantenha atualizado:
- `README.md` - Setup instructions
- API documentation (OpenAPI/Swagger)
- Architecture Decision Records (ADRs)
- `CHANGELOG.md`

---

## 🔗 Referências

- [Django Docs](https://docs.djangoproject.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Docker Docs](https://docs.docker.com/)

---

**Última atualização**: 2026-02-07  
**Versão**: 2.0 (Otimizado para LLMs)