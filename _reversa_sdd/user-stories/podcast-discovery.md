# User Story — Descoberta de Podcasts

> Spec gerada pelo Redator em 2026-06-06
> `doc_level` = `completo`
> User story cobrindo o fluxo de discovery: home → busca → resultados → adicionar podcast.

**Escala de confiança:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Personas

### 👀 Carla (visitante anônimo)
- Abre o site pela primeira vez
- Vê a home com episódios recentes
- Pode buscar por termo
- Pode clicar em play em episódios (link externo)
- **Não pode** adicionar podcasts

### 🔍 Pedro (reader, já autenticado)
- Tem conta aprovada
- Mesma experiência de discovery que Carla
- Vê seu role no Navbar
- Personalizou tema (dark ou light)
- **Não pode** adicionar podcasts (apenas `editor`/`admin`)

### ✍️ Mauro (editor)
- Pode adicionar podcasts via `/add-podcast`
- Vê lista expandida de opções de filtro
- Acessa a página restrita via link "+ Add Podcast" no Navbar

### 🛡️ Roberta (admin)
- Tudo que Mauro tem, mais gestão de usuários (em Django admin)
- Pode aprovar novos editores

---

## Fluxo 1: Landing na home (primeira visita)

**Ator:** Carla, anônima, primeira visita.

**Pré-condição:** browser limpo, sem cookies, sem localStorage de tema.

### Cenário feliz

```gherkin
Dado que Carla acessa GET /
Quando a página carrega
Então SSR renderiza o layout (RootLayout: ThemeProvider + AuthProvider + Navbar)
E HomeClient monta com searchTerm=""
E EpisodeList faz fetchEpisodes("", 1) → GET /api/episodes/?page=1
E o backend retorna 20 episódios mais recentes (paginação DRF default)
E os cards de episódio são renderizados:
  - desktop (md+): EpisodeCardCompact em grid 1-2 colunas
  - mobile (<md): EpisodeCard com hero image
E o título da seção é "Recent Results"
E a sidebar (lg+) mostra "Trending Podcasts — Coming soon..." e "Podigger Pro" CTA
E o BottomNav mobile (md:hidden) é renderizado com activeItem="search"
E o FAB é renderizado (sem onClick)
```

**Origem no legado:**
- `frontend/src/app/page.tsx` (RSC wrapper)
- `frontend/src/components/home/HomeClient.tsx` (orquestrador)
- `frontend/src/components/home/EpisodeList.tsx` (infinite scroll)
- `frontend/src/components/episodes/EpisodeCardCompact.tsx` (card desktop)
- `frontend/src/components/home/EpisodeCard.tsx` (card mobile)
- `frontend/src/lib/api.ts:44-62` (`fetchEpisodes`)

### Cenários de erro

```gherkin
Dado que o backend está fora do ar
Quando Carla acessa /
Então HomeClient monta normalmente
E EpisodeList.load() chama fetchEpisodes() que throws
E EpisodeList seta error
E renderiza <EmptyState type="error" onRetry={...}>
E mostra ícone de erro + "Algo deu errado" + botão "Retry"
```

---

## Fluxo 2: Busca de podcasts (Carla digita "python")

**Ator:** Carla.

**Pré-condição:** Carla está na home, sem termo de busca.

### Cenário feliz

```gherkin
Dado que Carla está na home
Quando digita "python" no SearchHero input
Então HomeClient atualiza query="python" (controlled input)
E o input mostra o texto "python" (visualmente)

Quando Carla pressiona Enter no input
Então SearchHero dispara onSearch()
E HomeClient.handleSearch() é chamado
E trimmed = "python" (já é trim)
E setSearchTerm("python")
E setIsSearchingPodcasts(true)
E await fetchPodcasts("python") → GET /api/podcasts/?search=python
E o backend retorna {count: 3, next: null, previous: null, results: [3 podcasts]}
E setPodcasts(res.results)
E setIsSearchingPodcasts(false)
E o grid de podcasts aparece com 3 PodcastCards (1-2 colunas)
E o título da seção Episodes muda para "Episodes for "python""
E EpisodeList re-faz fetch com searchTerm="python"
```

**Origem no legado:**
- `frontend/src/components/home/HomeClient.tsx:19-37` (`handleSearch`)
- `frontend/src/components/search/SearchHero.tsx` (desktop hero)
- `frontend/src/components/podcasts/PodcastCard.tsx` (card)
- `frontend/src/lib/api.ts:64-82` (`fetchPodcasts`)

### Cenários de erro

