# podcasts, Design Técnico

> Spec gerada pelo Redator em 2026-06-05
> `doc_level` = `completo`
> Foco: COMO a unit é construída, com referência ao código legado.

**Escala de confiança:** 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Interface

### Endpoints HTTP (expostos em `/api/`)

| Método | Caminho | Entrada | Saída | Status codes | Permissão |
|--------|---------|---------|-------|--------------|-----------|
| GET | `/api/podcasts/` | query: `search?`, `page?` | `{count, next, previous, results: Podcast[]}` | 200 | Pública |
| POST | `/api/podcasts/` | `{name: str, feed: str, image?: str, language?: int}` | `{id: int, status: "created"\|"none", message?: str}` | 201, 200, 400 | `IsEditorOrAdmin` |
| GET | `/api/podcasts/recent/` | — | `Podcast[]` (6 items) | 200 | Pública |
| GET | `/api/podcasts/{id}/` | — | `Podcast` | 200, 404 | Pública |
| PATCH | `/api/podcasts/{id}/` | `{name?, feed?, image?, language?}` | `Podcast` | 200, 400, 403, 404 | `IsEditorOrAdmin` |
| DELETE | `/api/podcasts/{id}/` | — | — | 204, 403, 404 | `IsEditorOrAdmin` |
| GET | `/api/episodes/` | query: `q?`, `podcast?`, `page?` | `{count, next, previous, results: Episode[]}` | 200 | Pública |
| GET | `/api/episodes/{id}/` | — | `Episode` | 200, 404 | Pública |
| POST | `/api/episodes/` | `{title, link, description?, published?, enclosure?, podcast: int, tags?: int[]}` | `Episode` | 201, 400, 403 | `IsEditorOrAdmin` |
| PATCH | `/api/episodes/{id}/` | partial | `Episode` | 200, 400, 403, 404 | `IsEditorOrAdmin` |
| DELETE | `/api/episodes/{id}/` | — | — | 204, 403, 404 | `IsEditorOrAdmin` |
| GET | `/api/topic-suggestions/` 🔴 | query: `page?` | `{count, next, previous, results: TopicSuggestion[]}` | 200 | Pública |
| POST | `/api/topic-suggestions/` 🔴 | `{title: str, description?: str}` | `TopicSuggestion` | 201, 400, 403 | `IsEditorOrAdmin` |
| PATCH | `/api/topic-suggestions/{id}/` 🔴 | `{title?, description?, is_recorded?}` | `TopicSuggestion` | 200, 400, 403, 404 | `IsEditorOrAdmin` |
| DELETE | `/api/topic-suggestions/{id}/` 🔴 | — | — | 204, 403, 404 | `IsEditorOrAdmin` |
| GET | `/api/popular-terms/` | — | `PopularTerm[]` ordenado por `-times` | 200 | Pública |

### Classes e funções-chave

