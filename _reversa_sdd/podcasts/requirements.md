# podcasts

> Spec gerada pelo Redator em 2026-06-05
> `doc_level` = `completo`
> Unit: app Django `podcasts/` (domínio principal: podcasts, episódios, tags, busca FTS, popularidade, sugestões)
> Granularidade: `module`

**Escala de confiança:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Visão Geral

O app `podcasts` é o **núcleo de domínio** do podigger. É responsável por agregar feeds RSS/Atom externos, normalizar episódios em um modelo relacional, oferecer busca full-text (FTS) com fallback trigrama em PostgreSQL, contabilizar termos populares, e permitir que editores/admins adicionem novos podcasts. Publica uma API REST sob `/api/` consumida pelo frontend e por integrações externas. É complementado por uma pipeline assíncrona Celery que mantém a base de episódios atualizada periodicamente.

## Responsabilidades

- Agregar feeds RSS/Atom de podcasts via `feedparser` (pull sob demanda + Celery periódico).
- Armazenar podcasts, episódios, tags, idiomas, termos populares e sugestões de tópico.
- Expor API REST para CRUD de podcasts e episódios.
- Implementar busca full-text com config `portuguese` (peso A em `title`, peso B em `description`) e fallback trigrama (`pg_trgm`, similaridade > 0.1) quando FTS não retorna resultados.
- Rastrear termos buscados em `PopularTerm` (incremento atômico por `F('times') + 1`).
- Manter `Podcast.total_episodes` atualizado via Celery (`update_total_episodes`).
- Limpar podcasts órfãos (sem episódios) via Celery (`remove_podcasts`).
- Validar feeds antes da criação (`is_valid_feed`: `bozo == 0` do feedparser).
- Idempotência: criação de podcast com `name` ou `feed` duplicado é atômica via `get_or_create` + `transaction.atomic`.
- Parsing tolerante a HTML malformado (regex `_strip_html`).
- Expor permissões RBAC: leitura pública, escrita requer editor/admin.

## Regras de Negócio

### Agregado `Podcast`

- 🟢 **R-POD-01** — `name` e `feed` são únicos e obrigatórios. Validação em `PodcastService.create_podcast`.
- 🟢 **R-POD-02** — `feed` precisa passar no `is_valid_feed` (bozo==0 do feedparser). Senão, HTTP 400 "o feed informado é inválido".
- 🟢 **R-POD-03** — Criação de podcast é atômica (race-condition safe) via `transaction.atomic` + `get_or_create`. Apenas 1 inserção vence, demais recebem `existing`.
- 🟢 **R-POD-04** — Podcast novo dispara Celery `add_episode(feed_url)` para popular episódios.
- 🟢 **R-POD-05** — Status `"none"` no response indica podcast já existente. HTTP 200 com `{id, status: "none", message}`.
- 🟢 **R-POD-06** — `recent` retorna os 6 podcasts mais recentes por `id` desc. Lista de 6 podcasts.
- 🟢 **R-POD-07** — Leitura pública de podcasts/episódios; escrita requer editor/admin (`IsEditorOrAdmin` em POST/PATCH/DELETE).
- 🟢 **R-POD-08** — Busca por `?search=` no nome do podcast usa `SearchFilter` DRF padrão.

### Agregado `Episode`

- 🟢 **R-EPI-01** — Busca usa FTS com config `portuguese`. `SearchVector(title:A, description:B)`.
- 🟢 **R-EPI-02** — Fallback Trigram quando FTS não retorna nada (`rank == 0`). `trigram__gt=0.1` com `order_by(-trigram, -published)`.
- 🟢 **R-EPI-03** — Toda busca (mesmo sem resultado) incrementa `PopularTerm`. `update` ou `create` em `PopularTerm`.
- 🟢 **R-EPI-04** — Query vazia retorna `get_queryset()` sem tracking. Early return em `search()`.
- 🟢 **R-EPI-05** — Episódio com mesmo `link` é ignorado (idempotência). Skip silencioso em `EpisodeUpdater.populate`.
- 🟢 **R-EPI-06** — Data do episódio parseada em formato RFC 2822 nos primeiros 25 chars. Em falha → log + skip.
- 🟡 **R-EPI-07** — `to_json` armazena o dict completo do parser (snapshot bruto). Sem limite de tamanho. Herança Flask→Django; mantido por compatibilidade.
- 🟡 **R-EPI-08** — HTML do `description` é stripped via regex. Não robusto para HTML malformado.
- 🟢 **R-EPI-09** — Filtro por `?podcast=<id>` filtra episódios do podcast. `Episode.objects.filter(podcast=id)`.
- 🟢 **R-EPI-10** — Falha no parse de um item não aborta o batch inteiro. Try/except em volta do item.

