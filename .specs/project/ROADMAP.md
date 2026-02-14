# Roadmap

**Current Milestone:** Milestone 2 - Frontend Funcional
**Status:** Planning

---

## Milestone 1 - Backend Foundation ✅

**Goal:** API REST completa e funcional com busca avançada
**Target:** COMPLETE (já implementado)

### Features

**API REST de Podcasts** - COMPLETE

- CRUD completo de podcasts
- Endpoint de podcasts recentes
- Busca por nome
- Serialização com episódios relacionados

**API REST de Episódios** - COMPLETE

- CRUD completo de episódios
- Busca full-text com PostgreSQL FTS
- Fallback para Trigram Similarity
- Filtro por podcast
- Tracking de termos populares

**Importação de Feeds RSS** - COMPLETE

- Parse de feeds RSS/Atom com feedparser
- Validação de feeds
- Extração de metadados (título, descrição, imagem, idioma)
- Criação automática de episódios e tags
- Service layer para lógica de negócio

**Processamento Assíncrono** - COMPLETE

- Celery tasks para importação de episódios
- Task de atualização periódica de feeds
- Task de limpeza de podcasts sem episódios
- Redis como broker e result backend

**Infraestrutura de Testes** - COMPLETE

- pytest + pytest-django configurado
- Testes de API endpoints
- Testes de models e managers
- Testes de feed parser e updater
- Cobertura básica implementada

---

## Milestone 2 - Frontend Funcional 🚧

**Goal:** Interface web funcional conectada ao backend com páginas principais
**Target:** Em andamento

### Features

**Design System** - COMPLETE

- Componentes UI base (Button, Card, Input, Badge, Icon, Loading)
- Variantes e estados (hover, loading, disabled)
- Integração com Tailwind CSS v4
- Tipagem TypeScript completa
- Material Icons integrados

**Página de Busca** - PLANNED

- Input de busca com debounce
- Integração com API de episódios (`GET /api/episodes/?q=termo`)
- Listagem de resultados com paginação
- Cards de episódios com informações principais
- Loading states e empty states
- Filtros (por podcast, data, etc.)

**Página de Listagem de Podcasts** - PLANNED

- Grid/lista de podcasts
- Integração com API (`GET /api/podcasts/`)
- Cards com imagem, nome e total de episódios
- Seção de podcasts recentes (`GET /api/podcasts/recent/`)
- Paginação

**Página de Detalhes do Podcast** - PLANNED

- Informações completas do podcast
- Lista de episódios do podcast
- Integração com API (`GET /api/podcasts/{id}/`)
- Link para episódios
- Imagem e metadados

**Formulário de Adicionar Podcast** - PLANNED

- Form com validação (nome + feed URL)
- Integração com API (`POST /api/podcasts/`)
- Feedback de sucesso/erro
- Loading state durante processamento
- Validação de URL de feed

**Layout e Navegação** - PLANNED

- Header com logo e navegação
- Footer com informações
- Menu de navegação (Home, Busca, Podcasts)
- Responsividade mobile-first
- Dark mode (já configurado no layout)

---

## Milestone 3 - Refinamento e Qualidade 📋

**Goal:** Melhorar qualidade, performance e experiência do usuário

### Features

**CI/CD Pipeline** - PLANNED

- GitHub Actions ou similar
- Testes automatizados em PRs
- Linting (ruff para backend, eslint para frontend)
- Build e deploy automático
- Coverage reporting

**Melhorias de Busca** - PLANNED

- Highlighting de termos buscados
- Sugestões de busca (autocomplete)
- Filtros avançados (data, duração, tags)
- Ordenação customizável
- Busca por tags

**Performance** - PLANNED

- Cache de queries frequentes (Redis)
- Otimização de queries N+1
- Lazy loading de imagens
- Paginação otimizada
- Índices de banco otimizados

**UX Enhancements** - PLANNED

- Skeleton loaders
- Toast notifications
- Error boundaries
- Animações suaves
- Acessibilidade (ARIA labels, keyboard navigation)

**Analytics** - PLANNED

- Dashboard de termos populares
- Estatísticas de uso
- Podcasts mais buscados
- Métricas de performance

---

## Milestone 4 - Features Avançadas 🔮

**Goal:** Adicionar funcionalidades que aumentam o valor do produto

### Features

**Sistema de Tags** - PLANNED

- Navegação por tags
- Tag cloud
- Filtro por múltiplas tags
- Sugestão de tags relacionadas

**Sugestões de Tópicos** - PLANNED

- Interface para sugerir tópicos
- CRUD de sugestões (já existe API)
- Votação de sugestões
- Marcação de tópicos gravados

**Player de Áudio Básico** - PLANNED

- Player integrado na página
- Controles básicos (play, pause, seek)
- Persistência de posição
- Queue de episódios

**Compartilhamento** - PLANNED

- Links diretos para episódios
- Open Graph tags
- Botões de compartilhamento social
- Copy link to clipboard

**RSS Feed Personalizado** - PLANNED

- Gerar feed RSS de resultados de busca
- Feed de episódios recentes
- Feed por tag

---

## Future Considerations

- **Autenticação e Usuários:** Sistema de login, favoritos, histórico de escuta
- **Recomendações:** ML para sugerir episódios baseado em interesses
- **Transcrições:** Integração com serviços de transcrição automática
- **Multi-idioma:** Suporte a inglês e outros idiomas
- **App Mobile:** React Native ou PWA avançado
- **API Pública:** Documentação e rate limiting para uso externo
- **Monetização:** Premium features, API comercial
- **Comunidade:** Sistema de reviews e ratings
- **Notificações:** Alertas de novos episódios sobre tópicos de interesse
- **Integração com Plataformas:** Spotify, Apple Podcasts, etc.