| Símbolo | Assinatura | Retorno | Observação |
|---------|-----------|---------|------------|
| `BaseModel` | (abstrato) | — | `created_at`, `updated_at`. Usado por todos os models concretos. |
| `PodcastLanguage` | (Django model) | — | `code` (default `"pt"`), `name` (default `"português"`). |
| `Podcast` | (Django model) | — | `name` (unique), `feed` (URLField unique), `image` (default), `language` (FK SET_NULL), `total_episodes` (IntegerField, default 0). |
| `Tag` | (Django model) | — | `name` (unique, 255 chars). Criado on-the-fly. |
| `Episode` | (Django model) | — | `title`, `link` (URLField unique), `description` (TextField, HTML stripped), `published` (DateTimeField, RFC 2822), `enclosure`, `to_json` (JSONField), `podcast` (FK CASCADE), `tags` (M2M). |
| `EpisodeManager` | (Django manager) | — | `search(query)` faz FTS+trigrama. |
| `EpisodeManager.search` | `(query: str \| None)` | `QuerySet[Episode]` | Veja "Fluxo: Busca de Episódios" abaixo. |
| `PopularTerm` | (Django model) | — | `term` (db_index), `times` (IntegerField, default 1), `date_search` (DateField, default today). |
| `TopicSuggestion` 🔴 Removendo | (Django model) | — | `title` (db_index), `description` (TextField, nullable), `is_recorded` (BooleanField, default False). |
| `PodcastViewSet` | `ModelViewSet` | — | CRUD completo; custom action `recent`. `permission_classes` por método: leitura pública, escrita `IsEditorOrAdmin`. |
| `PodcastViewSet.recent` | `(self, request)` | `Response` | `queryset.order_by("-id")[:6]`. Custom action (`@action(detail=False)`). |
| `EpisodeViewSet` | `ModelViewSet` | — | `get_queryset` filtra por `?podcast=`; `search` é feito via `EpisodeManager.search`. |
| `TopicSuggestionViewSet` 🔴 Removendo | `ModelViewSet` | — | `permission_classes` por método. |
| `PopularTermViewSet` | `ReadOnlyModelViewSet` | — | Read-only; queryset ordenado por `-times`. |
| `is_valid_feed` | `(feed_url: str)` | `bool` | `feedparser.parse(feed_url).bozo == 0`. |
| `_strip_html` | `(html: str)` | `str` | Remove tags HTML com regex `<[^>]+>`. Não robusto para HTML malformado. |
| `parse_feed` | `(feed_url: str)` | `FeedParserDict` | `feedparser.parse(feed_url)`. |
| `PodcastService.create_podcast` | `(name, feed, image=None, language=None)` | `{id, status, message?}` | Atomic. `is_valid_feed` + `get_or_create` + `add_episode.delay(feed)`. |
| `EpisodeUpdater.populate` | `(feed_url: str)` | `int` (count de episódios criados) | Para cada item do feed, parseia data+description, cria Episode idempotentemente, associa tags. |
| `add_episode` (Celery task) | `(feed_url: str)` | `int` | `EpisodeUpdater.populate(feed_url)`. Trigger: `PodcastService.create_podcast`. |
| `update_base` (Celery task) | `()` | `None` | Para cada podcast, faz `add_episode(podcast.feed)`. Encadeia `update_total_episodes` ao final. |
| `update_total_episodes` (Celery task) | `()` | `None` | Para cada podcast, recalcula `total_episodes` e persiste com `update_fields=['total_episodes']`. |
| `remove_podcasts` (Celery task) | `()` | `int` (count) | `Podcast.objects.annotate(num=Count('episode')).filter(num=0).delete()`. |
| `health_check` | `(request)` | `JsonResponse` | DB ping + Redis ping (soft, swallow exception). |

## Fluxo Principal

### Criação de Podcast (RF-POD-03, R-POD-01..04)

```
1. Editor/Admin: POST /api/podcasts/ com {name, feed}
2. Django: PodcastViewSet.create (ModelViewSet)
3. permission_classes = [IsEditorOrAdmin] — verificado aqui
4. serializer = PodcastSerializer(data=request.data)
5. serializer.is_valid(raise_exception=True)
6. service = PodcastService()
7. service.create_podcast(**serializer.validated_data):
   a. Validar name e feed (R-POD-01)
   b. is_valid_feed(feed) → bozo==0 (R-POD-02)
   c. with transaction.atomic():  # R-POD-03
      d.   podcast, created = Podcast.objects.get_or_create(
              name=name, feed=feed,
              defaults={image, language}
          )
      e.   if not created:
               return {id: podcast.id, status: "none", message: "Podcast já existe"}  # R-POD-05
      f.   add_episode.delay(feed)  # Celery async, fora da transação idealmente
8. response: 201 {id, status: "created"}  # R-POD-04
9. Celery worker: add_episode(feed)
   → EpisodeUpdater.populate(feed)
   → Para cada item: cria Episode idempotentemente + Tag M2M
```

### Busca de Episódios (RF-EPI-01..06, R-EPI-01..04)

```
1. Frontend: GET /api/episodes/?q=python
2. Django: EpisodeViewSet.list
3. queryset = Episode.objects.search(q)  # via EpisodeManager
4. EpisodeManager.search(query):
   a. if not query: return self.get_queryset()  # R-EPI-04
   b. track_popular_term(query)  # R-EPI-03
   c. try:
        vector = SearchVector('title', weight='A') + SearchVector('description', weight='B')
        qs = (self.get_queryset()
                .annotate(rank=SearchRank(vector, SearchQuery(query, search_type='websearch')))
                .filter(rank__gt=0)
                .order_by('-rank', '-published'))
        if qs.exists():
            return qs  # R-EPI-01
   d. except: pass
   e. # Fallback trigrama (R-EPI-02)
      return (self.get_queryset()
                .annotate(trigram=TrigramSimilarity('title', query))
                .filter(trigram__gt=0.1)
                .order_by('-trigram', '-published'))
5. PageNumberPagination aplica
6. response: {count, next, previous, results}
```