### Agregado `PopularTerm`

- 🟢 **R-PT-01** — Termo criado com `times=1` na primeira busca. `PopularTerm.objects.create(term=q, times=1, date_search=today)`.
- 🟢 **R-PT-02** — Termo existente incrementa `times` em 1. `update(times=models.F("times") + 1)`.
- 🟢 **R-PT-03** — Listagem pública ordenada por `-times` (mais buscados primeiro).

### Agregado `TopicSuggestion` (🔴 **Removendo — Perna 2026-06-06**)

- 🔴 **R-TS-00** — **Funcionalidade será removida.** Model `TopicSuggestion`, ViewSet, Serializer e rotas serão deletados do backend no próximo ciclo. Não implementar na reimplementação.
- 🟢 **R-TS-01** — (Até lá) Leitura pública; escrita requer editor/admin. `IsEditorOrAdmin` em POST/PATCH/DELETE.
- 🟢 **R-TS-02** — (Até lá) `is_recorded` default `False`. Flag manual, sem trigger automático.

### Agregado `Tag`

- 🟢 **R-TAG-01** — `name` único, criado on-the-fly. `Tag.objects.get_or_create(name=tag_name)`.
- 🟢 **R-TAG-02** — Associação M2M via `episode.tags.add(tag)`. M2M criado/ignorado.

### Tarefas assíncronas (Celery)

- 🟢 **R-CEL-01** — `add_episode(feed_url)` popula episódios de um feed recém-adicionado. Async via Redis broker.
- 🟢 **R-CEL-02** — `update_base` revalida todos os feeds. Periódico (Celery Beat). Encadeia `update_total_episodes` ao final.
- 🟢 **R-CEL-03** — `update_total_episodes` recalcula contadores. `Podcast.total_episodes` atualizado via `update_fields`.
- 🟢 **R-CEL-04** — `remove_podcasts` deleta podcasts sem episódios. Periódico (Celery Beat). Bulk delete via `annotate(Count).filter(num=0)`.
- 🟢 **R-CEL-05** — Falha em uma task não bloqueia as demais. Try/except dentro de `populate`.

## Requisitos Funcionais

### API REST — Podcasts

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-POD-01 | Listar podcasts com paginação DRF padrão | Must | `GET /api/podcasts/` retorna 200 com `{count, next, previous, results}`. |
| RF-POD-02 | Buscar podcasts por `?search=` no nome | Must | `GET /api/podcasts/?search=tech` retorna podcasts cujo `name` match. |
| RF-POD-03 | Criar podcast (editor/admin) com `{name, feed}` | Must | `POST /api/podcasts/` com name+feed+validação `is_valid_feed` retorna 201 com `{id, status: "created"}`. |
| RF-POD-04 | Criação de podcast duplicado (mesmo `name` ou `feed`) | Must | Retorna 200 com `{id, status: "none", message: "Podcast já existe"}`. |
| RF-POD-05 | Recuperação parcial: 6 podcasts mais recentes | Must | `GET /api/podcasts/recent/` retorna lista de 6 podcasts (id desc). |
| RF-POD-06 | Recuperação de podcast por id | Must | `GET /api/podcasts/{id}/` retorna 200 ou 404. |
| RF-POD-07 | Atualização parcial de podcast (editor/admin) | Must | `PATCH /api/podcasts/{id}/` com `{name?, feed?, image?, language?}` retorna 200. |
| RF-POD-08 | Exclusão de podcast (editor/admin) | Must | `DELETE /api/podcasts/{id}/` retorna 204. Cascade apaga episódios (CASCADE on delete). |
| RF-POD-09 | Validação de feed inválido (bozo != 0) | Must | `POST /api/podcasts/` com feed malformado retorna 400 com "o feed informado é inválido". |
| RF-POD-10 | Validação de campos obrigatórios | Must | `POST /api/podcasts/` sem `name` ou `feed` retorna 400 com "o nome e o feed são obrigatórios". |
| RF-POD-11 | Leitura pública de podcasts | Must | `GET /api/podcasts/` funciona sem autenticação. |
| RF-POD-12 | Escrita requer editor/admin | Must | `POST /api/podcasts/` como reader retorna 403. |

