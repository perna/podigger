# podcasts, Tarefas de Implementação

> Spec gerada pelo Redator em 2026-06-05
> `doc_level` = `completo`
> Tarefas para reimplementar a unit `podcasts` a partir do código legado, com rastreabilidade.

**Escala de confiança:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Pré-requisitos

- [ ] Django 5.2+ com app `podcasts` em `INSTALLED_APPS`
- [ ] PostgreSQL 15 com extensão `pg_trgm` habilitada (Django não habilita automaticamente — `CREATE EXTENSION` em migration ou psql)
- [ ] `djangorestframework` 3.16+ configurado
- [ ] `django-filter` 23.2+ instalado
- [ ] `feedparser` 6.0+ instalado
- [ ] `requests` 2.31+ instalado
- [ ] `Celery 5.5+` + `Redis 7+` configurados (broker + result backend)
- [ ] Permission `IsEditorOrAdmin` de `accounts.permissions` acessível
- [ ] Variáveis `DATABASE_URL`, `REDIS_URL`, `CELERY_BROKER_URL` configuradas
- [ ] FTS em português requer config `portuguese` do Postgres (default em imagens dockerizadas com locale `pt_BR`)
- [ ] Frontend: `frontend/src/lib/api.ts` com `fetchEpisodes`, `fetchPodcasts`, `addPodcast`
- [ ] Unit `accounts` (User, IsEditorOrAdmin) implementada

## Tarefas

### Models

- [ ] **T-01**, Definir `BaseModel` abstrato
  - Origem no legado: `backend/podcasts/models.py:BaseModel`
  - Critério de pronto: classe abstrata com `created_at` (DateTimeField, `auto_now_add=False, default=timezone.now`) e `updated_at` (DateTimeField, `auto_now=True`).
  - Confiança: 🟢

- [ ] **T-02**, Definir `PodcastLanguage`
  - Origem no legado: `backend/podcasts/models.py:PodcastLanguage`
  - Critério de pronto: `code = CharField(10, default="pt")`, `name = CharField(60, default="português")`. `__str__` retorna `name`.
  - Confiança: 🟢

- [ ] **T-03**, Definir `Podcast`
  - Origem no legado: `backend/podcasts/models.py:Podcast`
  - Critério de pronto: herda de `BaseModel`; `name = CharField(128, unique=True)`; `feed = URLField(unique=True)`; `image = CharField(255, default="/static/dist/img/podcast-banner.png")`; `language = ForeignKey(PodcastLanguage, on_delete=SET_NULL, null=True, blank=True)`; `total_episodes = IntegerField(default=0)`. `__str__` retorna `name`.
  - Confiança: 🟢

- [ ] **T-04**, Definir `Tag`
  - Origem no legado: `backend/podcasts/models.py:Tag`
  - Critério de pronto: `name = CharField(255, unique=True)`. `__str__` retorna `name`.
  - Confiança: 🟢

- [ ] **T-05**, Definir `Episode`
  - Origem no legado: `backend/podcasts/models.py:Episode`
  - Critério de pronto: herda de `BaseModel`; `title = CharField(1024)`; `link = URLField(unique=True)`; `description = TextField(null=True, blank=True)`; `published = DateTimeField(null=True, blank=True)`; `enclosure = CharField(1024, null=True, blank=True)`; `to_json = JSONField(null=True, blank=True)`; `podcast = ForeignKey(Podcast, on_delete=CASCADE, related_name="episodes")`; `tags = ManyToManyField(Tag, blank=True)`. `objects = EpisodeManager()`. `__str__` retorna `title[:50]`.
  - Confiança: 🟢

- [ ] **T-06**, Definir `EpisodeManager` com `search`
  - Origem no legado: `backend/podcasts/models.py:82-118`
  - Critério de pronto: herda de `models.Manager`; `search(query)` implementa:
    - Early return `get_queryset()` se `not query` (R-EPI-04).
    - `_track_popular_term(query)` sempre que query não-vazia (R-EPI-03).
    - FTS: `annotate(rank=SearchRank(SearchVector('title', weight='A') + SearchVector('description', weight='B'), SearchQuery(q, search_type='websearch')))`, `filter(rank__gt=0)`, `order_by('-rank', '-published')`.
    - Se `qs.exists()`: retorna.
    - Fallback trigrama: `annotate(trigram=TrigramSimilarity('title', q))`, `filter(trigram__gt=0.1)`, `order_by('-trigram', '-published')`.
  - Confiança: 🟢

