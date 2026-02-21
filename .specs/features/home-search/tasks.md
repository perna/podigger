# Home Page com Busca — Tasks

**Design**: `.specs/features/home-search/design.md`
**Status**: Draft

---

## Execution Plan

### Phase 1: Foundation (Sequential)

Backend first (API contract), then frontend lib + EmptyState.

```
T1 ──→ T2 ──→ T3
```

### Phase 2: Core Components (Parallel OK)

Após T2 e T3, estes podem rodar em paralelo.

```
T2, T3 complete, then:
  ├── T4 [P]  EpisodeCard
  ├── T5 [P]  SearchHeader
  └── T6 [P]  BottomNav
```

### Phase 3: Integration (Sequential)

```
T4, T5, T6 complete, then:
  T7 ──→ T8
```

---

## Task Breakdown

### T1: Backend — Incluir podcast (name, image) no EpisodeSerializer

**What**: Ajustar `EpisodeSerializer` para retornar `podcast` como objeto `{ id, name, image }` em vez de só o ID, permitindo exibir nome e imagem no card sem chamadas extras.

**Where**: `backend/podcasts/serializers.py`

**Depends on**: None

**Reuses**: `PodcastListSerializer` ou criar `PodcastMinimalSerializer` com `id`, `name`, `image`

**Done when**:
- [ ] `EpisodeSerializer` usa nested serializer para `podcast` (ou `SerializerMethodField` com prefetch)
- [ ] `GET /api/episodes/` retorna `podcast: { id, name, image }` por episódio
- [ ] Testes existentes continuam passando: `pytest backend/podcasts/tests/`

**Verify**:
```bash
cd backend && pytest podcasts/tests/test_api.py -v
curl -s http://localhost:8000/api/episodes/ | jq '.results[0].podcast'
# Expected: { "id": N, "name": "...", "image": "..." }
```

---

### T2: Criar lib/api.ts com fetchEpisodes e tipos [P]

**What**: Função `fetchEpisodes(q?, page?)` que chama `GET /api/episodes/` e tipagem `Episode`, `EpisodesResponse`.

**Where**: `frontend/src/lib/api.ts`

**Depends on**: T1 (para contrato da API; pode ser feito em paralelo se assumir contrato do design)

**Reuses**: `process.env.NEXT_PUBLIC_API_URL`

**Done when**:
- [ ] `Episode` e `EpisodesResponse` exportados
- [ ] `fetchEpisodes(query?: string, page?: number): Promise<EpisodesResponse>` implementada
- [ ] Query e page montados na URL corretamente (encodeURIComponent para query)
- [ ] Erro lançado quando `!response.ok`

**Verify**:
```bash
cd frontend && npx tsc --noEmit
# Testar manualmente ou com test: import e chamar fetchEpisodes()
```

---

### T3: Criar componente EmptyState

**What**: Componente que exibe mensagem contextual para `no-results`, `no-episodes` ou `error`.

**Where**: `frontend/src/components/home/EmptyState.tsx`

**Depends on**: None

**Reuses**: Estilos Tailwind (design system), opcionalmente Icon

**Done when**:
- [ ] Props: `type: 'no-results' | 'no-episodes' | 'error'`, `query?: string`, `onRetry?: () => void`
- [ ] `no-results`: "Nenhum episódio encontrado para {query}"
- [ ] `no-episodes`: "Ainda não há episódios. Adicione podcasts para começar."
- [ ] `error`: mensagem genérica + botão Retry (se onRetry)
- [ ] Sem erros de lint/TypeScript

**Verify**:
```bash
cd frontend && npx tsc --noEmit
# Renderizar no isolation ou em page temporária
```

---

### T4: Criar componente EpisodeCard [P]

**What**: Card de episódio com imagem 16/9, título, nome do podcast, descrição truncada, Play e View Podcast.

**Where**: `frontend/src/components/home/EpisodeCard.tsx`

**Depends on**: T2 (tipos Episode)

**Reuses**: Card (hoverable), Button, Icon

