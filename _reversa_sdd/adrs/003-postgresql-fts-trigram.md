# ADR-003: PostgreSQL FTS + Trigram Fallback para Busca de Episódios

> Status: Aceito (legado de 2016, ainda ativo)
> Data: 2016-05-16 (commit `3e8a729`: "implementação de full text search via postgresql")
> Renovado em 2026 com `pg_trgm` (commit `b99b7fc`: "fix: remove orphans" + migration `0002_enable_pg_trgm`)

## Contexto e problema

A feature principal do podigger é **buscar episódios por conteúdo (assunto)**, não por metadados do podcast. Os episódios vêm de feeds RSS externos com títulos e descrições em português, com bastante variação de grafia (acentos, plurais, sinônimos).

Precisávamos de:
- Busca em português (acentos, stemming, sinônimos básicos).
- Tolerância a typos ("podcas" ainda encontra "podcast").
- Ranking por relevância (título pesa mais que descrição).

## Decisão

Adotar **PostgreSQL Full-Text Search** com config `portuguese`, combinado com **Trigram Similarity** (`pg_trgm`) como fallback.

### Algoritmo (resumido)

```python
# backend/podcasts/models.py:82-118
SearchVector(SearchField("title", weight="A"), SearchField("description", weight="B"))
  → annotate(rank=SearchRank(...))
  → filter(rank__gt=0).order_by(-rank, -published)
# Fallback
.filter(trigram__gt=0.1).order_by(-trigram, -published)
```

### Configuração

- **Postgres extension**: `pg_trgm` (migration `0002_enable_pg_trgm.py`).
- **FTS config**: `portuguese` (stemmer + stop words em PT).
- **Pesos**: `title` = A (mais relevante), `description` = B.
- **Threshold Trigram**: 0.1 (similaridade mínima).

## Consequências

### Positivas
- 🟢 **Sem dependência externa** (Elasticsearch, Meilisearch) — uma stack a menos para operar.
- 🟢 **Performance boa** para o volume atual (~milhares de episódios).
- 🟢 **Suporte nativo a português** (acentos, stemming).
- 🟢 **Fallback gracioso** — typos não quebram a busca, apenas reduzem precisão.

### Negativas
- 🟡 **Reindexação manual** quando o algoritmo muda (não há auto-FTS update para `to_json`).
- 🟡 **Sem fuzzy match semântico** (não entende "carro" = "automóvel").
- 🟡 **Threshold Trigram fixo** (0.1) pode ser muito permissivo para termos curtos.
- 🟡 **Sem highlighting** dos matches no resultado.

## Alternativas consideradas

1. **Elasticsearch**: rejeitada. Operação cara para o volume do projeto.
2. **LIKE %term%**: rejeitada. Não tem stemming, é lenta em grandes volumes.
3. **Busca por `to_tsquery` puro (sem trigram)**: rejeitada. Typos quebram buscas.

## Notas de operação

- 🟢 A reindexação é feita pelo Celery Beat (`update_base` → `update_total_episodes`).
- 🟢 O índice FTS é criado na migration `0003_add_search_index.py`.
