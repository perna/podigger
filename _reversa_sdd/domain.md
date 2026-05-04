# Glossário e Regras de Domínio — podigger

> Gerado pelo Detetive em 2026-06-05
> `doc_level` = `completo`
> Conhecimento de negócio implícito extraído do código e do histórico Git.

**Escala de confiança:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Índice

1. [Glossário de domínio](#1-glossário-de-domínio)
2. [Regras de negócio por agregado](#2-regras-de-negócio-por-agregado)
3. [Invariantes do sistema](#3-invariantes-do-sistema)
4. [Mapa de origem (rastreabilidade)](#4-mapa-de-origem-rastreabilidade)

---

<a id="1-glossário-de-domínio"></a>
## 1. Glossário de domínio

### 1.1 Termos de produto

| Termo | Definição | Sinônimos / termos próximos | Fonte |
|-------|-----------|----------------------------|-------|
| **Podcast** | Série de episódios publicados via feed RSS/Atom, identificado por nome único e URL de feed canônica. | — | `podcasts/models.py:Podcast` |
| **Episode** | Item de áudio individual dentro de um Podcast, apontado por `link` canônico e `enclosure` (URL do MP3). | episódio, item de feed | `podcasts/models.py:Episode` |
| **Feed** | URL do RSS/Atom parseado pelo `feedparser` para popular o sistema. Validado por `bozo == 0`. | RSS, Atom, feed URL | `services/feed_parser.py` |
| **Tag** | Rótulo livre associado a um episódio, criado on-the-fly via `get_or_create` durante o `EpisodeUpdater.populate`. | rótulo, marcador | `podcasts/models.py:Tag` |
| **Popular Term** | Termo (string) buscado pelos usuários em `/api/episodes/?q=`, contabilizado a cada busca. | termo de busca, query popular | `podcasts/models.py:PopularTerm` |
| **Topic Suggestion** | Sugestão de tópico enviada pela comunidade, com flag `is_recorded` indicando se já virou episódio. | sugestão de pauta | `podcasts/models.py:TopicSuggestion` |
| **Total Episodes** | Contador denormalizado em `Podcast.total_episodes`, atualizado por Celery task `update_total_episodes`. | cache de contagem | `podcasts/models.py:Podcast` |
| **Approval Status** | Estado de aprovação de uma conta (`pending` ou `approved`). Bloqueia o login enquanto `pending`. | status de aprovação | `accounts/models.py:User` |
| **Role** | Papel RBAC: `admin`, `editor`, `reader`. Define permissões de escrita no sistema. | papel, função | `accounts/models.py:User` |
| **Token (JWT)** | Par `(access, refresh)` emitido pelo SimpleJWT e armazenado em cookies HttpOnly. | access token, refresh token | `accounts/authentication.py` |
| **Cookie path `/api/auth/token/refresh/`** | Escopo do cookie `refresh_token`, intencionalmente separado do path `/` do `access_token`. | refresh cookie scope | `accounts/views.py:75-77` |
| **Orphan podcast** | Podcast sem nenhum episódio (devido a feed inválido ou update que falhou). Removido por Celery task `remove_podcasts`. | podcast órfão | `podcasts/tasks.py:remove_podcasts` |
| **Proxy catch-all** | Route Handler `/api/proxy/[...path]` do Next.js que encaminha chamadas autenticadas para o backend Django, com auto-refresh de token. | proxy, gateway | `frontend/src/app/api/proxy/[...path]/route.ts` |
| **Search Hero** | Seção principal da home com input de busca e botão "Buscar". | hero, busca principal | `frontend/src/components/search/SearchHero.tsx` |
| **Episode Card (variant)** | `EpisodeCard` é o card mobile-large com imagem hero 16:9; `EpisodeCardCompact` é o desktop-compact com thumbnail lateral. | card de episódio | `frontend/src/components/home/EpisodeCard*.tsx` |
| **Theme Provider** | Provider que aplica `dark`/`light` no `<html>`. Default `dark`. Sem toggle exposto no Navbar. | tema, dark mode | `frontend/src/components/providers/ThemeProvider.tsx` |
| **Throttle scope** | Identificador DRF (`anon`, `user`, `login`, `register`) para rate limit diferenciado. | scope de throttling | `config/settings.py:REST_FRAMEWORK` |

### 1.2 Papéis e personas (linguagem de negócio)

| Papel | O que pode fazer | Linguagem observada no código |
|-------|------------------|-------------------------------|
| **Reader** (leitor) | Navegar, buscar episódios, ver podcasts. | `user.role == "reader"` (default no registro) |
| **Editor** | Tudo de Reader + adicionar podcasts + criar TopicSuggestions. | `IsEditorOrAdmin.has_permission` |
| **Admin** | Tudo de Editor + aprovar novos usuários + mudar papéis. | `IsAdminRole.has_permission` |
| **Pending User** | Conta criada mas aguardando aprovação de admin. Não consegue logar. | `User.approval_status == "pending"` |

### 1.3 Siglas / termos técnicos relevantes para o domínio

- **FTS** (Full-Text Search) — recurso nativo do PostgreSQL usado em `EpisodeManager.search`.
- **Trigram Similarity** — extensão `pg_trgm` que calcula similaridade entre strings; usada como fallback do FTS.
- **SearchRank / SearchVector** — operadores Django ORM para o FTS do Postgres.
- **Celery Beat** — agendador de tarefas periódicas (referenciado indiretamente; o `update_base` e `remove_podcasts` parecem ser periódicos).
- **RSC** (React Server Components) — páginas sem `"use client"` no Next.js App Router.
- **Hot reload / soft dependency** — Redis marcado como dependência não-crítica no health check (commit `a3827a2`).

---

<a id="2-regras-de-negócio-por-agregado"></a>
## 2. Regras de negócio por agregado

### 2.1 Agregado `User` (accounts)

| ID | Regra | Trigger | Efeito | Confiança | Localização |
|----|-------|---------|--------|-----------|------------|
| R-USER-01 | Email é obrigatório e único. | `UserManager.create_user` | Lança `ValueError` se vazio. | 🟢 | `accounts/models.py:18-19` |
| R-USER-02 | Novos usuários nascem `pending` e `reader`. | `UserManager.create_user` (defaults via `setdefault`) | `approval_status="pending"`, `role="reader"`. | 🟢 | `accounts/models.py:25-26` |
| R-USER-03 | Senha mínima de 8 caracteres. | `RegisterSerializer.validate_password` | Levanta `ValidationError` se menor. | 🟢 | `accounts/serializers.py:53-57` |
| R-USER-04 | Usuário `pending` não consegue logar. | `EmailTokenObtainPairSerializer.validate` | Levanta `PermissionDenied` (HTTP 403). | 🟢 | `accounts/serializers.py:32-35` |
| R-USER-05 | Apenas admin pode listar/aprovar/mudar papel. | `IsAdminRole.has_permission` | HTTP 403 se role ≠ `admin`. | 🟢 | `accounts/permissions.py:7-11` |
| R-USER-06 | Apenas editor ou admin pode escrever conteúdo. | `IsEditorOrAdmin.has_permission` | HTTP 403 se role ∉ {editor, admin}. | 🟢 | `accounts/permissions.py:17-20` |
| R-USER-07 | Mudança de papel aceita apenas `admin`, `editor`, `reader`. | `UserRoleUpdateView.patch` | HTTP 400 com `Mensagem("papel inválido")` se inválido. | 🟢 | `accounts/views.py:250-261` |
| R-USER-08 | Aprovação não registra auditoria. | `UserApproveView.post` | Apenas altera `approval_status` para `approved`. **Decisão Perna (2026-06-05): deveria ter log de quem aprovou — gap conhecido, manter como melhoria.** | 🔴 | `accounts/views.py:223-236` |
| R-USER-09 | `UserRoleUpdateView` permite que admin promova a si mesmo. | (validação ausente) | Sem proteção `pk != request.user.pk`. | 🟡 | `accounts/views.py:254-275` |
| R-USER-10 | Rate limit: login 5/min, register 3/min (anon). | `AnonRateThrottle` + scope | HTTP 429 quando excedido. | 🟢 | `config/settings.py:178-183` |

### 2.2 Agregado `Podcast` (podcasts)

| ID | Regra | Trigger | Efeito | Confiança | Localização |
|----|-------|---------|--------|-----------|------------|
| R-POD-01 | `name` e `feed` são únicos e obrigatórios. | `PodcastService.create_podcast` (validação) | HTTP 400 "o nome e o feed são obrigatórios" se ausentes. | 🟢 | `services/podcast_service.py:25-37` |
| R-POD-02 | `feed` precisa passar no `is_valid_feed` (bozo==0 do feedparser). | `PodcastService.create_podcast` | HTTP 400 "o feed informado é inválido" se falhar. | 🟢 | `services/feed_parser.py:117-132` |
| R-POD-03 | Criação de podcast é atômica (race-condition safe). | `transaction.atomic` + `get_or_create` | Apenas 1 inserção vence, demais recebem `existing`. | 🟢 | `services/podcast_service.py:50-54` |
| R-POD-04 | Podcast novo dispara Celery `add_episode` (popula episódios). | `PodcastService.create_podcast` ao criar | Task enfileirada no Redis broker. | 🟢 | `services/podcast_service.py:55-67` + `tasks.py:12` |
| R-POD-05 | Status "none" no response indica podcast já existente. | `PodcastViewSet.create` | HTTP 200 `{id, status: "none", message}`. | 🟢 | `views.py:73-78` |
| R-POD-06 | `recent` retorna os 6 podcasts mais recentes por `id` desc. | `PodcastViewSet.recent` | Lista de 6 podcasts. | 🟢 | `views.py:82-93` |
| R-POD-07 | Leitura pública de podcasts/episódios; escrita requer editor/admin. | `get_permissions` em ViewSets | `IsEditorOrAdmin` em POST/PATCH/DELETE. | 🟢 | `views.py:31-35, 107-111` |
| R-POD-08 | Busca por `?search=` no nome do podcast usa `SearchFilter`. | `filterset_fields` e `search_fields` em `PodcastViewSet` | Filtro DRF padrão. | 🟢 | `views.py:20-25` |

### 2.3 Agregado `Episode` (podcasts)

| ID | Regra | Trigger | Efeito | Confiança | Localização |
|----|-------|---------|--------|-----------|------------|
| R-EPI-01 | Busca usa FTS com config `portuguese`. | `EpisodeManager.search` | `SearchVector(SearchField('title', weight='A'), SearchField('description', weight='B'))`. | 🟢 | `models.py:82-118` |
| R-EPI-02 | Fallback Trigram quando FTS não retorna nada (`rank == 0`). | `EpisodeManager.search` | `trigram__gt=0.1` com `order_by(-trigram, -published)`. | 🟢 | `models.py:108-114` |
| R-EPI-03 | Toda busca (mesmo sem resultado) incrementa `PopularTerm`. | `EpisodeManager.search` | `update` ou `create` em `PopularTerm`. | 🟢 | `models.py:90-95` |
| R-EPI-04 | Query vazia retorna `get_queryset()` sem tracking. | `EpisodeManager.search` early return | Sem escrita em `PopularTerm`. | 🟢 | `models.py:84-89` |
| R-EPI-05 | Episódio com mesmo `link` é ignorado (idempotência). | `EpisodeUpdater.populate` | Skip silencioso. | 🟢 | `services/updater.py:75-76` |
| R-EPI-06 | Data do episódio parseada em formato RFC 2822 nos primeiros 25 chars. | `EpisodeUpdater.populate` | Em falha → log + skip. | 🟢 | `services/updater.py:60-67` |
| R-EPI-07 | `to_json` armazena o dict completo do parser (snapshot bruto). | `EpisodeUpdater.populate` | Sem limite de tamanho. **Contexto Perna (2026-06-05): no passado, os dados eram salvos também no formato JSON em um campo da tabela — herança da migração Flask→Django. Provavelmente overkill hoje, mas mantido por compatibilidade.** | 🟡 | `services/updater.py:78-79` |
| R-EPI-08 | HTML do `description` é stripped via regex. | `_strip_html` | Não robusto para HTML malformado. | 🟡 | `services/feed_parser.py:14-26` |
| R-EPI-09 | Filtro por `?podcast=<id>` filtra episódios do podcast. | `EpisodeViewSet.get_queryset` + `filterset_fields` | `Episode.objects.filter(podcast=id)`. | 🟢 | `views.py:113-123` |
| R-EPI-10 | Falha no parse de um item não aborta o batch inteiro. | `EpisodeUpdater.populate` | Try/except em volta do item. | 🟢 | `services/updater.py:56-100` |

### 2.4 Agregado `PopularTerm` (podcasts)

| ID | Regra | Trigger | Efeito | Confiança | Localização |
|----|-------|---------|--------|-----------|------------|
| R-PT-01 | Termo criado com `times=1` na primeira busca. | `EpisodeManager.search` (cria novo) | `PopularTerm.objects.create(term=q, times=1, date_search=today)`. | 🟢 | `models.py:90-95` |
| R-PT-02 | Termo existente incrementa `times` em 1. | `EpisodeManager.search` (incrementa) | `update(times=models.F("times") + 1)`. | 🟢 | `models.py:90-95` |
| R-PT-03 | Listagem pública ordenada por `-times` (mais buscados primeiro). | `PopularTermViewSet` | `queryset.order_by("-times")`. | 🟢 | `views.py:139-143` |

### 2.5 Agregado `TopicSuggestion` (podcasts)

| ID | Regra | Trigger | Efeito | Confiança | Localização |
|----|-------|---------|--------|-----------|------------|
| R-TS-01 | Leitura pública; escrita requer editor/admin. | `TopicSuggestionViewSet.get_permissions` | `IsEditorOrAdmin` em POST/PATCH/DELETE. | 🟢 | `views.py:126-137` |
| R-TS-02 | `is_recorded` default `False` (não foi gravado). | Model field default | True quando virou episódio (flag manual, sem trigger automático). **Decisão Perna (2026-06-05): é setado manualmente, intencionalmente — sem trigger automático.** | 🟢 | `models.py:TopicSuggestion` |

### 2.6 Agregado `Tag` (podcasts)

| ID | Regra | Trigger | Efeito | Confiança | Localização |
|----|-------|---------|--------|-----------|------------|
| R-TAG-01 | `name` único, criado on-the-fly. | `EpisodeUpdater.populate` | `Tag.objects.get_or_create(name=tag_name)`. | 🟢 | `services/updater.py:80-85` |
| R-TAG-02 | Associação M2M via `episode.tags.add(tag)`. | Mesmo | M2M criado/ignorado. | 🟢 | `services/updater.py:80-85` |

### 2.7 Tarefas assíncronas (Celery)

| ID | Regra | Trigger | Efeito | Confiança | Localização |
|----|-------|---------|--------|-----------|------------|
| R-CEL-01 | `add_episode(feed_url)` popula episódios de um feed recém-adicionado. | `PodcastService.create_podcast` (criação) | Async via Redis broker. | 🟢 | `tasks.py:12-22` |
| R-CEL-02 | `update_base` revalida todos os feeds. | Periódico (Celery Beat) | Encadeia `update_total_episodes` ao final. | 🟢 | `tasks.py:25-40` |
| R-CEL-03 | `update_total_episodes` recalcula contadores. | Final do `update_base` | `Podcast.total_episodes` atualizado via `update_fields`. | 🟢 | `tasks.py:43-52` |
| R-CEL-04 | `remove_podcasts` deleta podcasts sem episódios. | Periódico (Celery Beat) | Bulk delete via `annotate(Count).filter(num=0)`. | 🟢 | `tasks.py:55-72` |
| R-CEL-05 | Falha em uma task não bloqueia as demais. | Try/except dentro de `populate` | Log + continue. | 🟢 | `services/updater.py:56-100` |

### 2.8 Autenticação e sessão (frontend)

| ID | Regra | Trigger | Efeito | Confiança | Localização |
|----|-------|---------|--------|-----------|------------|
| R-AUTH-01 | Middleware bloqueia `/add-podcast` e `/admin/*` sem cookie `access_token`. | Edge Runtime, antes do render | 302 → `/auth/unauthorized?next=...`. | 🟢 | `middleware.ts:13-24` |
| R-AUTH-02 | Login 200 → `AuthContext.login(role, email)` + `router.push`. | `LoginPage.handleSubmit` | Redireciona para `next` ou `/`. | 🟢 | `login/page.tsx:36-43` |
| R-AUTH-03 | Login 403 → exibe "Sua conta aguarda aprovação" sem redirect. | `LoginPage.handleSubmit` | Mensagem em `pendingMessage` (role="status"). | 🟢 | `login/page.tsx:45-49` |
| R-AUTH-04 | Login 401 → mensagem genérica (sem hint de campo). | `LoginPage.handleSubmit` | `setError("Email ou senha inválidos")`. | 🟢 | `login/page.tsx:51-55` |
| R-AUTH-05 | Register valida `password === passwordConfirm` client-side. | `RegisterPage.handleSubmit` | Não chama API se diferentes. | 🟢 | `register/page.tsx:25-29` |
| R-AUTH-06 | Register 201 → esconde form e exibe card de sucesso. | `RegisterPage.handleSubmit` | Sem redirect (orienta ir a /login). | 🟢 | `register/page.tsx:40-46` |
| R-AUTH-07 | Proxy 401 → tenta refresh, retry com novo token. | `handleProxy` em `/api/proxy/[...path]` | Reenvia a mesma request com token novo. | 🟢 | `proxy/[...path]/route.ts:185-206` |
| R-AUTH-08 | Refresh falhou → 302 `/auth/unauthorized` + clear cookies. | `buildLogoutRedirect` | Cookies com `Max-Age=0`. | 🟢 | `proxy/[...path]/route.ts:217-225` |
| R-AUTH-09 | Body da request é pré-lido em `ArrayBuffer` para permitir retry. | `handleProxy` (linha 165) | Streams não podem ser consumidos 2x. | 🟢 | `proxy/[...path]/route.ts:165-167` |
| R-AUTH-10 | Login proxy forwarda `Set-Cookie` literal do Django (essencial). | `POST /api/auth/login` | Usa `headers.getSetCookie()` com fallback. | 🟢 | `api/auth/login/route.ts:46-61` |
| R-AUTH-11 | Logout limpa cookies localmente; tokens ainda válidos até `exp`. | `POST /api/auth/logout` | Set-Cookie Max-Age=0 para `access_token` e `refresh_token`. | 🟡 | `api/auth/logout/route.ts:3-18` |
| R-AUTH-12 | `AddPodcastPage` re-checa role no client (defesa em camadas). | Render no client | Tela de "Acesso Negado" se role inválido. | 🟢 | `add-podcast/page.tsx:21-47` |
| R-AUTH-13 | `ForbiddenPage` exibe label PT-BR do role atual. | Render | `ROLE_LABELS = {admin: "Administrador", ...}`. | 🟢 | `auth/forbidden/page.tsx:10-14, 49-54` |

---

<a id="3-invariantes-do-sistema"></a>
## 3. Invariantes do sistema

Invariantes são propriedades que **nunca** devem ser violadas em estado válido. Foram derivadas das regras acima.

### 3.1 Invariantes de modelo

| # | Invariante | Garantida por | Risco se violada |
|---|------------|---------------|------------------|
| I-1 | `User.email` único no banco. | `EmailField(unique=True)` | Email duplicado na criação. |
| I-2 | `Podcast.name` único. | `CharField(128, unique=True)` | Conflito ao recriar. |
| I-3 | `Podcast.feed` único. | `URLField(unique=True)` | Mesma. |
| I-4 | `Episode.link` único. | `URLField(unique=True)` | Duplicação silenciosa evitada pelo `populate`. |
| I-5 | `Tag.name` único. | `CharField(255, unique=True)` | `get_or_create` é seguro. |
| I-6 | Todo `Episode` tem `podcast` (FK NOT NULL). | `FK(Podcast, on_delete=CASCADE)` | Cascade apaga episódios se podcast removido. |
| I-7 | `User.role ∈ {admin, editor, reader}`. | Validação no `UserRoleUpdateView` | Sem `db.CheckConstraint` no model — confia no view. 🟡 |
| I-8 | `User.approval_status ∈ {pending, approved}`. | Choice no model + uso | Sem `db.CheckConstraint`. 🟡 |

### 3.2 Invariantes de comportamento

| # | Invariante | Garantida por |
|---|------------|---------------|
| I-9 | Usuário `pending` nunca recebe tokens JWT. | `EmailTokenObtainPairSerializer.validate` (PermissionDenied). |
| I-10 | Listeners em `PopularTerm` crescem monotonicamente no dia. | Não há reset automático; tarefa de manutenção ausente. 🔴 |
| I-11 | Cada podcast tem ao menos 0 episódios; órfãos são limpos. | Celery `remove_podcasts`. |
| I-12 | `Cookie path` do refresh é mais restrito que o do access. | Hard-coded em `TokenObtainCookieView` e `TokenRefreshCookieView`. |
| I-13 | O frontend sempre usa o proxy do Next.js para chamadas autenticadas; nunca chama Django diretamente. | Toda chamada passa por `/api/proxy/[...path]`. |
| I-14 | Health check retorna 200 mesmo se Redis está degradado. | `health_check` em `podcasts/health.py` (commit `a3827a2`). |
| I-15 | FTS prioriza matches no `title` (peso A) sobre `description` (peso B). | `SearchVector` com pesos A e B. |

### 3.3 Anti-invariantes observadas (o sistema NÃO garante)

| # | O que **não** está garantido | Risco |
|---|------------------------------|-------|
| AI-1 | Auditoria de aprovação/mudança de papel. | Sem rastreabilidade de quem promoveu/reprovou. |
| AI-2 | Unicidade semântica (mesmo feed com nome diferente). | Dois feeds com nomes diferentes são aceitos como diferentes. |
| AI-3 | Sanitização robusta de HTML. | Regex simples; pode deixar HTML malformado. |
| AI-4 | Rate limit no endpoint de busca. | `EpisodeManager.search` pode ser abusado para inflar `PopularTerm`. **Decisão Perna (2026-06-05): deveria ter rate limit com throttle por intervalo de tempo e por usuário — gap conhecido.** |
| AI-5 | Invalidação real de JWT no logout. | Tokens ainda válidos até `exp`; revogação requer blacklist manual. **Decisão Perna (2026-06-05): a invalidação deve ocorrer no logout — chamar `/api/auth/token/blacklist/` (já habilitado em `INSTALLED_APPS`).** |
| AI-6 | Bloqueio do próprio admin se auto-promover. | Sem proteção `pk != request.user.pk`. **Decisão Perna (2026-06-05): é regra de negócio — admin pode se auto-promover (incl. rebaixar). Não é gap.** |
| AI-7 | Tradução PT/EN no frontend. | Layout usa `lang="en"` mas UI é PT-BR. 🟡 |
| AI-8 | Toggle real de tema (light/dark). | `ThemeProvider` existe mas `Navbar` não expõe o toggle; sempre `dark`. |

---

<a id="4-mapa-de-origem-rastreabilidade"></a>
## 4. Mapa de origem (rastreabilidade)

Cada regra aqui pode ser rastreada até o código (e, quando possível, até o commit que a introduziu).

### 4.1 Por decisão Git

| Decisão | Commit | Tipo | Idade |
|---------|--------|------|------|
| Aprovação de novos usuários via admin (approval gate) | `94ca2f2` (2026-05-01) | feat | Recente |
| JWT em cookies HttpOnly com throttling | `94ca2f2` | feat | Recente |
| CSRF_TRUSTED_ORIGINS + SECURE_PROXY_SSL_HEADER | `5d4efa1` (2026-04-09) | feat | Recente |
| Material Symbols Rounded como sistema de ícones | `ca4dfad` (2026-04-09) | fix | Recente |
| Health check com Redis como soft dependency | `a3827a2` (2026-04-09) | fix | Recente |
| Subdomínios dash-separated para SSL | `8608d59` (2026-03-30) | fix | Recente |
| FTS via PostgreSQL (config `portuguese`) | `3e8a729` (2016-05-16) | feat | Original, ainda ativo |
| Tracking de termos populares | `226883a` (2016-06-19) | feat | Original, ainda ativo |
| Remoção de podcasts órfãos | `a7c5bd6`+ etc. (2026) | chore | Recorrente |
| Cache nas views (django-redis) | `b3d06a2` (2016-09-08) | feat | Original, depois Redis evoluiu para Celery broker |

### 4.2 Por arquivo-fonte

| Regra | Arquivo-fonte | Função/bloco |
|-------|---------------|--------------|
| R-USER-01..02 | `backend/accounts/models.py` | `UserManager.create_user` (16-30) |
| R-USER-03 | `backend/accounts/serializers.py` | `RegisterSerializer.validate_password` (53-57) |
| R-USER-04 | `backend/accounts/serializers.py` | `EmailTokenObtainPairSerializer.validate` (27-41) |
| R-USER-05..06 | `backend/accounts/permissions.py` | `IsAdminRole` (7-11), `IsEditorOrAdmin` (17-20) |
| R-USER-07 | `backend/accounts/views.py` | `UserRoleUpdateView.patch` (254-275) |
| R-USER-08 | `backend/accounts/views.py` | `UserApproveView.post` (223-236) |
| R-POD-01..04 | `backend/podcasts/services/podcast_service.py` | `PodcastService.create_podcast` (25-69) |
| R-POD-05 | `backend/podcasts/views.py` | `PodcastViewSet.create` (43-80) |
| R-POD-06 | `backend/podcasts/views.py` | `PodcastViewSet.recent` (82-93) |
| R-EPI-01..04 | `backend/podcasts/models.py` | `EpisodeManager.search` (82-118) |
| R-EPI-05..07 | `backend/podcasts/services/updater.py` | `EpisodeUpdater.populate` (15-103) |
| R-EPI-08 | `backend/podcasts/services/feed_parser.py` | `_strip_html` (14-26) |
| R-CEL-01..04 | `backend/podcasts/tasks.py` | `add_episode`, `update_base`, `update_total_episodes`, `remove_podcasts` (12-72) |
| R-AUTH-01 | `frontend/src/middleware.ts` | `middleware` (13-24) |
| R-AUTH-02..04 | `frontend/src/app/login/page.tsx` | `handleSubmit` (24-66) |
| R-AUTH-05..06 | `frontend/src/app/register/page.tsx` | `handleSubmit` (18-65) |
| R-AUTH-07..10 | `frontend/src/app/api/proxy/[...path]/route.ts` | `handleProxy` (162-208) |
| R-AUTH-11 | `frontend/src/app/api/auth/logout/route.ts` | `POST /api/auth/logout` (3-18) |
| R-AUTH-12 | `frontend/src/app/add-podcast/page.tsx` | `AddPodcastPage` (21-47) |
| R-AUTH-13 | `frontend/src/app/auth/forbidden/page.tsx` | `ROLE_LABELS` (10-14) |

### 4.3 Lacunas (🔴) que requerem validação humana

| Lacuna | Status | Resposta de Perna (2026-06-05) |
|--------|--------|-------------------------------|
| R-USER-08 (sem auditoria de aprovação) | 🔴 **Aberto** | Deveria ter log de quem aprovou — manter como melhoria conhecida. |
| R-EPI-07 (`to_json` cresce indefinidamente) | 🟡 **Resolvido (contexto)** | Herança da migração Flask→Django; provavelmente overkill hoje, mas mantido por compatibilidade. Avaliar em refactor futuro. |
| AI-4 (sem rate limit em busca) | 🔴 **Aberto** | Deveria ter rate limit com throttle por intervalo de tempo e por usuário. |
| AI-5 (logout não invalida JWT) | 🔴 **Aberto** | Deve invalidar token no logout (chamar `/api/auth/token/blacklist/`). |
| R-AUTH-12 (admin pode se auto-promover) | 🟢 **Resolvido (intencional)** | É regra de negócio — admin pode se auto-promover/rebaixar. |
| R-TS-02 (`is_recorded` sem trigger) | 🟢 **Resolvido (intencional)** | Setado manualmente, intencionalmente. Sem trigger automático. |

### 4.4 Respostas de validação (Q&A 2026-06-05)

Sessão de validação com o usuário Perna em 2026-06-05 — respostas usadas para atualizar o status das lacunas acima.

| # | Pergunta feita | Resposta de Perna | Onde foi integrada |
|---|----------------|-------------------|---------------------|
| Q1 | A aprovação de novos usuários deveria ter log de quem/quando aprovou? | "Deveria ter log de quem aprovou." | R-USER-08 marcada como gap conhecido (🔴). |
| Q2 | O `to_json` é debug ou auditoria? Pode ser limpo? | "No passado os dados eram salvos também no formato json em um campo da tabela. Talvez hoje seja overkill." | R-EPI-07 marcada como 🟡 (contexto histórico, avaliar em refactor). |
| Q3 | O endpoint de busca deveria ter throttle? Qual escopo? | "Sim deveria ter um rate limit com throttle por intervalo de tempo e usuário." | AI-4 marcado como gap conhecido (🔴). |
| Q4 | A blacklist de tokens deve ser ativada no logout? | "No logout." | AI-5 marcado como gap conhecido (🔴) — ação concreta: chamar `/api/auth/token/blacklist/`. |
| Q5 | Admin pode se auto-promover é regra de negócio ou falta validação? | "Sim admin pode se auto-promover." | AI-6 marcado como 🟢 (intencional) — não é gap. |
| Q6 | O flag `is_recorded` deveria ter trigger automático? | "Setado manualmente." | R-TS-02 marcado como 🟢 (intencional). |

**Lacunas ainda abertas após Q&A (3):**
- R-USER-08: adicionar log de auditoria em `UserApproveView.post`.
- AI-4: adicionar throttle scope `search` em `EpisodeViewSet`.
- AI-5: implementar invalidação de JWT no `POST /api/auth/logout` (chamar `/api/auth/token/blacklist/`).

**Lacunas resolvidas (3):**
- R-EPI-07: contexto histórico absorvido — não requer ação imediata.
- AI-6: auto-promoção de admin é regra de negócio — manter como está.
- R-TS-02: `is_recorded` manual é decisão consciente — manter como está.
