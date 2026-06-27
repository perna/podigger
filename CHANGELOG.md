# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Podcast addition interface (`/add-podcast`) with feed validation.
- `addPodcast` service in the frontend API client.
- `CSRF_TRUSTED_ORIGINS` configuration in backend and CI workflows for staging/production.
- `SECURE_PROXY_SSL_HEADER` configuration to trust Nginx proxy HTTPS identification.
- Unit tests for `addPodcast` API service and `AddPodcastPage` component.
- `RefreshService` extracted from `EpisodeUpdater` with bounded per-feed statement budget and single-statement `total_episodes` counter reset.
- `record_search_term` Celery task for asynchronous popular-term counter updates.
- `DbAwareTask` base class for all Celery tasks to close stale database connections between tasks.
- Composite index `podcasts_episode_podcast_published_idx` on `(podcast_id, published DESC)` and explicit index `podcasts_popularterm_term_idx` on `term`.
- `CONN_MAX_AGE` and `connect_timeout` settings on the default database.
- Regression-guard test `test_optimization_guards.py` that locks in every optimization in the pass.
- `BulkSeedMixin` and `make_large_catalogue` helpers in the test suite for the canonical 20 000-episode benchmark fixture.

### Changed
- Upgrade Django from 5.2.14 to 6.0.6; update backend dependencies (djangorestframework, django-environ, pytest-django) for compatibility.
- Episode search endpoint is now a pure read on the request path; the popular-terms counter is eventually consistent via a Celery task. The `/api/popular-terms/` counter may lag the most recent search by a few seconds.
- Feed refresh path is reorganized around `RefreshService`; the `update_total_episodes` Celery task is removed (its per-podcast `COUNT(*)` is replaced by the single-statement reset inside `process_all`).
- List and detail endpoints now use `select_related` and `Prefetch(...)` so the response is rendered with a bounded number of SQL statements. No response payload schema change.

### Performance
- Episode search p95 latency is now under 500 ms against the canonical 200 × 100 ≈ 20 000-episode benchmark fixture.
- Feed refresh emits at least 50 % fewer SQL statements per feed.
- `GET /api/podcasts/`, `GET /api/podcasts/{id}/`, `GET /api/episodes/?podcast=<id>` issue a bounded, constant number of SQL statements.
- `total_episodes` is consistent with the actual episode count after every refresh.
- Database connections are reused across requests (web) and between tasks (Celery).

### Fixed
- Resolved factory-boy `UserFactory._after_postgeneration` deprecation warning by setting `skip_postgeneration_save = True` and overriding `_after_postgeneration` to persist the instance after `set_password`.
- Replaced naive datetime in `podcasts/tests/test_views_features.py` with a timezone-aware value to silence the Django `RuntimeWarning`.
- Fixed backend lint configuration to pass CI consistently
- Consolidated Ruff configuration in root `ruff.toml`
- Added `ruff format --check` step to CI pipeline
- Auto-formatted 7 backend files for consistent code style
- Added pre-commit hook configuration for lint enforcement

## [2.1.0] - 2026-02-28

### Added
- Podcast search functionality in the frontend.
- `PodcastCard` component for search results.
- `fetchPodcasts` method in frontend API.
- Support for `Material Symbols Outlined` icons.
- `make makemigrations` command to `Makefile`.
- `make frontend-lint` command to `Makefile`.
- Semantic versioning automation with Commitizen.
- GitHub Actions workflow for automated releases.
- Commit message validation in CI.
- Test coverage for episode counter update logic.

### Fixed
- CORS configuration in backend for local development.
- English translation of UI components (EmptyState, SearchHeader, cards, nav).
- Updated tests to use English and support search functionality.

### Changed
- **BREAKING**: Complete migration from Flask to Django
  - Removed entire Flask application (`app/` directory)
  - Removed Flask-specific files (manage.py, run.py, requirements.txt, config/)
  - Removed Alembic migrations (replaced by Django migrations)
  - All functionality now provided by Django backend
  - Removed Next.js frontend implementation (preparation for Angular migration)

### Fixed
- Episode counter (`total_episodes`) now updates correctly after feed parsing
  - Fixed indentation bug that caused counter to update inside episode loop
  - Counter now updates once per feed within atomic transaction
  - Improved timezone-aware datetime handling

---

## Legacy Versions

> **Note**: The following versions were tracked manually before the adoption of automated semantic versioning.

### [0.3.0] - 2016-09-19

#### Added
- Adição de thumbnails dos últimos podcasts adicionados
- Adição da captura de imagens e idioma do podcast
- Remoção de podcasts com nenhum episódio cadastrado por mais de uma semana

#### Changed
- Aumento do número de ocorrências por página

#### Fixed
- Correção da sincronização de episódios

### [0.2.6] - 2016-09-08

#### Fixed
- Formatação apresentação do tempo de publicação do episódio

#### Removed
- Remoção do total de episódios indexados na lista de podcasts

### [0.2.5] - 2016-09-08

#### Fixed
- Removendo alguns 'smells' do código
- Formatação apresentação do tempo de publicação do episódio

#### Changed
- Refatoração da paginação de busca e lista de podcasts
- Refatoração da paginação e listagem
- Refatoração do parser

### [0.2.4] - 2016-07-31

#### Changed
- Ajustes no tempo de cache das páginas estáticas
- Atualização dos pacotes

### [0.2.3] - 2014-06-30

#### Added
- Painel administrativo
- Melhorias no parser

#### Fixed
- Correção do parâmetro id no consumo de recursos da API (ainda em construção)

### [0.1.2] - 2016-07-27

#### Added
- Adição do Gulp no stack para a otimização do css e js do projeto
- Favicon
- Implementação da funcionalidade "Trends" que traz os termos mais buscados nos últimos 7, 15 e 30 dias
- Implementação da funcionalidade de criação e listagem de sugestões de pautas
- Adição do Flask-Cache para realizar o cache das páginas estáticas

#### Changed
- Substituição do aviso de sincronização da task de atualização de podcasts através de emails com SendGrid pelo [healthchecks.io](https://healthchecks.io/)
- Mudança da paginação na página de busca
- Substituição do Vagrant como ambiente de desenvolvimento para o Docker
- Correção do texto da página "Sobre o Podiggger"
- Alteração no tratamento das buscas por episódios

#### Fixed
- Correção do parser que gerava erro na sincronização de episódios sem título

#### Removed
- AngularJS

### [0.0.1] - 2016-06-19

- Primeira versão em lançada

[Unreleased]: https://github.com/perna/podigger/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/perna/podigger/compare/v0.2.6...v0.3.0
[0.2.6]: https://github.com/perna/podigger/compare/v0.2.5...v0.2.6
[0.2.5]: https://github.com/perna/podigger/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/perna/podigger/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/perna/podigger/compare/v0.1.2...v0.2.3
[0.1.2]: https://github.com/perna/podigger/compare/v0.0.1...v0.1.2
[0.0.1]: https://github.com/perna/podigger/releases/tag/v0.0.1