- [ ] **T-07**, Definir `PopularTerm`
  - Origem no legado: `backend/podcasts/models.py:PopularTerm`
  - Critério de pronto: `term = CharField(255, db_index=True)`; `times = IntegerField(default=1)`; `date_search = DateField(default=timezone.now)`. `__str__` retorna `f"{term} ({times})"`. `class Meta: ordering = ['-times']`.
  - Confiança: 🟢

- [ ] **T-08**, Definir `TopicSuggestion` (🔴 **Removendo — Perna 2026-06-06**)
  - ⚠️ **Decisão:** model será deletado. Não implementar na reimplementação. Migration de remoção no próximo ciclo.
  - Origem no legado: `backend/podcasts/models.py:TopicSuggestion`
  - Critério de pronto: (até lá) herda de `BaseModel`; `title = CharField(255, db_index=True)`; `description = TextField(null=True, blank=True)`; `is_recorded = BooleanField(default=False)`. `__str__` retorna `title`.
  - Confiança: 🟢

### Migrations

- [ ] **T-09**, Migration inicial
  - Origem no legado: `backend/podcasts/migrations/0001_initial.py`
  - Critério de pronto: cria todas as tabelas do app com UNIQUE constraints em `Podcast.name`, `Podcast.feed`, `Episode.link`, `Tag.name`; FKs com `on_delete` corretos; índice em `PopularTerm.term` e `TopicSuggestion.title` (até ser removido).
  - Confiança: 🟢

- [ ] **T-10**, Habilitar `pg_trgm`
  - Origem no legado: `backend/podcasts/migrations/0002_enable_pg_trgm.py`
  - Critério de pronto: `RunSQL("CREATE EXTENSION IF NOT EXISTS pg_trgm;")` em `dependencies=[("podcasts", "0001_initial")]`. **Atenção:** requer permissão de superuser no DB; rodar como `postgres` ou equivalente.
  - Confiança: 🟢

- [ ] **T-11**, Adicionar índice FTS
  - Origem no legado: `backend/podcasts/migrations/0003_add_search_index.py`
  - Critério de pronto: cria índice GIN em `SearchVector(ToStringCoalesce(title), weight='A') + SearchVector(ToStringCoalesce(description), weight='B')` com config `'portuguese'`. Ou equivalentemente `AddIndex` com `models.Index(fields=[...], name='fts_idx')` após `RunSQL` para definir o vector.
  - Confiança: 🟢

- [ ] **T-12**, Alterar `date_search` de `PopularTerm`
  - Origem no legado: `backend/podcasts/migrations/0004_alter_popularterm_date_search.py`
  - Critério de pronto: migration com `AlterField` mudando default ou tipo de `date_search`. Espelhar o que o legado fez (verificar diff exato).
  - Confiança: 🟡 (não examinado em detalhe)

### Service layer

- [ ] **T-13**, Implementar `is_valid_feed` e `_strip_html` em `feed_parser.py`
  - Origem no legado: `backend/podcasts/services/feed_parser.py:14-132`
  - Critério de pronto: `is_valid_feed(feed_url) -> bool` chama `feedparser.parse(feed_url)` e retorna `parsed.bozo == 0`. `_strip_html(html) -> str` aplica regex `<[^>]+>` para remover tags. Função pode incluir `parse_feed(feed_url)` que retorna o `FeedParserDict` cru.
  - Confiança: 🟢

