# Dicionário de Dados — podigger

> Gerado pelo Arqueólogo em 2026-06-04
> `doc_level` = `completo`
> Cobre entidades de domínio (Django models), interfaces TypeScript e tipos de payload.

**Escala de confiança:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Índice

1. [Módulo `accounts`](#módulo-accounts)
2. [Módulo `podcasts`](#módulo-podcasts)
3. [Módulo `frontend-ui`](#módulo-frontend-ui)
4. [Módulo `frontend-pages`](#módulo-frontend-pages)
5. [Módulo `frontend-features`](#módulo-frontend-features) *(a preencher)*

---

<a id="módulo-accounts"></a>
## 1. Módulo `accounts`

### Entidade `User` (CustomUser) 🟢

| Campo | Tipo | Obrigatório | Default | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | `AutoField` (PK) | sim | auto | Identificador interno |
| `email` | `EmailField` (unique) | sim | — | Username (login usa email) |
| `password` | `CharField` (hash) | sim | — | Hash bcrypt via `set_password` |
| `role` | `CharField(20, choices)` | sim | `"reader"` | `admin` \| `editor` \| `reader` |
| `approval_status` | `CharField(20, choices)` | sim | `"pending"` | `pending` \| `approved` |
| `is_active` | `BooleanField` | sim | `True` | Django built-in |
| `is_staff` | `BooleanField` | sim | `False` | Django admin access |
| `created_at` | `DateTimeField` | sim | `auto_now_add` | Timestamp de criação |

**Manager:** `UserManager` com métodos `create_user` e `create_superuser`.

**Escolhas de `role`:** `admin`, `editor`, `reader`.

**Escolhas de `approval_status`:** `pending`, `approved`.

---

<a id="módulo-podcasts"></a>
## 2. Módulo `podcasts`

### Entidade `BaseModel` (abstrata) 🟢

| Campo | Tipo | Obrigatório | Default | Descrição |
|-------|------|-------------|---------|-----------|
| `created_at` | `DateTimeField` | sim | `timezone.now` | Timestamp de criação |
| `updated_at` | `DateTimeField` | não | `auto_now` | Auto-atualizado em save |

### Entidade `PodcastLanguage` 🟢

| Campo | Tipo | Obrigatório | Default | Descrição |
|-------|------|-------------|---------|-----------|
| `code` | `CharField(10)` | não | `"pt"` | Código ISO do idioma |
| `name` | `CharField(60)` | não | `"português"` | Nome legível |

### Entidade `Podcast` 🟢

| Campo | Tipo | Obrigatório | Default | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | `AutoField` (PK) | sim | auto | Identificador |
| `name` | `CharField(128, unique)` | sim | — | Nome do podcast |
| `feed` | `URLField` (unique) | sim | — | URL do feed RSS/Atom |
| `image` | `CharField(255)` | não | `"/static/dist/img/podcast-banner.png"` | Banner (path local) |
| `language` | `FK(PodcastLanguage, SET_NULL)` | não | `null` | Idioma do podcast |
| `total_episodes` | `IntegerField` | sim | `0` | Cache de contagem (atualizado por Celery) |

### Entidade `Tag` 🟢

| Campo | Tipo | Obrigatório | Default | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | `AutoField` (PK) | sim | auto | Identificador |
| `name` | `CharField(255, unique)` | sim | — | Nome único da tag |

### Entidade `Episode` 🟢

| Campo | Tipo | Obrigatório | Default | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | `AutoField` (PK) | sim | auto | Identificador |
| `title` | `CharField(1024)` | sim | — | Título do episódio |
| `link` | `URLField` (unique) | sim | — | URL canônica do episódio |
| `description` | `TextField` | não | `null` | Descrição (HTML stripped) |
| `published` | `DateTimeField` | não | `null` | Data de publicação (RFC 2822) |
| `enclosure` | `CharField(1024)` | não | `null` | URL do MP3/enclosure |
| `to_json` | `JSONField` | não | `null` | Snapshot do feed parser |
| `podcast` | `FK(Podcast, CASCADE)` | sim | — | Podcast-pai |
| `tags` | `M2M(Tag)` | não | — | Tags associadas |

### Entidade `PopularTerm` 🟢

| Campo | Tipo | Obrigatório | Default | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | `AutoField` (PK) | sim | auto | Identificador |
| `term` | `CharField(255, db_index)` | sim | — | Termo buscado |
| `times` | `IntegerField` | sim | `1` | Contagem de buscas |
| `date_search` | `DateField` | sim | `today` | Data da busca (granularidade diária) |

### Entidade `TopicSuggestion` 🟢 🔴 **Removendo — Perna 2026-06-06**

> ⚠️ Esta entidade será removida do schema. Mantida como referência do estado atual.

| Campo | Tipo | Obrigatório | Default | Descrição |
|-------|------|-------------|---------|-----------|
| `id` | `AutoField` (PK) | sim | auto | Identificador |
| `title` | `CharField(255, db_index)` | sim | — | Título da sugestão |
| `description` | `TextField` | não | `null` | Descrição da sugestão |
| `is_recorded` | `BooleanField` | sim | `False` | Flag: episódio já gravado? |

---

<a id="módulo-frontend-ui"></a>
## 3. Módulo `frontend-ui`

### Interface `ButtonProps` 🟢

| Campo | Tipo | Obrigatório | Default | Descrição |
|-------|------|-------------|---------|-----------|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'outline'` | não | `'primary'` | Variante visual |
| `size` | `'sm' \| 'md' \| 'lg' \| 'icon'` | não | `'md'` | Tamanho do botão |
| `isLoading` | `boolean` | não | `undefined` | Mostra spinner e desabilita |
| `className` | `string` | não | — | Classes extras (merge via `cn`) |
| `children` | `ReactNode` | sim | — | Conteúdo (esconde quando `isLoading`) |

**Estende:** `ButtonHTMLAttributes<HTMLButtonElement>` (todos os atributos nativos de `<button>`).
**Ref:** `Ref<HTMLButtonElement>` via `forwardRef`.

### Interface `CardProps` 🟢

| Campo | Tipo | Obrigatório | Default | Descrição |
|-------|------|-------------|---------|-----------|
| `hoverable` | `boolean` | não | `false` | Adiciona hover:shadow + translateY(-1) |
| `className` | `string` | não | — | Classes extras |

**Estende:** `HTMLAttributes<HTMLDivElement>`.
**Ref:** `Ref<HTMLDivElement>` via `forwardRef`.

### Type `InputProps` 🟢

| Campo | Tipo | Obrigatório | Default | Descrição |
|-------|------|-------------|---------|-----------|
| `className` | `string` | não | — | Classes extras |

**É alias de:** `InputHTMLAttributes<HTMLInputElement>` (todos os atributos nativos).
**Ref:** `Ref<HTMLInputElement>` via `forwardRef`.

### Interface `BadgeProps` 🟢

| Campo | Tipo | Obrigatório | Default | Descrição |
|-------|------|-------------|---------|-----------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost'` | não | `'primary'` | Variante visual |
| `className` | `string` | não | — | Classes extras |

**Estende:** `HTMLAttributes<HTMLDivElement>` (renderiza como `<div>`).
**Sem `forwardRef`** (badge é folha).

### Interface `IconProps` 🟢

| Campo | Tipo | Obrigatório | Default | Descrição |
|-------|------|-------------|---------|-----------|
| `name` | `string` | sim | — | Nome do glyph (ex: `"search"`, `"play_arrow"`) |
| `fill` | `boolean` | não | `false` | Variação FILL (0 ou 1) |
| `weight` | `number` | não | `400` | Variação wght (peso da fonte) |
| `grade` | `number` | não | `0` | Variação GRAD (grade) |
| `opticalSize` | `number` | não | `24` | Variação opsz (tamanho óptico) |
| `className` | `string` | não | — | Classes extras |

**Estende:** `React.HTMLAttributes<HTMLSpanElement>` (mas o componente força `aria-hidden="true"`).
**Renderiza:** `<span class="material-symbols-rounded">{name}</span>` com `fontVariationSettings` injetado via `style`.

### Componente `LoadingSpinner` 🟢

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `className` | `string` | — | Classes extras (ex: `size-12 text-primary`) |
| *(outros)* | `SVGAttributes<SVGSVGElement>` | — | Atributos SVG nativos |

**Renderiza:** `<svg>` com path circular animado (`animate-spin`). Não é controlado por prop — o spin é puramente CSS.

### Componente `Skeleton` 🟢

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `className` | `string` | — | Define largura/altura/forma do placeholder |
| *(outros)* | `HTMLAttributes<HTMLDivElement>` | — | Atributos `<div>` nativos |

**Renderiza:** `<div class="animate-pulse rounded-md bg-slate-200 dark:bg-slate-800">`.

### Componente `FullPageLoading` 🟢

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| *(nenhuma)* | — | — | Componente sem props |

**Renderiza:** Overlay fixo com `LoadingSpinner` centralizado, z-index 100, `backdrop-blur-sm`.

### Utilitários (`frontend/src/lib/utils.ts`)

#### `cn(...inputs: ClassValue[]): string` 🟢

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `...inputs` | `ClassValue[]` (clsx) | Strings, condicionais, arrays, objetos |

**Composição:** `twMerge(clsx(inputs))`.

#### `formatDuration(seconds: number): string` 🟢

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `seconds` | `number` | Duração em segundos (pode ser `0` ou `NaN` → retorna `"0:00"`) |

**Retorno:** `HH:MM:SS` se `hours > 0`, senão `MM:SS` (ambos com segundos `padStart(2, '0')`).

#### `formatDate(date: string | Date): string` 🟢

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `date` | `string \| Date` | Data ISO ou objeto `Date` |

**Retorno:** Data formatada em PT-BR (`{year: numeric, month: short, day: numeric}` via `Intl.DateTimeFormat`).

---

<a id="módulo-frontend-pages"></a>
## 4. Módulo `frontend-pages`

### Contratos de API (Route Handlers)

#### `POST /api/auth/login` 🟢

**Request body:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `email` | `string` | sim | Email do usuário |
| `password` | `string` | sim | Senha |

**Response:**
| Status | Body | Descrição |
|--------|------|-----------|
| 200 | `{role: string, email: string}` | Sucesso — Set-Cookie: `access_token`, `refresh_token` (forwarded) |
| 400 | `{detail: string}` | Body inválido (JSON parse falhou) |
| 401 | `{detail: string}` | Credenciais inválidas (forwarded do backend) |
| 403 | `{detail: string}` | Conta pending (forwarded do backend) |
| 503 | `{detail: string}` | Backend indisponível |

#### `POST /api/auth/register` 🟢

**Request body:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `email` | `string` | sim | Email do usuário |
| `password` | `string` | sim | Senha (mínimo 8 chars) |

**Response:**
| Status | Body | Descrição |
|--------|------|-----------|
| 201 | `{email: string}` ou body do backend | Sucesso — conta criada com `approval_status='pending'` |
| 400 | `{detail?, email?, password?}` | Dados inválidos (forwarded) |
| 503 | `{detail: string}` | Backend indisponível |

#### `POST /api/auth/refresh` 🟢

**Request:** requer cookie `refresh_token`.

**Response:**
| Status | Body | Descrição |
|--------|------|-----------|
| 200 | `{}` + Set-Cookie: `access_token` | Sucesso — novo access_token emitido |
| 401 | `{detail: string}` | Refresh token ausente ou inválido |
| 503 | `{detail: string}` | Backend indisponível |

#### `POST /api/auth/logout` 🟢

**Request:** sem body.

**Response:**
| Status | Body | Set-Cookie | Descrição |
|--------|------|------------|-----------|
| 200 | `{success: true}` | `access_token=; Max-Age=0` + `refresh_token=; Max-Age=0` | Limpa cookies localmente (não chama backend) |

#### `GET /api/health` 🟢

**Response:**
| Status | Body | Descrição |
|--------|------|-----------|
| 200 | `{status: 'healthy', timestamp: ISO string, environment: string}` | Health check do Next.js |

#### `* /api/proxy/[...path]` (GET, POST, PUT, PATCH, DELETE) 🟢

**Request:** qualquer método HTTP. Path segments viram path do backend. `access_token` cookie é injetado automaticamente.

**Response:** forward literal do backend. Em caso de 401, proxy tenta refresh automático (via `refresh_token` cookie) e reenvia a request com o novo token. Se refresh falhar, retorna 302 para `/auth/unauthorized?next=...` + clear cookies.

**Algoritmo de auto-refresh:**
1. Forward 1 com `access_token` cookie.
2. Se response ≠ 401: forward as-is.
3. Se response = 401:
   a. Tenta `POST /api/auth/token/refresh/` com `refresh_token` cookie.
   b. Se sucesso: extrai novo `access_token` do Set-Cookie via regex `^access_token=([^;]+)`.
   c. Re-envia request original (com body pré-lido em ArrayBuffer) usando o novo token.
   d. Forward response + Set-Cookie do refresh.
4. Se refresh falhar: redirect 302 + clear cookies.

### Estados de UI (AuthState)

#### `useAuth()` return value 🟢

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `user` | `User \| null` | Usuário autenticado, ou null |
| `isAuthenticated` | `boolean` | `true` se `user !== null` |
| `isLoading` | `boolean` | `true` durante fetch inicial do `/api/auth/login` ou refresh |
| `login(role, email)` | `(role: string, email: string) => void` | Set `user` no estado |
| `logout()` | `() => void` | Clear `user` (chama `/api/auth/logout`?) |
| `setUser(user)` | `(user: User \| null) => void` | Setter imperativo |

#### `User` (no AuthContext) 🟢

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `email` | `string` | Email do usuário |
| `role` | `'admin' \| 'editor' \| 'reader'` | Papel do usuário |

🟡 O `user` no AuthContext é mínimo (apenas email + role). Outros campos do backend (`approval_status`, `created_at`) não são propagados para o frontend.

### Query parameters

| Rota | Param | Tipo | Descrição |
|------|-------|------|-----------|
| `/login` | `next` | `string` (pathname) | URL para redirecionar após login bem-sucedido |
| `/auth/unauthorized` | `next` | `string` (pathname) | URL para redirecionar após login (preservado no botão "Fazer login") |

### Cookies manipulados

| Cookie | Path | HttpOnly | SameSite | Secure (prod) | Max-Age | Definido em |
|--------|------|----------|----------|---------------|---------|-------------|
| `access_token` | `/` | sim | Lax | sim | 300s (5min) | Django login + refresh |
| `refresh_token` | `/api/auth/token/refresh/` | sim | Lax | sim | 86400s (24h) | Django login |

🟡 Logout envia Set-Cookie com `Max-Age=0` para limpar ambos.

### Env vars lidas

| Variável | Default | Uso |
|----------|---------|-----|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | URL do backend Django (usada em todos os Route Handlers) |
| `NEXT_PUBLIC_ENVIRONMENT` | `'development'` | Tag no `/api/health` response |

---

<a id="módulo-frontend-features"></a>
## 5. Módulo `frontend-features`

### Entidades (TypeScript types / interfaces)

#### `Episode` 🟢

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | `number` | sim | PK do episódio |
| `title` | `string` | sim | Título do episódio |
| `link` | `string` | sim | URL original (página do episódio) |
| `description` | `string \| null` | não | Descrição (pode ser HTML) |
| `published` | `string \| null` | não | Data ISO de publicação |
| `enclosure` | `string \| null` | não | URL do MP3/audio |
| `podcast` | `{id, name, image}` | sim | Embedded podcast |
| `podcast.id` | `number` | sim | PK do podcast |
| `podcast.name` | `string` | sim | Nome do podcast |
| `podcast.image` | `string \| null` | não | URL da capa |
| `tags` | `{id, name}[]` | sim | Lista de tags (pode ser vazia) |
| `tags[].id` | `number` | sim | PK da tag |
| `tags[].name` | `string` | sim | Nome da tag |

#### `EpisodesResponse` (paginado DRF) 🟢

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `count` | `number` | Total de resultados |
| `next` | `string \| null` | URL da próxima página (null se última) |
| `previous` | `string \| null` | URL da página anterior (null se primeira) |
| `results` | `Episode[]` | Lista de episódios da página |

#### `Podcast` 🟢

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | `number` | sim | PK do podcast |
| `name` | `string` | sim | Nome |
| `feed` | `string` | sim | URL do feed RSS |
| `image` | `string \| null` | não | URL da capa |
| `language` | `number \| null` | não | FK para `PodcastLanguage.id` |
| `total_episodes` | `number` | sim | Contador cacheado |

#### `PodcastsResponse` (paginado DRF) 🟢

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `count` | `number` | Total de resultados |
| `next` | `string \| null` | URL da próxima página |
| `previous` | `string \| null` | URL da página anterior |
| `results` | `Podcast[]` | Lista de podcasts da página |

#### `AddPodcastResponse` 🟢

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `number \| undefined` | PK do podcast (presente quando `status: 'created'`) |
| `status` | `'created' \| 'existing' \| 'error'` | Status da operação |
| `message` | `string \| undefined` | Mensagem adicional (presente em 'existing' ou 'error') |

#### `AuthState` (useAuth return shape) 🟢

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `user` | `{email, role} \| null` | Usuário em memória |
| `isAuthenticated` | `boolean` | `true` se `user !== null` |
| `isLoading` | `boolean` | Sempre `false` (constante no provider) |

#### `AuthContextValue` (extends `AuthState`) 🟢

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `login(role, email)` | `('admin'\|'editor'\|'reader', string) => void` | Set user (client-side, sem API) |
| `logout()` | `() => void` | Clear user (Nav também chama `/api/auth/logout`) |
| `setUser(user)` | `(User \| null) => void` | Setter imperativo |

#### `Theme` 🟢

| Valor | Significado |
|-------|-------------|
| `'light'` | Tema claro |
| `'dark'` | Tema escuro (default) |

#### `NavItem` (BottomNav) 🟢

| Valor | Label | Icon | Href |
|-------|-------|------|------|
| `'home'` | Home | `home` | `/` |
| `'search'` | Search | `search` | `/` |
| `'library'` | Library | `library_music` | `#` (não implementado) |
| `'settings'` | Settings | `settings` | `#` (não implementado) |

#### `EmptyStateType` 🟢

| Valor | Mensagem | Retry? |
|-------|----------|--------|
| `'no-results'` | `No episodes found for "{q}".` ou `No episodes found.` | não |
| `'no-episodes'` | `No episodes found yet. Add some podcasts to get started.` | não |
| `'error'` | `Something went wrong. Please try again.` | sim (botão) |

### Constantes de domínio

#### `APP_VERSION` 🟢

- Origem: `process.env.NEXT_PUBLIC_APP_VERSION` ?? `'1.2.0'`
- Uso: exibido em `AboutHero` e outros lugares da home
- Tipo: `string`

#### `SOCIAL_LINKS` 🟢

| Chave | URL | Tipo |
|-------|-----|------|
| `twitter` | `https://twitter.com/podigger` | `string` |
| `github` | `https://github.com/podigger` | `string` |
| `discord` | `'#'` | `string` (placeholder) |
| `email` | `'mailto:support@podigger.app'` | `string` |

Declarado `as const` — todos os valores são literal types imutáveis.

### Endpoints consumidos (frontend → backend)

| Função | Método | Path | Query params | Body | Response type |
|--------|--------|------|--------------|------|---------------|
| `fetchEpisodes` | GET | `/api/episodes/` | `q?: string`, `page?: number` | — | `EpisodesResponse` |
| `fetchPodcasts` | GET | `/api/podcasts/` | `search?: string`, `page?: number` | — | `PodcastsResponse` |
| `addPodcast` | POST | `/api/podcasts/` | — | `{name: string, feed: string}` | `AddPodcastResponse` |

🟡 **Assimetria de query param:** `fetchEpisodes` usa `q` (DRF `search_fields=['title']`), `fetchPodcasts` usa `search` (DRF `search_fields=['name']`). Inconsistência reflete a configuração DRF backend-side, não bug do frontend.

### Estados de UI (componentes-chave)

#### `EpisodeList` state 🟢

| State | Tipo | Descrição |
|-------|------|-----------|
| `episodes` | `Episode[]` | Lista acumulada (append em loadMore) |
| `page` | `number` | Próxima página a carregar |
| `hasMore` | `boolean` | `!!res.next` |
| `isLoading` | `boolean` | True durante fetch inicial (mostra spinner) |
| `isLoadingMore` | `boolean` | True durante loadMore (mostra spinner menor) |
| `error` | `Error \| null` | Último erro capturado |

#### `HomeClient` state 🟢

| State | Tipo | Descrição |
|-------|------|-----------|
| `query` | `string` | Input value do SearchHero |
| `searchTerm` | `string` | Termo confirmado (Enter/click) — drives fetch |
| `isSearching` | `boolean` | Vindo do EpisodeList.onLoadingChange |
| `podcasts` | `Podcast[]` | Resultado de `fetchPodcasts(query)` |
| `isSearchingPodcasts` | `boolean` | Local do HomeClient (durante `handleSearch`) |

### localStorage manipulado

| Key | Tipo | Escrito em | Lido em |
|-----|------|-----------|---------|
| `podigger-theme` | `'light' \| 'dark'` | `ThemeProvider.useEffect` | `ThemeProvider.useState lazy init` |

### Env vars lidas (adicionais ao módulo anterior)

| Variável | Default | Uso |
|----------|---------|-----|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | `lib/api.ts` — base para todos os fetches |
| `NEXT_PUBLIC_APP_VERSION` | `'1.2.0'` | `lib/constants.ts` — exibido em AboutHero |
