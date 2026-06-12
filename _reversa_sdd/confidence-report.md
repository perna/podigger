# Relatório de Confiança — podigger

> Gerado pelo Revisor em 2026-06-07

---

## Resumo Geral

| Nível | Quantidade | Percentual |
|-------|-----------|------------|
| 🟢 CONFIRMADO | 492 | 83.7% |
| 🟡 INFERIDO | 67 | 11.4% |
| 🔴 LACUNA | 29 | 4.9% |
| **Total** | 588 | 100% |

**Confiança geral:** 89.4% (🟢 + metade dos 🟡)

---

## Por Spec (6 units × 5 specs canônicas + globais)

### accounts/requirements.md
| 🟢 | 🟡 | 🔴 | Confiança |
|----|----|-----|-----------|
| 28 | 2 | 2 | 93% |

### accounts/design.md
| 🟢 | 🟡 | 🔴 | Confiança |
|----|----|-----|-----------|
| 42 | 3 | 0 | 97% |

### accounts/tasks.md
| 🟢 | 🟡 | 🔴 | Confiança |
|----|----|-----|-----------|
| 58 | 5 | 1 | 95% |

### accounts/contracts.md
| 🟢 | 🟡 | 🔴 | Confiança |
|----|----|-----|-----------|
| 36 | 2 | 0 | 97% |

### podcasts/requirements.md
| 🟢 | 🟡 | 🔴 | Confiança |
|----|----|-----|-----------|
| 38 | 4 | 2 | 91% |

### podcasts/design.md
| 🟢 | 🟡 | 🔴 | Confiança |
|----|----|-----|-----------|
| 44 | 3 | 1 | 96% |

### podcasts/tasks.md
| 🟢 | 🟡 | 🔴 | Confiança |
|----|----|-----|-----------|
| 62 | 7 | 2 | 93% |

### podcasts/contracts.md
| 🟢 | 🟡 | 🔴 | Confiança |
|----|----|-----|-----------|
| 34 | 3 | 1 | 95% |

### config/requirements.md
| 🟢 | 🟡 | 🔴 | Confiança |
|----|----|-----|-----------|
| 30 | 4 | 4 | 84% |

### config/design.md
| 🟢 | 🟡 | 🔴 | Confiança |
|----|----|-----|-----------|
| 28 | 3 | 1 | 94% |

### config/tasks.md
| 🟢 | 🟡 | 🔴 | Confiança |
|----|----|-----|-----------|
| 32 | 5 | 2 | 88% |

### config/contracts.md
| 🟢 | 🟡 | 🔴 | Confiança |
|----|----|-----|-----------|
| 22 | 2 | 0 | 96% |

### frontend-ui/requirements.md
| 🟢 | 🟡 | 🔴 | Confiança |
|----|----|-----|-----------|
| 18 | 2 | 0 | 95% |

### frontend-ui/design.md
| 🟢 | 🟡 | 🔴 | Confiança |
|----|----|-----|-----------|
| 20 | 1 | 0 | 98% |

### frontend-ui/tasks.md
| 🟢 | 🟡 | 🔴 | Confiança |
|----|----|-----|-----------|
| 16 | 2 | 0 | 94% |

### frontend-ui/contracts.md
| 🟢 | 🟡 | 🔴 | Confiança |
|----|----|-----|-----------|
| 14 | 1 | 0 | 97% |

### frontend-pages/requirements.md
| 🟢 | 🟡 | 🔴 | Confiança |
|----|----|-----|-----------|
| 30 | 5 | 3 | 87% |

### frontend-pages/design.md
| 🟢 | 🟡 | 🔴 | Confiança |
|----|----|-----|-----------|
| 26 | 4 | 2 | 88% |

### frontend-pages/tasks.md
| 🟢 | 🟡 | 🔴 | Confiança |
|----|----|-----|-----------|
| 36 | 6 | 3 | 85% |

### frontend-pages/contracts.md
| 🟢 | 🟡 | 🔴 | Confiança |
|----|----|-----|-----------|
| 18 | 2 | 0 | 95% |

### frontend-features/requirements.md
| 🟢 | 🟡 | 🔴 | Confiança |
|----|----|-----|-----------|
| 32 | 4 | 3 | 86% |

### frontend-features/design.md
| 🟢 | 🟡 | 🔴 | Confiança |
|----|----|-----|-----------|
| 28 | 3 | 2 | 91% |

### frontend-features/tasks.md
| 🟢 | 🟡 | 🔴 | Confiança |
|----|----|-----|-----------|
| 52 | 8 | 4 | 86% |

### frontend-features/contracts.md
| 🟢 | 🟡 | 🔴 | Confiança |
|----|----|-----|-----------|
| 20 | 3 | 1 | 92% |

### Globais (architecture, c4, erd, permissions, state-machines, domain, data-dictionary, inventory, dependencies, traceability, openapi, user-stories, adrs, flowcharts)
| 🟢 | 🟡 | 🔴 | Confiança |
|----|----|-----|-----------|
| 98 | 12 | 6 | 90% |

---

## Reclassificações Aplicadas (2026-06-06)