- [ ] **T-14**, Implementar `PodcastService.create_podcast`
  - Origem no legado: `backend/podcasts/services/podcast_service.py:25-69`
  - Critério de pronto: método estático ou de classe `create_podcast(name, feed, image=None, language=None)` que:
    1. Valida `name` e `feed` não-vazios (R-POD-01) — lança `ValidationError` com mensagem PT-BR.
    2. Chama `is_valid_feed(feed)` (R-POD-02) — lança `ValidationError` se False.
    3. `with transaction.atomic():` (R-POD-03) — `podcast, created = Podcast.objects.get_or_create(name=name, feed=feed, defaults={"image": image, "language": language})`.
    4. Se `not created`: retorna `{"id": podcast.id, "status": "none", "message": "Podcast já existe"}` (R-POD-05).
    5. Se criado: enfileira `add_episode.delay(feed)` (R-POD-04) — idealmente após a transação, mas tolerar dentro.
    6. Retorna `{"id": podcast.id, "status": "created"}`.
  - Confiança: 🟢

- [ ] **T-15**, Implementar `EpisodeUpdater.populate`
  - Origem no legado: `backend/podcasts/services/updater.py:15-103`
  - Critério de pronto: classe `EpisodeUpdater` com método `populate(self, feed_url) -> int`:
    - `parsed = parse_feed(feed_url)`.
    - Itera `parsed.entries`.
    - Em try/except (R-EPI-10, R-CEL-05):
      1. Skip se `Episode.objects.filter(link=link).exists()` (R-EPI-05).
      2. Parse `published` RFC 2822 (R-EPI-06) — primeiros 25 chars, try/except ValueError.
      3. Strip HTML de `description` (R-EPI-08).
      4. Para cada tag em `item.tags`, `Tag.objects.get_or_create(name=tag_name)` (R-TAG-01).
      5. Cria `Episode` com `to_json=dict(item)` (R-EPI-07).
      6. `episode.tags.set(tags)` (R-TAG-02).
      7. Incrementa contador.
    - Retorna `created_count`.
  - Confiança: 🟢

### Celery tasks

- [ ] **T-16**, Implementar `add_episode` task
  - Origem no legado: `backend/podcasts/tasks.py:12-22`
  - Critério de pronto: `@shared_task def add_episode(feed_url) -> int` chama `EpisodeUpdater().populate(feed_url)`. Trigger: `PodcastService.create_podcast` enfileira `.delay(feed)`.
  - Confiança: 🟢

- [ ] **T-17**, Implementar `update_base` task
  - Origem no legado: `backend/podcasts/tasks.py:25-40`
  - Critério de pronto: `@shared_task def update_base()` itera `Podcast.objects.all()`; em try/except por podcast (R-CEL-05), chama `add_episode(podcast.feed)`; encadeia `update_total_episodes.delay()` ao final.
  - Confiança: 🟢

- [ ] **T-18**, Implementar `update_total_episodes` task
  - Origem no legado: `backend/podcasts/tasks.py:43-52`
  - Critério de pronto: `@shared_task def update_total_episodes()` itera `Podcast.objects.all()`; para cada um, `count = podcast.episode_set.count()`; se diferente, `podcast.total_episodes = count; podcast.save(update_fields=["total_episodes"])`.
  - Confiança: 🟢

- [ ] **T-19**, Implementar `remove_podcasts` task
  - Origem no legado: `backend/podcasts/tasks.py:55-72`
  - Critério de pronto: `@shared_task def remove_podcasts() -> int` faz `Podcast.objects.annotate(num=Count("episode")).filter(num=0).delete()`; retorna count deletado.
  - Confiança: 🟢

- [ ] **T-20**, Configurar Celery Beat
  - Origem no legado: `config/celery.py` (app Celery)
  - Critério de pronto: `app.conf.beat_schedule = {...}` inclui `update_base` e `remove_podcasts` com periodicidade adequada (ex: a cada 6h e 24h, respectivamente). Em dev, sem Beat (tasks são disparadas manualmente).
  - Confiança: 🟡 (frequência específica não foi confirmada no legado)

### Health check

