# Home Page com Busca — Especificação

## Problem Statement

O usuário precisa encontrar episódios de podcasts por assunto ou termo. A home page deve ser o ponto de entrada principal, com busca em destaque e resultados relevantes exibidos de forma clara e navegável. Atualmente o backend já expõe busca full-text via `GET /api/episodes/?q=termo`, mas o frontend ainda não oferece interface para isso.

## Goals

- [ ] Oferecer busca rápida e intuitiva na home page
- [ ] Exibir resultados de episódios em cards informativos e clicáveis
- [ ] Manter layout consistente com o design system (Plus Jakarta Sans, cores primary/background-dark)
- [ ] Conectar ao backend existente sem alterações estruturais na API

## Out of Scope

- Autocomplete/sugestões durante a digitação (P2)
- Player de áudio integrado (v1 usa links externos)
- Filtros avançados por duração ou tags (P2)
- Histórico de buscas persistente
- Autenticação e conta do usuário

---

## Referência de Layout

Baseado em `frontend/stitch_add_new_podcast/podigger_search_home/code.html`:

- **Header sticky:** Logo, título "Podigger", input de busca, botão Search, abas de filtro
- **Main:** Lista de cards de episódios em coluna única (max-w-2xl)
- **Card:** Imagem 16/9, badge de duração, título, nome do podcast, descrição (2 linhas), Play + View Podcast
- **Bottom nav:** Home, Search, Library, Settings
- **Infinite scroll:** Loading indicator ao carregar mais

---

## User Stories

### P1: Busca de episódios ⭐ MVP

**User Story:** Como ouvinte, quero buscar episódios por termo para encontrar conteúdo sobre o assunto que me interessa.

**Why P1:** Core do produto — sem busca funcional, não há valor.

**Acceptance Criteria:**

1. WHEN o usuário digita no input e clica em Search THEN o sistema SHALL enviar requisição `GET /api/episodes/?q={termo}` e exibir os resultados
2. WHEN a API retorna episódios THEN o sistema SHALL renderizar cards com título, nome do podcast, descrição truncada e imagem (podcast ou placeholder)
3. WHEN a API retorna vazio THEN o sistema SHALL exibir empty state informativo (ex: "Nenhum episódio encontrado para X")
4. WHEN ocorre erro de rede/API THEN o sistema SHALL exibir mensagem de erro amigável

**Independent Test:** Digitar "design", clicar Search, ver cards de episódios retornados pela API.

---

### P1: Exibição inicial sem busca ⭐ MVP

**User Story:** Como ouvinte, quero ver episódios relevantes ao abrir a home para descobrir conteúdo sem precisar buscar.

**Why P1:** Home precisa ter conteúdo útil; sem isso a página fica vazia.

**Acceptance Criteria:**

1. WHEN o usuário acessa a home sem query THEN o sistema SHALL carregar episódios recentes via `GET /api/episodes/` (sem parâmetro `q`)
2. WHEN os episódios carregam THEN o sistema SHALL exibir a mesma estrutura de cards da busca
3. WHEN não há episódios cadastrados THEN o sistema SHALL exibir empty state (ex: "Ainda não há episódios. Adicione podcasts para começar.")

**Independent Test:** Abrir home, ver lista de episódios recentes.

---

### P1: Paginação / Carregar mais ⭐ MVP

**User Story:** Como ouvinte, quero ver mais resultados quando há muitos episódios sem recarregar a página.

**Why P1:** API usa PageNumberPagination (10 itens); usuário precisa acessar páginas seguintes.

**Acceptance Criteria:**

1. WHEN o usuário rola até o fim da lista (ou clica "Carregar mais") THEN o sistema SHALL fazer `GET /api/episodes/?q=...&page=2` (ou equivalente) e acrescentar os itens à lista
2. WHEN há mais páginas THEN o sistema SHALL exibir indicador de loading durante o fetch
3. WHEN não há mais páginas THEN o sistema SHALL ocultar o botão/trigger de carregar mais