```gherkin
Dado que Carla digita "   " (só espaços) e pressiona Enter
Quando handleSearch é chamado
Então trimmed="" → early-return setPodcasts([])
E o grid de podcasts NÃO aparece
E o título da seção Episodes volta para "Recent Results"
E nenhum fetch de podcasts é feito

Dado que Carla digita "xyzxyz123" (sem matches)
Quando fetchPodcasts("xyzxyz123") é chamado
Então retorna {count: 0, results: []}
E HomeClient renderiza "No podcasts found for "xyzxyz123"."
E o grid de podcasts está vazio

Dado que o backend retorna 500
Quando fetchPodcasts throws
Então handleSearch captura o erro no try/catch
E console.error("Error searching podcasts:", err)
E setPodcasts([])
E NÃO há EmptyState (silencioso — não tem feedback visual para esse erro)
# Gap UX: usuário não vê mensagem de erro em fetchPodcasts falhas

Dado que Carla digita "python" rapidamente, depois apaga para ""
Quando query muda, searchTerm permanece "python" (não atualiza)
E setSearchTerm("") só acontece via Enter/click
E enquanto isso, o grid continua mostrando resultado antigo
# Aceitável: usuário pode re-buscar com "" para limpar explicitamente
```

---

## Fluxo 3: Infinite scroll de episódios

**Ator:** Carla, na home, scrollando.

**Pré-condição:** já há 20 episódios carregados (página 1), `hasMore=true`.

### Cenário feliz

```gherkin
Dado que Carla está na home com 20 episódios visíveis
E o IntersectionObserver está observando o loadMoreRef div (100px antes do fim)
Quando Carla rola a página para baixo
Então o loadMoreRef div fica visível
E o observer dispara
E setPage(p => p + 1) → page=2
E load("python", 2, true) é chamado
E setIsLoadingMore(true)
E await fetchEpisodes("python", 2) → GET /api/episodes/?q=python&page=2
E retorna {count: 47, next: "...?page=3", previous: "...?page=1", results: [...20 episódios]}
E setEpisodes(prev => [...prev, ...res.results]) → 40 episódios
E setHasMore(!!res.next) → true (ainda há página 3)
E isLoadingMore=false
E o spinner local aparece brevemente, depois some
E o usuário vê os 20 novos episódios
```

**Origem no legado:**
- `frontend/src/components/home/EpisodeList.tsx:60-78` (IntersectionObserver)

### Cenário de fim

```gherkin
Dado que Carla está na última página (ex: página 3 de 3)
E o backend retorna {count: 47, next: null, previous: "...?page=2", results: [...7 episódios]}
Quando setHasMore(!!res.next) é chamado
Então hasMore=false
E o observer não dispara mais
E o loadMoreRef div é removido do DOM
E o usuário vê os 7 últimos episódios sem spinner de "Loading more..."
```

### Cenário de erro

```gherkin
Dado que Carla rola rapidamente, e o backend está com lentidão
Quando o observer dispara antes do fetch anterior terminar
Então o useEffect guard (isLoading || isLoadingMore) bloqueia
E o observer não cria um novo IntersectionObserver
E nenhum fetch duplicado é feito

# Gap R-FF-43 (race condition):
Dado que Carla muda a query de "python" para "rust" durante um fetch
E o fetch de "python" ainda está pendente
Quando o fetch de "python" resolve depois do de "rust"
Então setEpisodes é chamado com o resultado antigo de "python"
E o usuário vê resultados de "python" mesmo tendo buscado "rust"
# Mitigação: AbortController (TT-49)
```

---

## Fluxo 4: Click em play de episódio

**Ator:** Carla.

**Pré-condição:** episódios carregados na home.

### Cenário feliz

```gherkin
Dado que Carla clica no play button de um EpisodeCard
Então o anchor tem href = episode.enclosure || episode.link
E uma nova aba abre com o player de podcast do site original
E o episódio começa a tocar
# Não é player interno — é link externo para feed original
```

**Origem no legado:**
- `frontend/src/components/home/EpisodeCard.tsx` (play button)
- `frontend/src/components/episodes/EpisodeCardCompact.tsx` (play button)

### Cenário de erro

```gherkin
Dado que o episódio não tem enclosure nem link
Quando Carla clica no play
Então o anchor tem href="#" ou href="javascript:void(0)"
E nada acontece (UX ruim — mas é edge case raro)
```

---

## Fluxo 5: Visualizar podcast (click no card)

**Ator:** Carla.

### Cenário atual (gap conhecido)

```gherkin
Dado que Carla clica em um PodcastCard
Então o link é /podcasts/{podcast.id}
E a rota /podcasts/[id] NÃO está implementada
E Next.js retorna 404
# Gap conhecido: rota futura, link visível mas gera 404
```

**Origem no legado:**
- `frontend/src/components/podcasts/PodcastCard.tsx`

---

## Fluxo 6: Adicionar podcast (Mauro/editor)

**Ator:** Mauro, editor, autenticado.

**Pré-condição:** Mauro tem role=editor ou admin, cookie `access_token` válido.

### Cenário feliz (acesso à página)

