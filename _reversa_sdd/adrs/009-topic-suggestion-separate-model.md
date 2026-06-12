# ADR-009: TopicSuggestion como Modelo Separado de Podcast

> Status: Aceito (padrão herdado de 2016)
> Data: Original (~2016-2017, sem commit único identificável)

## Contexto e problema

O podigger permite que a comunidade sugira tópicos para episódios futuros. A dúvida de modelagem era:

- Sugestões são **episódios futuros** (modelar como `Episode` com flag `is_suggestion`)?
- Sugestões são **pauta editorial** (modelar como entidade separada `TopicSuggestion`)?

## Decisão

Criar modelo dedicado `TopicSuggestion` com:

```python
# backend/podcasts/models.py
class TopicSuggestion(BaseModel):
    title = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank, null=True)
    is_recorded = models.BooleanField(default=False)
    # BaseModel: created_at, updated_at
```

### Por que separado?

| Razão | Explicação |
|-------|------------|
| **Schema diferente** | Sugestão tem `description` opcional; episódio tem `link`, `enclosure`, `podcast FK`, `tags M2M`. |
| **Fluxo diferente** | Sugestão vai por aprovação editorial → vira episódio em outro podcast. Episódio é populado por Celery a partir de feed RSS. |
| **Histórico separado** | Sugestões rejeitadas não devem poluir a tabela de `Episode`. |
| **Permissão diferente** | `IsEditorOrAdmin` para CRUD de TopicSuggestion vs. `IsEditorOrAdmin` para Episode — mesmas classes, mas intenção diferente. |

🟢 Fonte: `backend/podcasts/models.py:TopicSuggestion`; `backend/podcasts/serializers.py:TopicSuggestionSerializer`; `backend/podcasts/views.py:126-137`.

## Consequências

### Positivas
- 🟢 **Schema enxuto** para cada modelo.
- 🟢 **Semântica clara** — `is_recorded=False` é estado default e "vivo".
- 🟢 **Endpoints separados** — `/api/topic-suggestions/` é independente de `/api/episodes/`.

### Negativas
- 🟡 **Sem trigger automático** que marque `is_recorded=True` quando um `Episode` é criado com título igual à sugestão (gap de automação).
- 🟡 **Sem campo `created_by`** — não rastreia quem sugeriu (potencial melhoria).
- 🟡 **Sem `is_rejected`** — só é possível marcar como recorded, não rejeitar formalmente.

## Alternativas consideradas

1. **Episode com `is_suggestion=True`**: rejeitada. Poluiria o feed com placeholders.
2. **GenericForeignKey polimórfica**: rejeitada. Complexidade desnecessária.
3. **Sistema de "pools" ou "campaigns"**: rejeitada. Overhead de modelagem para 1 caso de uso.

## Notas de operação

- 🟢 O endpoint de leitura é público (qualquer um pode ver sugestões).
- 🟢 Apenas editor/admin pode criar/editar (escrita protegida).
- 🟢 Sem soft delete — `DELETE` remove fisicamente.