### API REST — Episodes

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-EPI-01 | Listar episódios com paginação DRF | Must | `GET /api/episodes/` retorna `{count, next, previous, results}`. |
| RF-EPI-02 | Buscar episódios por `?q=` com FTS+trigrama | Must | `GET /api/episodes/?q=python` retorna episódios ranqueados por FTS. |
| RF-EPI-03 | Fallback trigrama quando FTS vazio | Must | Query com FTS rank=0 retorna via trigrama (`order_by(-trigram, -published)`). |
| RF-EPI-04 | Filtro por `?podcast=<id>` | Must | `GET /api/episodes/?podcast=5` retorna apenas episódios do podcast 5. |
| RF-EPI-05 | Tracking de termo em toda busca | Must | `GET /api/episodes/?q=foo` (mesmo sem resultado) cria/incrementa `PopularTerm(term='foo')`. |
| RF-EPI-06 | Query vazia sem tracking | Must | `GET /api/episodes/` (sem `q`) retorna queryset sem criar `PopularTerm`. |
| RF-EPI-07 | Recuperação de episódio por id | Must | `GET /api/episodes/{id}/` retorna 200 ou 404. |
| RF-EPI-08 | Leitura pública de episódios | Must | `GET /api/episodes/` funciona sem autenticação. |
| RF-EPI-09 | Criação/edição manual de episódio (admin) | Could | `POST /api/episodes/` requer editor/admin. Em prática, episódios são criados via Celery; criação manual é para correções. |
| RF-EPI-10 | Throttle scope `search` em `EpisodeViewSet` (AI-4) | Should | `throttle_scope = "search"` com `search: 30/min` para anônimo. Implementar conforme decisão Perna 2026-06-06. |

### API REST — Topic Suggestions (🔴 Removendo)

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-TS-00 | 🔴 **Remover funcionalidade** (Perna 2026-06-06) | Won't | Deletar model `TopicSuggestion`, ViewSet, Serializer, URLs. Migration de remoção no próximo ciclo. |
| RF-TS-01 | Listar sugestões de tópico | Won't (até remoção) | `GET /api/topic-suggestions/` retorna lista paginada. |
| RF-TS-02 | Criar sugestão (editor/admin) | Won't (até remoção) | `POST /api/topic-suggestions/` com `{title, description?}` retorna 201. |
| RF-TS-03 | Marcar sugestão como gravada (editor/admin) | Won't (até remoção) | `PATCH /api/topic-suggestions/{id}/` com `{is_recorded: true}` retorna 200. |
| RF-TS-04 | Leitura pública; escrita requer editor/admin | Won't (até remoção) | `GET` é público; `POST/PATCH/DELETE` requer editor/admin. |
| RF-TS-05 | `is_recorded` é flag manual, sem trigger automático | Won't (até remoção) | Nenhum signal cria episódio a partir de sugestão. (Decisão consciente.) |

### API REST — Popular Terms

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-PT-01 | Listar termos populares | Must | `GET /api/popular-terms/` retorna lista ordenada por `-times`. |
| RF-PT-02 | Leitura pública | Must | Não requer autenticação. |
| RF-PT-03 | Termo criado/incrementado em cada busca | Must | `update_or_create(term=q, defaults={times: F+1})`. |