**Done when**:
- [ ] Props: `episode: Episode` (com `podcast` como objeto `{ id, name, image }` após T1)
- [ ] Imagem: `episode.podcast?.image` ou placeholder
- [ ] Badge duração: omitir por enquanto (P3)
- [ ] Play: link para `episode.link` (abre em nova aba)
- [ ] View Podcast: link para `/podcasts/{episode.podcast.id}` (ou # até existir rota)
- [ ] Layout conforme `code.html` (imagem 16/9, line-clamp-2 na descrição)
- [ ] Sem erros de lint/TypeScript

**Verify**:
```bash
cd frontend && npx tsc --noEmit
```

---

### T5: Criar componente SearchHeader [P]

**What**: Header sticky com logo, input de busca, botão Search e abas (All/Latest/Popular).

**Where**: `frontend/src/components/home/SearchHeader.tsx`

**Depends on**: None

**Reuses**: Button, Input, Icon

**Done when**:
- [ ] Props: `query`, `onQueryChange`, `onSearch`, `isSearching?`
- [ ] Logo + título "Podigger" + ícone account_circle (placeholder)
- [ ] Input com ícone search, placeholder "Episodes, podcasts, or RSS..."
- [ ] Botão Search (primary, isLoading quando isSearching)
- [ ] Abas: All Results, Latest, Popular (estático por enquanto; ativo = All)
- [ ] Layout sticky, backdrop-blur conforme `code.html`
- [ ] Sem erros de lint/TypeScript

**Verify**:
```bash
cd frontend && npx tsc --noEmit
```

---

### T6: Criar componente BottomNav [P]

**What**: Navegação inferior fixa com Home, Search, Library, Settings.

**Where**: `frontend/src/components/home/BottomNav.tsx`

**Depends on**: None

**Reuses**: Icon, Link (Next.js)

**Done when**:
- [ ] Props: `activeItem?: 'home' | 'search' | 'library' | 'settings'`
- [ ] Links para `/` (home), `#` (search, library, settings — placeholders)
- [ ] Ícones: home, search, library_music, settings
- [ ] Estilo ativo: text-primary
- [ ] Layout fixo, padding para safe area
- [ ] Sem erros de lint/TypeScript

**Verify**:
```bash
cd frontend && npx tsc --noEmit
```

---

### T7: Criar componente EpisodeList

**What**: Lista paginada de episódios com fetch, loading, empty state e "carregar mais".

**Where**: `frontend/src/components/home/EpisodeList.tsx`

**Depends on**: T2, T3, T4

**Reuses**: fetchEpisodes, EpisodeCard, EmptyState, Loading

**Done when**:
- [ ] Client Component (`'use client'`)
- [ ] Props: `query?: string` — quando vazio/undefined, fetch recentes; quando preenchido, busca
- [ ] Mount: fetch `GET /api/episodes/` (recentes)
- [ ] Quando query muda: reset page, fetch `GET /api/episodes/?q=...`
- [ ] Paginação: botão ou IntersectionObserver para `page+1`, append resultados
- [ ] Loading inicial: spinner ou skeleton
- [ ] Loading mais: "Loading more episodes..." no fim da lista
- [ ] Empty: EmptyState (no-results, no-episodes, error com onRetry)
- [ ] Tratamento de erro de rede/API
- [ ] Sem erros de lint/TypeScript

**Verify**:
```bash
cd frontend && npx tsc --noEmit
# Teste manual: abrir home, ver episódios; buscar; rolar para carregar mais
```

---

### T8: Integrar HomePage em page.tsx

**What**: Substituir conteúdo atual da home por SearchHeader, EpisodeList e BottomNav; estado de query compartilhado.

**Where**: `frontend/src/app/page.tsx`

**Depends on**: T5, T6, T7

**Reuses**: SearchHeader, EpisodeList, BottomNav

**Done when**:
- [ ] Client Component ou wrapper Client com estado
- [ ] Estado `query` e `setQuery`; `onSearch` limpa/reseta e passa query para EpisodeList
- [ ] Search vazia → EpisodeList recebe query vazia (mostra recentes)
- [ ] SearchHeader passa query, onQueryChange, onSearch, isSearching (do EpisodeList ou estado derivado)
- [ ] BottomNav com activeItem="home"
- [ ] Spacer no fim para não ficar atrás do BottomNav
- [ ] Sem erros de lint/TypeScript

**Verify**:
```bash
cd frontend && npm run build
# Teste manual: digitar, clicar Search, ver resultados; empty state; carregar mais
```

---

## Parallel Execution Map

```
Phase 1:
  T1 (backend) ──→ T2 (api) ──→ T3 (EmptyState)

Phase 2 (T2, T3 done):
  ├── T4 EpisodeCard  [P]
  ├── T5 SearchHeader [P]
  └── T6 BottomNav    [P]

Phase 3 (T4, T5, T6 done):
  T7 EpisodeList ──→ T8 page.tsx
```

---

## Granularity Check

| Task | Scope | Status |
|------|-------|--------|
| T1: Backend EpisodeSerializer | 1 arquivo, 1 mudança | ✅ Granular |
| T2: lib/api.ts | 1 arquivo, types + 1 função | ✅ Granular |
| T3: EmptyState | 1 componente | ✅ Granular |
| T4: EpisodeCard | 1 componente | ✅ Granular |
| T5: SearchHeader | 1 componente | ✅ Granular |
| T6: BottomNav | 1 componente | ✅ Granular |
| T7: EpisodeList | 1 componente (usa T2,T3,T4) | ✅ Granular |
| T8: page.tsx | 1 página, integração | ✅ Granular |
