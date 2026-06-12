# ADRs (Architecture Decision Records) — podigger

> Gerado pelo Detetive em 2026-06-05
> `doc_level` = `completo`
> Decisões arquiteturais retroativas extraídas do histórico Git e do código.

**Escala de confiança:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Índice

| # | Título | Status | Data | Contexto |
|---|--------|--------|------|----------|
| [001](001-approval-gate.md) | Approval Gate para Novos Usuários | Aceito | 2026-05-01 | `94ca2f2` |
| [002](002-jwt-httponly-cookies.md) | JWT em Cookies HttpOnly (Não em localStorage) | Aceito | 2026-05-01 | `94ca2f2` |
| [003](003-postgresql-fts-trigram.md) | PostgreSQL FTS + Trigram Fallback para Busca | Aceito (legado de 2016) | 2016-05-16 | `3e8a729` + `b99b7fc` |
| [004](004-redis-soft-dependency.md) | Redis como Soft Dependency no Health Check | Aceito | 2026-04-09 | `a3827a2` |
| [005](005-celery-pipeline.md) | Pipeline Assíncrono Celery para Atualização de Feeds | Aceito | 2016-06-19 | `226883a` + `b99b7fc` |
| [006](006-material-symbols-rounded.md) | Material Symbols Rounded como Sistema de Ícones | Aceito | 2026-04-09 | `2f50d77` + `ca4dfad` |
| [007](007-proxy-auto-refresh.md) | Proxy Catch-all com Auto-Refresh no Next.js | Aceito | 2026-05-01 | `94ca2f2` |
| [008](008-approval-status-orthogonal.md) | `approval_status` Ortogonal a `is_active` | Aceito | 2026-05-01 | `94ca2f2` |
| [009](009-topic-suggestion-separate-model.md) | TopicSuggestion como Modelo Separado de Podcast | Aceito | ~2016-2017 | (herdado) |
| [010](010-custom-user-email.md) | Custom User Model com Email como USERNAME_FIELD | Aceito | 2026-05-01 | `94ca2f2` |

---

## Como ler

Cada ADR segue o template clássico de Michael Nygard:

- **Status**: Aceito (padrão atual) / Proposto / Depreciado / Substituído por X.
- **Contexto**: situação que motivou a decisão.
- **Decisão**: o que foi escolhido.
- **Consequências**: trade-offs (positivos e negativos).
- **Alternativas consideradas**: outras opções avaliadas e por que foram rejeitadas.

## Cobertura

| Domínio | ADRs |
|---------|------|
| Autenticação e sessão | 001, 002, 007, 008, 010 |
| Busca e indexação | 003 |
| Infraestrutura e saúde | 004 |
| Processamento assíncrono | 005 |
| UI / Design system | 006 |
| Modelo de dados | 008, 009, 010 |

## ADRs que **não** foram gerados

Estes temas foram considerados mas não chegaram a virar ADR porque o sistema ainda não tem posição clara ou a evidência é fraca:

- **Cache de respostas** (django-redis): o uso atual é limitado ao health check; não há cache de views.
- **Throttling por escopo**: ADR-001-like para explicar por que 5/min em login e 3/min em register, mas é puramente "best practice" sem trade-off registrado.
- **Toggles de feature**: não há feature flag system; não há decisão a registrar.
- **Internacionalização**: layout usa `lang="en"` mas UI é PT-BR (inconsistência não documentada).
- **Versionamento de API**: não há versionamento explícito (não há `/api/v1/`); crescimento futuro vai exigir decisão.

## Próximas decisões sugeridas

| Tema | Quando gerar |
|------|--------------|
| **Soft delete vs hard delete** | Quando o sistema começar a perder dados que os usuários pedem de volta. |
| **Migração de monolito para microsserviços** | Quando Celery + DRF começar a ficar difícil de escalar. |
| **Mudar de PostgreSQL FTS para OpenSearch/Elasticsearch** | Quando o volume de episódios passar de ~1M. |
| **Refresh token com sliding session** | Se usuários reclamarem de logout forçado a cada 24h. |
| **Idempotency keys em mutations** | Se houver relatos de duplicação de podcasts criados em race condition (já mitigado, mas pode haver edge case). |
