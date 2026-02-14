# State

**Last Updated:** 2026-02-12T20:30:00Z
**Current Work:** Brownfield Mapping + Project Initialization - Complete

---

## Recent Decisions (Last 60 days)

### AD-001: Migração de Flask para Django (2026-02-12)

**Decision:** Migrar o backend de Flask para Django 5.2.11 com Django REST Framework
**Reason:** Django oferece ORM mais robusto, admin integrado, melhor suporte a PostgreSQL (FTS), e ecossistema mais maduro para APIs REST
**Trade-off:** Curva de aprendizado maior, mais "opinativo" que Flask, overhead inicial de configuração
**Impact:** Backend completamente reescrito, mas com arquitetura mais escalável e manutenível. Testes precisaram ser reescritos com pytest-django.

### AD-002: Next.js App Router para Frontend (2026-02-12)

**Decision:** Usar Next.js 16.1.5 com App Router (não Pages Router)
**Reason:** App Router é o futuro do Next.js, melhor suporte a Server Components, layouts aninhados, e streaming
**Trade-off:** Documentação ainda em evolução, alguns patterns diferentes do Pages Router
**Impact:** Estrutura de pastas em `src/app/`, uso de `page.tsx` e `layout.tsx`, API routes em `app/api/`

### AD-003: Tailwind CSS v4 (2026-02-12)

**Decision:** Adotar Tailwind CSS v4 (versão mais recente)
**Reason:** Melhor performance, CSS nativo, menos configuração
**Trade-off:** Versão mais nova pode ter menos recursos da comunidade, documentação em transição
**Impact:** Não há `tailwind.config.js` explícito, configuração via CSS e PostCSS

### AD-004: Celery para Processamento Assíncrono (2026-02-12)

**Decision:** Usar Celery + Redis para tasks assíncronas (importação de feeds, atualizações periódicas)
**Reason:** Importação de feeds RSS pode ser lenta, não deve bloquear requisições HTTP. Celery é padrão no ecossistema Django.
**Trade-off:** Complexidade adicional (worker separado, Redis como dependência), debugging mais difícil
**Impact:** Arquitetura distribuída, necessita de worker Celery rodando, mas permite escalabilidade horizontal

### AD-005: PostgreSQL Full-Text Search + Trigram (2026-02-12)

**Decision:** Usar PostgreSQL FTS nativo com fallback para Trigram Similarity
**Reason:** Performance superior a LIKE queries, suporte a português, sem necessidade de ElasticSearch
**Trade-off:** Acoplamento ao PostgreSQL (não funciona com SQLite), migrations específicas para extensões
**Impact:** Busca rápida e relevante, mas requer PostgreSQL em todos os ambientes (dev, test, prod)

---

## Active Blockers

### B-001: Frontend não conectado ao backend

**Discovered:** 2026-02-12
**Impact:** Alto - Frontend existe apenas como showcase de componentes, sem funcionalidade real
**Workaround:** Nenhum (é o próximo milestone)
**Resolution:** Implementar Milestone 2 - criar páginas funcionais que consomem a API REST

### B-002: CI/CD não configurado

**Discovered:** 2026-02-12
**Impact:** Médio - Branch `chore/setup-ci-tests` existe mas não está completa
**Workaround:** Testes rodados manualmente localmente
**Resolution:** Configurar GitHub Actions ou similar para rodar testes, linting e build automaticamente

### B-003: Cobertura de testes não medida

**Discovered:** 2026-02-12
**Impact:** Baixo - Testes existem mas não sabemos a cobertura real
**Workaround:** Confiança nos testes existentes
**Resolution:** Adicionar pytest-cov e configurar relatório de cobertura no CI

---

## Lessons Learned

### L-001: Brownfield Mapping é essencial

**Context:** Projeto em migração de Flask para Django, com frontend novo em Next.js
**Problem:** Sem documentação clara, seria difícil entender o estado atual e próximos passos
**Solution:** Criados 6 documentos de mapeamento (STACK, ARCHITECTURE, CONVENTIONS, STRUCTURE, TESTING, INTEGRATIONS)
**Prevents:** Confusão sobre padrões existentes, retrabalho, decisões inconsistentes com a arquitetura atual

### L-002: Separação clara de responsabilidades

**Context:** Backend Django com service layer separado das views
**Problem:** Views podem ficar sobrecarregadas com lógica de negócio
**Solution:** Service layer em `podcasts/services/` encapsula lógica complexa (PodcastService, EpisodeUpdater, feed_parser)
**Prevents:** Views gordas, dificuldade de testar lógica de negócio, acoplamento entre camadas

### L-003: Custom Managers para queries complexas

**Context:** Busca de episódios com FTS + Trigram
**Problem:** Lógica de busca complexa não deve estar nas views
**Solution:** `EpisodeManager.search()` encapsula toda a lógica de busca com fallback
**Prevents:** Duplicação de código, queries complexas espalhadas pelo código, dificuldade de manutenção

---

## Preferences

**Model Guidance Shown:** 2026-02-12