- [ ] **T-21**, Implementar `health_check`
  - Origem no legado: `backend/podcasts/health.py`
  - Critério de pronto: função `health_check(request)` que:
    - DB: `from django.db import connection; connection.cursor().execute("SELECT 1")`. Se falhar, `db_ok = False`.
    - Redis: `from django.core.cache import cache; cache.set("__health__", 1, 1)` em try/except. `redis_ok = True/False`. **Engolir exception** (ADR-004, soft dependency).
    - Se `db_ok`: retorna 200 com `{"status": "healthy", "db": True, "redis": redis_ok, "timestamp": now, "environment": settings.ENVIRONMENT}`.
    - Senão: retorna 503.
  - Confiança: 🟢

### ViewSets (Controllers)

- [ ] **T-22**, Implementar `PodcastViewSet`
  - Origem no legado: `backend/podcasts/views.py:PodcastViewSet`
  - Critério de pronto: herda de `ModelViewSet`; `queryset = Podcast.objects.all()`; `serializer_class = PodcastSerializer`; `filter_backends = [DjangoFilterBackend, SearchFilter]`; `search_fields = ["name"]` (R-POD-08); `get_permissions` retorna `[IsEditorOrAdmin]` para POST/PATCH/DELETE e `[]` para GET (R-POD-07). Custom action `@action(detail=False, methods=["get"]) def recent` retorna 6 podcasts mais recentes (R-POD-06). `create(self, request, *args, **kwargs)` chama `PodcastService.create_podcast(**serializer.initial_data)` (R-POD-01..05).
  - Confiança: 🟢

- [ ] **T-23**, Implementar `EpisodeViewSet`
  - Origem no legado: `backend/podcasts/views.py:EpisodeViewSet`
  - Critério de pronto: herda de `ModelViewSet`; `serializer_class = EpisodeSerializer`; `get_queryset()`:
    - Se `?podcast=` no query: `Episode.objects.filter(podcast=...)` (R-EPI-09).
    - Se `?q=`: `Episode.objects.search(q)` (R-EPI-01..04).
    - Senão: `Episode.objects.all()` ordenado por `-published`.
  - `get_permissions` retorna `[IsEditorOrAdmin]` para escrita; leitura pública. **Não** tem throttle `search` (AI-4 — ver T-EXT-01).
  - Confiança: 🟢

- [ ] **T-24**, Implementar `TopicSuggestionViewSet` (🔴 **Removendo — Perna 2026-06-06**)
  - Origem no legado: `backend/podcasts/views.py:TopicSuggestionViewSet:126-137`
  - ⚠️ **Decisão:** viewset será deletado. Não implementar na reimplementação.
  - Critério de pronto: (até lá) herda de `ModelViewSet`; `queryset = TopicSuggestion.objects.all()`; `serializer_class = TopicSuggestionSerializer`; `get_permissions` retorna `[IsEditorOrAdmin]` para POST/PATCH/DELETE; leitura pública (R-TS-01).
  - Confiança: 🟢

- [ ] **T-25**, Implementar `PopularTermViewSet`
  - Origem no legado: `backend/podcasts/views.py:PopularTermViewSet:139-143`
  - Critério de pronto: herda de `ReadOnlyModelViewSet`; `queryset = PopularTerm.objects.all().order_by("-times")`; `serializer_class = PopularTermSerializer`; `permission_classes = [AllowAny]`.
  - Confiança: 🟢

### Serializers

- [ ] **T-26**, Implementar `PodcastSerializer`
  - Origem no legado: `backend/podcasts/serializers.py`
  - Critério de pronto: `ModelSerializer` com `class Meta: model = Podcast; fields = ["id", "name", "feed", "image", "language", "total_episodes", "created_at"]`.
  - Confiança: 🟢

- [ ] **T-27**, Implementar `EpisodeSerializer`
  - Origem no legado: `backend/podcasts/serializers.py`
  - Critério de pronto: `ModelSerializer` com `class Meta: model = Episode; fields = ["id", "title", "link", "description", "published", "enclosure", "podcast", "tags", "created_at"]`. Nested `podcast` (apenas `id`, `name`, `image`). Nested `tags` (apenas `id`, `name`).
  - Confiança: 🟢

