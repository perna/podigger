# Gemini - Guia de Desenvolvimento

## Contexto do Projeto

Este é um projeto de podcasts em **migração do Flask para Django**:
- **Backend Legado**: Flask (pasta `app/`) - em processo de deprecação
- **Backend Novo**: Django (pasta `backend/`) - em desenvolvimento ativo
- **Frontend**: React com TypeScript (Vite) - em desenvolvimento
- **Infraestrutura**: Docker e Docker Compose
- **Banco de Dados**: PostgreSQL com migrações Alembic (Flask) e Django migrations

## ⚠️ Status da Migração

**IMPORTANTE**: Este projeto está em transição. Siga estas diretrizes:

1. **NÃO adicione novas features no Flask** (`app/`)
2. **TODO novo desenvolvimento vai para Django** (`backend/`)
3. **Mantenha compatibilidade** durante a transição
4. **Frontend deve consumir APIs Django** progressivamente
5. **Documente decisões** de migração no CHANGELOG.md

## Estrutura de Diretórios

```
projeto/
├── app/                          # ⚠️ LEGADO - Flask (não adicionar features)
│   ├── admin/                    # Admin Flask
│   ├── api/                      # API Flask (deprecar)
│   ├── parser/                   # Parser de feeds (migrar lógica)
│   ├── repository/               # Repositórios Flask
│   ├── site/                     # Views Flask
│   ├── static/                   # Assets estáticos
│   ├── templates/                # Templates Jinja2
│   └── utils/                    # Utilitários gerais
│
├── backend/                      # ✅ NOVO - Django (desenvolvimento ativo)
│   ├── Dockerfile
│   ├── config/                   # Settings Django
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── podcasts/                 # App principal
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── services/            # Business logic
│   │   │   └── feed_parser.py
│   │   ├── management/          # Commands
│   │   │   └── commands/
│   │   └── tests/
│   ├── pyproject.toml           # Ruff config
│   └── requirements.txt
│
├── frontend/                     # React + TypeScript + Vite
│   ├── src/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── migrations/                   # ⚠️ Alembic (Flask) - manter até migração completa
│   └── versions/
│
├── docker-compose.yml           # Orquestração principal
├── docker-compose.django.yml    # Django específico
├── GEMINI.md                    # Este arquivo
└── CHANGELOG.md                 # Histórico de mudanças
```

## Boas Práticas de Desenvolvimento

### 🔄 Estratégia de Migração Flask → Django

1. **Migração Incremental**
   - Migre uma feature por vez
   - Mantenha ambas APIs funcionando temporariamente
   - Use feature flags quando necessário
   - Teste exhaustivamente antes de desativar Flask

2. **Ordem Sugerida**
   - ✅ Models (já iniciado em `backend/podcasts/models.py`)
   - ⏳ API endpoints (migrar para DRF)
   - ✅ Business logic (`app/parser/` → `backend/podcasts/services/`)
   - ⏳ Templates (se necessário, ou usar React)
   - ⏳ Admin (Django Admin é superior)

3. **Conversão de Código**
   - Flask routes → Django views/viewsets
   - SQLAlchemy → Django ORM
   - Alembic migrations → Django migrations
   - Flask-RESTful → Django REST Framework
   - Jinja2 templates → React components (preferencial)

4. **Dados e Migrações**
   - Não rode migrações Alembic em produção
   - Use Django migrations no novo código
   - Mantenha schema compatível durante transição
   - Planeje data migration quando necessário

### Python/Django

1. **Organização de Apps**
   - Uma app por domínio/funcionalidade
   - Use `apps/` para agrupar suas aplicações
   - Mantenha models, views, serializers e tests separados

2. **Configurações**
   - Use variáveis de ambiente para credenciais
   - Separe settings por ambiente (dev, staging, prod)
   - Utilize `python-decouple` ou `django-environ`

3. **API Design**
   - Use Django REST Framework para APIs
   - Implemente versionamento (v1/, v2/)
   - Documente com drf-spectacular ou drf-yasg
   - Use serializers para validação

4. **Testes**
   - Cobertura mínima de 80%
   - Use pytest-django
   - Testes unitários e de integração
   - Factory Boy para fixtures