### Pipeline assíncrona (Celery)

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-CEL-01 | `add_episode(feed_url)` popula episódios | Must | Task enfileirada na criação de podcast; roda em Celery worker. |
| RF-CEL-02 | `update_base` revalida todos os feeds | Must | Task periódica (Celery Beat). Para cada podcast, parseia feed, atualiza episódios. |
| RF-CEL-03 | `update_total_episodes` recalcula contadores | Must | Encadeado após `update_base`. `Podcast.total_episodes = count(episodes)`. |
| RF-CEL-04 | `remove_podcasts` deleta podcasts órfãos | Must | Task periódica. `Podcast.objects.annotate(num=Count('episode')).filter(num=0).delete()`. |
| RF-CEL-05 | Falha em task não bloqueia as demais | Must | Try/except em cada item; log + skip. |
| RF-CEL-06 | Idempotência: episódio com mesmo `link` é ignorado | Must | `Episode.link` é UNIQUE. `EpisodeUpdater.populate` faz skip silencioso. |
| RF-CEL-07 | Health check tolera Redis indisponível | Should | `health_check` retorna 200 mesmo com Redis fora (ADR-004). |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência no código | Confiança |
|------|--------------------|---------------------|-----------|
| Performance | Busca FTS com índice GIN em `SearchVector` | `migrations/0003_add_search_index.py` | 🟢 |
| Performance | Busca trigrama com índice GIN em `pg_trgm` | `migrations/0002_enable_pg_trgm.py` | 🟢 |
| Performance | Paginação DRF padrão (PageNumberPagination) | `views.py:paginate_queryset` (DRF default) | 🟢 |
| Performance | `update_or_create` em `PopularTerm` é O(1) com índice em `term` | `models.py:PopularTerm.term` (db_index=True) | 🟢 |
| Performance | `annotate(Count)` em `remove_podcasts` evita N+1 | `tasks.py:remove_podcasts` | 🟢 |
| Escalabilidade | Processamento assíncrono desacopla latência de criação de podcast | `tasks.py:add_episode` | 🟢 |
| Escalabilidade | Cache django-redis disponível (não usado ativamente para podcasts/episódios) | `config/settings.py:CACHES` | 🟡 |
| Disponibilidade | Health check tolera Redis degradado (soft dependency) | `podcasts/health.py` + ADR-004 | 🟢 |
| Disponibilidade | Tasks periódicas garantem consistência eventual | `tasks.py:update_base`, `remove_podcasts` | 🟢 |
| Segurança | Leitura pública não requer autenticação | `views.py:get_permissions` | 🟢 |
| Segurança | Escrita requer `IsEditorOrAdmin` | `views.py:get_permissions` | 🟢 |
| Segurança | Idempotência via UNIQUE em `link` mitiga duplicação em re-runs | `models.py:Episode.link` (unique=True) | 🟢 |
| Segurança | Atomicidade em `create_podcast` mitiga race conditions | `services/podcast_service.py:transaction.atomic` | 🟢 |
| Confiabilidade | `to_json` (snapshot bruto) é o "audit trail" do que o parser viu | `models.py:Episode.to_json` | 🟡 (herança) |
| Manutenibilidade | Service layer isolada em `services/` | `services/feed_parser.py`, `updater.py`, `podcast_service.py` | 🟢 |
| Manutenibilidade | Custom manager `EpisodeManager` encapsula busca | `models.py:EpisodeManager.search` | 🟢 |
| Manutenibilidade | ViewSets por agregado (4 routers) | `urls.py:router.register` | 🟢 |
| Auditoria | **Sem** log estruturado de criação/edição de podcasts | `views.py:PodcastViewSet.create` | 🟡 |
| Internacionalização | Mensagens de erro em PT-BR | `services/podcast_service.py:25-37` | 🟢 |
| Performance | **Ausência** de throttle em busca de episódios (AI-4) | `views.py:EpisodeViewSet` | 🔴 gap |

## Critérios de Aceitação