- [ ] **T-28**, Implementar `TopicSuggestionSerializer` (🔴 **Removendo — Perna 2026-06-06**)
  - ⚠️ **Decisão:** serializer será deletado. Não implementar na reimplementação.
  - Origem no legado: `backend/podcasts/serializers.py`
  - Critério de pronto: (até lá) `ModelSerializer` com `fields = ["id", "title", "description", "is_recorded", "created_at"]`.
  - Confiança: 🟢

- [ ] **T-29**, Implementar `PopularTermSerializer`
  - Origem no legado: `backend/podcasts/serializers.py`
  - Critério de pronto: `ModelSerializer` com `fields = ["id", "term", "times", "date_search"]`.
  - Confiança: 🟢

### Roteamento

- [ ] **T-30**, Configurar `podcasts/urls.py`
  - Origem no legado: `backend/podcasts/urls.py`
  - Critério de pronto: `router = routers.DefaultRouter()`; registrar `podcasts`, `episodes`, `popular-terms` (topic-suggestions não será implementado — removendo); `urlpatterns = [path("", include(router.urls))]`. Incluído em `config/urls.py` via `path("api/", include("podcasts.urls"))`.
  - Confiança: 🟢

### Health endpoint

- [ ] **T-31**, Expor `health_check` em `/health/`
  - Origem no legado: `backend/config/urls.py:10`
  - Critério de pronto: `path("health/", health_check, name="health_check")` em `config/urls.py`.
  - Confiança: 🟢

### Fixtures e management commands

- [ ] **T-32**, Fixture de seed inicial
  - Origem no legado: `backend/podcasts/fixtures/initial_fake_seed.json`
  - Critério de pronto: JSON com podcasts de exemplo para dev/staging. Carregável via `python manage.py loaddata`.
  - Confiança: 🟢

- [ ] **T-33**, Management command `seed` / `clear` / `remove_fixture`
  - Origem no legado: `backend/podcasts/management/commands/`
  - Critério de pronto: comandos CLI para popular/limpar dados.
  - Confiança: 🟢

## Tarefas de Teste

- [ ] **TT-01**, Teste de criação de podcast feliz
  - Origem: `backend/podcasts/tests/test_create_podcast.py`
  - Cenário: editor cria podcast com feed válido → 201; Celery mockado verifica enqueue.
  - Confiança: 🟢

- [ ] **TT-02**, Teste de criação duplicada
  - Cenário: 2ª criação com mesmo feed → 200, status="none".
  - Confiança: 🟢

- [ ] **TT-03**, Teste de feed inválido
  - Cenário: feed com bozo != 0 → 400 com "o feed informado é inválido".
  - Confiança: 🟢

- [ ] **TT-04**, Teste de permissão de escrita
  - Cenário: reader tenta criar → 403.
  - Confiança: 🟢

- [ ] **TT-05**, Teste de busca FTS
  - Cenário: 5 episódios com "python" no title; query "python" → retorna todos, ranqueados.
  - Confiança: 🟢

- [ ] **TT-06**, Teste de fallback trigrama
  - Cenário: query "javascrpt" (typo) → FTS vazio, trigrama retorna episódio com "JavaScript".
  - Confiança: 🟢

- [ ] **TT-07**, Teste de tracking de PopularTerm
  - Cenário: 3 buscas do mesmo termo no dia → `times=3` no `PopularTerm`.
  - Confiança: 🟢

- [ ] **TT-08**, Teste de query vazia
  - Cenário: `GET /api/episodes/` (sem `?q`) → sem `PopularTerm` criado.
  - Confiança: 🟢

- [ ] **TT-09**, Teste de filtro por podcast
  - Cenário: `?podcast=5` → apenas episódios do podcast 5.
  - Confiança: 🟢

- [ ] **TT-10**, Teste de `recent` (custom action)
  - Cenário: `GET /api/podcasts/recent/` → 6 podcasts (id desc).
  - Confiança: 🟢

- [ ] **TT-11**, Teste idempotente de `EpisodeUpdater.populate`
  - Cenário: rodar populate 2x com mesmo feed → 2ª execução não cria duplicatas.
  - Confiança: 🟢