### Tracking de Popular Term (R-PT-01, R-PT-02)

```
track_popular_term(query):
  today = timezone.now().date()
  PopularTerm.objects.update_or_create(
      term=query,
      date_search=today,
      defaults={'times': 1}  # se cria
  )
  # Se já existe, Django atualiza `times` para 1, mas queremos incrementar!
  # Solução do legado (ver models.py:90-95): update + create separados:
  obj, created = PopularTerm.objects.get_or_create(
      term=query, date_search=today,
      defaults={'times': 1}
  )
  if not created:
      obj.times = models.F('times') + 1
      obj.save(update_fields=['times'])
```

### Pipeline Periódica (RF-CEL-02..04)

```
Celery Beat (periódico):
  update_base.delay()
  remove_podcasts.delay()  # independente

Celery Worker:
  update_base:
    for podcast in Podcast.objects.all():
      try:
        EpisodeUpdater.populate(podcast.feed)
      except Exception as e:
        logger.exception("Failed to update %s", podcast.name)
        continue  # R-CEL-05
    update_total_episodes.delay()  # encadeamento

  update_total_episodes:
    for podcast in Podcast.objects.all():
      count = podcast.episode_set.count()
      if count != podcast.total_episodes:
        podcast.total_episodes = count
        podcast.save(update_fields=['total_episodes'])

  remove_podcasts:
    orphan_ids = (Podcast.objects
                    .annotate(num=Count('episode'))
                    .filter(num=0)
                    .values_list('id', flat=True))
    Podcast.objects.filter(id__in=orphan_ids).delete()
```

## Fluxos Alternativos

- **Feed inválido (bozo != 0):** `is_valid_feed` retorna False → `create_podcast` lança `ValidationError` → DRF retorna 400 com "o feed informado é inválido" (PT-BR).
- **Campos obrigatórios ausentes:** Serializer valida `name` e `feed` (required) → 400 com "o nome e o feed são obrigatórios".
- **Race condition em criação duplicada:** `get_or_create` é atômico; a 2ª chamada vê o podcast já criado e retorna `status: "none"`.
- **Item individual com falha no parse (R-EPI-10):** try/except em volta do item → log + skip. Batch continua.
- **Data de publicação malformada (R-EPI-06):** parsing RFC 2822 falha → log + skip.
- **HTML malformado em description (R-EPI-08, DT-2):** regex `_strip_html` deixa lixo. Sem fallback robusto.
- **FTS vazio (R-EPI-02):** quando `rank == 0` para todos, fallback trigrama com `__gt=0.1`.
- **Redis indisponível (RF-CEL-07):** `health_check` engole exception do Redis; retorna 200 (soft dependency, ADR-004).
- **Sem permissão de escrita (RF-POD-12):** `IsEditorOrAdmin` retorna False → 403.
- **Episode.link duplicado (RF-CEL-06):** `Episode.link` é UNIQUE; `EpisodeUpdater.populate` faz skip silencioso.

## Dependências

- **Django 5.2.13 ORM** — models, migrations, transactions, F expressions.
- **djangorestframework 3.16+** — `ModelViewSet`, `generics`, `serializers.ModelSerializer`, `SearchFilter`, `PageNumberPagination`, `IsAuthenticated`, throttle classes.
- **django-filter 23.2+** — `DjangoFilterBackend` para filtros declarativos.
- **feedparser 6.0+** — `feedparser.parse(feed_url)` para RSS/Atom.
- **requests 2.31+** — HTTP client (usado internamente pelo feedparser).
- **PostgreSQL 15** — com extensões `pg_trgm` e FTS nativo.
- **Celery 5.5.3** — fila assíncrona.
- **Redis 7.1** — broker Celery.
- **Frontend:** `frontend/src/lib/api.ts` (`fetchEpisodes`, `fetchPodcasts`, `addPodcast`); `HomeClient`, `AddPodcastPage`, `EpisodeList`, `PodcastCard`.
- **accounts** — `IsEditorOrAdmin` permission reusada em ViewSets.

