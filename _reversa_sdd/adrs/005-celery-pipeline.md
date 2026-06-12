# ADR-005: Pipeline Assíncrono Celery para Atualização de Feeds

> Status: Aceito
> Data: 2016-06-19 (introdução, commit `226883a` e `5791a04`)
> Renovado em 2026 com commit `b99b7fc` ("fix: remove orphans")

## Contexto e problema

Cada podcast adicionado tem um feed RSS/Atom que precisa ser parseado para popular a tabela de episódios. O processo é:

1. Fetch HTTP do feed (pode demorar segundos).
2. Parse XML/Atom/RSS.
3. Normalização dos entries.
4. Persistência (idempotente por `link`).
5. Associação de tags M2M.
6. Recálculo de contadores.

Se feito sincronamente no request HTTP, o usuário que adiciona um podcast esperaria **segundos** pelo response, e qualquer falha derrubaria a operação inteira.

## Decisão

Adotar **Celery + Redis broker** para processamento assíncrono com 4 tasks dedicadas:

| Task | Trigger | Função |
|------|---------|--------|
| `add_episode(feed_url)` | Após `PodcastService.create_podcast` (criação de novo podcast) | Popula episódios de **1 feed** recém-adicionado. |
| `update_base` | Celery Beat (periódico) | Re-busca **todos** os feeds. Encadeia `update_total_episodes` ao final. |
| `update_total_episodes` | Encadeado de `update_base` | Recalcula `Podcast.total_episodes` para todos. |
| `remove_podcasts` | Celery Beat (periódico) | Bulk delete de podcasts sem episódios. |

### Padrão de chain

```
update_base → update_total_episodes
```

### Padrão de resiliência

- 🟢 Falha em 1 item → log + continue (try/except dentro de `populate`).
- 🟢 Idempotência: skip se `Episode` com mesmo `link` já existe.
- 🟢 Transação atômica por feed (`transaction.atomic`).

🟢 Fonte: `backend/podcasts/tasks.py:12-72`; `backend/podcasts/services/updater.py:15-103`.

## Consequências

### Positivas
- 🟢 **Request de adição retorna em <500ms** (apenas `get_or_create` + enqueue).
- 🟢 **Falhas isoladas** não derrubam o batch inteiro.
- 🟢 **Re-rodar é barato** (idempotente).
- 🟢 **Cleanup automático** de podcasts órfãos (commit `b99b7fc`: "fix: remove orphans").

### Negativas
- 🟡 **Janela de inconsistência** entre `Episode.objects.create` e `update_total_episodes` (cosmética).
- 🟡 **Sem retry persistente** em falhas de rede — depende do próximo `update_base`.
- 🟡 **Sem dead-letter queue** visível; falhas ficam só em logs.
- 🟡 **Coupling temporal**: `update_base` e `remove_podcasts` dependem do Celery Beat estar configurado (não verificado neste extrato).

## Alternativas consideradas

1. **Threading in-process** (`threading.Thread`): rejeitada. Não sobrevive a restart do worker; sem visibility.
2. **RQ (Redis Queue)**: rejeitada. Menos rico que Celery para tasks periódicas e chains.
3. **Síncrono com cache HTTP**: rejeitada. Latência alta para o usuário.