```gherkin
Dado que Mauro está autenticado
Quando acessa GET /add-podcast
Então o Edge Middleware verifica cookie access_token → presente
E NextResponse.next() é chamado
E AddPodcastPage monta
E useAuth() retorna user={email, role: "editor"}
E role check: editor → renderiza o form
```

**Origem no legado:**
- `frontend/src/middleware.ts:13-24` (Edge Middleware)
- `frontend/src/app/add-podcast/page.tsx` (page guard)

### Cenário de acesso negado (2 camadas)

```gherkin
# Camada 1: Edge Middleware
Dado que Carla (anônima) tenta acessar /add-podcast
Quando o middleware avalia o cookie
Então access_token ausente → 302 para /auth/unauthorized?next=%2Fadd-podcast
E Carla é redirecionada para a página de unauthorized

# Camada 2: Page guard (defesa em profundidade)
Dado que Sofia (reader) tenta acessar /add-podcast
Quando a página monta com cookie válido mas role=reader
Então useAuth() retorna user.role="reader"
E page renderiza "Acesso Negado" inline (sem mostrar form)

# Cenário com cookie forjado:
Dado que Carla tem cookie access_token forjado (válido sintaticamente)
E tenta acessar /add-podcast
Quando o middleware passa adiante
E AddPodcastPage monta
Então useAuth() retorna user=null (frontend não decodifica JWT)
E page renderiza "Acesso Negado" (porque !user)
```

### Cenário feliz (submissão)

```gherkin
Dado que Mauro está em /add-podcast com o form visível
E preencheu "name": "Python in Production" e "feed": "https://feeds.example.com/python.rss"
Quando clica em "Add Podcast"
Então addPodcast(name, feed) é chamado (lib/api.ts)
E POST /api/podcasts/ (direto, sem proxy) é chamado
  # Gap R-FF-54: deveria passar por /api/proxy/podcasts/ para auto-refresh
E body é JSON { name, feed }
E Content-Type: application/json
E retorna 201 { id: 5, status: "created" }
E a página exibe "Podcast cadastrado com sucesso!"
E setTimeout(2000) → router.push('/')
E Mauro é redirecionado para a home após 2 segundos
E Celery task é agendada para popular episódios do novo podcast
```

**Origem no legado:**
- `frontend/src/app/add-podcast/page.tsx` (form + submit)
- `frontend/src/lib/api.ts:90-108` (`addPodcast`)
- `backend/podcasts/views.py` (PodcastViewSet.create)
- `backend/podcasts/services/podcast_service.py` (lógica de create)

### Cenário de duplicata

```gherkin
Dado que o feed "https://feeds.example.com/python.rss" já existe
Quando POST /api/podcasts/ é chamado
Então retorna 200 { id: 5, status: "none", message: "Podcast já existe" }
E a página exibe "Este podcast já está cadastrado" (ou a message)
E NÃO há Celery task agendada (já existe)
```

### Cenários de erro

```gherkin
Dado que o feed "https://invalid.url/feed" é inválido (bozo != 0)
Quando POST /api/podcasts/ é chamado
Então retorna 400 { detail: "o feed informado é inválido" }
E a página exibe "URL do feed inválida"

Dado que Mauro deixa o campo "feed" vazio
Quando clica em "Add Podcast"
Então validação client-side bloqueia OU
  POST retorna 400 { detail: "o nome e o feed são obrigatórios" }
E a página exibe "Preencha todos os campos"

Dado que o access_token de Mauro expirou durante o preenchimento
Quando POST /api/podcasts/ é chamado (vai direto, sem proxy)
Então retorna 401 { detail: "Authentication credentials were not provided." }
E a página exibe erro genérico
# Gap R-FF-54: se fosse via /api/proxy/, o auto-refresh funcionaria
```

---

## Fluxo 7: Sugestão de tópico (admin/editor)

**Ator:** Mauro, editor.

### Cenário

```gherkin
Dado que Mauro quer sugerir um tópico
Quando POST /api/topic-suggestions/ com body { title, description }
Então retorna 201 com TopicSuggestion (is_recorded=false)
E a sugestão aparece em GET /api/topic-suggestions/ para admins
# Sem frontend para isso — admin usa Django admin
```

---

## Fluxo 8: Termos populares (qualquer usuário)

**Ator:** Carla, anônima.

### Cenário

```gherkin
Dado que Carla acessa / ou qualquer página
Quando popular terms são renderizados
  # Gap: atualmente NÃO há UI que consome /api/popular-terms/
  # O endpoint existe mas não é chamado pelo frontend
Então a sidebar mostra "Trending Podcasts — Coming soon..." (placeholder)
# Endpoint disponível para futuro widget de trending
```

---

## Diagrama do fluxo de discovery

