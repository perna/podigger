# Gaps Consolidados — podigger

> Gerado pelo Revisor em 2026-06-07
> Lacunas 🔴 remanescentes após entrevista com Perna (2026-06-06)

---

## Legenda

| Status | Significado |
|--------|-------------|
| 🔴 ABERTO | Gap não resolvido, requer decisão futura |
| 🔴 ACEITO | Gap conhecido, decisão consciente de não implementar |
| ✅ RESOLVIDO | Gap fechado após decisão do usuário |
| 🔴 REMOVIDO | Funcionalidade removida por decisão |

---

## 1. Backend — accounts

| ID | Gap | Status | Decisão |
|----|-----|--------|---------|
| R-USER-08 | Log de auditoria em `UserApproveView` não implementado | 🔴 **ACEITO** | Perna 2026-06-06: gap aceitável, não implementar agora |
| AI-5 | Blacklist de token no `POST /api/auth/logout` | 🔴 **ACEITO** | Perna 2026-06-06: não implementar. `TOKEN_BLACKLIST_ENABLED=False` |
| I-12 | `db.CheckConstraint` ausente em `PopularTerm.times >= 1` | 🔴 **ACEITO** | Gap conhecido, sem prazo |

## 2. Backend — config

| ID | Gap | Status | Decisão |
|----|-----|--------|---------|
| R-CFG-14 | Access token TTL = 15min definido | ✅ **RESOLVIDO** | Perna 2026-06-06: 15 minutos |
| R-CFG-15 | `TOKEN_BLACKLIST_ENABLED = False` | 🔴 **ACEITO** | Decisão consciente, blacklist desabilitado |
| R-CFG-16 | `BLACKLIST_AFTER_ROTATION = False` | 🔴 **ACEITO** | Decisão consciente, sem blacklist pós-rotação |
| R-CFG-17 | `ROTATE_REFRESH_TOKENS = True` | ✅ **RESOLVIDO** | Alinhado com código real |

## 3. Backend — podcasts

| ID | Gap | Status | Decisão |
|----|-----|--------|---------|
| R-TS-00 | `TopicSuggestion` removido do produto | 🔴 **REMOVIDO** | Perna 2026-06-06: model, viewset, serializer, rotas deletados |
| AI-4 | Throttle scope `search` em `EpisodeViewSet` | ✅ **RESOLVIDO** | Perna 2026-06-06: implementar `search: 30/min` |

## 4. Frontend

| ID | Gap | Status | Decisão |
|----|-----|--------|---------|
| R-FF-44 | Theme FOUC sem inline script no `<head>` | 🔴 **ABERTO** | Requer alteração em `frontend-pages` (RootLayout) |
| R-FF-43 | Race condition em `EpisodeList` sem AbortController | 🔴 **ABERTO** | Requer refactor de `load` para aceitar `signal` |
| R-FF-53 | Retry duplica fetch sem guard | 🔴 **ABERTO** | Requer guard em `useEffect` durante retry manual |
| R-FF-54 | addPodcast sem proxy | ✅ **RESOLVIDO** | Perna 2026-06-06: manter POST direto |
| R-FF-51 | AuthContext sem decoder JWT | ✅ **RESOLVIDO** | Perna 2026-06-06: criar `GET /api/auth/me/` |
| R-FF-44 | Theme FOUC | 🔴 **ABERTO** | Inline script no `<head>` |
| R-FF-55 | Inconsistência EN/PT-BR | ✅ **RESOLVIDO** | Perna 2026-06-06: PT-BR total |
| R-FF-56 | formatRelativeTime inline | ✅ **RESOLVIDO** | Perna 2026-06-06: extrair para lib/utils |
| T-51 | SearchHeader código morto | ✅ **RESOLVIDO** | Perna 2026-06-06: deletar (opção A) |
| R-FF-45 | AuthContext não persiste | ✅ **RESOLVIDO** | Perna 2026-06-06: solução A (`GET /api/auth/me/`) |
| R-FF-42 | Sem cache layer em lib/api.ts | 🔴 **ABERTO** | Decisão futura: SWR ou simplicidade |
| R-FF-50 | Retry reseta paginação | 🔴 **ABERTO** | Decisão futura de UX |
| R-FF-49 | PodcastCard link para 404 | ✅ **RESOLVIDO** | Perna 2026-06-06: implementar rota `/podcasts/[id]/` |

## 5. Globais

| ID | Gap | Status | Decisão |
|----|-----|--------|---------|
| DT-9 | `<html lang="en">` mas app é PT-BR | ✅ **RESOLVIDO** | Perna 2026-06-06: `<html lang="pt-BR">` |
| DT-1 | Episode.to_json cresce com episódios | 🔴 **ABERTO** | Tech debt, sem prazo |
| DT-2 | HTML stripping via regex | 🔴 **ABERTO** | Tech debt, sem prazo |
| DT-3/8/13 | CheckConstraints ausentes | 🔴 **ABERTO** | Tech debt, sem prazo |
| DT-10 | ThemeProvider sem toggle exposto | 🔴 **ABERTO** | Tech debt, sem prazo |
| DT-11 | Drift requirements.txt vs pyproject.toml | 🔴 **ABERTO** | Tech debt, sem prazo |
| DT-14 | Cobertura de testes accounts < podcasts | 🔴 **ABERTO** | Tech debt, sem prazo |
| ADR-009 | TopicSuggestion como model separado (obsoleto) | 🔴 **REMOVIDO** | ADR deve ser marcado como obsoleto |

---

## 6. Resumo

| Tipo | Quantidade |
|------|------------|
| ✅ RESOLVIDO | 11 |
| 🔴 ABERTO (requer decisão futura) | 6 |
| 🔴 ACEITO (decidido não implementar) | 4 |
| 🔴 REMOVIDO (funcionalidade removida) | 2 |
| **Total** | **23** |

---

> Próximo passo sugerido: `/reversa-forward` para iniciar o ciclo de evolução (features) a partir das specs geradas.
