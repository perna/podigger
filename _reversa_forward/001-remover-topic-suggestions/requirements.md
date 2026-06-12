# Requirements: Remover funcionalidade TopicSuggestion

> Identificador: `001-remover-topic-suggestions`
> Data: `2026-06-07`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

Remover do backend o model `TopicSuggestion`, seu ViewSet, Serializer, rotas e testes associados. A funcionalidade de "sugestões de tópicos da comunidade" não faz mais parte do produto (decisão Perna 2026-06-06). No frontend, nenhum componente consome este endpoint. O ADR-009 deve ser marcado como obsoleto.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/architecture.md`#adr-index | ADR-009 "TopicSuggestion como model separado" — será obsoleto | 🟢 |
| `_reversa_sdd/domain.md`#agregado-topic-suggestion | R-TS-01 (leitura pública/escrita editor) e R-TS-02 (`is_recorded` manual) — ambas serão removidas | 🟢 |
| `_reversa_sdd/inventory.md`#modelos | `TopicSuggestion` listado como model do app `podcasts` — será removido | 🟢 |
| `_reversa_sdd/code-analysis.md`#topicsuggestion | Model (title, description, is_recorded), ViewSet (CRUD), Serializer — tudo removido | 🟢 |
| `_reversa_sdd/podcasts/requirements.md`#topic-suggestion | R-TS-00 a R-TS-05 — já marcados como removendo (Perna 2026-06-06) | 🟢 |
| `_reversa_sdd/erd-complete.md`#entity-topicsuggestion | Entidade `TopicSuggestion` — será removida do schema | 🟢 |

## 3. Personas e cenários de uso

Nenhuma. A funcionalidade não tem mais usuários no produto. O único cenário é a remoção técnica.

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** `TopicSuggestion` é removido do modelo de dados. 🟢
   - Origem no legado: `_reversa_sdd/domain.md#R-TS-01`, `_reversa_sdd/domain.md#R-TS-02`
   - Tipo: removida
2. **RN-02:** ADR-009 ("TopicSuggestion como model separado") é marcado como obsoleto. 🟢
   - Origem no legado: `_reversa_sdd/architecture.md#adr-index`
   - Tipo: alterada (status: ativa → obsoleta)

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | Remover model `TopicSuggestion` e sua migration de remoção | Must | Tabela `podcasts_topicsuggestion` não existe mais no schema. Migration reversível (down recria tabela). | 🟢 |
| RF-02 | Remover `TopicSuggestionViewSet` e `TopicSuggestionSerializer` | Must | Código deletado. Nenhum import quebrado. | 🟢 |
| RF-03 | Remover rota `/api/topic-suggestions/` do router | Must | `GET /api/topic-suggestions/` retorna 404. | 🟢 |
| RF-04 | Remover testes de `TopicSuggestion` | Must | Testes referentes a TopicSuggestion deletados. Suite de testes existente passa (excluindo TT-19). | 🟢 |
| RF-05 | Marcar ADR-009 como obsoleto | Should | `status: obsoleto` + rationale no frontmatter do ADR. | 🟢 |
| RF-06 | Atualizar specs da extração reversa que referenciam TopicSuggestion | Should | `_reversa_sdd/domain.md`, `_reversa_sdd/erd-complete.md`, `_reversa_sdd/data-dictionary.md`, `_reversa_sdd/permissions.md` sem referências a TopicSuggestion como entidade ativa. | 🟢 |
| RF-07 | Remover `TopicSuggestion` do registro de rotas no DefaultRouter | Must | Router em `podcasts/urls.py` não registra mais `topic-suggestions`. | 🟢 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Manutenibilidade | Zero impacto em funcionalidades existentes | Nenhum componente consome TopicSuggestion. Frontend não tem rota ou componente associado. | 🟢 |
| Banco de Dados | Migration de remoção deve ser reversível | `migration.RunSQL` com `reverse_sql` para recriar tabela, permitindo rollback seguro. Aplicar em horário de baixa carga. | 🟢 |

## 7. Critérios de Aceitação

```gherkin
Cenário: Remoção da rota TopicSuggestion
  Dado que o sistema está rodando com a migration de remoção aplicada
  Quando um cliente faz GET /api/topic-suggestions/
  Então a resposta é 404 Not Found

Cenário: Rollback da migration
  Dado que a migration de remoção foi revertida
  Quando um cliente faz GET /api/topic-suggestions/
  Então a resposta é 200 OK com lista vazia

Cenário: Suite de testes intacta
  Dado que o código foi removido
  Quando executo pytest no app podcasts
  Então todos os testes passam (exceto TT-19 que foi removido)

Cenário: ADR-009 obsoleto
  Dado que o ADR-009 foi marcado como obsoleto
  Quando leio o frontmatter do ADR
  Então o campo status contém "obsoleto"
  E a rationale menciona a remoção da funcionalidade
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01 | Must | Model é a raiz da funcionalidade; sem ele nada mais existe |
| RF-02 | Must | ViewSet/serializer são dead code sem o model |
| RF-03 | Must | Rota sem model/viewSet quebra o router |
| RF-04 | Must | Testes órfãos falham |
| RF-07 | Must | Router quebrado se viewSet não existe |
| RF-05 | Should | ADR obsoleto não bloqueia remoção, mas é boa prática |
| RF-06 | Should | Specs desatualizadas não bloqueiam, mas causam ruído |

## 9. Esclarecimentos

> Decisões tomadas diretamente pelo usuário (Perna 2026-06-07), sem `/reversa-clarify`:

| Dúvida | Resposta |
|--------|----------|
| ADR-009: manter como obsoleto ou deletar? | **Deletar** o arquivo ADR-009 junto com a funcionalidade. |
| Migration: backup dos dados antes de DROP TABLE? | **Sem backup.** Descartar dados diretamente. |

## 10. Lacunas

Nenhuma.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-06-07 | Versão inicial gerada por `/reversa-requirements` | reversa |