```
[Visitante acessa /]
        │
        ├─── SSR: HomeClient + EpisodeList
        │         │
        │         └── fetchEpisodes("", 1) ──→ 20 episódios
        │
        ├─── [SearchHero: digita "python"]
        │         │
        │         ├── Enter/click
        │         │   │
        │         │   └── fetchPodcasts("python") ──→ 3 podcasts
        │         │       │
        │         │       └── grid renderizado
        │         │
        │         └── EpisodeList re-fetch com searchTerm="python"
        │                  │
        │                  └── infinite scroll ──→ 47 episódios (3 pages)
        │
        ├─── [Click no play]
        │         │
        │         └── episode.enclosure || episode.link (nova aba)
        │
        ├─── [Click no PodcastCard] ──→ /podcasts/{id} (404 — gap)
        │
        └─── [Click no FAB] ──→ nada (placeholder — gap)

═══════════════════════════════════════════════════════════════

[Editor /add-podcast]
        │
        ├─── Middleware verifica cookie
        │         │
        │         ├── ausente → 302 /auth/unauthorized
        │         └── presente → passa adiante
        │
        ├─── Page guard: useAuth().role
        │         │
        │         ├── role ∉ {editor, admin} → "Acesso Negado"
        │         └── role ∈ {editor, admin} → form
        │
        └─── Submit form
                  │
                  ├── POST /api/podcasts/ (direto, sem proxy)
                  │
                  ├─── 201 created → "Sucesso!" + setTimeout(2s) → home
                  ├─── 200 existing → "Já cadastrado"
                  ├─── 400 invalid feed → erro
                  └─── 401/403 → erro genérico
```

---

## Matriz de endpoints por persona

| Endpoint | Anônimo | Reader | Editor | Admin | UI Frontend |
|----------|---------|--------|--------|-------|-------------|
| `GET /api/episodes/` | ✅ | ✅ | ✅ | ✅ | HomeClient |
| `GET /api/episodes/?q=` | ✅ | ✅ | ✅ | ✅ | EpisodeList |
| `GET /api/podcasts/` | ✅ | ✅ | ✅ | ✅ | HomeClient (search) |
| `GET /api/podcasts/recent/` | ✅ | ✅ | ✅ | ✅ | (gap — não consumido) |
| `GET /api/podcasts/{id}/` | ✅ | ✅ | ✅ | ✅ | (gap — rota 404) |
| `POST /api/podcasts/` | ❌ | ❌ | ✅ | ✅ | AddPodcastPage |
| `GET /api/popular-terms/` | ✅ | ✅ | ✅ | ✅ | (gap — não consumido) |
| `GET /api/topic-suggestions/` | ✅ | ✅ | ✅ | ✅ | (gap — não consumido) |
| `POST /api/topic-suggestions/` | ❌ | ❌ | ✅ | ✅ | (gap — sem UI) |

---

## Rastreabilidade

| Fluxo | Specs |
|-------|-------|
| Home | `frontend-features/requirements.md` (RF-FF-01..06) + `design.md` (Fluxo 1) |
| Busca | `frontend-features/requirements.md` (RF-FF-02..05) + `design.md` (Fluxo 1) |
| Infinite scroll | `frontend-features/requirements.md` (RF-FF-07..13) + `design.md` (Fluxo 2) |
| Add podcast | `frontend-pages/requirements.md` (RF-PAGE-06..08) + `podcasts/contracts.md` (POST /api/podcasts/) |
| Termos populares | `podcasts/contracts.md` (GET /api/popular-terms/) — gap de consumo |
| Topic suggestions | `podcasts/contracts.md` (POST /api/topic-suggestions/) — gap de UI |

---

## Lacunas conhecidas (🔴)

- **R-FF-54:** `addPodcast` POST direto (sem proxy `/api/proxy/`) — auto-refresh não funciona. Mitigação: refatorar `lib/api.ts:90-108` para usar `/api/proxy/podcasts/`.
- **R-FF-43:** Race condition em `EpisodeList` quando query muda. Mitigação: AbortController.
- **R-PAGE-21:** `AuthContext.login/logout` client-side puros. Sem endpoint `/api/auth/me/`, frontend perde `user` no reload.
- **404 em /podcasts/{id}:** Rota futura, link em PodcastCard gera 404.
- **Sem UI para popular-terms:** Endpoint existe mas não é consumido pelo frontend.
- **Sem UI para topic-suggestions:** Criação/edição apenas via Django admin.
- **Feedback de erro silencioso em fetchPodcasts:** Falha é `console.error` mas UI não muda.
- **BottomNav com 2/4 itens não implementados** (Library, Settings).
- **FAB sem onClick** — placeholder.
- **Botão "Filters" decorativo** na home.
- **Inconsistência EN/PT-BR** no `EmptyState` e `SearchHero` (ver `frontend-features/requirements.md` R-FF-55).