```gherkin
# Criar podcast (happy path)
Dado que sou editor/admin autenticado
E o feed "https://exemplo.com/rss" é válido (bozo==0)
E o nome "Tecnologia Hoje" não existe
Quando POST /api/podcasts/ com {name: "Tecnologia Hoje", feed: "https://exemplo.com/rss"}
Então o status é 201
E o body contém {id: <n>, status: "created"}
E uma task Celery add_episode é enfileirada

# Criar podcast duplicado
Dado que existe podcast com feed "https://exemplo.com/rss"
Quando POST /api/podcasts/ com mesmo feed
Então o status é 200
E o body contém {id: <existente>, status: "none", message: "Podcast já existe"}

# Criar podcast com feed inválido
Dado que o feed "https://invalido.com/rss" retorna bozo!=0
Quando POST /api/podcasts/ com esse feed
Então o status é 400
E o body contém "o feed informado é inválido"

# Criar podcast sem autenticação/role insuficiente
Quando POST /api/podcasts/ como reader
Então o status é 403

# Buscar episódios (FTS)
Dado que existem episódios com title/description contendo "python"
Quando GET /api/episodes/?q=python
Então o status é 200
E o body é uma lista ranqueada por SearchRank
E o termo "python" foi criado/incrementado em PopularTerm

# Buscar episódios (FTS vazio, trigrama pega)
Dado que existe episódio com title "JavaScript Avançado" mas query "javascrpt" (typo)
Quando GET /api/episodes/?q=javascrpt
Então o status é 200
E o body usa fallback trigrama (trigram__gt=0.1, order_by(-trigram, -published))

# Buscar episódios (query vazia)
Quando GET /api/episodes/ (sem ?q)
Então o status é 200
E o body é o queryset padrão ordenado
E nenhum PopularTerm foi criado

# Filtrar episódios por podcast
Dado que existem 10 episódios do podcast 5
Quando GET /api/episodes/?podcast=5
Então o status é 200
E o body contém apenas episódios do podcast 5

# Atualizar podcast
Dado que sou editor/admin e existe podcast 5
Quando PATCH /api/podcasts/5/ com {image: "/static/img/new.png"}
Então o status é 200
E o body reflete o campo atualizado

# Atualizar podcast como reader
Quando PATCH /api/podcasts/5/ como reader
Então o status é 403

# Deletar podcast
Dado que sou editor/admin e existe podcast 5 com 10 episódios
Quando DELETE /api/podcasts/5/
Então o status é 204
E os 10 episódios foram removidos (CASCADE)

# TopicSuggestion (🔴 Removendo — Perna 2026-06-06)
Dado que sou editor/admin
Quando POST /api/topic-suggestions/ com {title: "Serverless", description: "..."}
Então o status é 201
E is_recorded=False (default)

# Popular terms
Dado que busquei "python" 5 vezes e "rust" 2 vezes
Quando GET /api/popular-terms/
Então o status é 200
E o body tem "python" primeiro (times=5), depois "rust" (times=2)

# Pipeline assíncrona
Dado que Celery worker está rodando
E existe podcast recém-criado
Quando add_episode.delay(feed) é chamado
Então em segundos, os episódios aparecem no banco

# update_base (periódico)
Dado que existe podcast com feed atualizado (novo episódio)
Quando Celery Beat dispara update_base
Então o novo episódio é criado (idempotente para os antigos)

# remove_podcasts (periódico)
Dado que existe podcast sem episódios (feed removido pelo autor)
Quando Celery Beat dispara remove_podcasts
Então o podcast é deletado

# Health check (Redis fora)
Dado que Redis está indisponível
Quando GET /health/
Então o status é 200 (soft dependency)
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Criação/listagem de podcasts | Must | Caminho crítico; produto principal |
| Busca FTS com fallback trigrama | Must | Diferencial do produto (busca por conteúdo) |
| Tracking de PopularTerm | Must | Métrica de produto |
| TopicSuggestion CRUD | **Won't (removendo)** | Decisão Perna 2026-06-06: remover do backend |
| Popular terms listing | Must | Feature visível (home) |
| Pipeline assíncrona (4 tasks) | Must | Mantém base atualizada sem interação manual |
| Idempotência de criação | Must | Mitiga race conditions e re-runs |
| Validação de feed | Must | Previne podcasts "fantasma" |
| Throttle em busca (AI-4) | Should | Mitiga abuso; gap conhecido |
| Marcar sugestão como gravada | Should | Operacional; feito manualmente |
| Criação manual de episódio | Could | Raramente usado; correção pontual |
| `to_json` (snapshot bruto) | Won't (gap) | DT-1: herança, mantido por compatibilidade |
| Auditoria de criação/edição de podcast | Won't (gap) | R-POD sem auditoria explícita |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---------|-----------------|-----------|
| `backend/podcasts/models.py:BaseModel` | Base abstrata (created_at, updated_at) | 🟢 |
| `backend/podcasts/models.py:PodcastLanguage` | Idioma (code, name) | 🟢 |
| `backend/podcasts/models.py:Podcast` | Modelo principal | 🟢 |
| `backend/podcasts/models.py:Tag` | Tag (unique) | 🟢 |
| `backend/podcasts/models.py:Episode` | Episódio | 🟢 |
| `backend/podcasts/models.py:82-118` | `EpisodeManager.search` (FTS+trigrama) (R-EPI-01..04) | 🟢 |
| `backend/podcasts/models.py:PopularTerm` | Termo popular (R-PT-01..02) | 🟢 |
| `backend/podcasts/models.py:TopicSuggestion` | Sugestão de tópico (R-TS-01..02) | 🟢 |
| `backend/podcasts/views.py:PodcastViewSet` | CRUD de podcast (RF-POD-01..12) | 🟢 |
| `backend/podcasts/views.py:43-80` | `PodcastViewSet.create` (R-POD-01..05) | 🟢 |
| `backend/podcasts/views.py:82-93` | `PodcastViewSet.recent` (R-POD-06) | 🟢 |
| `backend/podcasts/views.py:EpisodeViewSet` | CRUD de episódio + search | 🟢 |
| `backend/podcasts/views.py:107-123` | `EpisodeViewSet.get_queryset` (RF-EPI-04) | 🟢 |
| `backend/podcasts/views.py:TopicSuggestionViewSet` | CRUD de sugestão | 🟢 |
| `backend/podcasts/views.py:PopularTermViewSet` | Listagem de termos | 🟢 |
| `backend/podcasts/serializers.py` | Serializers de todos os modelos | 🟢 |
| `backend/podcasts/urls.py` | Router com 4 ViewSets | 🟢 |
| `backend/podcasts/services/feed_parser.py` | `is_valid_feed`, `_strip_html` | 🟢 |
| `backend/podcasts/services/feed_parser.py:14-26` | `_strip_html` (R-EPI-08) | 🟡 |
| `backend/podcasts/services/feed_parser.py:117-132` | `is_valid_feed` (R-POD-02) | 🟢 |
| `backend/podcasts/services/podcast_service.py` | `PodcastService.create_podcast` | 🟢 |
| `backend/podcasts/services/podcast_service.py:25-69` | `create_podcast` (R-POD-01..04) | 🟢 |
| `backend/podcasts/services/updater.py` | `EpisodeUpdater.populate` | 🟢 |
| `backend/podcasts/services/updater.py:15-103` | `populate` (R-EPI-05..10, R-TAG-01..02) | 🟢 |
| `backend/podcasts/tasks.py:12-22` | `add_episode` (R-CEL-01) | 🟢 |
| `backend/podcasts/tasks.py:25-40` | `update_base` (R-CEL-02) | 🟢 |
| `backend/podcasts/tasks.py:43-52` | `update_total_episodes` (R-CEL-03) | 🟢 |
| `backend/podcasts/tasks.py:55-72` | `remove_podcasts` (R-CEL-04) | 🟢 |
| `backend/podcasts/health.py` | `health_check` (DB+Redis soft) | 🟢 |
| `backend/podcasts/migrations/0002_enable_pg_trgm.py` | Habilita `pg_trgm` | 🟢 |
| `backend/podcasts/migrations/0003_add_search_index.py` | Índice FTS (portuguese) | 🟢 |
| `backend/podcasts/migrations/0004_alter_popularterm_date_search.py` | Altera `date_search` | 🟢 |
| `backend/podcasts/management/commands/` | Comandos CLI (seed, clear, remove_fixture) | 🟢 |
| `backend/podcasts/fixtures/initial_fake_seed.json` | Seed inicial | 🟢 |
| `backend/podcasts/tests/` | 8 arquivos de teste | 🟢 |
| `frontend/src/lib/api.ts` | `fetchEpisodes`, `fetchPodcasts`, `addPodcast` | 🟢 |
| `frontend/src/components/home/HomeClient.tsx` | Consome `fetchEpisodes`+`fetchPodcasts` | 🟢 |
| `frontend/src/components/home/EpisodeList.tsx` | Lista paginada | 🟢 |
| `frontend/src/components/podcasts/PodcastCard.tsx` | Card | 🟢 |
| `frontend/src/app/add-podcast/page.tsx` | UI de adição de podcast | 🟢 |
| `_reversa_sdd/adrs/003-postgresql-fts-trigram.md` | FTS + trigrama | 🟢 |
| `_reversa_sdd/adrs/004-redis-soft-dependency.md` | Redis soft | 🟢 |
| `_reversa_sdd/adrs/005-celery-pipeline.md` | Pipeline assíncrona | 🟢 |
| `_reversa_sdd/adrs/009-topic-suggestion-separate-model.md` | TopicSuggestion como model separado | 🟢 |