- [ ] **TT-12**, Teste de tolerância a item malformado
  - Cenário: feed com 5 items, 1º malformado → restantes são criados; `created_count=4`.
  - Confiança: 🟢

- [ ] **TT-13**, Teste de data RFC 2822 inválida
  - Cenário: item com data "invalid" → log + skip, episódio criado com `published=None`.
  - Confiança: 🟢

- [ ] **TT-14**, Teste de `update_total_episodes`
  - Cenário: podcast com `total_episodes=0` mas 5 episódios no banco → após task, `total_episodes=5`.
  - Confiança: 🟢

- [ ] **TT-15**, Teste de `remove_podcasts`
  - Cenário: podcast sem episódios (após feed inválido) → após task, deletado.
  - Confiança: 🟢

- [ ] **TT-16**, Teste de `add_episode` task
  - Cenário: Celery task roda em worker de teste; popula episódios.
  - Confiança: 🟢

- [ ] **TT-17**, Teste de `health_check` com DB up
  - Cenário: DB ping OK, Redis up → 200 com `db:true, redis:true`.
  - Confiança: 🟢

- [ ] **TT-18**, Teste de `health_check` com Redis down (soft)
  - Cenário: Redis indisponível → 200 com `redis:false` (não 503).
  - Confiança: 🟢

- [ ] **TT-19**, Teste de TopicSuggestion CRUD (🔴 **Removendo — Perna 2026-06-06**)
  - ⚠️ **Decisão:** testes associados serão removidos junto com a funcionalidade.
  - Origens: `backend/podcasts/tests/test_api.py` (presumido)
  - Cenários: criar como editor, listar como reader, criar sem auth → 201/200/401.
  - Confiança: 🟢

- [ ] **TT-20**, Teste de cascade delete
  - Cenário: deletar podcast com 10 episódios → episódios também deletados.
  - Confiança: 🟢

- [ ] **TT-21**, Teste property-based de FTS
  - Origem: `backend/podcasts/tests/test_property_search.py` (presumido)
  - Cenário: gerar queries aleatórias; verificar que resultados batem com consulta SQL manual.
  - Confiança: 🟡

- [ ] **TT-22**, Teste de `Tag` on-the-fly
  - Cenário: feed com 3 tags → 3 `Tag` criados; 2ª execução do mesmo feed → sem duplicatas.
  - Confiança: 🟢

- [ ] **TT-23**, Teste de paginação DRF
  - Cenário: criar 25 episódios; `GET /api/episodes/` → 20 (padrão); `?page=2` → 5.
  - Confiança: 🟢

## Tarefas de Migração de Dados (se aplicável)

- [ ] **TM-01**, Migration inicial com 7 tabelas
  - Origem: `0001_initial.py`
  - Conteúdo: `accounts_user` (não, esse é accounts); `podcasts_podcastlanguage`, `podcasts_podcast`, `podcasts_tag`, `podcasts_episode`, `podcasts_popularterm`, `podcasts_topicsuggestion`, `podcasts_episode_tags` (M2M).
  - Confiança: 🟢

- [ ] **TM-02**, Habilitar `pg_trgm`
  - Origem: `0002_enable_pg_trgm.py`
  - Conteúdo: `RunSQL("CREATE EXTENSION IF NOT EXISTS pg_trgm;")`. Reverso: `RunSQL("DROP EXTENSION IF EXISTS pg_trgm;")`.
  - Confiança: 🟢

- [ ] **TM-03**, Criar índice FTS
  - Origem: `0003_add_search_index.py`
  - Conteúdo: SQL DDL para criar índice GIN em `to_tsvector('portuguese', coalesce(title,'') || ' ' || coalesce(description,''))`. Peso aplicado em runtime no `SearchVector` da query, não no índice.
  - Confiança: 🟡

- [ ] **TM-04**, Alterar `date_search`
  - Origem: `0004_alter_popularterm_date_search.py`
  - Conteúdo: `AlterField` em `PopularTerm.date_search`. Verificar diff exato.
  - Confiança: 🟡

