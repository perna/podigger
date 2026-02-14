# Podigger

**Vision:** Motor de busca para conteúdo de podcasts que permite descobrir episódios por assunto, não apenas por nome do podcast.

**For:** Ouvintes de podcasts que querem encontrar episódios sobre tópicos específicos através de múltiplos podcasts.

**Solves:** Dificuldade de descobrir conteúdo relevante em podcasts quando você sabe o assunto que procura, mas não sabe qual podcast ou episódio específico aborda aquele tema.

## Goals

- **Busca eficiente:** Permitir busca full-text em títulos e descrições de episódios com resultados relevantes em <500ms (PostgreSQL FTS + Trigram)
- **Agregação automática:** Manter base atualizada de podcasts e episódios através de sincronização automática de feeds RSS (Celery tasks)
- **Experiência moderna:** Interface responsiva e intuitiva com design system consistente (Next.js + Tailwind)

## Tech Stack

**Core:**

- Framework: Django 5.2.11 (Backend) + Next.js 16.1.5 (Frontend)
- Language: Python 3.12 + TypeScript 5
- Database: PostgreSQL (com extensões FTS e pg_trgm)

**Key dependencies:**
- Django REST Framework 3.16+ (API REST)
- Celery 5.5.3 + Redis 7.1.0 (processamento assíncrono)
- feedparser 6.0.10+ (parse de RSS/Atom)
- React 19.2.1 + Tailwind CSS v4 (UI)
- pytest + pytest-django (testes)

## Scope

**v1 includes:**

- ✅ API REST completa para gerenciamento de podcasts e episódios
- ✅ Busca avançada com Full-Text Search e Trigram Similarity
- ✅ Importação automática de episódios via RSS feeds
- ✅ Sincronização periódica de feeds (Celery tasks)
- ✅ Tracking de termos populares de busca
- ✅ Design system básico (componentes UI)
- 🚧 Interface web funcional conectada ao backend
- 🚧 Página de busca de episódios
- 🚧 Página de detalhes de podcast
- 🚧 CI/CD pipeline

**Explicitly out of scope:**

- Player de áudio integrado (v1 apenas links para episódios)
- Sistema de autenticação e usuários (v1 é público)
- Recomendações personalizadas baseadas em ML
- Transcrição automática de episódios
- Suporte a múltiplos idiomas (v1 foca em português)
- App mobile nativo (v1 é web responsivo)

## Constraints

- **Timeline:** Projeto em desenvolvimento incremental, sem deadline rígido
- **Technical:** 
  - Migração de Flask para Django já concluída no backend
  - Frontend Next.js em fase inicial (apenas showcase de componentes)
  - PostgreSQL obrigatório para FTS (não funciona com SQLite)
- **Resources:** 
  - Projeto solo/pequeno time
  - Infraestrutura containerizada (Docker Compose)
  - Foco em simplicidade e manutenibilidade

## Current Status

**Backend:** ✅ Funcional e testado
- API REST completa
- Busca avançada implementada
- Celery tasks para sincronização
- Testes unitários e de integração

**Frontend:** 🚧 Em desenvolvimento inicial
- Design system criado
- Componentes UI básicos prontos
- Não conectado ao backend ainda
- Sem páginas funcionais

**Infrastructure:** ✅ Configurada
- Docker Compose para desenvolvimento
- PostgreSQL + Redis containerizados
- Celery worker configurado
- Ambientes staging/production definidos

**Next Steps:** Conectar frontend ao backend e implementar páginas principais (busca, listagem, detalhes).