5. **Clean Code**
   - Funções pequenas com responsabilidade única
   - Nomes descritivos e auto-explicativos
   - Evite comentários desnecessários (código deve ser auto-documentável)
   - Máximo de 3-4 parâmetros por função
   - DRY (Don't Repeat Yourself)
   - KISS (Keep It Simple, Stupid)

6. **Princípios SOLID**
   - **S**ingle Responsibility: Uma classe, uma responsabilidade
   - **O**pen/Closed: Aberto para extensão, fechado para modificação
   - **L**iskov Substitution: Subclasses devem ser substituíveis
   - **I**nterface Segregation: Interfaces específicas e coesas
   - **D**ependency Inversion: Dependa de abstrações, não implementações

7. **Ruff - Linting e Formatação**
   - Substitui Flake8, isort, Black e mais
   - Extremamente rápido (escrito em Rust)
   - Configuração no `pyproject.toml`

### TypeScript/React

1. **Estrutura de Componentes**
   - Componentes funcionais com hooks
   - Props tipadas com interfaces
   - Separar lógica de negócio em hooks customizados

2. **Tipagem**
   - Defina interfaces para todas as entidades
   - Use types para unions e aliases
   - Evite `any`, prefira `unknown`

3. **Estado**
   - Context API para estado global simples
   - React Query para cache de API
   - Zustand ou Redux Toolkit para estado complexo

4. **Requisições**
   - Axios com interceptors
   - Tratamento centralizado de erros
   - Tipos compartilhados com backend

### Docker

1. **Multi-stage Builds**
   - Reduza tamanho das imagens
   - Separe build de runtime

2. **Volumes**
   - Code reload em desenvolvimento
   - Persistência de dados com volumes nomeados

3. **Networks**
   - Isole serviços em networks customizadas
   - Comunicação entre containers por nome de serviço

## Comandos Úteis

### Django
```bash
# Navegue para o backend
cd backend/

# Criar nova app
python manage.py startapp nome_app

# Migrations
python manage.py makemigrations
python manage.py migrate

# Superuser
python manage.py createsuperuser

# Shell
python manage.py shell_plus

# Testes
pytest
pytest --cov

# Ruff
ruff check .
ruff check --fix .
ruff format .

# Commands customizados
python manage.py seed_podcasts
python manage.py seed_fake_podcasts
python manage.py clear_fake_seed

# Servidor de desenvolvimento
python manage.py runserver 0.0.0.0:8000
```

### React/TypeScript
```bash
# Instalação
npm install

# Desenvolvimento
npm run dev

# Build
npm run build

# Testes
npm test
npm run test:coverage

# Lint
npm run lint
npm run lint:fix
```

### Docker
```bash
# Django stack
docker-compose -f docker-compose.django.yml up --build

# Stack completo (se disponível)
docker-compose up --build

# Stop
docker-compose down

# Logs
docker-compose logs -f [service]

# Exec no backend Django
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser

# Exec no frontend
docker-compose exec frontend npm install

# Rebuild específico
docker-compose build [service]

# Limpar volumes (cuidado!)
docker-compose down -v
```

## Padrões de Código

### Python
- PEP 8 como base
- **Ruff** para linting e formatação (substitui Black, Flake8, isort)
- Type hints obrigatórios (mypy para verificação)
- Docstrings no estilo Google ou NumPy

**Configuração Ruff (`pyproject.toml`):**
```toml
[tool.ruff]
line-length = 88
target-version = "py311"

[tool.ruff.lint]
select = [
    "E",      # pycodestyle errors
    "W",      # pycodestyle warnings
    "F",      # pyflakes
    "I",      # isort
    "C90",    # mccabe complexity
    "N",      # pep8-naming
    "D",      # pydocstyle
    "UP",     # pyupgrade
    "S",      # bandit security
    "B",      # flake8-bugbear
    "A",      # flake8-builtins
    "C4",     # flake8-comprehensions
    "DTZ",    # flake8-datetimez
    "T10",    # flake8-debugger
    "DJ",     # flake8-django
    "EM",     # flake8-errmsg
    "ISC",    # flake8-implicit-str-concat
    "ICN",    # flake8-import-conventions
    "PIE",    # flake8-pie
    "PT",     # flake8-pytest-style
    "Q",      # flake8-quotes
    "RET",    # flake8-return
    "SIM",    # flake8-simplify
    "ARG",    # flake8-unused-arguments
    "PTH",    # flake8-use-pathlib
    "ERA",    # eradicate
    "PL",     # pylint
    "RUF",    # ruff-specific rules
]
ignore = [
    "D100",   # Missing docstring in public module
    "D104",   # Missing docstring in public package
]

[tool.ruff.lint.per-file-ignores]
"tests/**/*.py" = ["S101", "PLR2004"]  # Allow assert and magic values in tests
"**/migrations/*.py" = ["E501"]         # Long lines ok in migrations

[tool.ruff.lint.mccabe]
max-complexity = 10

[tool.ruff.lint.pydocstyle]
convention = "google"
```

**Comandos Ruff:**
```bash
# Linting
ruff check .
ruff check --fix .

# Formatação
ruff format .
ruff format --check .
```

### TypeScript
- ESLint com config recomendada
- Prettier para formatação
- Convenção de nomenclatura:
  - Components: PascalCase
  - Functions/variables: camelCase
  - Constants: UPPER_CASE
  - Files: kebab-case ou PascalCase para components

## Segurança

1. **Backend**
   - CORS configurado corretamente
   - CSRF protection habilitado
   - Authentication/Authorization (JWT ou Session)
   - Rate limiting
   - SQL injection prevention (use ORM)

2. **Frontend**
   - Sanitize inputs
   - XSS prevention
   - Secure storage (httpOnly cookies)
   - Environment variables

3. **Docker**
   - Não rode como root
   - Use imagens oficiais
   - Scan de vulnerabilidades
   - Secrets management

## Performance

1. **Backend**
   - Database indexing
   - Query optimization (select_related, prefetch_related)
   - Caching (Redis)
   - Pagination

2. **Frontend**
   - Code splitting
   - Lazy loading
   - Memoization (useMemo, useCallback)
   - Image optimization

## CI/CD

Considere implementar:
- GitHub Actions ou GitLab CI
- Testes automatizados
- Linting/formatting checks
- Build de imagens Docker
- Deploy automatizado

## Conventional Commits

Siga o padrão de commits semânticos para histórico claro e geração automática de changelogs.

### Estrutura
```
<tipo>[escopo opcional]: <descrição>

[corpo opcional]

[rodapé(s) opcional(is)]
```

### Tipos Principais
- **feat**: Nova funcionalidade
- **fix**: Correção de bug
- **docs**: Documentação
- **style**: Formatação (não afeta código)
- **refactor**: Refatoração (sem mudança de comportamento)
- **perf**: Melhoria de performance
- **test**: Adição ou correção de testes
- **build**: Mudanças no sistema de build
- **ci**: Mudanças em arquivos de CI
- **chore**: Tarefas gerais (deps, configs)
- **revert**: Reverter commit anterior

### Exemplos
```bash
# Feature
feat(auth): adiciona autenticação JWT

# Bugfix
fix(api): corrige erro de validação no endpoint de usuários

# Breaking change
feat(api)!: remove suporte a API v1

BREAKING CHANGE: A API v1 foi removida. Migre para v2.

# Múltiplos escopos
fix(frontend,backend): corrige sincronização de dados

# Com issue
fix(orders): corrige cálculo de desconto

Closes #123

# Refactoring
refactor(models): aplica SOLID principles em UserService

# Documentation
docs: atualiza README com instruções de Docker
```

### Escopos Sugeridos
- **backend**: Django/Python
- **frontend**: React/TypeScript
- **api**: Endpoints REST
- **models**: Models Django
- **auth**: Autenticação/Autorização
- **docker**: Configurações Docker
- **tests**: Arquivos de teste
- **ci**: Pipeline CI/CD
- **deps**: Dependências

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

## Documentação

Mantenha atualizado:
- README.md com setup instructions
- API documentation (OpenAPI/Swagger)
- Architecture Decision Records (ADRs)
- Changelog

## Debugging

### Backend
```python
# Django Debug Toolbar
# django-extensions para shell_plus
# pdb ou ipdb para debugging

import pdb; pdb.set_trace()  # Python debugger
```

### Frontend
```typescript
// React DevTools
// Redux DevTools (se usar Redux)
// Console logging estratégico
// Source maps habilitados
```

## Checklist de Migração

Use este checklist para acompanhar o progresso:

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
- [ ] Configurar Celery (se necessário)
- [ ] Remover código Flask

### Frontend
- [ ] Setup React + TypeScript completo
- [ ] Componentes principais
- [ ] Integração com API Django
- [ ] Roteamento (React Router)
- [ ] Estado global (Context/Zustand)
- [ ] Formulários
- [ ] Listagens com paginação
- [ ] Search/filters
- [ ] Testes (Vitest/Testing Library)
- [ ] Build de produção

### Infraestrutura
- [x] Docker Django
- [x] Docker Frontend
- [ ] Docker Compose unificado
- [ ] PostgreSQL configurado
- [ ] Redis (se usar cache/Celery)
- [ ] Nginx para produção
- [ ] CI/CD pipeline
- [ ] Monitoring/logging

### Documentação
- [x] GEMINI.md (este arquivo)
- [ ] README.md atualizado
- [ ] API documentation (Swagger)
- [ ] DOCKER_DJANGO.md
- [ ] CHANGELOG.md mantido

## Decisões de Arquitetura

### Por que Django?
- ORM mais robusto que SQLAlchemy
- Admin interface poderosa
- DRF para APIs RESTful
- Ecossistema maduro e bem documentado
- Melhor suporte para testes
- Comunidade mais ativa

### Por que React + TypeScript?
- Type safety para menos bugs
- Componentes reutilizáveis
- Melhor DX (Developer Experience)
- Ecosistema rico (React Query, Zustand, etc.)
- Performance com Vite

### Estrutura de Services
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

Esta estrutura separa lógica de negócio (services) de acesso a dados (models) e apresentação (views/serializers).

- Django Docs: https://docs.djangoproject.com/
- React Docs: https://react.dev/
- TypeScript Handbook: https://www.typescriptlang.org/docs/
- Docker Docs: https://docs.docker.com/

---

**Nota**: Adapte este guia conforme as necessidades específicas do seu projeto.