**Independent Test:** Buscar termo com 15+ resultados, rolar até o fim, ver mais episódios carregando.

---

### P2: Filtros por abas (All / Latest / Popular)

**User Story:** Como ouvinte, quero filtrar resultados por "Todos", "Mais recentes" ou "Populares" para refinar a descoberta.

**Why P2:** Melhora UX; backend já suporta ordenação por `published`. "Popular" pode depender de PopularTerm ou de implementação futura.

**Acceptance Criteria:**

1. WHEN o usuário seleciona aba "All Results" / "Latest" / "Popular" THEN o sistema SHALL refazer a busca com parâmetros de ordenação apropriados (ex: `ordering=-published` se suportado)
2. WHEN a aba muda THEN o sistema SHALL indicar visualmente a aba ativa (estilo do layout: borda primary, texto primary)

**Independent Test:** Buscar termo, alternar abas, ver ordenação mudar (se API suportar).

---

### P2: Debounce no input

**User Story:** Como ouvinte, quero que a busca não dispare a cada tecla para evitar chamadas excessivas.

**Why P2:** Melhora performance e evita rate limiting; UX mais fluida.

**Acceptance Criteria:**

1. WHEN o usuário digita no input E o botão Search é clicado THEN a busca SHALL ser executada com o valor atual do input
2. (Opcional para P2) WHEN o usuário digita E para por ~300–500ms THEN o sistema PODE disparar busca automática (search-as-you-type)

**Independent Test:** Digitar rapidamente, clicar Search uma vez, ver uma única requisição com termo final.

---

### P3: Duração no card

**User Story:** Como ouvinte, quero ver a duração do episódio no card para decidir se vale a pena ouvir.

**Why P3:** Layout do mockup mostra badge de duração; episódio não tem campo `duration` no modelo atual — pode vir de enclosure/metadata ou ficar como "—" até suporte.

**Acceptance Criteria:**

1. WHEN o episódio tiver duração disponível (enclosure ou futuro campo) THEN o sistema SHALL exibir no formato `MM:SS` ou `H:MM:SS`
2. WHEN não houver duração THEN o sistema SHALL ocultar o badge ou exibir placeholder discreto

**Independent Test:** Episódio com duração → badge visível; sem duração → sem badge ou "—".

---

## Edge Cases

- WHEN o usuário envia busca com string vazia ou só espaços THEN o sistema SHALL tratar como "sem filtro" e exibir episódios recentes (equivalente à home inicial)
- WHEN a resposta da API demora >3s THEN o sistema SHALL exibir loading state; se timeout, exibir erro
- WHEN o usuário busca com caracteres especiais (ex: `"`, `%`) THEN o sistema SHALL enviar a query encoded corretamente (encodeURIComponent ou similar)

---

## Integração com API

| Ação                  | Endpoint                         | Notas                                          |
|-----------------------|----------------------------------|------------------------------------------------|
| Listar recentes       | `GET /api/episodes/`             | Sem `q`; ordenação default por `-published`    |
| Buscar                | `GET /api/episodes/?q={termo}`   | FTS + Trigram no backend                       |
| Paginar               | `GET /api/episodes/?q=...&page=2`| PageNumberPagination, 10 itens                 |
| Filtrar por podcast   | `GET /api/episodes/?podcast={id}`| Opcional para filtros futuros                  |

**Resposta esperada por episódio:** `id`, `title`, `link`, `description`, `published`, `enclosure`, `podcast` (ID), `tags`. O frontend precisará do nome do podcast — verificar se o serializer inclui `podcast` como objeto nested ou se será necessário ajuste no backend (ex: `podcast__name` ou serializer customizado para search).

---

## Success Criteria

- [ ] Usuário encontra episódios por termo em <2 cliques (digitar + Search)
- [ ] Lista de resultados carrega em <2s (rede normal)
- [ ] Empty state e erros são claros e acionáveis
- [ ] Layout responsivo e consistente com design system (dark mode, fontes, cores)