## Decisões de Design Identificadas

| Decisão | Evidência no código | Confiança |
|---------|---------------------|-----------|
| 4 ViewSets via DRF DefaultRouter (podcasts, episodes, popular-terms; topic-suggestions 🔴 removendo) | `podcasts/urls.py:6-10` | 🟢 |
| Custom action `recent` em `PodcastViewSet` para 6 podcasts | `views.py:82-93` (custom action) | 🟢 |
| Permissões por método: GET público, POST/PATCH/DELETE `IsEditorOrAdmin` | `views.py:31-35, 107-111` (get_permissions) | 🟢 |
| FTS com `SearchVector` (peso A title, peso B description) e `SearchRank` | `models.py:82-118` | 🟢 |
| FTS com config `'portuguese'` | `migrations/0003_add_search_index.py` | 🟢 |
| Fallback trigrama `pg_trgm` com threshold `0.1` | `models.py:108-114` | 🟢 |
| Tracking de `PopularTerm` em **toda** busca (mesmo sem resultado) | `models.py:90-95` | 🟢 |
| Incremento atômico via `models.F('times') + 1` | `models.py:90-95` | 🟢 |
| `PopularTerm.term` indexado (db_index) para O(1) lookup | `models.py:PopularTerm` | 🟢 |
| `Episode.link` UNIQUE para idempotência | `models.py:Episode.link` | 🟢 |
| `Episode.podcast` FK CASCADE (deleta episódios se podcast removido) | `models.py:Episode.podcast` | 🟢 |
| `Tag` criado on-the-fly via `get_or_create` | `services/updater.py:80-85` | 🟢 |
| `to_json` (JSONField) armazena snapshot bruto do parser (herança) | `models.py:Episode.to_json` | 🟡 (DT-1) |
| Atomicidade em `create_podcast` via `transaction.atomic` | `services/podcast_service.py:50-54` | 🟢 |
| Validação de feed via `is_valid_feed` (bozo==0) | `services/feed_parser.py:117-132` | 🟢 |
| Mensagens de erro em PT-BR | `services/podcast_service.py:25-37` | 🟢 |
| `update_base` encadeia `update_total_episodes` | `tasks.py:39` (chamada explícita) | 🟢 |
| `remove_podcasts` usa `annotate(Count)` para evitar N+1 | `tasks.py:55-72` | 🟢 |
| `total_episodes` atualizado via `update_fields` (não save() completo) | `tasks.py:50-52` | 🟢 |
| HTML stripping via regex (não robusto) | `services/feed_parser.py:14-26` | 🟡 (DT-2) |
| Try/except em cada item (não aborta batch) | `services/updater.py:56-100` | 🟢 |
| Health check tolerante a Redis (soft) | `podcasts/health.py` + ADR-004 | 🟢 |
| `is_recorded` setado manualmente (sem trigger) 🔴 Removendo | `models.py:TopicSuggestion.is_recorded` | 🟢 (Q&A 2026-06-05) |
| `TopicSuggestion` é model separado 🔴 Removendo | `models.py:TopicSuggestion` + ADR-009 | 🟢 |
| Approval status ortogonal (não há `TopicSuggestion.approval_status` 🔴 Removendo) | N/A — fora do escopo | 🟢 (ADR-008) |
| **Sem** throttle em `EpisodeViewSet` (AI-4) | `views.py:EpisodeViewSet` (config DRF) | 🔴 gap |
| `Recent` retorna 6 podcasts hard-coded | `views.py:82-93` | 🟢 |

## Estado Interno

| Estado | Onde | Comportamento |
|---------|------|---------------|
| `Podcast.total_episodes` | DB | Denormalizado; atualizado por `update_total_episodes` (Celery). |
| `Episode.to_json` | DB (JSONField) | Snapshot bruto do feedparser; cresce indefinidamente (DT-1). |
| `PopularTerm.times` | DB | Incrementado atômico; cresce monotonicamente no dia. |
| `PopularTerm.date_search` | DB | Granularidade diária; sem job de reset (I-10). |
| `TopicSuggestion.is_recorded` 🔴 Removendo | DB | Flag manual; sem trigger automático. |
| `Episode.tags` | DB (M2M table) | Criados on-the-fly; nunca removidos (não há prune). |
| `Episode.published` | DB | RFC 2822 parseado; pode ser null se falhar (log + skip). |
| Memória (worker) | Celery worker | Estado transitório das tasks. |
| `TopicSuggestion` em `RecentActivity` 🔴 Removendo | Não implementado | 🔴 Removendo (Perna 2026-06-06) |