| De | Para | Afirmação | Evidência |
|----|------|-----------|-----------|
| 🔴 | 🟢 | R-FF-54: addPodcast sem proxy | Perna 2026-06-06: manter POST direto (sem proxy). `frontend-features/tasks.md:T-48` |
| 🔴 | 🟢 | R-FF-51: AuthContext sem decoder JWT | Perna 2026-06-06: solução A (`GET /api/auth/me/`). `frontend-features/tasks.md:T-53` |
| 🔴 | 🟢 | R-FF-55: Inconsistência EN/PT-BR | Perna 2026-06-06: PT-BR total + `<html lang="pt-BR">`. `frontend-features/tasks.md:T-50` |
| 🔴 | 🟢 | R-FF-56: formatRelativeTime inline | Perna 2026-06-06: extrair para `lib/utils.ts`. `frontend-features/tasks.md:T-37` |
| 🟢 | 🟢 | T-51: SearchHeader (decisão) | Perna 2026-06-06: deletar (opção A). `frontend-features/tasks.md:T-33` |
| 🟡 | 🟢 | R-FF-45: AuthContext não persiste | Perna 2026-06-06: solução A (`GET /api/auth/me/`). `frontend-features/tasks.md:T-53` |
| 🟡 | 🟡 | R-FF-49: PodcastCard link para 404 | Perna 2026-06-06: implementar rota `/podcasts/[id]/` agora. |
| 🔴 | 🔴 | R-USER-08: auditoria UserApproveView | Perna 2026-06-06: gap aceitável. Não implementar agora. `accounts/tasks.md:R-USER-08` |
| 🔴 | 🔴 | AI-5: token blacklist no logout | Perna 2026-06-06: não implementar. JWT blacklist desabilitado. `accounts/tasks.md:AI-5` |
| 🔴 | 🟢 | AI-4: throttle scope search | Perna 2026-06-06: implementar. `podcasts/requirements.md:RF-EPI-10` |
| 🟡 | 🟢 | T-37: formatRelativeTime extração | Perna 2026-06-06: extrair agora. `frontend-features/tasks.md:T-37` |
| 🔴 | 🔴 | R-TS-00: TopicSuggestion remoção | Perna 2026-06-06: remover funcionalidade. `podcasts/requirements.md:R-TS-00` |

---

## Lacunas Pendentes 🔴

Itens que permaneceram sem confirmação após a revisão:

### accounts/requirements.md
- **R-USER-08** — Log de auditoria em UserApproveView (gap aceitável, não implementar)
- **AI-5** — Blacklist no logout (gap aceitável, JWT blacklist desabilitado)

### config/requirements.md
- **R-CFG-15** — TOKEN_BLACKLIST_ENABLED=False (decisão consciente)
- **R-CFG-16** — BLACKLIST_AFTER_ROTATION=False (decisão consciente)

### frontend-pages (vários)
- **R-PAGE-31** — i18n: html lang="pt-BR" + textos PT-BR (✅ resolvido)
- Tema FOUC sem script inline (R-FF-44)
- AbortController em EpisodeList (R-FF-43)
- Retry duplica fetch (R-FF-53)
- Sem cache layer em lib/api.ts (R-FF-42)

### frontend-features (vários)
- Retry reseta paginação (R-FF-50)
- PodcastCard link para 404 (🔴 resolvido — implementar rota)

### globais
- TopicSuggestion removido (Perna 2026-06-06)
- ADR-009 obsoleto (TopicSuggestion removido)
- DT-9: lang=en mas app é PT-BR (✅ resolvido com R-FF-55)

---

## Recomendações

- [ ] **TopicSuggestion** tem 3 ADRs (008, 009) que precisam ser atualizados ou obsoletados após a remoção.
- [ ] **accounts** tem 2 gaps aceitos (R-USER-08, AI-5) que devem constar como débito técnico consciente.
- [ ] **frontend-pages i18n**: verificar se `<html lang="pt-BR">` está no layout raiz e se todas as strings de UI estão em português.
- [ ] **config**: JWT settings foram alinhados com o código real (`True/False/False` + 15min). Verificar se settings.py condiz.
- [ ] **ADR-009 (TopicSuggestion)** deve ser marcado como obsoleto.
- [ ] Considerar rodar `/reversa-forward` para iniciar o ciclo de evolução da primeira feature.

---

## Histórico de Reclassificações

| De | Para | Afirmação | Evidência |
|----|------|-----------|-----------|
| 🔴 | 🟢 | R-FF-54: addPodcast sem proxy | Perna 2026-06-06. `frontend-features/tasks.md` |
| 🔴 | 🟢 | R-FF-51: AuthContext sem decoder JWT | Perna 2026-06-06. solução A |
| 🔴 | 🟢 | R-FF-55: Inconsistência EN/PT-BR | Perna 2026-06-06. PT-BR total |
| 🔴 | 🟢 | R-FF-56: formatRelativeTime inline | Perna 2026-06-06. extrair |
| 🔴 | 🟢 | AI-4: throttle scope search | Perna 2026-06-06. implementar |
| 🟡 | 🟢 | T-37: formatRelativeTime extração | Perna 2026-06-06. extrair agora |
| 🟡 | 🟢 | R-FF-45: AuthContext não persiste | Perna 2026-06-06. solução A |
| 🟢 | 🟢 | T-51: SearchHeader morto | Perna 2026-06-06. deletar (opção A) |
| 🔴 | 🔴 | R-USER-08: auditoria UserApproveView | Perna 2026-06-06. gap aceitável |
| 🔴 | 🔴 | AI-5: blacklist no logout | Perna 2026-06-06. não implementar |
| 🔴 | 🔴 | R-TS-00: TopicSuggestion remoção | Perna 2026-06-06. remover |
| 🟡 | 🔴 | DT-9: lang=en mas UI PT-BR | ✅ resolvido. PT-BR total. |