- [ ] **TM-05**, (Opcional) Backfill de `total_episodes`
  - Origem: prático, não automático no legado
  - Conteúdo: após deploy inicial, rodar `update_total_episodes` uma vez para sincronizar contador com realidade.
  - Confiança: 🟡

- [ ] **TM-06**, (Opcional) Seed inicial de idiomas
  - Origem: prático
  - Conteúdo: criar `PodcastLanguage` (pt, en, es) como lookup.
  - Confiança: 🟡

## Ordem Sugerida

1. **T-01..T-08** (Models) — base de tudo.
2. **T-09..T-12** (Migrations) — dependem de T-01..T-08.
3. **T-13..T-15** (Service layer) — dependem de T-01..T-08.
4. **T-26..T-29** (Serializers) — dependem de T-01..T-08.
5. **T-22..T-25** (ViewSets) — dependem de T-26..T-29 e de `accounts.permissions`.
6. **T-30** (URLs) — depende de T-22..T-25.
7. **T-31** (Health endpoint) — depende de T-21.
8. **T-16..T-19** (Celery tasks) — dependem de T-15.
9. **T-20** (Celery Beat) — depende de T-16..T-19.
10. **T-32, T-33** (Seed/management) — após T-09..T-12.
11. **TM-05, TM-06** (Backfill) — após primeiro deploy.
12. **TT-01..TT-23** (Testes) — escritos em paralelo com cada task (TDD opcional).

**Bloqueios críticos:**
- Sem T-09..T-12 → nada pode rodar.
- Sem T-15 → tasks Celery não fazem nada útil.
- Sem T-30 → endpoints não estão expostos.
- Sem T-31 → health check não é público (mas containers não conseguem verificar saúde).

## Lacunas Pendentes (🔴)

- **AI-4 (rate limit em busca):** se for decidido implementar:
  - **T-EXT-01**, Adicionar `throttle_classes = [ScopedRateThrottle]` com `throttle_scope = "search"` em `EpisodeViewSet`.
  - **T-EXT-02**, Em `config/settings.py`, adicionar `"search": "30/min"` em `DEFAULT_THROTTLE_RATES`.
  - **T-EXT-03**, Opcional: adicionar `UserRateThrottle` para usuários logados (escopo mais alto, ex: 60/min).
  - **T-EXT-04**, Teste: 31 buscas em 1 minuto → 31ª retorna 429.

- **DT-1 (to_json cresce):** se for decidido normalizar/remover:
  - **T-CLEAN-01**, Adicionar `Cleanup` model ou `Episode.to_json = None` em episódio > 90 dias.
  - **T-CLEAN-02**, Task periódica para cleanup.
  - **T-CLEAN-03**, Verificar consumidores do campo (frontend? admin? scripts?); remover se não há.

- **DT-2 (HTML stripping regex):** se for decidido fortalecer:
  - **T-HTML-01**, Adicionar `bleach` ou `BeautifulSoup4` em `requirements.txt`.
  - **T-HTML-02**, Reescrever `_strip_html` usando o novo parser.
  - **T-HTML-03**, Teste property-based com HTML adversarial.

- **TopicSuggestion:** funcionalidade será removida (Perna 2026-06-06). Model, ViewSet, Serializer, rotas, testes serão deletados. Não implementar na reimplementação.
  - **T-SUB-01**, Adicionar `submitted_by = ForeignKey(settings.AUTH_USER_MODEL, on_delete=SET_NULL, null=True)`.
  - **T-SUB-02**, Auto-set em `perform_create` se request.user autenticado.
  - **T-SUB-03**, Migration.

- **Tag pruning:** se for decidido:
  - **T-TAG-01**, Task periódica que deleta `Tag` sem episódios.
  - **T-TAG-02**, Verificar que nenhuma UI depende de tags "órfãs".

- **`Recent` hard-coded em 6:** se for decidido parametrizar:
  - **T-RECENT-01**, `settings.PODCAST_RECENT_LIMIT = 6`.
  - **T-RECENT-02**, `PodcastViewSet.recent` lê de settings.