## Observabilidade

| Sinal | Origem | Cobertura |
|-------|--------|-----------|
| `EpisodeUpdater.populate` log por item | `services/updater.py:60-100` | 🟡 Sem log estruturado (apenas print/logger) |
| `add_episode` task success/failure | `tasks.py:12-22` | 🟡 Logger Celery default |
| `update_base` per-podcast log | `tasks.py:25-40` | 🟡 |
| `remove_podcasts` count | `tasks.py:55-72` | 🟡 |
| `health_check` Redis exception | `health.py` | 🟡 (engolida) |
| Feed parse error | `feed_parser.py` | 🟡 |
| `Episode.published` parse failure | `services/updater.py:60-67` | 🟡 (log + skip) |
| `Episode.link` duplicado (skip) | `services/updater.py:75-76` | 🟡 (silencioso) |
| `_strip_html` falha | `services/feed_parser.py:14-26` | 🟡 (silencioso) |
| `create_podcast` success | `services/podcast_service.py:55-67` | 🟡 (sem log explícito) |
| Métricas (Prometheus/etc) | — | 🔴 Não observado |
| Tracing distribuído | — | 🔴 Não observado |
| Audit log de criação/edição de podcast | — | 🔴 Ausente (gap menor) |
| Health check exposto em `/health/` | `config/urls.py:10` | 🟢 |
| `health_check` do frontend em `/api/health` | `frontend/src/app/api/health/route.ts` | 🟢 (mas não checa backend) |

## Riscos e Lacunas

- 🔴 **AI-4** — `EpisodeViewSet` não tem throttle scope `search`. Invasor pode inflar `PopularTerm` ou DoS. Recomendação: adicionar `AnonRateThrottle` com scope `search` (30/min) + `UserRateThrottle` (60/min por usuário logado).
- 🟡 **DT-1** — `Episode.to_json` cresce indefinidamente. Herança Flask→Django. Recomendação: avaliar remoção em refactor futuro (sem quebrar o legado se houver consumidores que leem o campo).
- 🟡 **DT-2** — `_strip_html` usa regex não robusto. Recomendação: trocar por `BeautifulSoup` ou `bleach` (com whitelist de tags).
- 🟡 **Sem `db.CheckConstraint`** para `PopularTerm.times >= 1` (I-12)
- 🟡 **Sem prune de `Tag` órfãs** — tags criadas em feeds antigos permanecem no banco.
- 🟡 **Sem retry exponencial** em fetch de feeds externos (R-CEL-05 mitiga com skip, mas não há backoff).
- 🟡 **Sem circuit breaker** para feeds que falham repetidamente.
- 🟡 **Rate limit não diferencia busca anônima vs autenticada** — gap relacionado a AI-4.
- 🟡 **`Recent` retorna 6 hard-coded** — sem configuração; vale parametrizar.
- 🟡 **`popular-terms` expõe contagem total por dia** — pode vazar informação sobre popularidade de tópicos; sem rate limit.
- 🔴 **`TopicSuggestion` removido** — Perna 2026-06-06 decidiu remover a funcionalidade por completo.
- 🟡 **`health_check` engole exception do Redis** — bom para disponibilidade, ruim para observabilidade.

## Detalhes de Search (R-EPI-01..02)

```python
# backend/podcasts/models.py (EpisodeManager.search)
from django.contrib.postgres.search import (
    SearchVector, SearchQuery, SearchRank, TrigramSimilarity
)

class EpisodeManager(models.Manager):
    def search(self, query: str | None):
        if not query:
            return self.get_queryset()  # R-EPI-04 (early return)

        # R-EPI-03: tracking sempre
        self._track_popular_term(query)

        # R-EPI-01: FTS com pesos
        vector = (
            SearchVector('title', weight='A') +
            SearchVector('description', weight='B')
        )
        search_query = SearchQuery(query, search_type='websearch')
        qs = (
            self.get_queryset()
            .annotate(rank=SearchRank(vector, search_query))
            .filter(rank__gt=0)
            .order_by('-rank', '-published')
        )
        if qs.exists():
            return qs

        # R-EPI-02: fallback trigrama
        return (
            self.get_queryset()
            .annotate(
                trigram=TrigramSimilarity('title', query),
            )
            .filter(trigram__gt=0.1)
            .order_by('-trigram', '-published')
        )

    def _track_popular_term(self, query: str):
        today = timezone.now().date()
        obj, created = PopularTerm.objects.get_or_create(
            term=query, date_search=today,
            defaults={'times': 1}
        )
        if not created:
            obj.times = models.F('times') + 1
            obj.save(update_fields=['times'])
```

**Algoritmo em pseudocódigo:**
```
search(query):
  if not query: return all_episodes
  
  track_popular_term(query)
  
  fts_result = episodes.filter(FTS_rank(query) > 0).order_by(-rank, -published)
  if fts_result.exists():
    return fts_result
  
  return episodes.annotate(trigram=similarity(query, title))
                   .filter(trigram > 0.1)
                   .order_by(-trigram, -published)
```

## Detalhes de Feed Parse (R-POD-02, R-EPI-05..10)

```python
# backend/podcasts/services/feed_parser.py
import feedparser
import re

_HTML_RE = re.compile(r'<[^>]+>')

def is_valid_feed(feed_url: str) -> bool:
    parsed = feedparser.parse(feed_url)
    return parsed.bozo == 0  # bozo==0 indica feed bem-formado

def _strip_html(html: str) -> str:
    return _HTML_RE.sub('', html or '')

def parse_feed(feed_url: str):
    return feedparser.parse(feed_url)
```

```python
# backend/podcasts/services/updater.py (EpisodeUpdater.populate, simplificado)
import email.utils
from datetime import datetime

def populate(self, feed_url: str) -> int:
    parsed = parse_feed(feed_url)
    created_count = 0
    
    for item in parsed.entries:
        try:
            link = item.get('link')
            if Episode.objects.filter(link=link).exists():
                continue  # R-EPI-05 (idempotente)
            
            # R-EPI-06 (data RFC 2822)
            published = None
            raw_date = item.get('published', '')[:25]  # primeiros 25 chars
            try:
                published = email.utils.parsedate_to_datetime(raw_date)
            except (TypeError, ValueError):
                logger.warning("Bad date: %s", raw_date)
            
            # R-EPI-08 (HTML stripping)
            description = _strip_html(item.get('description', ''))
            
            # R-TAG-01 (tag on-the-fly)
            tags = []
            for tag_name in item.get('tags', []):
                tag_name = tag_name.get('term', '').strip()
                if tag_name:
                    tag, _ = Tag.objects.get_or_create(name=tag_name)
                    tags.append(tag)
            
            # Criar episódio
            episode = Episode.objects.create(
                title=item.get('title', '')[:1024],
                link=link,
                description=description,
                published=published,
                enclosure=(item.get('enclosures') or [{}])[0].get('href', '')[:1024],
                to_json=dict(item),  # DT-1: snapshot bruto
                podcast=self.podcast,
            )
            episode.tags.set(tags)  # R-TAG-02
            created_count += 1
        except Exception as e:
            logger.exception("Failed to process item: %s", item.get('link'))
            continue  # R-EPI-10, R-CEL-05
    
    return created_count
```

## Fluxo de Health Check (RF-CEL-07)

```
1. Nginx/healthcheck: GET /health/
2. Django: health_check(request)
3. db_ok = False
   try: db.connection.cursor().execute("SELECT 1"); db_ok = True
   except: pass
4. redis_ok = False  # soft dependency
   try: from django.core.cache import cache; cache.set("__health__", 1, 1); redis_ok = True
   except: pass  # ADR-004
5. if db_ok: return 200 {status: "healthy", db: true, redis: redis_ok}
   else: return 503
```

> 🟡 Redis exception é engolida — sistema reporta 200 mesmo com Redis fora. Aceitável para disponibilidade, ruim para observabilidade. Considerar log quando Redis está fora.
